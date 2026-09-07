import { Router } from 'express'
import { getProjectMessages } from '../controllers/message.controller.js'
import { auth_user } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/:project_id', auth_user, getProjectMessages)

export default router