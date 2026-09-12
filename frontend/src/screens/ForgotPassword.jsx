import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from '../config/axios.js'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [userId, setUserId] = useState('')

  const location = useLocation()
  const navigate = useNavigate()
  const initialEmail = location.state?.email || ''

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await axios.post('/users/password/forgot', { email: email.trim() || initialEmail })
      setUserId(data.userId)
      setOtpSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await axios.post('/users/password/reset', { userId, otp, password: newPassword })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed')
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await axios.post('/users/password/resend', { userId })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={otpSent ? handleResetPassword : handleSendOtp} className="flex flex-col gap-4 max-w-sm mx-auto mt-20 p-5 sm:p-0">
      <h2 className="text-xl font-semibold">Reset Password</h2>
      {!otpSent ? (
        <>
          <p className="text-sm text-zinc-400">Enter your email and we will send you a reset code.</p>
          <input
            type="email"
            value={email || initialEmail}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="bg-zinc-200 px-3 py-2 rounded outline-none border border-white/10"
          />
          <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded font-medium cursor-pointer">Send OTP</button>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-400">We sent a 6-digit code to {email || initialEmail}.</p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            inputMode="numeric"
            placeholder="Enter OTP"
            required
            className="bg-zinc-200 px-3 py-2 rounded outline-none border border-white/10"
          />
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[#8B93A7] mb-1.5 ml-1">Enter New Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                placeholder="••••••••"
                className="bg-zinc-200 px-3 py-2 rounded outline-none border border-white/10 w-full"
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6376] hover:text-[#8B93A7] transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded font-medium cursor-pointer">Reset Password</button>
          <button type="button" onClick={handleResend} disabled={resending} className="text-sm text-zinc-400 hover:text-yellow-500 underline cursor-pointer">
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </>
      )}
      {error && !otpSent && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  )
}


export default ForgotPassword