import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

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
