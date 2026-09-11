import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios.js";

function score_password(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0 - 4
}

const password_strength = [
  { label: "Too weak", color: "bg-[#F87171]" },
  { label: "Weak", color: "bg-[#F87171]" },
  { label: "Fair", color: "bg-[#E8B34A]" },
  { label: "Good", color: "bg-[#E8B34A]" },
  { label: "Strong", color: "bg-[#4ADE80]" },
];

export default function Register() {
  const navigate = useNavigate();

  // Two-way bound form state
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null })); 
    // it's better to clear the error for that field when user starts typing again
  };

  const strength = useMemo(() => score_password(form.password), [form.password]);
  // memoized password strength score to avoid recalculating on every render

  const validate = () => {
    const next = {};
    if (form.username.trim().length < 3) next.username = "Use at least 3 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 6) next.password = "Use at least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const {data} = await axios.post('/users/register', form)
      navigate('/verify-otp', { state: { userId: data.userId } })
    } catch (err) {
      setErrors({ form: err.response?.data?.message || "Something went wrong. Try again." });
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

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-4xl border border-[#1F2230] bg-zinc-900/20 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
          <h2 className="font-display text-3xl font-semibold tracking-tight mb-2">
            Create your account
          </h2>
          <p className="text-[#8B93A7] text-sm mb-8">
            Already registered?{" "}
            <Link to="/login" className="text-[#E8B34A] hover:text-[#F3C877] underline underline-offset-2 transition-colors">
              Log in instead
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-[#8B93A7] mb-1.5 ml-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange("username")}
                placeholder="jeesan_dev"
                className={`w-full rounded-lg bg-[#0A0C12] border px-3.5 py-2.5 text-sm text-[#E7E9EE] placeholder-[#4A5165] outline-none transition-all focus:ring-2 focus:ring-[#E8B34A]/40 ${
                  errors.username ? "border-[#F87171]" : "border-[#1F2230] focus:border-[#E8B34A]"
                }`}
              />
              {errors.username && <p className="mt-1.5 text-xs text-[#F87171]">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#8B93A7] mb-1.5 ml-1">
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
              <label htmlFor="password" className="block text-xs font-medium text-[#8B93A7] mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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

              {/* Strength meter */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength ? password_strength[strength].color : "bg-[#1F2230]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-[#5B6376]">{password_strength[strength].label}</p>
                </div>
              )}
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
                  Creating account…
                </>
              ) : (
                "Create account"
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