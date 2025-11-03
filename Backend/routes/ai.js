import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/ai/chat", async (req, res) => {
  try {
    const response = await fetch("https://25cc-212-103-80-2.ngrok-free.app/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add whatever auth that ngrok API expects (e.g., Bearer token)
        // "Authorization": `Bearer ${process.env.NGROK_API_KEY}`
      },
      body: JSON.stringify(req.body),
    });

    // Pass-through response from the upstream API
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("AI proxy error:", err);
    res.status(500).json({ error: "Upstream request failed" });
  }
});

export default router;