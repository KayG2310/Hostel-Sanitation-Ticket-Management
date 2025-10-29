import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
        role,
      });
      alert("✅ Login successful!");
      console.log(res.data);
    } catch (err) {
      alert("❌ Login failed: " + err.response?.data?.message);
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8 w-96">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
        Hostel Portal Login
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select
          className="w-full p-2 border rounded-lg"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="caretaker">Caretaker</option>
          <option value="warden">Warden</option>
        </select>
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
        >
          Login
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-500">
        Don’t have an account?{" "}
        <a href="/signup/student" className="text-blue-600 font-semibold">
          Sign up
        </a>
      </p>
    </div>
  );
}
