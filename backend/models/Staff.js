import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Staff", staffSchema);
