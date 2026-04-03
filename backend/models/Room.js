import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", default: null },
  lastCleaned: { type: Date, default: null },
  caretaker: { type: String, default: null },
  floor: { type: Number, required: true },
  janitors: {
    roomCleaner:     { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    corridorCleaner: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    washroomCleaner: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
  },
});

export default mongoose.model("Room", roomSchema);
