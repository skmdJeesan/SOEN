import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from '../config/axios.js'
import {UserContext} from '../context/user.context.jsx'

export default function Login() {
  const navigate = useNavigate();

  // Two-way bound form state
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const {setUserdata} = useContext(UserContext)

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length === 0) next.password = "Enter your password.";
    else if (form.password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const {data} = await axios.post('/users/login', form)
      // console.log(data)
      setUserdata(data.user)
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('sessionExpiresAt', String(Date.now() + 24 * 60 * 60 * 1000));
      navigate("/");
    } catch (err) {
        if (err.response?.status === 403 && err.response?.data?.userId) {
          navigate('/verify-otp', { state: { userId: err.response.data.userId } })
        } else {
          const responseErrors = err.response?.data?.errors;
          const validationMessage = Array.isArray(responseErrors)
            ? responseErrors[0]?.msg
            : responseErrors;
          setErrors({
            form: err.response?.data?.message || validationMessage || 'Login failed',
          });
        }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#05070C] text-[#E7E9EE] flex items-center justify-center p-6 font-sans relative overflow-hidden">

      {/* Grid backdrop + ambient glow */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-lg h-128 rounded-full bg-[#E8B34A]/10 blur-3xl" />
      
      <div className="logo flex items-center gap-1 absolute top-4 left-4 sm:top-8 sm:left-16">
        <img src="/cursor-ai-yellow.png" alt="Logo" className="w-7 h-7" />
        <h1 className="text-xl font-bold" font-display>SOEN</h1>
      </div>

      <div className="relative z-10 w-full max-w-95">
        <div className="rounded-4xl border border-[#1F2230] bg-zinc-900/20 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
          <h2 className="font-display text-3xl font-semibold tracking-tight mb-2">
            Log in
          </h2>
          <p className="text-[#8B93A7] text-sm mb-8">
            New here?{" "}
            <Link to="/register" className="text-[#E8B34A] hover:text-[#F3C877] underline underline-offset-2 transition-colors">
              Create an account
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#8B93A7] mb-1.5 ml-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                className={`w-full rounded-lg bg-[#0A0C12] border px-3.5 py-2.5 text-sm text-[#E7E9EE] placeholder-[#4A5165] outline-none transition-all focus:ring-2 focus:ring-[#E8B34A]/40 ${
                  errors.email ? "border-[#F87171]" : "border-[#1F2230] focus:border-[#E8B34A]"
                }`}
              />
              {errors.email && <p className="mt-1.5 text-xs text-[#F87171]">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm ml-1 font-medium text-[#8B93A7]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password', { state: { email: form.email } })}
                  className="text-xs text-[#5B6376] hover:text-[#8B93A7] transition-colors bg-transparent border-0 p-0 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="••••••••"
                  className={`w-full rounded-lg bg-[#0A0C12] border px-3.5 py-2.5 pr-10 text-sm text-[#E7E9EE] placeholder-[#4A5165] outline-none transition-all focus:ring-2 focus:ring-[#E8B34A]/40 ${
                    errors.password ? "border-[#F87171]" : "border-[#1F2230] focus:border-[#E8B34A]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6376] hover:text-[#8B93A7] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-10-8-10-8a18.7 18.7 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 10 8 10 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-[#F87171]">{errors.password}</p>}
            </div>

            {errors.form && (
              <p className="text-xs text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-3 py-2">
                {errors.form}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer w-full rounded-lg bg-[#E8B34A] text-[#05070C] font-medium text-sm py-2.5 mt-2 transition-all hover:bg-[#F3C877] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                  </svg>
                  Logging in…
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-[#4A5165] leading-relaxed">
          By continuing, you agree to the Terms of Service and Privacy Policy.
        </p>
      </div>

    </div>
  );
}