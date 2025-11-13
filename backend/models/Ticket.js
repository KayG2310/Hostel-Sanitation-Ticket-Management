// backend/models/Ticket.js
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  // studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentEmail: { type: String, required: true },
  roomNumber: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
  createdAt: { type: Date, default: Date.now },
  photoUrl: { type: String, default: null },        // public URL or server path
  aiConfidence: { type: Number, default: null },    // e.g. 0-100
});

export default mongoose.model("Ticket", ticketSchema);
