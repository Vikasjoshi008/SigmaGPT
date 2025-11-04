import express, { json } from "express";
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js"


const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

app.listen(PORT, () => {
  console.log("server is runnig on port",PORT);
  connectDB();
});

app.get("/", (req, res)=> {
  res.send("This is root");
});

const connectDB = async() => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected With Database!");
  } catch (err) {
    console.log("failed to connect with db",err);
  }
}