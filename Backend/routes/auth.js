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

if (!admin.apps.length) {
  try {
    // Step 1: decode the Base64 JSON from Render
    const jsonString = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf8");

    const serviceAccount = JSON.parse(jsonString);


admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});
    console.log("✅ Firebase Admin initialized successfully");
 } catch (err) {
    console.error("🔥 Firebase Admin initialization failed:", err);
  }
}
// routes/auth.js
// routes/auth.js
router.post("/firebase", async (req, res) => {
  const { token } = req.body;
  console.log("Received Firebase ID Token (truncated):", token ? token.slice(0, 30) + "..." : "No token");

  // A) Verify the token
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    console.error("❌ Firebase token verification failed:", err.code, err.message);
    return res.status(401).json({ error: "Invalid Firebase token", details: err.message });
  }

  // B) Resolve identity (with fallback)
  try {
    let { uid, email, name } = decoded;

    if (!email || !name) {
      const record = await admin.auth().getUser(uid);
      email = email || record.email || (record.providerData.find(p => p.email)?.email);
      name  = name  || record.displayName || (email ? email.split("@")[0] : "User");
    }

    if (!email) {
      return res.status(400).json({ error: "Email missing from Firebase account." });
    }

    // normalize
    email = String(email).toLowerCase().trim();
    const provider = "google"; // <-- make sure your schema allows this value

    // C) Upsert (atomic) — avoid race/duplicate errors
    const user = await User.findOneAndUpdate(
      { email },
      { 
        $setOnInsert: { authProvider: provider },
        $set: { name } 
      },
      { new: true, upsert: true, runValidators: true, context: "query", collation: { locale: "en", strength: 2 } }
    );

    // D) Issue your app JWT
    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token: jwtToken, user: { name: user.name, email: user.email } });

  } catch (err) {
    if (err?.code === 11000) {
      // email already exists (likely a local account for same email)
      return res.status(409).json({ error: "Account already exists for this email. Try password login or link accounts." });
    }
    // surface mongoose details so you can see what's wrong
    const fields = err?.errors ? Object.fromEntries(Object.entries(err.errors).map(([k,v]) => [k, v.message])) : undefined;
    console.error("❌ User creation/login failed:", err);
    return res.status(400).json({ error: "User creation failed", details: err.message, fields });
  }
});



router.post("/signup", async (req, res) => {
  try {
    let { name, email, password } = req.body || {};

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    name = String(name).trim();
    email = String(email).toLowerCase().trim();
    password = String(password);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email }).collation({ locale: "en", strength: 2 });
    if (existing) {
      if (existing.authProvider && existing.authProvider !== "local") {
        return res.status(400).json({ error: "This email is already registered with Google. Use 'Continue with Google'." });
      }
      return res.status(400).json({ error: "User already exists" });
    }

    // Create local user
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      authProvider: "local", 
    });

    await user.save();

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, user: { name: user.name, email: user.email } });

  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Account already exists for this email." });
    }
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Signup failed" });
  }
});


router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    email = String(email).toLowerCase().trim();
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (user.authProvider && user.authProvider !== "local") {
      return res.status(400).json({ error: "This account uses Google login. Use 'Continue with Google'." });
    }
    const hash = user.password || ""; 
    const isMatch = await bcrypt.compare(String(password), String(hash));

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

  
// Logout
router.post("/logout", (req, res) => {
  res.json({ success: "Logged out" });
});

export default router;
