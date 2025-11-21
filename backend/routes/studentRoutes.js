import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Room from "../models/Room.js";
import Rating from "../models/Rating.js";

const router = express.Router();

// Dummy in-memory data for now
const floorJanitors = {
  1: { roomCleaner: "Raj", corridorCleaner: "Mohan", washroomCleaner: "Suresh" },
  2: { roomCleaner: "Vikas", corridorCleaner: "Kian", washroomCleaner: "Manoj" },
  3: { roomCleaner: "Ravi", corridorCleaner: "Amit", washroomCleaner: "Prakash" },
  4: { roomCleaner: "Rishabh", corridorCleaner: "Akshat", washroomCleaner: "Abhishek" },
  5: { roomCleaner: "Tushar Oberoi", corridorCleaner: "Dinesh", washroomCleaner: "Shubhman" },
};

// GET /api/student/dashboard-student
router.get("/dashboard-student", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -verificationCode");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Derive floor number from room number (first digit)
    const floor = user.roomNumber ? user.roomNumber[0] : "1";

    // ✅ Fetch actual room from database
    let room = await Room.findOne({ roomNumber: user.roomNumber }).populate("caretaker", "name email role");
    
    // If room doesn't exist, create it with default values
    if (!room) {
      const floorNum = parseInt(floor) || 1;
      room = new Room({
        roomNumber: user.roomNumber || "N/A",
        floor: floorNum,
        lastCleaned: null, // No cleaning date yet
        caretaker: null,
        janitors: floorJanitors[floorNum] || floorJanitors[1],
      });
      await room.save();
    }

    // ✅ Fetch actual tickets from database
    let tickets = await Ticket.find({ studentEmail: user.email }).sort({ createdAt: -1 });

    // Dummy notifications
    const notifications = [
      { id: 1, message: "Cleaning scheduled at 10 AM tomorrow" },
      { id: 2, message: "Caretaker meeting on 3rd Nov, 5 PM" },
    ];

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roomNumber: user.roomNumber,
      },
      room: {
        roomNumber: room.roomNumber,
        lastCleaned: room.lastCleaned, // ✅ Use actual database value
        caretaker: room.caretaker,
        janitors: room.janitors,
      },
      tickets,
      notifications,
    });
    
  } catch (err) {
    console.error("❌ Error loading dashboard:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🧹 POST /api/student/mark-clean
router.post("/mark-clean", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Only students can mark clean." });
    }

    let room = await Room.findOne({ roomNumber: user.roomNumber });
    if (!room) {
      // Create room entry if missing
      const floor = parseInt(user.roomNumber[0]) || 1;
      room = new Room({
        roomNumber: user.roomNumber,
        floor,
        caretaker: null,
        janitors: {
          roomCleaner: floor === 1 ? "Raj" : floor === 2 ? "Vikas" : "Ravi",
          corridorCleaner: floor === 1 ? "Mohan" : floor === 2 ? "Kiran" : "Amit",
          washroomCleaner: floor === 1 ? "Suresh" : floor === 2 ? "Manoj" : "Prakash",
        },
      });
    }

    room.lastCleaned = new Date();
    await room.save();

    res.json({ message: `Room ${room.roomNumber} marked as clean!`, room });
  } catch (err) {
    console.error("Error marking clean:", err);
    res.status(500).json({ message: "Server error while marking clean." });
  }
});

// ⭐ POST /api/student/rate
router.post("/rate", verifyToken, async (req, res) => {
  try {
    const { ratings } = req.body; // { roomCleaner: 4, corridorCleaner: 5, washroomCleaner: 3 }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Only students can rate janitors." });
    }

    const floor = parseInt(user.roomNumber[0]) || 1;

    const savedRatings = await Promise.all(
      Object.entries(ratings).map(([janitorType, rating]) =>
        new Rating({
          userId: user._id,
          floor,
          janitorType,
          rating,
        }).save()
      )
    );

    res.json({ message: "Ratings submitted successfully!", savedRatings });
  } catch (err) {
    console.error("Error submitting ratings:", err);
    res.status(500).json({ message: "Server error while submitting ratings." });
  }
});
// ⭐ GET /api/student/staff-ratings
router.get("/staff-ratings", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const floor = parseInt(user.roomNumber[0]) || 1;

    // Group by janitorType and calculate averages for that floor
    const avgRatings = await Rating.aggregate([
      { $match: { floor } },
      { $group: { _id: "$janitorType", avgRating: { $avg: "$rating" } } },
    ]);

    const formatted = avgRatings.reduce((acc, item) => {
      acc[item._id] = item.avgRating.toFixed(1);
      return acc;
    }, {});

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching average ratings:", err);
    res.status(500).json({ message: "Server error while fetching ratings." });
  }
});

export default router;
