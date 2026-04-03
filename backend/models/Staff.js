import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", default: null },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Staff", staffSchema);
