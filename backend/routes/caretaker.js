import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Rating from "../models/Rating.js";
import Room from "../models/Room.js";
import Staff from "../models/Staff.js";
import Announcement from "../models/Announcement.js";
import { sendEmail } from "../utils/sendMail.js";

const router = express.Router();

// ── Tickets ──────────────────────────────────────────────────────────────────

router.get("/tickets", verifyToken, async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    if (!caretaker) return res.status(404).json({ message: "Caretaker not found" });

    // Step 3: only return tickets that belong to this caretaker's hostel
    const filter = caretaker.hostelId ? { hostelId: caretaker.hostelId } : {};
    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) {
    console.error("Error loading caretaker tickets:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/tickets/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const ticketId = req.params.id;
    const valid = ["open", "in-progress", "resolved_pending", "resolved"];
    if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const verifiedByStudent = status === "resolved";
    const updated = await Ticket.findByIdAndUpdate(
      ticketId,
      { status, verifiedByStudent },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Ticket not found" });
    res.json({ message: "Status updated", ticket: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating ticket" });
  }
});

router.put("/mark-resolved/:id", verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    ticket.status = "resolved_pending";
    ticket.verifiedByStudent = false;
    await ticket.save();
    res.json({ message: "Marked as resolved (pending student confirmation)", ticket });
  } catch (err) {
    console.error("Error marking resolved:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Staff CRUD ────────────────────────────────────────────────────────────────

// GET /api/caretaker/staff — list staff for this caretaker's hostel
router.get("/staff", verifyToken, async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    // Step 5: filter by hostelId so each caretaker only sees their own staff
    const filter = caretaker?.hostelId ? { hostelId: caretaker.hostelId } : {};
    const staff = await Staff.find(filter).sort({ name: 1 });
    res.json({ staff });
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/caretaker/staff — add a new staff member (scoped to this hostel)
router.post("/staff", verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (!phone || !phone.trim()) return res.status(400).json({ message: "Phone number is required" });

    const caretaker = await User.findById(req.user.id);
    const hostelId = caretaker?.hostelId || null;

    // Prevent duplicate active staff within the same hostel (by name OR phone)
    const existing = await Staff.findOne({
      isActive: true,
      hostelId,
      $or: [{ name: name.trim() }, { phone: phone.trim() }],
    });
    if (existing) {
      const conflict = existing.name === name.trim() ? "name" : "phone number";
      return res.status(409).json({ message: `A staff member with this ${conflict} already exists` });
    }

    const staff = await Staff.create({
      name: name.trim(),
      phone: phone.trim(),
      addedBy: req.user.id,
      hostelId,
      isActive: true,
    });
    res.status(201).json({ message: "Staff member added", staff });
  } catch (err) {
    console.error("Error adding staff:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// PUT /api/caretaker/staff/:id/reinstate — reactivate a previously removed staff member
router.put("/staff/:id/reinstate", verifyToken, async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    res.json({ message: `${staff.name} has been reinstated`, staff });
  } catch (err) {
    console.error("Error reinstating staff:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// DELETE /api/caretaker/staff/:id — soft-delete (ratings preserved)
router.delete("/staff/:id", verifyToken, async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!staff) return res.status(404).json({ message: "Staff member not found" });

    // Unassign from any room that currently has this staff member
    await Room.updateMany(
      { "janitors.roomCleaner": staff._id },
      { $set: { "janitors.roomCleaner": null } }
    );
    await Room.updateMany(
      { "janitors.corridorCleaner": staff._id },
      { $set: { "janitors.corridorCleaner": null } }
    );
    await Room.updateMany(
      { "janitors.washroomCleaner": staff._id },
      { $set: { "janitors.washroomCleaner": null } }
    );

    res.json({ message: "Staff member removed and unassigned from duties", staff });
  } catch (err) {
    console.error("Error removing staff:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── Staff Duties ──────────────────────────────────────────────────────────────

// PUT /api/caretaker/update-janitors/:floor — body: { roomCleaner: staffId, ... }
router.put("/update-janitors/:floor", verifyToken, async (req, res) => {
  try {
    const { floor } = req.params;
    const { roomCleaner, corridorCleaner, washroomCleaner } = req.body;
    const caretaker = await User.findById(req.user.id);
    const hostelId = caretaker?.hostelId || null;

    // Step 5: scope floor updates to rooms in this hostel only
    const roomFilter = hostelId
      ? { floor: Number(floor), hostelId }
      : { floor: Number(floor) };

    const result = await Room.updateMany(
      roomFilter,
      {
        $set: {
          "janitors.roomCleaner":     roomCleaner     || null,
          "janitors.corridorCleaner": corridorCleaner || null,
          "janitors.washroomCleaner": washroomCleaner || null,
        },
      }
    );

    res.json({ message: "Janitor duties updated successfully", result });
  } catch (err) {
    console.error("Error updating janitors:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/caretaker/janitors/:floor — returns { roomCleaner: { _id, name }, ... }
router.get("/janitors/:floor", verifyToken, async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    const hostelId = caretaker?.hostelId || null;

    // Step 5: scope room lookup to this hostel's floor
    const roomFilter = hostelId
      ? { floor: Number(req.params.floor), hostelId }
      : { floor: Number(req.params.floor) };

    const room = await Room.findOne(roomFilter)
      .populate("janitors.roomCleaner", "name phone isActive")
      .populate("janitors.corridorCleaner", "name phone isActive")
      .populate("janitors.washroomCleaner", "name phone isActive");

    if (!room) return res.status(404).json({ message: "No data for this floor" });
    res.json(room.janitors);
  } catch (err) {
    console.error("Error fetching janitors:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Staff Ratings ─────────────────────────────────────────────────────────────

// GET /api/caretaker/staff-ratings
// Returns one row per staff member with their overall avg rating,
// total ratings, and a breakdown of which duties / floors they cover.
router.get("/staff-ratings", verifyToken, async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    if (!caretaker) return res.status(404).json({ message: "Caretaker not found" });

    const { sortOrder = "desc" } = req.query;

    // Only aggregate ratings that have a staffId (proper ratings)
    const perStaff = await Rating.aggregate([
      { $match: { staffId: { $ne: null, $exists: true } } },
      {
        $group: {
          _id: "$staffId",
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          // Collect all unique floor+role combinations this person was rated on
          duties: {
            $addToSet: {
              floor: "$floor",
              janitorType: "$janitorType",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          staffId: "$_id",
          avgRating: { $round: ["$avgRating", 2] },
          totalRatings: 1,
          duties: 1,
        },
      },
      {
        $sort: sortOrder === "asc" ? { avgRating: 1 } : { avgRating: -1 },
      },
    ]);

    // Populate Staff name for each row
    const staffIds = perStaff.map((r) => r.staffId);
    const staffDocs = await Staff.find({ _id: { $in: staffIds } }).select("name phone isActive");
    const staffMap = {};
    staffDocs.forEach((s) => { staffMap[s._id.toString()] = s; });

    const result = perStaff.map((r) => ({
      staffId: r.staffId,
      name: staffMap[r.staffId.toString()]?.name || "Unknown",
      phone: staffMap[r.staffId.toString()]?.phone || null,
      isActive: staffMap[r.staffId.toString()]?.isActive ?? true,
      avgRating: r.avgRating,
      totalRatings: r.totalRatings,
      duties: r.duties.sort((a, b) => a.floor - b.floor || a.janitorType.localeCompare(b.janitorType)),
    }));

    // Also include legacy ratings (janitorName set, staffId null) as a single unattributed group
    const legacyCount = await Rating.countDocuments({
      $or: [{ staffId: null }, { staffId: { $exists: false } }],
    });

    res.json({ ratings: result, legacyCount });
  } catch (err) {
    console.error("Error fetching staff ratings:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── Announcements ─────────────────────────────────────────────────────────────

router.post("/announcements", verifyToken, async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    if (!caretaker || caretaker.role !== "caretaker")
      return res.status(403).json({ message: "Only caretakers can post announcements" });

    const { title, content, priority = "medium", targetAudience = "all" } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Title and content are required" });

    const announcement = new Announcement({
      title,
      content,
      postedBy: caretaker._id,
      postedByName: caretaker.name,
      hostelId: caretaker.hostelId || null,  // Step 6: stamp hostel on announcement
      priority,
      targetAudience,
    });
    await announcement.save();

    try {
      // Step 6: only email students from the same hostel
      const studentFilter = {
        role: "student",
        isVerified: true,
        ...(caretaker.hostelId ? { hostelId: caretaker.hostelId } : {}),
      };
      const students = await User.find(studentFilter).select("email name");
      const studentEmails = students.map((s) => s.email).filter(Boolean);
      if (studentEmails.length > 0) {
        const emailSubject = `[${priority.toUpperCase()}] ${title}`;
        const emailContent = `Dear Student,\n\n${caretaker.name} has posted a new announcement:\n\nTitle: ${title}\n\n${content}\n\nPlease check your dashboard for more details.\n\nBest regards,\nCleanTrack Portal`;
        await Promise.all(
          studentEmails.map((email) =>
            sendEmail(email, emailSubject, emailContent).catch((err) =>
              console.error(`Failed to send email to ${email}:`, err)
            )
          )
        );
        console.log(`✅ Sent announcement emails to ${studentEmails.length} students (hostel-scoped)`);
      }
    } catch (emailErr) {
      console.error("Error sending announcement emails:", emailErr);
    }

    res.status(201).json({ message: "Announcement posted successfully", announcement });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/announcements", verifyToken, async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    // Step 6: only show announcements posted by this hostel's caretaker(s)
    const filter = caretaker?.hostelId ? { hostelId: caretaker.hostelId } : {};
    const announcements = await Announcement.find(filter)
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