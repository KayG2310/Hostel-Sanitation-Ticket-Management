// backend/models/Announcement.js
import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  postedByName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high"], 
    default: "medium" 
  },
  targetAudience: {
    type: String,
    enum: ["all", "students", "staff"],
    default: "all"
  }
});

export default mongoose.model("Announcement", announcementSchema);

