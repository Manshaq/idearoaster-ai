import { useState } from "react";

interface RoastResult {
  funnyRoast: string;
  whatIsWeak: string[];
  betterMvpVersion: string;
  shortPitch: string;
}

const API_ENDPOINT = "/api/roast";

function App() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RoastResult | null>(null);

  const handleRoast = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: RoastResult = await response.json();
      setResult(data);
    } catch {
      setError("Roast failed. Try again with a clearer idea.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "true");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f23] text-gray-200 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent">
          IdeaRoaster AI
        </h1>
        <p className="text-center text-lg text-gray-400 mb-1">
          Let AI roast your idea before the market does.
        </p>
        <p className="text-center text-sm text-gray-500 mb-8">
          Paste your startup, hackathon, crypto, or app idea and get a funny
          roast, weak points, better MVP direction, and a short pitch.
        </p>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Paste your idea
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Example: I want to build another crypto wallet tracker."
            rows={4}
            className="w-full bg-[#1a1a3e] border border-gray-600 rounded-lg p-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleRoast}
          disabled={loading || !idea.trim()}
          className="w-full py-3 rounded-lg font-semibold text-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Cooking your idea..." : "Roast My Idea"}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-4">
            <ResultCard
              title="Funny Roast"
              text={result.funnyRoast}
              onCopy={copyToClipboard}
            />
            <ResultCard
              title="What Is Weak"
              list={result.whatIsWeak}
              onCopy={copyToClipboard}
            />
            <ResultCard
              title="Better MVP Version"
              text={result.betterMvpVersion}
              onCopy={copyToClipboard}
            />
            <ResultCard
              title="Short Pitch"
              text={result.shortPitch}
              onCopy={copyToClipboard}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface ResultCardProps {
  title: string;
  text?: string;
  list?: string[];
  onCopy: (text: string) => void;
}

function ResultCard({ title, text, list, onCopy }: ResultCardProps) {
  const content = list ? list.map((x) => `- ${x}`).join("\n") : text || "";

  return (
    <div className="bg-[#1a1a3e] border border-gray-700 rounded-lg p-4 relative group">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-orange-300">{title}</h3>
        <button
          onClick={() => onCopy(content)}
          className="text-xs text-gray-500 hover:text-orange-300 transition"
          title="Copy"
        >
          Copy
        </button>
      </div>
      {text && <p className="text-gray-300 text-sm leading-relaxed">{text}</p>}
      {list && (
        <ul className="list-disc list-inside space-y-1">
          {list.map((item, i) => (
            <li key={i} className="text-gray-300 text-sm leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;