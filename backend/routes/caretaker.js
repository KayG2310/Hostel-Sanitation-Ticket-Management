import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

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
  
export default router;