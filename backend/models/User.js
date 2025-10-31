import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "caretaker", "warden"], required: true },
  roomNumber: { type: String, required: function() { return this.role === "student"; } }, // 👈 new
  isVerified: { type: Boolean, default: false },

  verificationCode: { type: String },
});

export default mongoose.model("User", userSchema);
