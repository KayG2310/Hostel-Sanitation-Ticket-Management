import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Hostel from "../models/Hostel.js";
import { sendEmail } from "../utils/sendMail.js";
import Room from "../models/Room.js";
const router = express.Router();
import { verifyToken } from "../middleware/authMiddleware.js";

router.get("/verify", verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// -------------------- STUDENT SIGNUP --------------------
// -------------------- CARETAKER SIGNUP --------------------


router.post("/signup/student", async (req, res) => {
  try {
    const { name, email, password, roomNumber, hostelId } = req.body;

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
      hostelId: hostelId || null,
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
// -------------------- CARETAKER VERIFY --------------------
// TEMP storage for caretaker signup (clears on server restart)
let pendingCaretakers = {};

// -------------------- CARETAKER SIGNUP --------------------
router.post("/signup/caretaker", async (req, res) => {
  try {
    const { name, email, password, hostelId } = req.body;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!email.endsWith("@iitrpr.ac.in")) {
      return res.status(400).json({ message: "Email must end with @iitrpr.ac.in" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) await User.deleteOne({ email });
      else return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({
      name,
      email,
      password: hashed,
      role: "caretaker",
      hostelId: hostelId || null,
      verificationCode: code,
      isVerified: false,
    });
    await newUser.save();
    
    // send OTP to ADMIN EMAIL
    await sendEmail(
      ADMIN_EMAIL,
      "Caretaker Signup Verification",
      `Caretaker ${name} requested signup.\nOTP: ${code}\nEmail: ${email}`
    );
    
    res.status(200).json({
      message: "OTP sent to Admin Email. Contact admin to get your verification code.",
    });
    // await newUser.save();

    // console.log(`🔐 Caretaker signup OTP for ${email}: ${code} (sent to ADMIN)`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during caretaker signup" });
  }
});

// -------------------- CARETAKER VERIFY --------------------
router.post("/verify/caretaker", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email, role: "caretaker" });
    if (!user) return res.status(400).json({ message: "Caretaker not found" });

    if (user.verificationCode !== code)
      return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    // Assign this caretaker to their hostel
    if (user.hostelId) {
      await Hostel.findByIdAndUpdate(user.hostelId, { caretaker: user._id });
    }

    res.json({ message: "Caretaker verified successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying caretaker" });
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
      { id: user._id, role: user.role, hostelId: user.hostelId || null },
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
        hostelId: user.hostelId || null,
      },
    });
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});


// ✅ Fetch current logged-in user's details (hostelId populated with name)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -verificationCode")
      .populate("hostelId", "name code");  // Step 7: return hostel name to frontend
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching user info:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.verificationCode !== code)
      return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    return res.status(200).json({ message: "User verified successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
});

// -------------------- FORGOT PASSWORD --------------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    if (!user.isVerified)
      return res.status(400).json({ message: "Account not verified. Please verify your email first." });

    // Reuse the same 6-digit OTP mechanism
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    await user.save();

    await sendEmail(
      email,
      "CleanTrack — Password Reset OTP",
      `Your password reset code is: ${code}\n\nThis code is valid for one use only. Do not share it with anyone.`
    );

    console.log(`🔑 Password reset OTP for ${email}: ${code}`);
    res.json({ message: "A password reset code has been sent to your email." });
  } catch (err) {
    console.error("❌ Error in forgot-password:", err);
    res.status(500).json({ message: "Server error during password reset" });
  }
});

// -------------------- RESET PASSWORD --------------------
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword)
      return res.status(400).json({ message: "Email, OTP and new password are required" });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.verificationCode !== code)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.verificationCode = null;
    await user.save();

    res.json({ message: "✅ Password reset successfully! You can now log in with your new password." });
  } catch (err) {
    console.error("❌ Error in reset-password:", err);
    res.status(500).json({ message: "Server error during password reset" });
  }
});

export default router;
