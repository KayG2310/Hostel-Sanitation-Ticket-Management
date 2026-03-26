import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/studentRoutes.js";
import caretakerRoutes from "./routes/caretaker.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

// serve static uploads folder (optional)
app.use('/uploads', express.static(path.join(__dirname, "../backend/uploads")));

connectDB();

// Routes
app.use("/api/tickets", ticketRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/caretaker", caretakerRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("Backend API running");
});

export default app;
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});