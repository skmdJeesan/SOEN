import 'dotenv/config'
import http from 'http'
import app from './app.js'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Project from './models/project.model.js'
import Message from './models/message.model.js'
import { generate_response } from './services/ai.service.js'

const port = process.env.PORT || 3001

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
});

const get_cookie = (cookie_header, name) => {
    // example cookie_header: "token=abc123; other_cookie=xyz456"
    const cookie = cookie_header?.split(';').find((part) => part.trim().startsWith(`${name}=`))
    return cookie ? decodeURIComponent(cookie.trim().slice(name.length + 1)) : null
}

function normalizeContents(str) {
    if (typeof str !== 'string') return str
    // If it contains literal "\n"/"\"" sequences but no real newline characters,
    // it's very likely double-escaped — unescape it once more.
    if (!str.includes('\n') && (str.includes('\\n') || str.includes('\\"'))) {
        try {
            return JSON.parse(`"${str}"`)
        } catch {
            return str // if it doesn't parse cleanly, leave it untouched rather than corrupt it
        }
    }
    return str
}

io.use(async (socket, next) => { // middleware to authenticate socket connection
    try {
        const authorization = socket.handshake.headers.authorization
        const header_token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
        const cookie_token = get_cookie(socket.handshake.headers.cookie, 'token')

        const token = socket.handshake.auth?.token || header_token || cookie_token
        if (!token) return next(new Error('Authentication error!'))

        const project_id = socket.handshake.query?.project_id
        if (!mongoose.Types.ObjectId.isValid(project_id)) return next(new Error('Invalid project id!'))
        
        socket.project = await Project.findById(project_id)
        if (!socket.project) return next(new Error('Project not found!'))

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded) return next(new Error('Authentication error!'))

        socket.user = decoded
        next()
    } catch (error) {
        console.log('Socket auth failed:', error.message)
        next(error)
    }
})

const project_documents = new Map() // Map to store documents for each project
io.on('connection', socket => {
    console.log('user connected')

    socket.room_id = socket.project._id.toString()
    socket.join(socket.room_id)

    socket.on('code-editor:initialize', ({ fileTree = {} }) => {
        const documents = new Map()
        Object.entries(fileTree).forEach(([filename, file]) => {
            documents.set(filename, {
                type: file?.type === 'file' || file?.file ? 'file' : 'folder',
                contents: file?.file?.contents || '',
                revision: 0,
                history: []
            })
        })
        project_documents.set(socket.room_id, documents)
        const syncedFileTree = Object.fromEntries(
            [...documents.entries()].map(([filename, document]) => [filename, {
                type: document.type,
                ...(document.type === 'file' && { file: { contents: document.contents } })
            }])
        )
        socket.emit('code-editor:sync', { fileTree: syncedFileTree })
    })

    socket.on('code-editor:changes', ({ filename, changes = [] }) => {
        const documents = project_documents.get(socket.room_id)
        const document = documents?.get(filename)
        if (!document || document.type !== 'file' || !Array.isArray(changes)) return

        // this is the core logic to apply changes to the document contents
        // we sort the changes in reverse order of their rangeOffset to avoid messing up the offsets of subsequent changes
        let contents = document.contents
        const applied_changes = []
        // example of a changes: [{ rangeOffset: 10, rangeLength: 5, text: 'new text' }, {...}]
        for (const change of [...changes].sort((left, right) => right.rangeOffset - left.rangeOffset)) {
            if (!Number.isInteger(change.rangeOffset) || !Number.isInteger(change.rangeLength) || typeof change.text !== 'string') continue
            contents = contents.slice(0, change.rangeOffset) + change.text + contents.slice(change.rangeOffset + change.rangeLength)
            applied_changes.push(change)
        }

        if (applied_changes.length === 0) return
        document.contents = contents
        document.revision += 1
        document.history.push(applied_changes)
        io.to(socket.room_id).except(socket.id).emit('code-editor:changes', {
            filename,
            changes: applied_changes,
            revision: document.revision
        })
    })

    socket.on('file-tree:update', ({ path, entry }) => {
        if (!project_documents.has(socket.room_id)) {
            project_documents.set(socket.room_id, new Map())
        }
        const documents = project_documents.get(socket.room_id)

        if (!documents.has(path)) {
            documents.set(path, {
                type: entry?.type === 'file' ? 'file' : 'folder',
                contents: entry?.file?.contents || '',
                revision: 0,
                history: []
            })
        }

        socket.to(socket.room_id).emit('file-tree:update', { path, entry })
    })

    socket.on('file-tree:delete', ({ paths }) => {
        const documents = project_documents.get(socket.room_id)
        if (documents) {
            paths.forEach((path) => documents.delete(path))
        }
        socket.to(socket.room_id).emit('file-tree:delete', { paths })
    })
    
    socket.on('project-message', async data => {
        // console.log(data)
        const message = data.message
        const ai_call = message.includes('@soen')

        const saved = await Message.create({
            project: socket.room_id,
            sender: data.sender._id,
            senderType: 'user',
            message: data.message
        })

        const populated = await saved.populate('sender', 'username email')
        io.to(socket.room_id).emit('project-message', populated)
        
        if(ai_call) {
            // console.log('ai ko call huwa!')
            const prompt = message.replace('@soen', '')
            const response = await generate_response(prompt)
            const parsedResponse = JSON.parse(response)
            // console.log('AI response:', parsedResponse)

            // convert fileTree from array shape → object shape the frontend expects
            if (parsedResponse.fileTree) {
                const fileTreeObject = {}
                parsedResponse.fileTree.forEach(({ path, contents }) => {
                    fileTreeObject[path] = { type: 'file', file: { contents: normalizeContents(contents) } }
                })
                parsedResponse.fileTree = fileTreeObject
            }

            const finalMessage = JSON.stringify(parsedResponse)

            const aiMessage = await Message.create({
                project: socket.room_id,
                sender: null,
                senderType: 'ai',
                message: finalMessage
            })

            io.to(socket.room_id).emit('project-message', {
                _id: aiMessage._id,
                message: finalMessage,
                senderType: 'ai',
                sender: {_id: 'soen_ai', username: 'soen', email: "ai.soen@mail.com"}
            })
        }
           
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
        socket.leave(socket.room_id)
        setTimeout(() => {
            if (!io.sockets.adapter.rooms.has(socket.room_id)) project_documents.delete(socket.room_id)
        }, 0)
    });
});

server.listen(port, () => {
    console.log(`server is running on port: ${port}`)
})
