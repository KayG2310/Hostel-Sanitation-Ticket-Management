// backend/routes/ticketRoutes.js
import express from "express";
import Ticket from "../models/Ticket.js";
import multer from "multer";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import Replicate from "replicate";
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
      const { roomNumber, title, description, floorSelected, locationSelected } = req.body;
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
        hostelId: user?.hostelId || null,   // ← Step 2: stamp hostel on ticket
        floor,
        title: trimmedTitle,
        description: trimmedDescription,
        status: "open",
        createdAt: new Date(),
        photoUrl,
        floorSelected,
        locationSelected,
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
          console.log("🤖 Starting AI analysis (multimodal)...");
          const openRouterApiKey = process.env.OPENROUTER_API_KEY;
          let textScore = 0.5;
          if (!openRouterApiKey) {
            console.warn("⚠️ OPENROUTER_API_KEY not set - using default text score");
          } else {
            try {
              const prompt = `You are evaluating cleanliness issues in a hostel. Rate the urgency from 0.0 to 1.0 based on:- Hygiene risk - Severity - Impact on students ONLY return a number between 0.0 and 1.0. Issue: "${trimmedDescription}"`;
              const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${openRouterApiKey}`,
                },
                body: JSON.stringify({
                  model: "gpt-4o-mini",
                  messages: [
                    { role: "system", content: "Return only a number between 0.0 and 1.0." },
                    { role: "user", content: prompt },
                  ],
                  temperature: 0.2,
                  max_tokens: 20,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content?.trim() || "";

                let score = parseFloat(content);
                if (!isNaN(score)) {
                  textScore = Math.max(0, Math.min(1, score));
                }

                console.log("🧠 Text score:", textScore);
              } else {
                console.warn("⚠️ OpenRouter failed, using fallback text score");
              }
            } catch (err) {
              console.warn("⚠️ Text AI error:", err.message);
            }
          }
          // =========================
          // 2. IMAGE SCORE (Vision LLM)
          // =========================
          let imageScore = 0.5;
          let predictedLabel = "Others";
          let similarity = 0.4;
          if (photoUrl && process.env.OPENROUTER_API_KEY) {
            try {
              console.log("🖼️ Running vision model for image classification...");

              const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "meta-llama/llama-3.2-11b-vision-instruct",
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are an image classifier. Only return ONE label from this list exactly:\n" +
                        `"clean room", "dirty room", "garbage", "overflowing toilet", "water leak", "stains", "pest infestation", "clean washroom", "Others".\n` +
                        "Return ONLY the label, nothing else.",
                    },
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: "Classify this hostel cleanliness image.",
                        },
                        {
                          type: "image_url",
                          image_url: {
                            url: photoUrl,
                          },
                        },
                      ],
                    },
                  ],
                  temperature: 0,
                  max_tokens: 20,
                }),
              });

              const data = await response.json();

              let label =
                data.choices?.[0]?.message?.content?.trim().toLowerCase() || "others";

              console.log("🧠 Raw label:", label);

              // normalize label (important)
              const validLabels = [
                "clean room",
                "dirty room",
                "garbage",
                "overflowing toilet",
                "water leak",
                "stains",
                "pest infestation",
                "clean washroom",
                "others",
              ];

              if (!validLabels.includes(label)) {
                label = "others";
              }

              predictedLabel = label;

              const map = {
                "clean room": 0.1,
                "clean washroom": 0.1,
                "dirty room": 0.6,
                "garbage": 0.9,
                "overflowing toilet": 1.0,
                "water leak": 0.8,
                "stains": 0.5,
                "pest infestation": 1.0,
                "others": 0.5,
              };

              imageScore = map[label];

              console.log("🖼️ Final label:", predictedLabel);
              console.log("🖼️ Image score:", imageScore);

              try {
                const prompt = `You are a context similarity matcher. Your task is to find the similarity between a text description and its predicted label. Only return a similarity score between 0.0 and 1.0. Text Description: "${trimmedDescription}", Predicted label: "${predictedLabel}"`;
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openRouterApiKey}`,
                  },
                  body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                      { role: "system", content: "Return only a number between 0.0 and 1.0." },
                      { role: "user", content: prompt },
                    ],
                    temperature: 0.2,
                    max_tokens: 20,
                  }),
                });
    
                if (response.ok) {
                  const data = await response.json();
                  const content = data.choices?.[0]?.message?.content?.trim() || "";
    
                  let score = parseFloat(content);
                  if (!isNaN(score)) {
                    textScore = Math.max(0, Math.min(1, score));
                  }
                  similarity = textScore;
                } else {
                  console.warn("⚠️ OpenRouter failed, using fallback text score");
                }
              } catch (err) {
                console.warn("⚠️ Text AI error:", err.message);
              }
            } catch (err) {
              console.error("❌ Vision classification failed:", err.message);
            }
          }

          // =========================
          // 3. SIMILARITY
          // =========================

          

          console.log("🔗 Similarity:", similarity);
          // =========================
          // 4. DYNAMIC WEIGHTS
          // =========================
          let w_img, w_txt;

          if (similarity > 0.7) {
            w_img = 0.6;
            w_txt = 0.4;
          } 
          else if(!photoUrl){
            w_img = 0;
            w_txt = 0.9;
          }
          else {
            w_img = 0.3;
            w_txt = 0.7;
          }

          console.log("⚖️ Weights → Image:", w_img, "Text:", w_txt);

          // =========================
          // 5. FINAL SCORE
          // =========================
          const finalScore = Math.round(
            (w_img * imageScore + w_txt * textScore) * 100
          );

          console.log("✅ Final AI Score:", finalScore);

          // =========================
          // 6. SAVE TO DB
          // =========================
          await Ticket.findByIdAndUpdate(newTicket._id, {
            aiConfidence: finalScore,
          });

        } catch (aiError) {
          console.error("⚠️ AI analysis failed:", aiError.message);

          await Ticket.findByIdAndUpdate(newTicket._id, {
            aiConfidence: 50,
          });
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
