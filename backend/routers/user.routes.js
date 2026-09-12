import {Router} from 'express'
import { forgot_password, get_all_users, get_profile, password_reset, password_reset_resend, user_login, user_logout, user_otp_verify, user_register, user_resend_otp } from '../controllers/user.controller.js'
import {body} from 'express-validator'
import { auth_user } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/register', 
    body('username').notEmpty().withMessage('Username is required.'),
    body('email').isEmail().withMessage('Email must be valid.'),
    body('password').isLength({min: 6}).withMessage('Password must be atleast of 6 chars.'),
    user_register
)

router.post('/login',
    body('email').isEmail().withMessage('Email must be valid.'),
    body('password').isLength({min: 6}).withMessage('Password must be atleast of 6 chars.'),
    user_login
)

router.post('/otp/verify', 
    body('userId').notEmpty().withMessage('User ID is required.'),
    body('otp').notEmpty().withMessage('OTP is required.'),
    user_otp_verify
)

router.post('/otp/resend', 
    body('userId').notEmpty().withMessage('User ID is required.'),
    user_resend_otp
)

router.post('/password/forgot',
    body('email').isEmail().withMessage('Email must be valid.'),
    forgot_password
)

router.post('/password/reset',
    body('userId').notEmpty().withMessage('User ID is required.'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    password_reset
)

router.post('/password/resend',
    body('userId').notEmpty().withMessage('User ID is required.'),
    password_reset_resend
)

router.get('/logout', auth_user, user_logout)
router.get('/profile', auth_user, get_profile)
router.get('/all', auth_user, get_all_users)
// router.get('/:userId', auth_user, get_username)

export default router