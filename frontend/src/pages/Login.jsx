// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LeavesBackground from "../components/LeavesBackground";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      // show animation for at least 700ms for nicer UX
      const apiCall = axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
        role,
      });

      const res = await Promise.all([apiCall, new Promise((r) => setTimeout(r, 700))]);
      const { data } = await apiCall;

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);

      // ✅ After successful login
      alert("✅ Login successful!");

      // token-based role routing
      if (data.user.role === "student") {
        navigate("/dashboard-student", { state: { token: data.token } });
      } else if (data.user.role === "caretaker") {
        navigate("/dashboard-caretaker", { state: { token: data.token } });
      } else {
        navigate("/dashboard-warden", { state: { token: data.token } });
      }

    } catch (err) {
      alert("❌ Login failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative">
      <LeavesBackground />

      {/* subtle glass panel wrapper */}
      <div
        className={`relative z-10 w-full max-w-md p-8 rounded-3xl shadow-2xl transition-transform duration-500
          ${isLoggingIn ? "scale-98 blur-sm/10" : "scale-100"}`}
        aria-live="polite"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl font-extrabold text-center text-green-700 mb-6">
            CleanTrack
          </h1>
          <p className="text-center text-sm text-gray-500 mb-4">
            Hostel Portal Login — choose your role to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex gap-3 items-center">
              <label className="flex-1">
                <select
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 transition"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="caretaker">Caretaker</option>
                  <option value="warden">Warden</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              className={`relative overflow-hidden w-full p-3 rounded-lg font-semibold text-white transition-transform
                ${isLoggingIn ? "bg-green-800 scale-95" : "bg-green-600 hover:bg-green-700 active:scale-95"}`}
              aria-busy={isLoggingIn}
            >
              {/* ripple / spinner */}
              <span className={`inline-block ${isLoggingIn ? "opacity-0" : "opacity-100"} transition-opacity`}>
                Login
              </span>

              {isLoggingIn && (
                <>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"></path>
                    </svg>
                  </span>
                  <span className="absolute -inset-1 bg-white/5 animate-pulse" aria-hidden="true"></span>
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-center mt-4 text-gray-500">
            Don’t have an account?{" "}
            <a href="/signup/student" className="text-green-600 font-semibold">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
