import express from 'express';
import 'dotenv/config'
import cors from 'cors'
import morgan from 'morgan';
import cookieParser from 'cookie-parser'
import connect_db from './config/db.js';
import user_routes from './routers/user.routes.js'
import project_routes from './routers/project.routes.js'
import message_routes from './routers/message.routes.js'
import ai_routes from './routers/ai.routes.js'

const app = express()
await connect_db()

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

app.use('/users', user_routes)
app.use('/projects', project_routes)
app.use('/messages', message_routes)
app.use('/ai', ai_routes)

app.get('/', (req, res) => {
    res.send('Hello!, this is soen server:)')
})

export default app;