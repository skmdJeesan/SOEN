import socket from 'socket.io-client'
let socketInstance = null

export const initializeSocket = (project_id) => {
    console.log('Connecting to:', import.meta.env.VITE_API_URL)
    socketInstance = socket.io(import.meta.env.VITE_API_URL, {
        withCredentials: true,
        query: { project_id }
    })
    socketInstance.on('connect_error', (err) => {
        console.log('Socket connect error:', err.message)
    })
    return socketInstance
}

export const receiveMessage = (eventName, cb) => {
    socketInstance.on(eventName, cb)
}

export const sendMessage = (eventName, cb) => {
    socketInstance.emit(eventName, cb)
}

export const sendCodeChanges = (changes) => {
    socketInstance?.emit('code-editor:changes', changes)
}

export const initializeCodeEditor = (fileTree) => {
    socketInstance?.emit('code-editor:initialize', { fileTree })
}

export const sendFileTreeUpdate = (payload) => {
    socketInstance.emit('file-tree:update', payload)
}

export const sendFileTreeDelete = (payload) => {
    socketInstance.emit('file-tree:delete', payload)
}