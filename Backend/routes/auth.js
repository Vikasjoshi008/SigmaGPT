import express from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

// Start Google Auth
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        authProvider,
      });
      await user.save();
    }

    req.login(user, err => {
      if (err) return res.status(500).json({ error: "Login failed" });
      res.json({ success: "Logged in with Google", user });
    });
  } catch (err) {
    console.error("❌ Google login error:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'https://sigma-gpt.vercel.app/login' }),
  (req, res) => {
    res.redirect('https://sigma-gpt.vercel.app/chat');
  }
);


// Signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();

    // ✅ Wrap req.login in a Promise
    await new Promise((resolve, reject) => {
      req.login(user, (err) => {
        if (err) {
          console.error("❌ Login after signup failed:", err);
          return reject(err);
        }
        resolve();
      });
      req.login(user, err => {
        if (err) return res.status(500).json({ error: "Login failed" });
        req.session.save(() => {
          res.json({ success: "Logged in with Google", user });
        });
      });

    });

    console.log("✅ Logged in user:", user);
    res.json({ success: "Signed up and logged in", user });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});



// Login
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ success: "Logged in", user: req.user });
});

// Logout
router.post("/logout", (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ success: "Logged out" });
  });
});

export default router;
