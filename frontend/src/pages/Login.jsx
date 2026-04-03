// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LeavesBackground from "../components/LeavesBackground";
import SwirlTransition from "../components/SwirlTransition";

const API = import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL;

export default function Login() {
  const navigate = useNavigate();

  // ── Main login state ───────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role] = useState("caretaker");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSwirling, setIsSwirling] = useState(false);

  // ── Forgot-password step: "login" | "forgot" | "reset" | "done" ───────────
  const [step, setStep] = useState("login");
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp]     = useState("");
  const [newPass, setNewPass]  = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError]   = useState("");
  const [fpSuccess, setFpSuccess] = useState("");

  const resetFp = () => {
    setStep("login");
    setFpEmail(""); setFpOtp(""); setNewPass(""); setConfirmPass("");
    setFpError(""); setFpSuccess("");
  };

  // ── Handler: login ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const apiCall = axios.post(`${API}/api/auth/login`, { email, password, role });
      const [res] = await Promise.all([apiCall, new Promise((r) => setTimeout(r, 700))]);
      const { data } = res;
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      setIsSwirling(true);
      await new Promise((r) => setTimeout(r, 1300));
      alert("✅ Login successful!");
      if (data.user.role === "student") navigate("/dashboard-student", { state: { token: data.token } });
      else if (data.user.role === "caretaker") navigate("/dashboard-caretaker", { state: { token: data.token } });
    } catch (err) {
      alert("❌ Login failed: " + (err.response?.data?.message || err.message));
      setIsLoggingIn(false);
      setIsSwirling(false);
    }
  };

  // ── Handler: send reset OTP ────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!fpEmail) return setFpError("Please enter your email.");
    setFpError(""); setFpLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email: fpEmail });
      setStep("reset");
    } catch (err) {
      setFpError(err.response?.data?.message || "Failed to send reset code.");
    } finally {
      setFpLoading(false);
    }
  };

  // ── Handler: reset password ────────────────────────────────────────────────
  const handleResetPass = async (e) => {
    e.preventDefault();
    if (!fpOtp) return setFpError("Please enter the OTP from your email.");
    if (!newPass) return setFpError("Please enter a new password.");
    if (newPass.length < 6) return setFpError("Password must be at least 6 characters.");
    if (newPass !== confirmPass) return setFpError("Passwords do not match.");
    setFpError(""); setFpLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/reset-password`, {
        email: fpEmail,
        code: fpOtp,
        newPassword: newPass,
      });
      setFpSuccess(res.data.message || "Password reset successfully!");
      setStep("done");
    } catch (err) {
      setFpError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setFpLoading(false);
    }
  };

  // ── Shared input class ─────────────────────────────────────────────────────
  const inputCls =
    "w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 transition text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <LeavesBackground />
      <SwirlTransition active={isSwirling} />

      <div
        className={`relative z-10 w-full max-w-md p-8 rounded-3xl shadow-2xl transition-transform duration-500
          ${isLoggingIn ? "scale-98 blur-sm/10" : "scale-100"}`}
        aria-live="polite"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-lg">

          {/* ═══ LOGO / step title ═══ */}
          <h1 className="text-3xl font-extrabold text-center text-green-700 mb-1">CleanTrack</h1>
          <p className="text-center text-xs text-gray-400 mb-6 font-medium tracking-wide uppercase">
            {step === "login"  ? "Caretaker Portal"
            : step === "forgot" ? "Forgot Password"
            : step === "reset"  ? "Reset Password"
            :                     "Password Reset ✅"}
          </p>

          {/* ═══ LOGIN FORM ═══ */}
          {step === "login" && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email" placeholder="Email" className={inputCls}
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
                <input
                  type="password" placeholder="Password" className={inputCls}
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
                <button
                  type="submit"
                  className={`relative overflow-hidden w-full p-3 rounded-lg font-semibold text-white transition-transform
                    ${isLoggingIn ? "bg-green-800 scale-95" : "bg-green-600 hover:bg-green-700 active:scale-95"}`}
                  aria-busy={isLoggingIn}
                  disabled={isLoggingIn}
                >
                  <span className={`inline-block ${isLoggingIn ? "opacity-0" : "opacity-100"} transition-opacity`}>
                    Login
                  </span>
                  {isLoggingIn && (
                    <>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z" />
                        </svg>
                      </span>
                      <span className="absolute -inset-1 bg-white/5 animate-pulse" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              {/* Forgot password link */}
              <div className="text-right mt-3">
                <button
                  onClick={() => setStep("forgot")}
                  className="text-xs text-green-600 hover:text-green-800 font-semibold underline underline-offset-2 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <p className="text-sm text-center mt-4 text-gray-500">
                Don't have an account?{" "}
                <a href="/signup/caretaker" className="text-green-600 font-semibold ml-1">Sign up here</a>
              </p>
            </>
          )}

          {/* ═══ FORGOT — Enter email ═══ */}
          {step === "forgot" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-sm text-gray-500 -mt-2">
                Enter your registered email and we'll send a one-time reset code.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email address</label>
                <input
                  type="email" placeholder="you@iitrpr.ac.in" className={inputCls}
                  value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} required autoFocus
                />
              </div>
              {fpError && <p className="text-xs text-red-500 font-medium">{fpError}</p>}
              <button
                type="submit" disabled={fpLoading}
                className="w-full p-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-all"
              >
                {fpLoading ? "Sending code…" : "Send Reset Code →"}
              </button>
              <button
                type="button" onClick={resetFp}
                className="w-full mt-1 text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                ← Back to Login
              </button>
            </form>
          )}

          {/* ═══ RESET — Enter OTP + new password ═══ */}
          {step === "reset" && (
            <form onSubmit={handleResetPass} className="space-y-4">
              <p className="text-sm text-gray-500 -mt-2">
                A 6-digit code was sent to{" "}
                <span className="font-semibold text-gray-700">{fpEmail}</span>.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reset Code</label>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  placeholder="• • • • • •"
                  className={`${inputCls} tracking-[0.4em] text-center font-mono text-lg`}
                  value={fpOtp} onChange={(e) => setFpOtp(e.target.value)} required autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                <input
                  type="password" placeholder="At least 6 characters" className={inputCls}
                  value={newPass} onChange={(e) => setNewPass(e.target.value)} required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                <input
                  type="password" placeholder="Re-enter new password" className={inputCls}
                  value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required
                />
              </div>
              {fpError && <p className="text-xs text-red-500 font-medium">{fpError}</p>}
              <button
                type="submit" disabled={fpLoading}
                className="w-full p-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-all"
              >
                {fpLoading ? "Resetting…" : "Reset Password"}
              </button>
              <button
                type="button" onClick={resetFp}
                className="w-full mt-1 text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                ← Back to Login
              </button>
            </form>
          )}

          {/* ═══ DONE ═══ */}
          {step === "done" && (
            <div className="text-center space-y-5 py-2">
              <div className="text-5xl">✅</div>
              <p className="text-green-700 font-semibold text-base leading-relaxed">{fpSuccess}</p>
              <button
                onClick={resetFp}
                className="w-full p-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-all"
              >
                Back to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
