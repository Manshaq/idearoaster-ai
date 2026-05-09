import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Flame, Smile, Briefcase, RefreshCw, Send, Share2, Volume2, VolumeX, Download } from "lucide-react";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";

interface RoastResult {
  funnyRoast: string;
  whatIsWeak: string[];
  betterMvpVersion: string;
  shortPitch: string;
}

const API_ENDPOINT = "/api/roast";

const LOADING_MESSAGES = [
  "Sharpening the knives...",
  "Consulting the ghost of failed startups...",
  "Analyzing your unit economics (lol)...",
  "Brewing some cold, hard truth...",
  "Preparing the savage burn...",
  "Checking if your idea is just a wrapper...",
  "Calculating the time to pivot...",
  "Roasting with high-intensity flames...",
];

function App() {
  const [idea, setIdea] = useState("");
  const [intensity, setIntensity] = useState("savage");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<RoastResult | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [sharing, setSharing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 2000);
      setLoadingMsg(LOADING_MESSAGES[0]);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/\bVC\b/gi, "Vee See")
      .replace(/\bMVP\b/gi, "Em Vee Pee")
      .replace(/\bAI\b/gi, "Ay Eye")
      .replace(/\blol\b/gi, "laughing out loud")
      .replace(/\bSaaS\b/gi, "Sass")
      .replace(/\bUX\b/gi, "You Ex")
      .replace(/#/g, "number ")
      .replace(/\*/g, "");
  };

  const speak = (text: string) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const cleanedText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Male")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.pitch = 0.8;
    utterance.rate = 1.0;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const handleRoast = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    window.speechSynthesis.cancel();

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, intensity }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: RoastResult = await response.json();
      setResult(data);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f97316", "#ef4444", "#ec4899"]
      });

      setTimeout(() => {
        speak(data.funnyRoast);
      }, 500);

    } catch {
      setError("Roast failed. The server is laughing too hard.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const getCanvas = async () => {
    if (!resultRef.current) return null;
    return html2canvas(resultRef.current, {
      backgroundColor: "#0a0a1a",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      onclone: (clonedDoc) => {
        const clonedArea = clonedDoc.querySelector("[data-export-area]") as HTMLElement;
        if (clonedArea) {
          clonedArea.style.backdropFilter = "none";
          (clonedArea.style as any).webkitBackdropFilter = "none";
          clonedArea.style.boxShadow = "none";
          clonedArea.style.borderRadius = "24px";
          clonedArea.style.background = "linear-gradient(145deg, #0f0f2d 0%, #1a0f0f 100%)";
        }
      }
    });
  };

  const exportAsImage = async () => {
    const canvas = await getCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "idearoaster-card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    if (!result) return;
    setSharing(true);
    try {
      const canvas = await getCanvas();
      if (!canvas) return;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      const text = `I just got roasted by IdeaRoaster AI! 🔥\n\n"${result.funnyRoast}"\n\nRoast yours at: ${window.location.origin}`;

      // 1. Try Native Sharing (Best for Mobile, supports files)
      if (typeof navigator.share !== "undefined" && typeof navigator.canShare !== "undefined") {
        const file = new File([blob], "roast.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "My IdeaRoaster Card",
            text: text,
          });
          return;
        }
      }
      
      // 2. Desktop Fallback: Copy to Clipboard and open X
        // Most browsers allow copying images to clipboard now
        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          alert("🔥 Roast Card copied to clipboard! Paste it (Ctrl+V) into your X post.");
        } catch (err) {
          console.warn("Clipboard image copy failed", err);
        }
        
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
    } catch (err) {
      console.error("Sharing failed", err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-[#f1f1f1] flex flex-col items-center px-4 py-12 selection:bg-[#f97316]/30 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#ea580c]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#9333ea]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-block p-3 bg-[#f97316]/10 rounded-2xl mb-4 border border-[#f97316]/20">
            <Flame className="text-[#f97316] animate-bounce" size={32} />
          </div>
          <h1 className="text-6xl font-black mb-3 bg-gradient-to-br from-white via-[#fb923c] to-[#ef4444] bg-clip-text text-transparent tracking-tight">
            IdeaRoaster AI
          </h1>
          <p className="text-[#9ca3af] text-xl font-medium mb-1">
            Let AI roast your idea before the market does.
          </p>
          <p className="text-[#6b7280] text-sm max-w-md mx-auto text-balance">
            Paste your startup, hackathon, crypto, or app idea and get a funny roast, weak points, and a better direction.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#161633]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl mb-8 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#f97316]/5 to-transparent rounded-3xl pointer-events-none" />
          
          <div className="flex justify-between items-end mb-3">
            <label className="text-sm font-bold text-[#9ca3af] uppercase tracking-widest">
              Paste your idea
            </label>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-white/5 rounded-lg text-[#6b7280] hover:text-[#f97316] transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Example: I want to build another crypto wallet tracker."
            rows={4}
            className="w-full bg-[#0a0a1a]/80 border border-white/5 rounded-2xl p-5 text-[#f1f1f1] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 transition-all resize-none mb-6 text-lg"
          />

          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                <span>Roast Intensity</span>
                <span className="text-[#f97316]">{intensity === "gentle" ? "Merciful" : intensity === "vc" ? "Passive Aggressive" : "Savage"}</span>
              </div>
              <div className="flex p-1.5 bg-[#0a0a1a]/80 rounded-2xl border border-white/5">
                {[
                  { id: "gentle", label: "Gentle", icon: Smile },
                  { id: "savage", label: "Savage", icon: Flame },
                  { id: "vc", label: "VC Mode", icon: Briefcase },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setIntensity(opt.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                      intensity === opt.id 
                        ? "bg-gradient-to-r from-[#f97316] to-[#dc2626] text-white shadow-lg shadow-[#f97316]/20"
                        : "text-[#6b7280] hover:text-[#d1d5db]"
                    }`}
                  >
                    <opt.icon size={16} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRoast}
              disabled={loading || !idea.trim()}
              className="group relative overflow-hidden w-full py-5 rounded-2xl font-black text-xl text-white bg-white disabled:opacity-50 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ea580c] to-[#dc2626] transition-transform group-hover:scale-105" />
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={24} />
                    <span>Roasting your idea...</span>
                  </>
                ) : (
                  <>
                    <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span>Roast My Idea</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </motion.div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0a0a1a]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-[#f97316] rounded-full blur-3xl animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <Flame className="text-[#f97316] relative z-10 animate-bounce" size={80} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">{loadingMsg}</h2>
              <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#f97316] to-[#dc2626]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 10, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-3xl text-[#f87171] font-bold text-center mb-8 flex flex-col items-center gap-2"
          >
            <Smile size={32} className="rotate-180" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <div className="space-y-6">
              {/* The Roaster Card (Export Area) */}
              <div 
                ref={resultRef} 
                data-export-area 
                className="rounded-3xl p-8 space-y-6 relative overflow-hidden"
                style={{ 
                  background: "linear-gradient(145deg, #0f0f2d 0%, #1a0f0f 100%)",
                  border: "2px solid rgba(249, 115, 22, 0.2)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                }}
              >
                {/* Blazing Fire Elements for Card */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ea580c]" style={{ filter: "blur(80px)", opacity: 0.1, borderRadius: "50%" }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ef4444]" style={{ filter: "blur(80px)", opacity: 0.1, borderRadius: "50%" }} />

                {/* Card Header */}
                <div className="flex flex-col items-center text-center pb-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <div className="p-2 rounded-xl mb-2" style={{ backgroundColor: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.2)" }}>
                    <Flame style={{ color: "#f97316" }} size={24} />
                  </div>
                  <h2 className="text-2xl font-black" style={{ color: "#f97316" }}>
                    IdeaRoaster AI
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: "#6b7280" }}>Official Roast Certification</p>
                </div>

                {/* Card Body */}
                <div className="space-y-4">
                  <ResultCard title="The Savage Roast" text={result.funnyRoast} icon={Flame} onCopy={copyToClipboard} color="#fb923c" bgColor="rgba(251, 146, 60, 0.05)" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ResultCard title="Weak Points" list={result.whatIsWeak} onCopy={copyToClipboard} color="#f87171" bgColor="rgba(248, 113, 113, 0.05)" />
                    <ResultCard title="The Pivot Pitch" text={result.shortPitch} onCopy={copyToClipboard} color="#60a5fa" bgColor="rgba(96, 165, 250, 0.05)" />
                  </div>
                  <ResultCard title="Better MVP Version" text={result.betterMvpVersion} onCopy={copyToClipboard} color="#34d399" bgColor="rgba(52, 211, 153, 0.05)" />
                </div>

                {/* Card Footer */}
                <div className="pt-4 flex justify-center" style={{ opacity: 0.3 }}>
                  <p className="text-[8px] font-bold tracking-widest uppercase" style={{ color: "#6b7280" }}>idearoaster.ai • roasted with savage precision</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={exportAsImage}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold transition-all text-[#f1f1f1]"
                >
                  <Download size={18} />
                  Save Roast Card
                </button>
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 rounded-2xl text-[#1DA1F2] text-sm font-bold transition-all disabled:opacity-50"
                >
                  {sharing ? <RefreshCw className="animate-spin" size={18} /> : <Share2 size={18} />}
                  Share on X
                </button>
              </div>
              <p className="text-center text-[10px] text-[#4b5563] font-medium max-w-sm mx-auto">
                {typeof navigator.share !== "undefined" ? "Tap 'Share on X' to post your Roast Card automatically!" : "Tip: 'Share on X' copies your Roast Card to the clipboard—just paste (Ctrl+V) it into your post!"}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
      
      <footer className="mt-20 text-[#4b5563] text-xs font-medium tracking-widest uppercase text-center">
        Built for the Roasters • No Ideas Were Harmed (Maybe)
      </footer>
    </div>
  );
}

function ResultCard({ title, text, list, onCopy, icon: Icon, color, bgColor }: any) {
  const [copied, setCopied] = useState(false);
  const content = list ? list.map((x: string) => `• ${x}`).join("\n") : text || "";

  const handleCopy = () => {
    onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      style={{ backgroundColor: bgColor, border: "1px solid rgba(255, 255, 255, 0.05)" }}
      className="rounded-3xl p-6 relative group hover:border-white/10 transition-all h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", color: color }}>
            {Icon && <Icon size={20} />}
          </div>
          <h3 className="font-black uppercase tracking-tighter text-sm" style={{ color: color }}>{title}</h3>
        </div>
        <button
          onClick={handleCopy}
          className="p-2.5 rounded-xl transition-all active:scale-90"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", color: "#6b7280" }}
        >
          {copied ? <span className="text-[10px] font-bold tracking-tighter" style={{ color: "#10b981" }}>COPIED</span> : <Copy size={16} />}
        </button>
      </div>
      {text && <p className="text-[#f1f1f1] text-lg leading-relaxed font-medium">{text}</p>}
      {list && (
        <ul className="space-y-3">
          {list.map((item: string, i: number) => (
            <li key={i} className="flex gap-4 text-[#f1f1f1] text-base font-medium p-3 rounded-xl" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <span style={{ color: color }}>#</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;