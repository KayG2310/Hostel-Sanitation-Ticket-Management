// backend/routes/ticketRoutes.js
import express from "express";
import Ticket from "../models/Ticket.js";
import multer from "multer";
import { spawn } from "child_process";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* -----------------------------------------------------------
   MULTER (MEMORY STORAGE FOR VERCEL)
----------------------------------------------------------- */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* -----------------------------------------------------------
   CREATE (RAISE) TICKET
----------------------------------------------------------- */
router.post(
  "/create",
  verifyToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { roomNumber, title, description } = req.body;
      const trimmedTitle = title?.trim();
      const trimmedDescription = description?.trim();

      // Validation
      if (!trimmedTitle || !trimmedDescription) {
        return res
          .status(400)
          .json({ message: "Title and description are required." });
      }

      const user = await User.findById(req.user?.id);
      const studentEmail = user?.email || req.body.studentEmail || "unknown";
      const floor = roomNumber
        ? parseInt(String(roomNumber)[0]) || null
        : null;

      const ticketData = {
        studentEmail,
        roomNumber,
        floor,
        title: trimmedTitle,
        description: trimmedDescription,
        status: "open",
        createdAt: new Date(),
      };

      /* -----------------------------------------------------------
         UPLOAD TO CLOUDINARY IF PHOTO EXISTS
      ----------------------------------------------------------- */
      if (req.file) {
        const uploadedImage = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "hostel_tickets",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(req.file.buffer);
        });

        ticketData.photoUrl = uploadedImage.secure_url; // Save Cloudinary URL
      }

      /* -----------------------------------------------------------
         AI CLEANLINESS MODEL (IF PHOTO OR DESCRIPTION EXISTS)
      ----------------------------------------------------------- */
      if (req.file || trimmedDescription) {
        const imageInput = ticketData.photoUrl || "none";

        const py = spawn(
          "/opt/anaconda3/bin/python",
          ["./ml/cleanliness_model.py", imageInput, trimmedDescription],
          { stdio: ["ignore", "pipe", "pipe"] }
        );

        let out = "";
        let errOut = "";

        py.stdout.on("data", (data) => (out += data.toString()));
        py.stderr.on("data", (data) => (errOut += data.toString()));

        const exitCode = await new Promise((resolve) =>
          py.on("close", (code) => resolve(code))
        );

        if (exitCode === 0 && out) {
          try {
            const parsed = JSON.parse(out.trim());
            const score = Number(parsed?.score);

            if (!Number.isNaN(score)) {
              ticketData.aiConfidence = score;
            } else {
              console.error("⚠️ Invalid model output:", out);
            }
          } catch (err) {
            console.error("⚠️ Error parsing Python output:", err, out);
          }
        } else {
          console.error("⚠️ Python model error:", errOut || out || "no output");
        }
      }

      /* -----------------------------------------------------------
         SAVE TICKET
      ----------------------------------------------------------- */
      const newTicket = new Ticket(ticketData);
      await newTicket.save();

      return res.status(201).json({
        message: "Ticket created successfully",
        ticket: newTicket,
      });
    } catch (error) {
      console.error("❌ Error creating ticket:", error);
      return res.status(500).json({
        message: "Error creating ticket",
        error: error.message,
      });
    }
  }
);

/* -----------------------------------------------------------
   GET ALL TICKETS FOR A STUDENT
----------------------------------------------------------- */
router.get("/student/:email", async (req, res) => {
  try {
    const tickets = await Ticket.find({ studentEmail: req.params.email });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching tickets",
      error: error.message,
    });
  }
});

export default router;
