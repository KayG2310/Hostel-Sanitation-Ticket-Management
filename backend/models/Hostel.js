import mongoose from "mongoose";

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true }, // e.g. "Yudhishthir Bhawan"
  code: { type: String, required: true, trim: true, unique: true }, // e.g. "YB"
  caretaker: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // assigned on caretaker verify
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Hostel", hostelSchema);
