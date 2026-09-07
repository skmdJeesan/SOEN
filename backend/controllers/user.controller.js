import { create_user, get_all_users_by_userid, login_user, resend_user_otp, verify_user_otp } from "../services/user.service.js"
import {validationResult} from 'express-validator'
import redis_client from "../config/redis.js"
import User from "../models/user.model.js"

export const user_register = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
        const { user } = await create_user(req.body)
        res.status(201).json({
            message: 'OTP sent to your email. Please verify to continue.',
            userId: user._id,
        })
    } catch (error) {
        console.error('Registration failed:', error)
        if (error.message === 'User already exists' || error.code === 11000) {
            return res.status(409).json({ message: 'An account with this email already exists.' })
        }
        if (error.code === 'OTP_EMAIL_FAILED') {
            return res.status(503).json({ message: error.message })
        }
        res.status(500).json({ message: 'Registration failed. Please try again.' })
    }
}

export const user_otp_verify = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
        const { user, token } = await verify_user_otp(req.body.userId, req.body.otp)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV == 'production',
            sameSite: process.env.NODE_ENV == 'production' ? 'none' : 'strict',
            maxAge: 24 * 60 * 60 * 1000
        })
        res.status(200).json({ user, token })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const user_resend_otp = async (req, res) => {
    try {
        await resend_user_otp(req.body.userId)
        res.status(200).json({ message: 'OTP resent successfully' })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const user_login = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
        const result = await login_user(req.body)
        if (!result) return res.status(400).json({ errors: 'invalid credentials' })

        if (result.unverified) {
            return res.status(403).json({
                message: 'Please verify your email first',
                userId: result.userId,
            })
        }

        const { user, token } = result
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV == 'production',
            sameSite: process.env.NODE_ENV == 'production' ? 'none' : 'strict',
            maxAge: 24 * 60 * 60 * 1000
        })
        res.status(200).json({ user, token })
    } catch (error) {
        res.status(500).send(error.message)
    }
}

export const user_logout = async (req, res) => {
    try {
        const auth_header = req.headers.authorization
        const token = req.cookies?.token || (auth_header?.startsWith('Bearer ') ? auth_header.slice(7) : null)
        if (!token) return res.status(400).json({message: "No token provided"})
        redis_client.set(token, 'logout', 'EX', 60*60*24)
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV == 'production' ? 'none' : 'strict'
        })
        res.status(200).json({message: `user logout successfully`})
    } catch (error) {
        console.log(error)
        res.status(500).json({message: `log out error: ${error}`})
    }
}

export const get_profile = async (req, res) => {
    try {
       return res.status(200).json({user: req.user})
    } catch (error) {
        return res.status(500).json({message: `get profile error: ${error}`})
    }
}

export const get_all_users = async (req, res) => {
    try {
        const {email} = req.user
        const curr_user = await User.findOne({email})
        const all_users = await get_all_users_by_userid({
            user_id: curr_user._id
        })
        return res.status(200).json({users: all_users})
    } catch (error) {
        return res.status(500).json({message: `get all users error: ${error}`})
    }
}