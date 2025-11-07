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

console.log("Firebase Admin SDK Initialized with:");
console.log("  Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("  Client Email:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("  Private Key (truncated):", process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.substring(0, 30) + "..." : "Not set");

router.post("/firebase", async (req, res) => {
  const { token } = req.body;
  console.log("Received Firebase ID Token on backend (truncated):", token ? token.substring(0, 30) + "..." : "No token");
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { email, name } = decoded;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, authProvider: "firebase" });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token: jwtToken, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("❌ Firebase token verification failed:", err);
    res.status(401).json({ error: "Invalid Firebase token" });
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
