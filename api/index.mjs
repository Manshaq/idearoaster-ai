import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ─── AI Provider Config ─────────────────────────────────────────────
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.deepseek.com";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

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

  // Customize prompt based on intensity
  let personaPrompt = "brutally honest but funny startup idea critic";
  if (intensity === "gentle") {
    personaPrompt = "constructive, kind, but witty startup mentor. Roast the idea gently with a smile";
  } else if (intensity === "vc") {
    personaPrompt = "skeptical, data-driven, and slightly arrogant Silicon Valley Venture Capitalist. Roast the idea based on market viability and unit economics";
  }

  const systemPrompt = `You are IdeaRoaster AI — a ${personaPrompt}.
Return ONLY valid JSON with this structure:
{
  "funnyRoast": "A funny one-liner roast",
  "whatIsWeak": ["Weak 1", "Weak 2", "Weak 3"],
  "betterMvpVersion": "A smarter, simpler way to start",
  "shortPitch": "A punchy pitch"
}
Important:
- Only roast the idea, not the user.
- Keep it funny but useful.
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
        temperature: 0.8,
        response_format: { type: "json_object" } // DeepSeek/OpenAI support this
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
    return res.status(502).json({ error: "Roast failed. Try again with a clearer idea." });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", model: AI_MODEL });
});

// ─── Vercel Compatibility ───────────────────────────────────────────
// For local development, we still need to listen on a port
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🔥 Local server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;