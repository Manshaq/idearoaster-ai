import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import "dotenv/config";
import { generateRoastAndRebuild } from "../server/src/services/groqService";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Security
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: "Too many roasts! Take a break and pivot." }
});

app.use("/api/roast", limiter);

// Validation
const roastValidation = [
  body("idea")
    .isString()
    .trim()
    .isLength({ min: 20, max: 1500 })
    .withMessage("Idea must be between 20 and 1500 characters."),
  body("intensity")
    .isIn(["gentle", "savage", "vc"])
    .withMessage("Intensity must be gentle, savage, or vc.")
];

// Routes
app.post("/api/roast", roastValidation, async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  const { idea, intensity } = req.body;

  try {
    const result = await generateRoastAndRebuild({ idea, intensity });
    res.json({ success: true, result });
  } catch (err: any) {
    console.error("API Error:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Roast failed. The server is laughing too hard at your idea." 
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🔥 Roaster & Rebuilder live on port ${PORT}`);
});

export default app;
