import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hostelId:    { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", default: null },
  floor:       { type: Number, required: true },
  janitorType: { type: String, enum: ["roomCleaner", "corridorCleaner", "washroomCleaner"], required: true },
  staffId:     { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null }, // the actual person rated
  // Legacy field kept for old documents — new ratings don't use this
  janitorName: { type: String, default: null },
  rating:      { type: Number, required: true },
  createdAt:   { type: Date, default: Date.now },
});

export default mongoose.model("Rating", ratingSchema);
