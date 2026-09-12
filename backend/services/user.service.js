import { sendOtpEmail } from "../config/mailer.js"
import { compareOtp, generateOtp, hashOtp } from "../config/otp.js"
import User from "../models/user.model.js"

// services (wherever create_user lives)
export const create_user = async (body) => {
    const { username, email, password } = body
    if (!email || !password) throw new Error('Email and Password are required!')

    const existingUser = await User.findOne({ email })
    if (existingUser && existingUser.isVerified) {
        throw new Error('User already exists')
    }

    const hashed_password = await User.hash_password(password)
    const otp = generateOtp()
    const hashedOtp = await hashOtp(otp)
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

    let user
    if (existingUser && !existingUser.isVerified) {
        // re-registering on top of an unverified account — update instead of creating a duplicate
        existingUser.username = username
        existingUser.password = hashed_password
        existingUser.otp = hashedOtp
        existingUser.otpExpiresAt = otpExpiresAt
        user = await existingUser.save()
    } else {
        user = await User.create({
            username, email, password: hashed_password,
            isVerified: false, otp: hashedOtp, otpExpiresAt
        })
    }

    await sendOtpEmail(email, otp)

    delete user._doc.password
    return { user } // no token
}

export const verify_user_otp = async (userId, otp) => {
    const user = await User.findById(userId).select('+otp +otpExpiresAt +password')
    if (!user) throw new Error('User not found')
    if (user.isVerified) throw new Error('Email already verified')

    if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        throw new Error('OTP expired. Please request a new one.')
    }

    const isValid = await compareOtp(otp, user.otp)
    if (!isValid) throw new Error('Invalid OTP')

    user.isVerified = true
    user.otp = undefined
    user.otpExpiresAt = undefined
    await user.save()

    const token = user.generate_jwt()
    delete user._doc.password
    return { user, token }
}

export const resend_user_otp = async (userId) => {
    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')
    if (user.isVerified) throw new Error('Email already verified')

    const otp = generateOtp()
    user.otp = await hashOtp(otp)
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendOtpEmail(user.email, otp)
}

export const request_password_reset = async (email) => {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user || !user.isVerified) throw new Error('No verified account found with that email')

    const otp = generateOtp()
    user.otp = await hashOtp(otp)
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()
    await sendOtpEmail(user.email, otp)

    return user._id
}

export const resend_password_reset_otp = async (userId) => {
    const user = await User.findOne({ _id: userId, isVerified: true })
    if (!user) throw new Error('User not found')

    const otp = generateOtp()
    user.otp = await hashOtp(otp)
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()
    await sendOtpEmail(user.email, otp)
}

export const reset_password = async ({ userId, otp, password }) => {
    const user = await User.findById(userId).select('+otp +otpExpiresAt +password')
    if (!user || !user.isVerified) throw new Error('User not found')
    if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        throw new Error('OTP expired. Please request a new one.')
    }
    if (!await compareOtp(otp, user.otp)) throw new Error('Invalid OTP')

    user.password = await User.hash_password(password)
    user.otp = undefined
    user.otpExpiresAt = undefined
    await user.save()
}

export const login_user = async (body) => {
    const { email, password } = body
    const existing_user = await User.findOne({ email }).select('+password')
    if (!existing_user) return null

    const is_match = await existing_user.is_valid_password(password)
    if (!is_match) return null

    if (!existing_user.isVerified) {
        return { unverified: true, userId: existing_user._id } // credentials are correct, but block login
    }

    const token = existing_user.generate_jwt()
    delete existing_user._doc.password
    return { user: existing_user, token }
}

export const get_all_users_by_userid = async ({ user_id }) => {
    if (!user_id) throw new Error('User Id is required')
    const all_users = await User.find({
        _id: { $ne: user_id }
    });
    return all_users;
}