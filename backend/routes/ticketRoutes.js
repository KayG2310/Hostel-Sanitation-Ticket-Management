// // backend/routes/ticketRoutes.js
// import express from "express";
// import Ticket from "../models/Ticket.js";
// import multer from "multer";
// import path from "path";
// import { spawn } from "child_process";
// import { fileURLToPath } from "url";
// import { verifyToken } from "../middleware/authMiddleware.js";
// import User from "../models/User.js";
// const router = express.Router();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + "-" + file.originalname;
//     const ext = path.extname(file.originalname);
//     const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
//   fileFilter: (req, file, cb) => {
//     const allowed = /jpeg|jpg|png/;
//     const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
//                allowed.test(file.mimetype);
//     cb(ok ? null : new Error("Only JPG/PNG allowed"), ok);
//   },
// });
// // Create (Raise) a ticket
// router.post("/create",verifyToken,  upload.single("photo"), async (req, res) => {
//   try {
//     const { roomNumber, title, description } = req.body;

//     const user = await User.findById(req.user?.id);
//     const studentEmail = user?.email || req.body.studentEmail || "unknown";
//     const floor = roomNumber ? parseInt(String(roomNumber)[0]) || null : null;

//     const ticketData = {
//       studentEmail,
//       roomNumber,
//       floor,
//       title,
//       description,
//       status: "open",
//       createdAt: new Date(),
//     };

//     // ✅ Handle photo + Python model
//     if (req.file) {
//       const filePath = req.file.path; // absolute path to image
//       const publicUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
//       ticketData.photoUrl = publicUrl;

//       // spawn Python process
//       const py = spawn('/opt/anaconda3/bin/python', ["./ml/cleanliness_model.py", filePath, description], {
//         stdio: ["ignore", "pipe", "pipe"],
//       });

//       let out = "";
//       let errOut = "";
//       py.stdout.on("data", (data) => (out += data.toString()));
//       py.stderr.on("data", (data) => (errOut += data.toString()));

//       const exitCode = await new Promise((resolve) => {
//         py.on("close", (code) => resolve(code));
//       });

//       if (exitCode === 0 && out) {
//         try {
//           const parsed = JSON.parse(out.trim());
//           if (parsed && typeof parsed.score === "number") {
//             const dirtinessPercent = Math.round(parsed.score * 100);
//             ticketData.aiConfidence = dirtinessPercent;
//           }
//         } catch (err) {
//           console.error("⚠️ Error parsing Python output:", err, out);
//         }
//       } else {
//         console.error("⚠️ Python model error:", errOut || out || "no output");
//       }
//     }

//     // ✅ Save ticket with all fields
//     const newTicket = new Ticket(ticketData);
//     await newTicket.save();

//     res.status(201).json({
//       message: "Ticket created successfully",
//       ticket: newTicket,
//     });
//   } catch (error) {
//     console.error("❌ Error creating ticket:", error);
//     res.status(500).json({ message: "Error creating ticket", error: error.message });
//   }
// });


// // Get all tickets for a specific student
// router.get("/student/:email", async (req, res) => {
//   try {
//     const tickets = await Ticket.find({ studentEmail: req.params.email });
//     res.json(tickets);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching tickets", error: error.message });
//   }
// });

// export default router;

// backend/routes/ticketRoutes.js
import express from "express";
import Ticket from "../models/Ticket.js";
import multer from "multer";
import path from "path";
import { spawn } from "child_process";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// ---------- Multer Setup ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ok =
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    cb(ok ? null : new Error("Only JPG/PNG allowed"), ok);
  },
});

// ---------- Create (Raise) Ticket ----------
router.post("/create", verifyToken, upload.single("photo"), async (req, res) => {
  try {
    const { roomNumber, title, description } = req.body;
    const trimmedTitle = title?.trim();
    const trimmedDescription = description?.trim();

    // 🔒 Validation: Title and Description are mandatory
    if (!trimmedTitle || !trimmedDescription) {
      return res
        .status(400)
        .json({ message: "Title and description are required." });
    }

    const user = await User.findById(req.user?.id);
    const studentEmail = user?.email || req.body.studentEmail || "unknown";
    const floor = roomNumber ? parseInt(String(roomNumber)[0]) || null : null;

    // Base ticket data
    const ticketData = {
      studentEmail,
      roomNumber,
      floor,
      title: trimmedTitle,
      description: trimmedDescription,
      status: "open",
      createdAt: new Date(),
    };

    // ---------- AI Cleanliness Analysis ----------
    const imagePath = req.file ? req.file.path : "none";
    if (req.file) {
      const publicUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      ticketData.photoUrl = publicUrl;
    }

    // 🧠 Run AI model only if photo or description exists
    if (req.file || trimmedDescription) {
      const py = spawn("/opt/anaconda3/bin/python", [
        "./ml/cleanliness_model.py",
        imagePath,
        trimmedDescription,
      ], { stdio: ["ignore", "pipe", "pipe"] });

      let out = "";
      let errOut = "";

      py.stdout.on("data", (data) => (out += data.toString()));
      py.stderr.on("data", (data) => (errOut += data.toString()));

      const exitCode = await new Promise((resolve) => {
        py.on("close", (code) => resolve(code));
      });

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

    // ---------- Save Ticket ----------
    const newTicket = new Ticket(ticketData);
    await newTicket.save();

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("❌ Error creating ticket:", error);
    res.status(500).json({
      message: "Error creating ticket",
      error: error.message,
    });
  }
});

// ---------- Get All Tickets for a Specific Student ----------
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
