// backend/models/Ticket.js
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  // studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentEmail: { type: String, required: true },
  roomNumber: { type: String, required: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", default: null },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["open", "in-progress", "resolved_pending", "resolved"],
    default: "open",
  },
  createdAt: { type: Date, default: Date.now },
  photoUrl: { type: String, default: null },        // public URL or server path
  aiConfidence: { type: Number, default: null },    // e.g. 0-100
  floorSelected: {
    type: String,
    required: false,
  },
  locationSelected: {
    type: String,
    required: false,
  },
  verifiedByStudent: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Ticket", ticketSchema);
