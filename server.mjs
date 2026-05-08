import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ─── AI Provider Config ─────────────────────────────────────────────
// Supports any OpenAI-compatible API: DeepSeek, Groq, Together AI, etc.
// Default: DeepSeek (https://platform.deepseek.com)
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_BASE_URL =
  process.env.AI_BASE_URL || "https://api.deepseek.com";
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

  // If it's already plain JSON, parse directly.
  try {
    return JSON.parse(trimmed);
  } catch {
    // ignore
  }

  // Otherwise attempt to extract the first JSON object.
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

Rules:
- Keep it funny, but never insulting, hateful, or personal. Only roast the IDEA.
- Be specific to the idea submitted. Do NOT give generic filler.
- Keep all feedback practical, concise, and easy to read.
- Return ONLY valid JSON — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "funnyRoast": "A funny one-liner roast about the idea (max 2 sentences)",
  "whatIsWeak": ["Weak point 1", "Weak point 2", "Weak point 3"],
  "betterMvpVersion": "A concrete, simpler MVP suggestion (max 2 sentences)",
  "shortPitch": "A one-sentence punchy elevator pitch for the improved version"
}`;

// ─── Mock fallback (when no API key is configured) ───────────────────
const MOCKS = [
  {
    funnyRoast:
      "Another todo app with AI? Innovation really left the chat.",
    whatIsWeak: [
      "Solves a problem that 500 other apps already solved",
      "No clear monetization strategy",
      "No unique differentiator beyond 'has AI'",
    ],
    betterMvpVersion:
      "Build a single-feature app that does one thing perfectly — no AI wrapper, just great UX.",
    shortPitch:
      "The simplest tool for people who just want to get things done, no fluff.",
  },
  {
    funnyRoast:
      "A crypto tracker? Groundbreaking. The blockchain world was waiting for yet another dashboard.",
    whatIsWeak: [
      "Portfolio trackers are a commoditized space",
      "Requires users to trust you with API keys or wallet connections",
      "No network effect — each user is isolated",
    ],
    betterMvpVersion:
      "Build a Telegram bot that sends one alert per day — that's it.",
    shortPitch:
      "The lowest-friction way to know when your bags are moving.",
  },
  {
    funnyRoast:
      "You want to build a social media app? In this economy? Bold move for someone who didn't even post this idea publicly first.",
    whatIsWeak: [
      "Cold start problem — empty feeds kill retention",
      "User acquisition costs are astronomical",
      "Moderation at scale costs a fortune",
    ],
    betterMvpVersion:
      "Build a niche community on a single platform (Discord/Telegram) first, validate before writing code.",
    shortPitch:
      "A curated community for people who actually want quality conversations.",
  },
];

// ─── Route ───────────────────────────────────────────────────────────
app.post("/api/roast", async (req, res) => {
  const idea = typeof req.body?.idea === "string" ? req.body.idea : "";

  if (!idea || !idea.trim()) {
    return res.status(400).json({ error: "Idea is required" });
  }

  if (idea.length > 2000) {
    return res.status(413).json({ error: "Idea is too long" });
  }

  // Fallback mock when no API key is configured
  if (!AI_API_KEY) {
    console.warn("⚠ No AI_API_KEY set — returning mock roast. Set your DeepSeek key in .env");
    const mock = MOCKS[idea.length % MOCKS.length];
    return res.json(normalizeRoastResult(mock));
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
        max_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Roast this idea:\n\n${idea}` },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error(`AI API error ${response.status}:`, errBody);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();

    // OpenAI-compatible extraction
    const raw =
      data?.choices?.[0]?.message?.content ??
      data?.message?.content ??
      data?.content ??
      data?.output ??
      "";

    const parsed = extractJsonFromText(raw);
    if (!parsed) {
      console.error("Failed to parse JSON from AI response. Raw:", raw);
      throw new Error("Failed to parse JSON from AI response");
    }

    return res.json(normalizeRoastResult(parsed));
  } catch (err) {
    console.error("AI proxy error:", err.message || err);
    return res
      .status(502)
      .json({ error: "AI roast failed — please try again in a moment." });
  }
});

// ─── Health check ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    provider: AI_API_KEY ? AI_BASE_URL : "mock (no API key)",
    model: AI_MODEL,
  });
});

// ─── Start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔥 IdeaRoaster server running on http://localhost:${PORT}`);
  if (AI_API_KEY) {
    console.log(`   AI Provider: ${AI_BASE_URL}`);
    console.log(`   Model: ${AI_MODEL}`);
  } else {
    console.log(`   ⚠ No AI_API_KEY — using mock responses`);
    console.log(`   Set AI_API_KEY in .env (get one at https://platform.deepseek.com)`);
  }
});