import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Rating from "../models/Rating.js";
import Room from "../models/Room.js";
import Announcement from "../models/Announcement.js";
import { sendEmail } from "../utils/sendMail.js";

const router = express.Router();

router.get("/tickets", verifyToken, async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    if (!caretaker) return res.status(404).json({ message: "Caretaker not found" });

    // Fetch tickets belonging to their floor / hostel
    const tickets = await Ticket.find({})
      .sort({ createdAt: -1 });

    res.json({ tickets });
  } catch (err) {
    console.error("Error loading caretaker tickets:", err);
    res.status(500).json({ message: "Server Error" });
  }
});
// PUT /api/caretaker/tickets/:id/status
router.put("/tickets/:id/status", verifyToken, async (req, res) => {
    try {
      const { status } = req.body; // expected: "in-process" or "resolved"
      const ticketId = req.params.id;
  
      const valid = ["open", "in-process", "resolved"];
      if (!valid.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
  
      const updated = await Ticket.findByIdAndUpdate(
        ticketId,
        { status },
        { new: true }
      );
  
      if (!updated)
        return res.status(404).json({ message: "Ticket not found" });
  
      res.json({ message: "Status updated", ticket: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating ticket" });
    }
  });

// GET /api/caretaker/staff-ratings
router.get("/staff-ratings", verifyToken, async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    if (!caretaker) return res.status(404).json({ message: "Caretaker not found" });

    const { janitorType, floor, sortOrder = "desc" } = req.query;

    // Build match criteria
    const matchCriteria = {};
    if (janitorType && janitorType !== "all") {
      matchCriteria.janitorType = janitorType;
    }
    if (floor && floor !== "all") {
      matchCriteria.floor = parseInt(floor);
    }

    // Aggregate ratings grouped by floor and janitorType
    const ratings = await Rating.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            floor: "$floor",
            janitorType: "$janitorType"
          },
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          floor: "$_id.floor",
          janitorType: "$_id.janitorType",
          avgRating: { $round: ["$avgRating", 2] },
          totalRatings: 1
        }
      },
      {
        $sort: sortOrder === "asc" 
          ? { avgRating: 1, floor: 1, janitorType: 1 }
          : { avgRating: -1, floor: 1, janitorType: 1 }
      }
    ]);

    // Add janitor names to each rating
    const ratingsWithNames = await Promise.all(
      ratings.map(async (rating) => {
        // Find a room on this floor to get janitor names
        const room = await Room.findOne({ floor: rating.floor });
        let janitorName = "N/A";
        
        if (room && room.janitors) {
          janitorName = room.janitors[rating.janitorType] || "N/A";
        } else {
          // Fallback to hardcoded mapping if room not found
          const floorJanitors = {
            1: { roomCleaner: "Raj", corridorCleaner: "Mohan", washroomCleaner: "Suresh" },
            2: { roomCleaner: "Vikas", corridorCleaner: "Kian", washroomCleaner: "Manoj" },
            3: { roomCleaner: "Ravi", corridorCleaner: "Amit", washroomCleaner: "Prakash" },
            4: { roomCleaner: "Rishabh", corridorCleaner: "Akshat", washroomCleaner: "Abhishek" },
            5: { roomCleaner: "Tushar Oberoi", corridorCleaner: "Dinesh", washroomCleaner: "Shubhman" },
          };
          const floorData = floorJanitors[rating.floor];
          if (floorData) {
            janitorName = floorData[rating.janitorType] || "N/A";
          }
        }
        
        return {
          ...rating,
          janitorName
        };
      })
    );

    res.json({ ratings: ratingsWithNames });
  } catch (err) {
    console.error("Error fetching staff ratings:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/caretaker/announcements
router.post("/announcements", verifyToken, async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    if (!caretaker || caretaker.role !== "caretaker") {
      return res.status(403).json({ message: "Only caretakers can post announcements" });
    }

    const { title, content, priority = "medium", targetAudience = "all" } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const announcement = new Announcement({
      title,
      content,
      postedBy: caretaker._id,
      postedByName: caretaker.name,
      priority,
      targetAudience
    });

    await announcement.save();

    // Send email to all students
    try {
      const students = await User.find({ role: "student", isVerified: true }).select("email name");
      const studentEmails = students.map(s => s.email).filter(Boolean);
      
      if (studentEmails.length > 0) {
        const emailSubject = `[${priority.toUpperCase()}] ${title}`;
        const emailContent = `Dear Student,\n\n${caretaker.name} has posted a new announcement:\n\nTitle: ${title}\n\n${content}\n\nPlease check your dashboard for more details.\n\nBest regards,\nCleanTrack Portal`;
        
        // Send emails to all students (in production, you might want to batch these)
        await Promise.all(
          studentEmails.map(email => 
            sendEmail(email, emailSubject, emailContent).catch(err => 
              console.error(`Failed to send email to ${email}:`, err)
            )
          )
        );
        
        console.log(`✅ Sent announcement emails to ${studentEmails.length} students`);
      }
    } catch (emailErr) {
      console.error("Error sending announcement emails:", emailErr);
      // Don't fail the request if email sending fails
    }

    res.status(201).json({ message: "Announcement posted successfully", announcement });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/caretaker/announcements
router.get("/announcements", verifyToken, async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .sort({ createdAt: -1 })
      .populate("postedBy", "name email")
      .limit(50);

    res.json({ announcements });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ message: "Server Error" });
  }
});
  
export default router;