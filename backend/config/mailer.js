import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendOtpEmail = async (toEmail, otp) => {
    try {
        const { error } = await resend.emails.send({
            from: 'SOEN <onboarding@resend.dev>', // Resend's shared sending domain for testing; verify your own domain later for production use
            to: toEmail,
            subject: 'Verify your email',
            html: `<p>Your verification code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`,
        })

        if (error) {
            throw new Error(error.message)
        }
    } catch (error) {
        console.error('OTP email delivery failed:', error.message)
        const mail_error = new Error('Unable to send the verification email. Check the email configuration.')
        mail_error.code = 'OTP_EMAIL_FAILED'
        throw mail_error
    }
}