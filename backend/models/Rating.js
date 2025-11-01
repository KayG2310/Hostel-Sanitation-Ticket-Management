import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  floor: { type: Number, required: true },
  janitorType: { type: String, enum: ["roomCleaner", "corridorCleaner", "washroomCleaner"], required: true },
  rating: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Rating", ratingSchema);
