import nodemailer from 'nodemailer'
import 'dotenv/config'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD?.replace(/\s/g, ''),
    },
})

export const sendOtpEmail = async (toEmail, otp) => {
    try {
        await transporter.sendMail({
            from: `"SOEN" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'Verify your email',
            html: `<p>Your verification code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`,
        })
    } catch (error) {
        console.error('OTP email delivery failed:', error.message)
        const mail_error = new Error('Unable to send the verification email. Check the email configuration.')
        mail_error.code = 'OTP_EMAIL_FAILED'
        throw mail_error
    }
}