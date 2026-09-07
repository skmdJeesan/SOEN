import { useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from '../config/axios.js'
import { UserContext } from '../context/user.context.jsx'

const VerifyOtp = () => {
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')
    const [resending, setResending] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const { setUserdata } = useContext(UserContext)
    const userId = location.state?.userId

    const handleVerify = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const { data } = await axios.post('/users/otp/verify', { userId, otp })
            setUserdata(data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('token', data.token)
            localStorage.setItem('sessionExpiresAt', String(Date.now() + 24 * 60 * 60 * 1000))
            navigate('/') // redirect only on success
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed')
        }
    }

    const handleResend = async () => {
        setResending(true)
        try {
            await axios.post('/users/otp/resend', { userId })
        } catch (err) {
            setError(err.response?.data?.message || 'Could not resend OTP')
        } finally {
            setResending(false)
        }
    }

    return (
        <form onSubmit={handleVerify} className="flex flex-col gap-4 max-w-sm mx-auto mt-20">
            <h2 className="text-xl font-semibold">Verify your email</h2>
            <p className="text-sm text-zinc-400">We sent a 6-digit code to your email.</p>
            <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder="Enter OTP"
                className="bg-zinc-200 px-3 py-2 rounded outline-none border border-white/10"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded font-medium cursor-pointer">Verify</button>
            <button type="button" onClick={handleResend} disabled={resending} className="text-sm text-zinc-400 hover:text-yellow-500 underline cursor-pointer">
                {resending ? 'Resending...' : 'Resend OTP'}
            </button>
        </form>
    )
}

export default VerifyOtp