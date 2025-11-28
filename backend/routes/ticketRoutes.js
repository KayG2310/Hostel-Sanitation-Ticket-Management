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
    console.log("🎫 ===== TICKET CREATION REQUEST RECEIVED =====");
    console.log("📋 Request body:", { roomNumber: req.body.roomNumber, title: req.body.title, description: req.body.description?.substring(0, 50) + "..." });
    console.log("📸 File uploaded:", req.file ? `Yes (${req.file.size} bytes)` : "No");
    console.log("👤 User ID:", req.user?.id);
    
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
        console.log("📸 Uploading photo to Cloudinary...");
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
        console.log("✅ Photo uploaded successfully:", ticketData.photoUrl);
      }
// --- After uploading to Cloudinary ---
let imageInput = "none";
if (req.file && ticketData.photoUrl) {
  imageInput = ticketData.photoUrl; // pass Cloudinary URL
}

// Spawn Python process
const py = spawn("/opt/anaconda3/bin/python", [
  "./ml/cleanliness_model.py",
  imageInput,
  trimmedDescription,
], { stdio: ["ignore", "pipe", "pipe"] });

let out = "";
let errOut = "";

py.stdout.on("data", (data) => out += data.toString());
py.stderr.on("data", (data) => errOut += data.toString());

const exitCode = await new Promise((resolve) => py.on("close", (code) => resolve(code)));

if (exitCode === 0 && out) {
  try {
    const parsed = JSON.parse(out.trim());
    const score = Number(parsed?.score);
    if (!Number.isNaN(score)) ticketData.aiConfidence = score;
    else console.error("⚠️ Invalid AI output:", out);
  } catch (err) {
    console.error("⚠️ Parsing Python output failed:", err, out);
  }
} else {
  console.error("⚠️ Python error:", errOut || out || "no output");
}

      /* -----------------------------------------------------------
         SAVE TICKET FIRST (NON-BLOCKING)
      ----------------------------------------------------------- */

      console.log("💾 Saving ticket to database...");
      const newTicket = new Ticket(ticketData);
      await newTicket.save();
      console.log("✅ Ticket saved successfully with ID:", newTicket._id);

      /* -----------------------------------------------------------
         AI CLEANLINESS MODEL (RUN IN BACKGROUND - NON-BLOCKING)
      ----------------------------------------------------------- */
      // Run AI analysis in background without blocking the response
      if (req.file || trimmedDescription) {
        // Don't await - let it run in background
        (async () => {
          try {
            console.log("🤖 Starting AI analysis in background...");
            const imageInput = ticketData.photoUrl || "none";
            const pythonPath = process.env.PYTHON_PATH || "python3";
            const scriptPath = "./ml/cleanliness_model.py";

            // Add timeout to prevent hanging
            const timeout = 30000; // 30 seconds
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("AI analysis timeout")), timeout);
            });

            const py = spawn(
              pythonPath,
              [scriptPath, imageInput, trimmedDescription],
              { stdio: ["ignore", "pipe", "pipe"] }
            );

            let out = "";
            let errOut = "";

            py.stdout.on("data", (data) => (out += data.toString()));
            py.stderr.on("data", (data) => (errOut += data.toString()));

            const exitCodePromise = new Promise((resolve) =>
              py.on("close", (code) => resolve(code))
            );

            // Race between exit and timeout
            const exitCode = await Promise.race([exitCodePromise, timeoutPromise]);

            if (exitCode === 0 && out) {
              try {
                const parsed = JSON.parse(out.trim());
                const score = Number(parsed?.score);

                if (!Number.isNaN(score)) {
                  // Update ticket with AI confidence
                  await Ticket.findByIdAndUpdate(newTicket._id, {
                    aiConfidence: score
                  });
                  console.log("✅ AI analysis completed, score:", score);
                } else {
                  console.error("⚠️ Invalid model output:", out);
                }
              } catch (err) {
                console.error("⚠️ Error parsing Python output:", err, out);
              }
            } else {
              console.error("⚠️ Python model error:", errOut || out || "no output");
            }
          } catch (pythonError) {
            // Gracefully handle Python execution errors - ticket already saved
            console.error("⚠️ AI analysis failed (ticket already saved):", pythonError.message);
          }
        })();
      }

      // Return response immediately - don't wait for AI
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
