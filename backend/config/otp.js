import crypto from 'crypto'
import bcrypt from 'bcrypt'

export const generateOtp = () => {
    return crypto.randomInt(100000, 999999).toString() // 6-digit numeric OTP
}

export const hashOtp = async (otp) => {
    return bcrypt.hash(otp, 10)
}

export const compareOtp = async (rawOtp, hashedOtp) => {
    return bcrypt.compare(rawOtp, hashedOtp)
}