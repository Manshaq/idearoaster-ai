import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ─── AI Provider Config ─────────────────────────────────────────────
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_BASE_URL =
  process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
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

// ─── System prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are IdeaRoaster AI — a brutally honest but funny startup idea critic.
Return ONLY valid JSON with this structure:
{
  "funnyRoast": "A funny one-liner roast",
  "whatIsWeak": ["Weak 1", "Weak 2", "Weak 3"],
  "betterMvpVersion": "A simpler MVP suggestion",
  "shortPitch": "A punchy pitch"
}`;

// ─── Route ───────────────────────────────────────────────────────────
// On Vercel, this file handles /api/*
app.post("/api/roast", async (req, res) => {
  const idea = typeof req.body?.idea === "string" ? req.body.idea : "";

  if (!idea || !idea.trim()) {
    return res.status(400).json({ error: "Idea is required" });
  }

  if (!AI_API_KEY) {
    return res.status(500).json({ error: "AI_API_KEY is not configured on the server." });
  }

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.8,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Roast this idea:\n\n${idea}` },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJsonFromText(raw);

    if (!parsed) throw new Error("Failed to parse JSON from AI");

    return res.json(normalizeRoastResult(parsed));
  } catch (err) {
    console.error("AI proxy error:", err);
    return res.status(502).json({ error: "AI roast failed" });
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