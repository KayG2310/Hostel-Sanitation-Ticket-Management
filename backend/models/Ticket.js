// backend/models/Ticket.js
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  // studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentEmail: { type: String, required: true },
  roomNumber: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ticket", ticketSchema);
