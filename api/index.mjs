import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ─── AI Provider Config ─────────────────────────────────────────────
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
const AI_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";

// ─── Helpers ─────────────────────────────────────────────────────────
function asString(value) {
  return typeof value === "string" ? value : "";
}

function normalizeRoastResult(payload) {
  const funnyRoast = asString(payload?.funnyRoast).trim();
  const betterMvpVersion = asString(payload?.betterMvpVersion).trim();
  const shortPitch = asString(payload?.shortPitch).trim();

  const weak = Array.isArray(payload?.whatIsWeak) ? payload.whatIsWeak : [];
  const whatIsWeak = weak
    .map((x) => asString(x).trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!funnyRoast || !betterMvpVersion || !shortPitch || whatIsWeak.length !== 3) {
    throw new Error("Invalid roast JSON shape");
  }

  return { funnyRoast, whatIsWeak, betterMvpVersion, shortPitch };
}

function extractJsonFromText(rawText) {
  if (typeof rawText !== "string") return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    // ignore
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ─── Route ───────────────────────────────────────────────────────────
app.post("/api/roast", async (req, res) => {
  const idea = typeof req.body?.idea === "string" ? req.body.idea : "";
  const intensity = typeof req.body?.intensity === "string" ? req.body.intensity : "savage";

  if (!idea || !idea.trim()) {
    return res.status(400).json({ error: "Idea is required" });
  }

  if (!AI_API_KEY) {
    return res.status(500).json({ error: "AI API Key is not configured on the server." });
  }

  let personaPrompt = "a brutally honest, sarcastic, and hilarious startup critic";
  if (intensity === "gentle") {
    personaPrompt = "a slightly nicer but still witty startup mentor who roasts with a smile";
  } else if (intensity === "vc") {
    personaPrompt = "a skeptical, data-driven, and slightly arrogant Venture Capitalist from Sand Hill Road";
  }

  const systemPrompt = `You are IdeaRoaster AI — ${personaPrompt}.
Your goal is to roast the user's startup idea with maximum wit and humor.
Return ONLY valid JSON with this structure:
{
  "funnyRoast": "A hilarious, sarcastic roast. Include expressions like 'Haha!', 'LOL!', 'Oh honey...', or 'You can't be serious!' to make it sound more conversational and funny.",
  "whatIsWeak": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "betterMvpVersion": "A smarter, simpler way to actually start",
  "shortPitch": "A punchy, witty pitch"
}
Important:
- Be hilarious, sharp, and very sarcastic.
- Use conversational humor.
- Return ONLY the JSON object.`;

  try {
    const response = await fetch(`${AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Roast this idea:\n\n${idea}` },
        ],
        temperature: 0.9,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJsonFromText(raw);

    if (!parsed) throw new Error("Failed to parse JSON from AI");

    return res.json(normalizeRoastResult(parsed));
  } catch (err) {
    console.error("AI proxy error:", err);
    return res.status(502).json({ error: "Roast failed. The server is laughing too hard." });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", provider: "Groq", model: AI_MODEL });
});

// ─── Vercel Compatibility ───────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🔥 Roaster is live on http://localhost:${PORT}`);
  });
}

export default app;