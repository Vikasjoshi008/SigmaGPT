import "dotenv/config";

const getGeminiAIAPIResponse=async(message) => {
      try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
        const payload = {
          contents: [
            {
              role: "user",
              parts: [
                { text: message }
              ]
            }
          ]
        };
    
        const response = await fetch(url, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify(payload)
        });
    
        const rawText = await response.text(); // Read once
    
        let data;
        try {
          data = JSON.parse(rawText); // Parse from rawText
        } catch (err) {
          console.error("Failed to parse JSON:", err.message);
          return res.status(500).send({ error: "Invalid JSON from Gemini", details: rawText });
        }
    
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log("Gemini response:", text);
          return ({ response: text });
        } else {
          console.error("Unexpected response format:", data);
          res.status(500).send({ error: "Unexpected response format", details: data });
        }
    
      } catch (err) {
        console.error("Internal error:", err.message);
        res.status(500).send({ error: "Internal server error", details: err.message });
      }
}

export default getGeminiAIAPIResponse;
