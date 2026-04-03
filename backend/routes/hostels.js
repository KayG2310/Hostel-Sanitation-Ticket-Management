import express from "express";
import Hostel from "../models/Hostel.js";

const router = express.Router();

// GET /api/hostels — public, used by signup forms to populate the hostel dropdown
router.get("/", async (req, res) => {
  try {
    const hostels = await Hostel.find({}).select("_id name code").sort({ name: 1 });
    res.json({ hostels });
  } catch (err) {
    console.error("Error fetching hostels:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
