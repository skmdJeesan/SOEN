import { Router } from 'express'
import { auth_user } from '../middleware/auth.middleware.js'
import { get_ai_response } from '../controllers/ai.controller.js'

const router = Router()

router.get('/get-response', auth_user, get_ai_response)

export default router