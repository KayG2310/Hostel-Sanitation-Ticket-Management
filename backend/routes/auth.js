
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendMail.js";

const router = express.Router();
import { verifyToken } from "../middleware/authMiddleware.js";

router.get("/verify", verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// -------------------- STUDENT SIGNUP --------------------
router.post("/signup/student", async (req, res) => {
  try {
    const { name, email, password, roomNumber} = req.body;

    // check domain
    if (!email.endsWith("@iitrpr.ac.in")) {
      return res.status(400).json({ message: "Email must end with @iitrpr.ac.in" });
    }

    // check existing
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but is not verified, delete and allow re-signup
      if (!existingUser.isVerified) {
        await User.deleteOne({ email });
      } else {
        return res.status(400).json({ message: "User already exists" });
      }
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // save to DB
    const newUser = new User({
      name,
      email,
      password: hashed,
      role: "student",
      roomNumber,
      verificationCode: code,
      isVerified: false,
    });

    await newUser.save();

    // send verification email
    await sendEmail(email, "Your CleanTrack Verification Code", `Your verification code is: ${code}`);

    res.status(200).json({ message: "Verification email sent. Please check your inbox." });
    console.log(`✅ Verification code for ${email}: ${code}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during signup" });
  }

});

// -------------------- STUDENT VERIFY --------------------
router.post("/verify/student", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Already verified" });

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.json({ message: "✅ Email verified successfully! You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Server error during verification" });
  }
});

// -------------------- LOGIN --------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Please verify your email first." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});


// ✅ Fetch current logged-in user's details
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -verificationCode");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching user info:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
