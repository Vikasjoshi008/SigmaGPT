import "dotenv/config";

/**
 * getGeminiAIAPIResponse(input)
 * - input can be a string OR an array of messages [{ role:"system"|"user"|"assistant", content:"..." }]
 * - returns { response: string }
 */
const getGeminiAIAPIResponse = async (input) => {
  try {
    const MODEL = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // --- Build contents[] for Gemini REST ---
    // If input is a string -> single user message
    // If array -> convert to {role: "user"|"model", parts:[{text}]} list
    let contents = [];

    if (typeof input === "string") {
      contents = [
        {
          role: "user",
          parts: [{ text: input }],
        },
      ];
    } else if (Array.isArray(input)) {
      let systemBuffer = ""; // accumulate system text to fold into first user msg

      for (const m of input) {
        if (!m || !m.content) continue;

        if (m.role === "system") {
          // Gemini REST has no system role; fold it into context as user text
          systemBuffer += (systemBuffer ? "\n\n" : "") + String(m.content);
          continue;
        }

        const role = m.role === "assistant" ? "model" : "user";
        const text = String(m.content);

        // If we have system context waiting and this is the first real user turn, prepend it
        if (systemBuffer && role === "user" && contents.length === 0) {
          contents.push({
            role: "user",
            parts: [{ text: systemBuffer + "\n\n" + text }],
          });
          systemBuffer = "";
        } else {
          contents.push({ role, parts: [{ text }] });
        }
      }

      // If conversation had only assistant messages after system, still inject system once
      if (systemBuffer && contents.length === 0) {
        contents.push({ role: "user", parts: [{ text: systemBuffer }] });
      }
    } else {
      return { response: "Invalid input for Gemini helper." };
    }

    const payload = { contents };

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
      console.error("Failed to parse JSON:", err.message, "\nRaw:", rawText.slice(0, 400));
      return { response: "Upstream returned invalid JSON." };
    }

    // API error handling
    if (!response.ok || data.error) {
      const msg = data?.error?.message || response.statusText || "Model error";
      console.error("Gemini API error:", msg);
      return { response: msg };
    }

    // Safety/prompt block check
    const block = data?.promptFeedback?.blockReason;
    if (block) {
      console.warn("Prompt blocked:", block);
      return { response: "I can't answer that due to safety filters." };
    }

    // Extract text from candidates
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p?.text).filter(Boolean).join("\n").trim();

    if (text) {
      // console.log("Gemini response:", text);
      return { response: text };
    } else {
      console.error("Unexpected response format:", JSON.stringify(data)?.slice(0, 400));
      return { response: "Sorry, I couldn't generate a reply." };
    }
  } catch (err) {
    console.error("Internal error:", err);
    return { response: "Internal server error while generating a reply." };
  }
};

export default getGeminiAIAPIResponse;
