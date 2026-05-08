import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Flame, Smile, Briefcase, RefreshCw, Send } from "lucide-react";

interface RoastResult {
  funnyRoast: string;
  whatIsWeak: string[];
  betterMvpVersion: string;
  shortPitch: string;
}

const API_ENDPOINT = "/api/roast";

const LOADING_MESSAGES = [
  "Sharpening the knives...",
  "Checking my ego at the door...",
  "Consulting with the ghost of Steve Jobs...",
  "Analyzing your unit economics (lol)...",
  "Brewing some cold, hard truth...",
  "Preparing the savage burn...",
];

function App() {
  const [idea, setIdea] = useState("");
  const [intensity, setIntensity] = useState("savage");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<RoastResult | null>(null);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 2000);
      setLoadingMsg(LOADING_MESSAGES[0]);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleRoast = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, intensity }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: RoastResult = await response.json();
      setResult(data);
    } catch {
      setError("Roast failed. The AI might be too shocked by this idea.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-gray-200 flex flex-col items-center px-4 py-12 selection:bg-orange-500/30">
      <div className="w-full max-w-2xl relative">
        {/* Background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full" />

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 bg-clip-text text-transparent tracking-tight">
            IdeaRoaster AI
          </h1>
          <p className="text-gray-400 text-lg">
            Brutally honest feedback for your "next big thing."
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#161633]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl mb-6"
        >
          <label className="block text-sm font-medium text-gray-400 mb-2">
            What's the big idea?
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="I want to build a Uber for cats..."
            rows={4}
            className="w-full bg-[#0a0a1a]/50 border border-white/10 rounded-xl p-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none mb-6"
          />

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex p-1 bg-[#0a0a1a]/50 rounded-xl border border-white/5 w-full sm:w-auto">
              {[
                { id: "gentle", label: "Gentle", icon: Smile },
                { id: "savage", label: "Savage", icon: Flame },
                { id: "vc", label: "VC Mode", icon: Briefcase },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setIntensity(opt.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    intensity === opt.id 
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <opt.icon size={16} />
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRoast}
              disabled={loading || !idea.trim()}
              className="w-full sm:flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Cooking...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Roast My Idea</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-orange-400 italic mb-8"
            >
              "{loadingMsg}"
            </motion.p>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center mb-8"
          >
            {error}
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <ResultCard title="The Roast" text={result.funnyRoast} icon={Flame} onCopy={copyToClipboard} color="text-orange-400" />
              <ResultCard title="Weak Points" list={result.whatIsWeak} onCopy={copyToClipboard} color="text-red-400" />
              <ResultCard title="The Smart Move" text={result.betterMvpVersion} onCopy={copyToClipboard} color="text-green-400" />
              <ResultCard title="The Pivot Pitch" text={result.shortPitch} onCopy={copyToClipboard} color="text-blue-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultCard({ title, text, list, onCopy, icon: Icon, color }: any) {
  const [copied, setCopied] = useState(false);
  const content = list ? list.map((x: string) => `• ${x}`).join("\n") : text || "";

  const handleCopy = () => {
    onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      layout
      className="bg-[#161633]/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 relative group hover:border-white/10 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={color} size={18} />}
          <h3 className={`font-bold uppercase tracking-wider text-xs ${color}`}>{title}</h3>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all"
        >
          {copied ? <span className="text-[10px] font-bold text-green-400">COPIED!</span> : <Copy size={14} />}
        </button>
      </div>
      {text && <p className="text-gray-200 leading-relaxed">{text}</p>}
      {list && (
        <ul className="space-y-2">
          {list.map((item: string, i: number) => (
            <li key={i} className="flex gap-3 text-gray-200">
              <span className={color}>•</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

export default App;