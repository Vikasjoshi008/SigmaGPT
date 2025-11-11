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
 *  - an array of messages: [{ role: "system"|"user"|"assistant", content: "..." }]
 * Returns: { response: string }
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash"; // safe default
const ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`;

function toGeminiPayload(input) {
  let contents = [];
  let systemText = "";

  if (typeof input === "string") {
    contents = [{ role: "user", parts: [{ text: input }] }];
    return { contents, systemText };
  }

  if (!Array.isArray(input)) {
    throw new Error("getGeminiAIAPIResponse: input must be string or messages[]");
  }

  for (const m of input) {
    if (!m || !m.content) continue;

    if (m.role === "system") {
      systemText += (systemText ? "\n\n" : "") + String(m.content);
      continue;
    }

    const role =
      m.role === "assistant" ? "model" :
      m.role === "user"      ? "user"  :
      "user";

    contents.push({ role, parts: [{ text: String(m.content) }] });
  }

  return { contents, systemText };
}

export default async function getGeminiAIAPIResponse(input) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[Gemini] Missing GEMINI_API_KEY");
      return { response: "Server missing configuration (GEMINI_API_KEY)." };
    }

    const { contents, systemText } = toGeminiPayload(input);

    const payload = {
      contents,
      ...(systemText && {
        systemInstruction: { role: "system", parts: [{ text: systemText }] },
      }),
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
      // Optional: relax safety a bit while testing (comment out if not needed)
      // safetySettings: [
      //   { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      //   { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      //   { category: "HARM_CATEGORY_SEXUAL_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      //   { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      // ],
    };

    const url = `${ENDPOINT}?key=${apiKey}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await resp.text();

    // Helpful logging in dev only
    if (process.env.NODE_ENV !== "production") {
      console.log("[Gemini] Request →", JSON.stringify(payload).slice(0, 1200), "…");
      console.log("[Gemini] Status:", resp.status);
      console.log("[Gemini] Raw:", raw.slice(0, 1200), "…");
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("[Gemini] JSON parse error:", e?.message);
      return { response: "Upstream response was not valid JSON." };
    }

    // Handle API errors
    if (!resp.ok || data.error) {
      console.error("[Gemini] API Error:", data.error || resp.statusText);
      return { response: data?.error?.message || "The model could not generate a reply." };
    }

    // Handle safety/prompt feedback
    const block = data?.promptFeedback?.blockReason;
    if (block) {
      console.warn("[Gemini] Prompt blocked:", block);
      return { response: "I can't answer that due to safety filters." };
    }

    const candidate = data?.candidates?.[0];
    if (!candidate) {
      console.warn("[Gemini] No candidates");
      return { response: "I couldn't generate a reply." };
    }

    const finish = candidate.finishReason;
    if (finish && finish !== "STOP") {
      // e.g., SAFETY, RECITATION, OTHER
      console.warn("[Gemini] Finish reason:", finish);
    }

    const parts = candidate?.content?.parts || [];
    const text = parts.map(p => p?.text).filter(Boolean).join("\n").trim();

    return { response: text || "Sorry, I couldn't generate a reply." };
  } catch (err) {
    console.error("[Gemini] Helper error:", err);
    return { response: "Internal error while generating a reply." };
  }
}
