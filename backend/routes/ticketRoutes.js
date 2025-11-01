// backend/routes/ticketRoutes.js
import express from "express";
import Ticket from "../models/Ticket.js";

const router = express.Router();

// Create (Raise) a ticket
router.post("/create", async (req, res) => {
  try {
    const { studentEmail, roomNumber, title, description } = req.body;
    const newTicket = new Ticket({ studentEmail, roomNumber, title, description });
    await newTicket.save();
    res.status(201).json({ message: "Ticket created successfully", ticket: newTicket });
  } catch (error) {
    res.status(500).json({ message: "Error creating ticket", error: error.message });
  }
});

// Get all tickets for a specific student
router.get("/student/:email", async (req, res) => {
  try {
    const tickets = await Ticket.find({ studentEmail: req.params.email });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets", error: error.message });
  }
});

export default router;
