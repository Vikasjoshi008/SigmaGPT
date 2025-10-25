import express, { json } from "express";
import fetch from "node-fetch";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chartRoutes from "./routes/chat.js";

const app = express();
const PORT = 8080;
app.use(express.json());
app.use(cors());

app.use("/api", chartRoutes);

// const API_KEY = process.env.GEMINI_API_KEY;
// app.post("/test", async (req, res) => {
//   try {
//     const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

//     const payload = {
//       contents: [
//         {
//           role: "user",
//           parts: [
//             { text: req.body.prompt || "Hello!" }
//           ]
//         }
//       ]
//     };

//     const response = await fetch(url, {
//       method: "POST",
//       headers: { 
//         "Content-Type": "application/json" 
//       },
//       body: JSON.stringify(payload)
//     });

//     const rawText = await response.text(); // Read once

//     let data;
//     try {
//       data = JSON.parse(rawText); // Parse from rawText
//     } catch (err) {
//       console.error("Failed to parse JSON:", err.message);
//       return res.status(500).send({ error: "Invalid JSON from Gemini", details: rawText });
//     }

//     const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//     if (text) {
//       console.log("Gemini response:", text);
//       res.send({ response: text });
//     } else {
//       console.error("Unexpected response format:", data);
//       res.status(500).send({ error: "Unexpected response format", details: data });
//     }

//   } catch (err) {
//     console.error("Internal error:", err.message);
//     res.status(500).send({ error: "Internal server error", details: err.message });
//   }
// });

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