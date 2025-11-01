import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  lastCleaned: { type: Date, default: null },
  caretaker: { type: String, default: null},
  floor: { type: Number, required: true },
  janitors: {
    roomCleaner: { type: String },
    corridorCleaner: { type: String },
    washroomCleaner: { type: String },
  },
});

export default mongoose.model("Room", roomSchema);
