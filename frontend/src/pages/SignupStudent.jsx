// src/pages/SignupStudent.jsx
import { useState } from "react";
import axios from "axios";
import BubblesBackground from "../components/BubblesBackground";

export default function SignupStudent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roomNumber: "",
  });
  const [step, setStep] = useState(1); // 1 = signup, 2 = verify
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post("http://localhost:3000/api/auth/signup/student", formData);
      alert(res.data.message);
      setStep(2);
    } catch (err) {
      alert("❌ Signup failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post("http://localhost:3000/api/auth/verify/student", {
        email: formData.email,
        code,
      });
      alert(res.data.message);
      window.location.href = "/";
    } catch (err) {
      alert("❌ Verification failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <BubblesBackground />

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-center text-sky-700 mb-4">
                Student Sign Up
              </h1>
              <p className="text-sm text-center text-slate-500 mb-4">
                Create your CleanTrack account for hostel services
              </p>

              <form onSubmit={handleSignup} className="space-y-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-100"
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Institute Email (must end with @iitrpr.ac.in)"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-100"
                />

                <input
                  type="text"
                  name="roomNumber"
                  placeholder="Room Number"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-100"
                />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-100"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full p-3 rounded-lg font-semibold text-white transition
                    ${isSubmitting ? "bg-sky-700/80" : "bg-sky-600 hover:bg-sky-700"}`}
                >
                  {isSubmitting ? "Signing up…" : "Sign Up"}
                </button>
              </form>

              <p className="text-sm text-center mt-4 text-gray-500">
                Already have an account?{" "}
                <a href="/" className="text-sky-600 font-semibold">
                  Login
                </a>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center text-sky-700 mb-4">
                Verify Your Email
              </h1>
              <p className="text-sm text-gray-600 text-center mb-4">
                We sent a 6-digit verification code to <br />
                <span className="font-semibold">{formData.email}</span>
              </p>

              <form onSubmit={handleVerify} className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-200 rounded-lg text-center tracking-widest"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full p-3 rounded-lg font-semibold text-white transition
                    ${isSubmitting ? "bg-green-700/80" : "bg-green-600 hover:bg-green-700"}`}
                >
                  {isSubmitting ? "Verifying…" : "Verify"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
