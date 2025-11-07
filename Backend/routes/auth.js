import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});

router.post("/firebase", async (req, res) => {
  const { token } = req.body;
  console.log("Received Firebase ID Token (truncated):", token ? token.slice(0, 30) + "..." : "No token");

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token); // this part is fine
  } catch (err) {
    console.error("❌ Firebase token verification failed:", err.code, err.message);
    return res.status(401).json({ error: "Invalid Firebase token", details: err.message });
  }

  try {
    const email = decoded.email;
    if (!email) {
      // Extremely rare for Google, but be safe
      return res.status(400).json({ error: "Email missing from Firebase token." });
    }

    // Name may be absent in token; fallback to local-part of email
    const name = decoded.name || (email.includes("@") ? email.split("@")[0] : "User");

    // Use a provider value your schema allows
    const provider = "google"; // or "firebase" if your enum includes it

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, authProvider: provider });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token: jwtToken, user: { name: user.name, email: user.email } });
  } catch (err) {
    // IMPORTANT: Don't call this a "token" error; surface the real Mongoose validation details
    console.error("❌ User creation/login failed:", err);
    return res.status(400).json({ error: "User creation failed", details: err.message });
  }
});


  router.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: "User already exists" });
  
      const hashed = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashed });
      await user.save();
  
      const token = generateToken(user);
      res.json({ token, user: { name: user.name, email: user.email } });
    } catch (err) {
      res.status(500).json({ error: "Signup failed" });
    }
  });

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    const token = generateToken(user);
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

  
// Logout
router.post("/logout", (req, res) => {
  res.json({ success: "Logged out" });
});

export default router;
