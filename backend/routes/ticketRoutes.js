// backend/routes/ticketRoutes.js
import express from "express";
import Ticket from "../models/Ticket.js";
import multer from "multer";
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

      /* -----------------------------------------------------------
         SAVE TICKET FIRST
      ----------------------------------------------------------- */
      console.log("💾 Saving ticket to database...");
      const newTicket = new Ticket(ticketData);
      await newTicket.save();
      console.log("✅ Ticket saved successfully with ID:", newTicket._id);

      /* -----------------------------------------------------------
         AI CLEANLINESS MODEL (TEXT-BASED ONLY - RUN IN BACKGROUND)
      ----------------------------------------------------------- */
      // Run AI analysis in background without blocking the response
      // Only analyzes description text (photo is saved but not processed)
      if (trimmedDescription) {
        // Don't await - let it run in background
        (async () => {
          try {
            console.log("🤖 Starting AI analysis (text-based) in background...");
            
            const openRouterApiKey = process.env.OPENROUTER_API_KEY;
            
            if (!openRouterApiKey) {
              console.warn("⚠️ OPENROUTER_API_KEY not set - skipping AI analysis");
              return;
            }

            // Get text-based cleanliness score using OpenRouter API
            const prompt = `You are a cleanliness evaluator. Based on the following facility issue description, give a cleanliness or urgency score between 0.0 (very clean or minor issue) and 1.0 (extremely dirty or urgent). Consider both hygiene and urgency level. Respond ONLY with a JSON object like: {"score": <number>}

Description: "${trimmedDescription}"`;

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openRouterApiKey}`,
                "HTTP-Referer": process.env.FRONTEND_URL || "https://app1-ten-delta.vercel.app",
                "X-Title": "Hostel Management System"
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: "You are an accurate cleanliness assessment assistant."
                  },
                  {
                    role: "user",
                    content: prompt
                  }
                ],
                temperature: 0.3,
                max_tokens: 150
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("⚠️ OpenRouter API error:", response.status, errorText);
              return;
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content?.trim() || "";

            // Extract numeric score from response
            const scoreMatch = content.match(/[-+]?\d*\.\d+|\d+/);
            if (scoreMatch) {
              let score = parseFloat(scoreMatch[0]);
              // Normalize to 0-1 range
              score = Math.max(0.0, Math.min(1.0, score));
              // Convert to 0-100 scale (same format as Python script)
              const finalScore = score * 100;

              // Update ticket with AI confidence
              await Ticket.findByIdAndUpdate(newTicket._id, {
                aiConfidence: Math.round(finalScore * 100) / 100
              });
              console.log("✅ AI analysis completed, score:", finalScore);
            } else {
              console.error("⚠️ Could not extract score from AI response:", content);
            }
          } catch (aiError) {
            // Gracefully handle AI errors - ticket already saved
            console.error("⚠️ AI analysis failed (ticket already saved):", aiError.message);
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
