import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Room from "../models/Room.js";
import Rating from "../models/Rating.js";
import Announcement from "../models/Announcement.js";

const router = express.Router();

/** Extract floor from room numbers like "219", "RW-201", "G04" etc.
 *  Strips non-digit chars, then reads the first digit as the floor. */
const getFloor = (roomNumber) => {
  const digits = String(roomNumber).replace(/[^0-9]/g, "");
  const floor = digits ? parseInt(digits[0], 10) : 1;
  return floor || 1; // guard against 0
};

// GET /api/student/dashboard-student
router.get("/dashboard-student", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -verificationCode");
    if (!user) return res.status(404).json({ message: "User not found" });

    const floor = getFloor(user.roomNumber);

    // Fetch room and populate Staff refs so student sees actual names
    let room = await Room.findOne({ roomNumber: user.roomNumber, hostelId: user.hostelId })
      .populate("janitors.roomCleaner", "name phone")
      .populate("janitors.corridorCleaner", "name phone")
      .populate("janitors.washroomCleaner", "name phone");

    // Step 4: find caretaker scoped to this student's hostel
    const caretakerUser = await User.findOne({
      role: "caretaker",
      isVerified: true,
      hostelId: user.hostelId,
    });
    const caretakerName = caretakerUser ? caretakerUser.name : "Unassigned";

    if (!room) {
      // Create a bare room — no janitors assigned yet, stamp hostelId
      const newRoom = new Room({
        roomNumber: user.roomNumber || "N/A",
        floor,
        hostelId: user.hostelId || null,  // Step 4: stamp hostel on room
        lastCleaned: null,
        caretaker: caretakerName !== "Unassigned" ? caretakerName : null,
        janitors: { roomCleaner: null, corridorCleaner: null, washroomCleaner: null },
      });
      await newRoom.save();
      room = newRoom;
    } else if (caretakerName !== "Unassigned" && !room.caretaker) {
      room.caretaker = caretakerName;
      await room.save();
    }

    const tickets = await Ticket.find({ studentEmail: user.email }).sort({ createdAt: -1 });

    const notifications = [
      { id: 1, message: "Cleaning scheduled at 10 AM tomorrow" },
      { id: 2, message: "Caretaker meeting on 3rd Nov, 5 PM" },
    ];

    // Build janitor info map for the student dashboard (name + phone)
    const janitors = {
      roomCleaner: {
        name:  room.janitors?.roomCleaner?.name  || "Unassigned",
        phone: room.janitors?.roomCleaner?.phone || null,
      },
      corridorCleaner: {
        name:  room.janitors?.corridorCleaner?.name  || "Unassigned",
        phone: room.janitors?.corridorCleaner?.phone || null,
      },
      washroomCleaner: {
        name:  room.janitors?.washroomCleaner?.name  || "Unassigned",
        phone: room.janitors?.washroomCleaner?.phone || null,
      },
    };

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
        lastCleaned: room.lastCleaned,
        caretaker: caretakerName,
        janitors,
      },
      tickets,
      notifications,
    });
  } catch (err) {
    console.error("❌ Error loading dashboard:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/student/mark-clean
router.post("/mark-clean", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student")
      return res.status(403).json({ message: "Only students can mark clean." });

    let room = await Room.findOne({ roomNumber: user.roomNumber, hostelId: user.hostelId });
    if (!room) {
      const floor = getFloor(user.roomNumber);
      room = new Room({
        roomNumber: user.roomNumber,
        floor,
        hostelId: user.hostelId || null,  // Step 4: stamp hostelId
        caretaker: null,
        janitors: { roomCleaner: null, corridorCleaner: null, washroomCleaner: null },
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

// POST /api/student/rate
router.post("/rate", verifyToken, async (req, res) => {
  try {
    const { ratings } = req.body; // { roomCleaner: 4, corridorCleaner: 5, washroomCleaner: 3 }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student")
      return res.status(403).json({ message: "Only students can rate janitors." });

    const floor = getFloor(user.roomNumber);

    // Fetch room to get current Staff assignments
    const room = await Room.findOne({ roomNumber: user.roomNumber });
    const currentJanitors = room?.janitors || {};

    const savedRatings = await Promise.all(
      Object.entries(ratings).map(([janitorType, rating]) => {
        // staffId is the ObjectId stored in the room's janitor slot
        const staffId = currentJanitors[janitorType] || null;
        return new Rating({
          userId: user._id,
          floor,
          janitorType,
          staffId,      // the actual person being rated
          rating,
        }).save();
      })
    );

    res.json({ message: "Ratings submitted successfully!", savedRatings });
  } catch (err) {
    console.error("Error submitting ratings:", err);
    res.status(500).json({ message: "Server error while submitting ratings." });
  }
});

// GET /api/student/staff-ratings
router.get("/staff-ratings", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const floor = getFloor(user.roomNumber);

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

// GET /api/student/announcements
router.get("/announcements", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Step 6: scope announcements to the student's hostel
    const hostelFilter = user.hostelId ? { hostelId: user.hostelId } : {};

    const announcements = await Announcement.find({
      createdAt: { $gte: sevenDaysAgo },
      $or: [{ targetAudience: "all" }, { targetAudience: "students" }],
      ...hostelFilter,
    })
      .populate("postedBy", "name email")
      .limit(20);

    const priorityOrder = { high: 3, medium: 2, low: 1 };
    announcements.sort((a, b) => {
      const diff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      return diff !== 0 ? diff : new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ announcements });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ message: "Server error while fetching announcements." });
  }
});

// PUT /api/student/confirm-resolved/:id
router.put("/confirm-resolved/:id", verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    ticket.status = "resolved";
    ticket.verifiedByStudent = true;
    await ticket.save();
    res.json({ message: "Ticket fully resolved", ticket });
  } catch (err) {
    console.error("Error confirming resolution:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/student/delete-account
router.delete("/delete-account", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete all tickets raised by this student
    const ticketResult = await Ticket.deleteMany({ studentEmail: user.email });

    // Delete the user
    await User.findByIdAndDelete(req.user.id);

    console.log(`🗑️ Deleted account for ${user.email} (${ticketResult.deletedCount} tickets removed)`);
    res.json({ message: "Account and all associated tickets deleted successfully." });
  } catch (err) {
    console.error("Error deleting student account:", err);
    res.status(500).json({ message: "Server error while deleting account" });
  }
});

export default router;
