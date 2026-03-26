// backend/routes/ticketRoutes.js
import express from "express";
import Ticket from "../models/Ticket.js";
import multer from "multer";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

      let photoUrl = null;
      const ticketData = {
        studentEmail,
        roomNumber,
        floor,
        title: trimmedTitle,
        description: trimmedDescription,
        status: "open",
        createdAt: new Date(),
        photoUrl,
      };
      if (req.file) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: "Home/hostel_tickets" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.file.buffer);
          });
      
          photoUrl = result.secure_url;
          console.log("☁️ Image uploaded:", photoUrl);
        } catch (err) {
          console.error("❌ Cloudinary upload failed:", err);
        }
      }
      ticketData.photoUrl = photoUrl;
      console.log("💾 Saving ticket to database...");
      const newTicket = new Ticket(ticketData);
      await newTicket.save();
      console.log("✅ Ticket saved successfully with ID:", newTicket._id);
      if (trimmedDescription) {
        try {
          console.log("🤖 Starting AI analysis (text-based)...");
            console.log("📝 Description to analyze:", trimmedDescription.substring(0, 100));
            
            const openRouterApiKey = process.env.OPENROUTER_API_KEY;
            
            if (!openRouterApiKey) {
              console.warn("⚠️ OPENROUTER_API_KEY not set - skipping AI analysis");
              await Ticket.findByIdAndUpdate(newTicket._id, {
                aiConfidence: 50.0
              });
            } else {
            const prompt = `Evaluate the cleanliness urgency of this hostel facility issue. Give a score from 0.0 (very clean/minor) to 1.0 (extremely dirty/urgent). Respond with ONLY a number between 0.0 and 1.0, nothing else.

Issue: "${trimmedDescription}"`;

            console.log("📤 Sending request to OpenRouter API...");
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
                    content: "You are a cleanliness evaluator. Always respond with only a number between 0.0 and 1.0."
                  },
                  {
                    role: "user",
                    content: prompt
                  }
                ],
                temperature: 0.3,
                max_tokens: 50
              })
            });

            console.log("📥 OpenRouter response status:", response.status);

            if (!response.ok) {
              const errorText = await response.text();
              console.error("⚠️ OpenRouter API error:", response.status, errorText);
              await Ticket.findByIdAndUpdate(newTicket._id, {
                aiConfidence: 50.0
              });
            } else {

            const data = await response.json();
            console.log("📦 OpenRouter response data:", JSON.stringify(data).substring(0, 200));
            
            const content = data.choices?.[0]?.message?.content?.trim() || "";
            console.log("💬 AI response content:", content);
            let score = null;
            const jsonMatch = content.match(/\{"score":\s*([\d.]+)\}/i) || content.match(/score["\s:]+([\d.]+)/i);
            if (jsonMatch) {
              score = parseFloat(jsonMatch[1]);
            } else {
              const numberMatch = content.match(/([0-9]*\.?[0-9]+)/);
              if (numberMatch) {
                score = parseFloat(numberMatch[0]);
              }
            }

            if (score !== null && !isNaN(score)) {
              score = Math.max(0.0, Math.min(1.0, score));
              const finalScore = Math.round(score * 100 * 100) / 100;
              await Ticket.findByIdAndUpdate(newTicket._id, {
                aiConfidence: finalScore
              });
              console.log("✅ AI analysis completed, score:", finalScore);
            } else {
              console.error("⚠️ Could not extract valid score from AI response:", content);
              const urgencyKeywords = ['dirty', 'filthy', 'messy', 'urgent', 'severe', 'terrible', 'disgusting', 'broken', 'leak', 'overflow'];
              const hasUrgency = urgencyKeywords.some(keyword => 
                trimmedDescription.toLowerCase().includes(keyword)
              );
              const fallbackScore = hasUrgency ? 75.0 : 40.0;
              
              await Ticket.findByIdAndUpdate(newTicket._id, {
                aiConfidence: fallbackScore
              });
              console.log("⚠️ Using fallback score:", fallbackScore);
            }
            }
          }
        } catch (aiError) {
          console.error("⚠️ AI analysis failed (ticket already saved):", aiError.message);
          console.error("⚠️ Error stack:", aiError.stack);
          try {
            await Ticket.findByIdAndUpdate(newTicket._id, {
              aiConfidence: 50.0
            });
          } catch (updateError) {
            console.error("⚠️ Failed to update ticket with default score:", updateError.message);
          }
        }
      } else {
        await Ticket.findByIdAndUpdate(newTicket._id, {
          aiConfidence: 50.0
        });
      }
      const updatedTicket = await Ticket.findById(newTicket._id);
      return res.status(201).json({
        message: "Ticket created successfully",
        ticket: updatedTicket || newTicket,
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
