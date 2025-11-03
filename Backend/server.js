import express, { json } from "express";
import session from "express-session";
import fetch from "node-fetch";
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js"
import passport from "passport";
import "./config/passport.js"; // ✅ this loads LocalStrategy
import aiRoutes from "./routes/ai.js";

const app = express();
const PORT = 8080;
app.use(express.json());

app.use(cors({
  origin: ["https://sigma-gpt-livid.vercel.app" , "http://localhost:5173"],
  credentials: true,
}));

app.set("trust proxy", 1);
app.use(session({
  secret: process.env.my_session_secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
      maxAge: 25 * 60 * 60 * 1000,
      secure: true, // ✅ set to true only in production with HTTPS
      sameSite: "none"
  }
}));

// app.use((req, res, next) => {
//   res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
//   next();
// });


app.use(passport.initialize());
app.use(passport.session());
app.use("/api/auth", authRoutes); // ✅ this enables /api/auth/google
app.use("/api", chatRoutes);
app.use("/api", aiRoutes);

app.listen(PORT, () => {
  console.log("server is runnig on port",PORT);
  connectDB();
});

const connectDB = async() => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected With Database!");
  } catch (err) {
    console.log("failed to connect with db",err);
  }
}