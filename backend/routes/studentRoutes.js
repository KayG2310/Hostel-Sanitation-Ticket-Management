import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

const router = express.Router();

// Dummy in-memory data for now
const floorJanitors = {
  1: { roomCleaner: "Raj", corridorCleaner: "Mohan", washroomCleaner: "Suresh" },
  2: { roomCleaner: "Vikas", corridorCleaner: "Kiran", washroomCleaner: "Manoj" },
  3: { roomCleaner: "Ravi", corridorCleaner: "Amit", washroomCleaner: "Prakash" },
};

// GET /api/student/dashboard-student
router.get("/dashboard-student", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -verificationCode");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Derive floor number from room number (first digit)
    const floor = user.roomNumber ? user.roomNumber[0] : "1";

    // Create dummy room info
    const room = {
      roomNumber: user.roomNumber || "N/A",
      lastCleaned: new Date(Date.now() - 86400000), // 1 day ago
      numTickets: 2, // temporary
      caretaker: null, // placeholder
      janitors: floorJanitors[floor] || floorJanitors[1],
    };

    // Dummy tickets
    // ✅ Fetch actual tickets from database
let tickets = await Ticket.find({ studentEmail: user.email }).sort({ createdAt: -1 });


    // Dummy notifications
    const notifications = [
      { id: 1, message: "Cleaning scheduled at 10 AM tomorrow" },
      { id: 2, message: "Caretaker meeting on 3rd Nov, 5 PM" },
    ];

    // res.json({ user, room, tickets, notifications });
    res.json({
      user: {
        _id: user._id,       // <-- add this line
        name: user.name,
        email: user.email,
        role: user.role,
        roomNumber: user.roomNumber,
      },
      room,
      tickets,
      notifications,
    });
    
  } catch (err) {
    console.error("❌ Error loading dashboard:", err);
    res.status(500).json({ message: "Server error" });
  }
});
import Room from "../models/Room.js";
import Rating from "../models/Rating.js";

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

export default router;
