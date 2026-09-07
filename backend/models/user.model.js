import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const user_schema = new mongoose.Schema({
    username: {type: String},
    email: {type: String, required: true, unique: true, trim: true, lowercase: true},
    password: {type: String, required: true, minlength: 6, select: false},
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false }, // hashed, not stored in plain text
    otpExpiresAt: { type: Date, select: false }
}, {timestamps: true})

user_schema.statics.hash_password = async (password) => {
    return await bcrypt.hash(password, 10)
}

user_schema.methods.is_valid_password = async function(password) {
    return bcrypt.compare(password, this.password)
}

user_schema.methods.generate_jwt = function() {
    return jwt.sign({email: this.email}, process.env.JWT_SECRET, {expiresIn: '24h'})
}

const User = mongoose.model('User', user_schema)
export default User