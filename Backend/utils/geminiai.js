// import "dotenv/config";

// const getGeminiAIAPIResponse=async(message) => {
//       try {
//         const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
//         const payload = {
//           contents: [
//             {
//               role: "user",
//               parts: [
//                 { text: message }
//               ]
//             }
//           ]
//         };
    
//         const response = await fetch(url, {
//           method: "POST",
//           headers: { 
//             "Content-Type": "application/json" 
//           },
//           body: JSON.stringify(payload)
//         });
    
//         const rawText = await response.text(); // Read once
    
//         let data;
//         try {
//           data = JSON.parse(rawText); // Parse from rawText
//         } catch (err) {
//           console.error("Failed to parse JSON:", err.message);
//           return res.status(500).send({ error: "Invalid JSON from Gemini", details: rawText });
//         }
    
//         const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//         if (text) {
//           console.log("Gemini response:", text);
//           return ({ response: text });
//         } else {
//           console.error("Unexpected response format:", data);
//           throw new Error("Unexpected response format");
//         }
    
//       } catch (err) {
//         console.error("Internal error:", err.message);
//         res.status(500).send({ error: "Internal server error", details: err.message });
//       }
// }

// export default getGeminiAIAPIResponse;

import "dotenv/config";

/**
 * Accepts either:
 *  - a string (single user prompt), or
 *  - an array of messages [{ role: "system"|"user"|"assistant", content: "..." }]
 * Returns: { response: string }
 */
const getGeminiAIAPIResponse = async (input) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      return { response: "Server is missing GEMINI_API_KEY." };
    }

    // Convert input to Gemini contents[] + optional systemInstruction
    let contents = [];
    let systemText = "";

    if (typeof input === "string") {
      // Simple mode: single user message
      contents = [
        {
          role: "user",
          parts: [{ text: input }],
        },
      ];
    } else if (Array.isArray(input)) {
      // Chat mode: map roles and separate system messages
      for (const m of input) {
        if (!m || !m.content) continue;

        if (m.role === "system") {
          // Accumulate all system prompts into one instruction
          systemText += (systemText ? "\n\n" : "") + String(m.content);
          continue;
        }

        const role =
          m.role === "assistant" ? "model" :
          m.role === "user"      ? "user"  :
          // default fallback
          "user";

        contents.push({
          role,
          parts: [{ text: String(m.content) }],
        });
      }
    } else {
      return { response: "Invalid input to Gemini helper." };
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents,
      // If you prefer, you can omit systemInstruction and just prepend as first user message.
      ...(systemText && {
        systemInstruction: {
          role: "system",
          parts: [{ text: systemText }],
        },
      }),
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error("Gemini JSON parse error:", err.message, "\nRaw:", rawText);
      return { response: "Upstream response was not valid JSON." };
    }

    // Extract text from candidates
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p?.text)
        .filter(Boolean)
        .join("\n")
      ?? data?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "";

    if (text) {
      return { response: text };
    } else {
      console.error("Unexpected Gemini response shape:", JSON.stringify(data, null, 2));
      return { response: "Sorry, I couldn't generate a reply." };
    }
  } catch (err) {
    console.error("Gemini helper error:", err);
    return { response: "Internal error while generating a reply." };
  }
};

export default getGeminiAIAPIResponse;

