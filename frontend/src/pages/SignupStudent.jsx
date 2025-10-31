import { useState } from "react";
import axios from "axios";

export default function SignupStudent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roomNumber:"",
  });
  const [step, setStep] = useState(1); // 1 = signup, 2 = verify
  const [code, setCode] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/signup/student", formData);
      alert(res.data.message);
      setStep(2);
    } catch (err) {
      alert("❌ Signup failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/verify/student", {
        email: formData.email,
        code,
      });
      alert(res.data.message);
      window.location.href = "/"; // Redirect to login
    } catch (err) {
      alert("❌ Verification failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-blue-50 to-white">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96">
        {step === 1 ? (
          <>
            <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
              Student Sign Up
            </h1>
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-lg"
              />
              <input
                type="email"
                name="email"
                placeholder="Institute Email (must end with @iitrpr.ac.in)"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-lg"
              />
              <input
                type="text"
                name="roomNumber"
                placeholder="Room Number"
                value={formData.roomNumber}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-lg"
                />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-lg"
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
              >
                Sign Up
              </button>
            </form>
            <p className="text-sm text-center mt-4 text-gray-500">
              Already have an account?{" "}
              <a href="/" className="text-blue-600 font-semibold">
                Login
              </a>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center text-green-700 mb-6">
              Verify Your Email
            </h1>
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                We sent a 6-digit verification code to <br />
                <span className="font-semibold">{formData.email}</span>
              </p>
              <input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full p-2 border rounded-lg text-center tracking-widest"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
              >
                Verify
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
