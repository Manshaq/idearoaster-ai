import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Flame, Smile, Briefcase, RefreshCw, Send, Share2, Volume2, VolumeX, Download, CheckCircle2, AlertTriangle, Zap, Target, Layers, LayoutTemplate, Activity, ShieldAlert, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";

interface IdeaDNA {
  marketSize: number;
  executionDifficulty: number;
  innovationLevel: number;
  competition: number;
  monetizationPotential: number;
  speedToMarket: number;
}

interface DebateAgent {
  role: string;
  emoji: string;
  color: string;
  agentName: string;
  verdict: string;
  opening: string;
  points: string[];
}

interface DebateResult {
  agents: DebateAgent[];
  overallVerdict: string;
}

interface RoastResult {
  ideaType: string;
  funnyRoast: string;
  roastScore: {
    score: number;
    label: string;
    reason: string;
  };
  ideaDNA: IdeaDNA;
  whatIsWeak: string[];
  betterVersion: string;
  firstVersionPlan: string[];
  executionStack: {
    toolsNeeded: string[];
    salesOrDistribution: string;
    operations: string;
    marketing: string;
    paymentsOrMonetization: string;
    freeTools: string[];
  };
  noCostComplexityBoosts: {
    feature: string;
    whyItFeelsImpressive: string;
    howToBuildOrApplyForFree: string;
  }[];
  riskAndTesting: {
    risk: string;
    test: string;
    fix: string;
  }[];
  pivotPitch: string;
  makeItWin: string;
}

const API_ENDPOINT = "/api/roast";

const LOADING_MESSAGES = [
  "Sharpening the knives...",
  "Looking for the actual problem...",
  "Checking if this idea has a pulse...",
  "Removing delusion from the plan...",
  "Turning chaos into execution...",
  "Asking the market if it cares...",
  "Rebuilding the idea into something useful...",
  "Preparing your official roast report...",
];

const PLACEHOLDERS = [
  "I want to start selling fresh fruit near campus.",
  "I want to build a crypto wallet risk checker.",
  "I want to start a small clothing brand for students.",
  "I want to create a WhatsApp food preorder business.",
  "I want to build an AI study helper.",
];

function App() {
  const [idea, setIdea] = useState(() => localStorage.getItem("latestIdea") || "");
  const [intensity, setIntensity] = useState("savage");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<RoastResult | null>(() => {
    const saved = localStorage.getItem("latestResult");
    return saved ? JSON.parse(saved) : null;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [debate, setDebate] = useState<DebateResult | null>(null);
  const [debateLoading, setDebateLoading] = useState(false);
  const [debateError, setDebateError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 2000);
      setLoadingMsg(LOADING_MESSAGES[0]);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    localStorage.setItem("latestIdea", idea);
  }, [idea]);

  useEffect(() => {
    if (result) {
      localStorage.setItem("latestResult", JSON.stringify(result));
    }
  }, [result]);

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
    if (!idea.trim() || idea.length < 20) {
      setError("Idea must be at least 20 characters long. Give us something to work with!");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setDebate(null);
    setDebateError("");
    window.speechSynthesis.cancel();

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, intensity }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResult(data.result);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f97316", "#ef4444", "#ec4899", "#8b5cf6"]
      });

      setTimeout(() => {
        speak(data.result.funnyRoast);
      }, 500);

    } catch (err: any) {
      setError(err.message || "Roast failed. The server is laughing too hard.");
    } finally {
      setLoading(false);
    }
  };

  const handleDebate = async () => {
    if (!idea.trim() || idea.length < 20) {
      setDebateError("Enter an idea above first, then trigger the debate!");
      return;
    }
    setDebateLoading(true);
    setDebateError("");
    setDebate(null);
    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || `HTTP ${response.status}`);
      setDebate(data.result);
    } catch (err: any) {
      setDebateError(err.message || "Debate failed. The agents couldn't agree.");
    } finally {
      setDebateLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const getCanvas = async () => {
    if (!resultRef.current) return null;
    try {
      return await html2canvas(resultRef.current, {
        backgroundColor: "#0a0a1a",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedArea = clonedDoc.querySelector("[data-export-area]") as HTMLElement;
          if (clonedArea) {
            clonedArea.style.backdropFilter = "none";
            (clonedArea.style as any).webkitBackdropFilter = "none";
            clonedArea.style.boxShadow = "none";
            clonedArea.style.borderRadius = "24px";
            clonedArea.style.background = "linear-gradient(145deg, #0f0f2d 0%, #1a0f0f 100%)";
            
            // Fix for Recharts ResponsiveContainer off-screen rendering
            const rechartsWrappers = clonedArea.querySelectorAll('.recharts-wrapper, .recharts-responsive-container');
            rechartsWrappers.forEach((container: any) => {
              container.style.width = "100%";
              container.style.height = "250px";
            });
            const svgs = clonedArea.querySelectorAll('.recharts-surface');
            svgs.forEach((svg: any) => {
              svg.style.width = "100%";
              svg.style.height = "100%";
            });
          }
        }
      });
    } catch (error) {
      console.error("html2canvas error:", error);
      return null;
    }
  };

  const exportAsImage = async () => {
    const canvas = await getCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "idearoaster-rebuild.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShareToX = async () => {
    if (!result) return;
    setSharing(true);
    try {
      const canvas = await getCanvas();
      if (!canvas) return;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      if (typeof navigator.share !== "undefined" && typeof navigator.canShare !== "undefined") {
        const file = new File([blob], "roast.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "IdeaRoaster Report",
            text: `My idea just got roasted and rebuilt by IdeaRoaster AI 🔥\n\n"${result.pivotPitch}"\n\nRebuild yours at: ${window.location.origin}`,
          });
          setSharing(false);
          return;
        }
      }

      try {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
      } catch (err) {
        console.warn("Clipboard copy failed", err);
      }

      const text = `My idea just got roasted and rebuilt by IdeaRoaster AI 🔥\n\n"${result.pivotPitch}"\n\nRebuild yours at: ${window.location.origin}\n\n(Paste your Report Card here! 👇)`;
      
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
      
    } catch (err) {
      console.error("Sharing failed", err);
    } finally {
      setSharing(false);
    }
  };

  const getFullReportText = () => {
    if (!result) return "";
    return `IdeaRoaster AI Report
Idea Type: ${result.ideaType}
Score: ${result.roastScore.score}/100 - ${result.roastScore.label}

ROAST:
${result.funnyRoast}

WEAK POINTS:
${result.whatIsWeak.map(w => "- " + w).join("\n")}

BETTER VERSION:
${result.betterVersion}

FIRST VERSION PLAN:
${result.firstVersionPlan.map(p => "- " + p).join("\n")}

PIVOT PITCH:
${result.pivotPitch}

MAKE IT WIN:
${result.makeItWin}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-[#f1f1f1] flex flex-col items-center px-4 py-12 selection:bg-[#f97316]/30 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#ea580c]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#8b5cf6]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-block px-3 py-1 bg-white/5 rounded-full mb-6 border border-white/10 text-xs font-bold tracking-widest text-[#9ca3af] uppercase">
            For builders, students, founders, and people with "one crazy idea"
          </div>
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-[#f97316]/10 rounded-2xl border border-[#f97316]/20">
              <Flame className="text-[#f97316] animate-bounce" size={32} />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-br from-white via-[#fb923c] to-[#ef4444] bg-clip-text text-transparent tracking-tight text-balance">
            Roast your idea.<br/>Then rebuild it smarter.
          </h1>
          <p className="text-[#9ca3af] text-lg max-w-xl mx-auto text-balance leading-relaxed">
            Paste any idea, from a startup app to a fruit-selling business, and get a funny roast, weak point analysis, practical execution plan, free tools, risks, tests, and a pitch.
          </p>
          <p className="mt-4 text-[#f97316] text-sm font-semibold tracking-wide uppercase">
            No fluff. No fake motivation. Just useful criticism with a plan.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#161633]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl mb-8 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#f97316]/5 to-transparent rounded-3xl pointer-events-none" />
          
          <div className="flex justify-between items-end mb-3">
            <label className="text-sm font-bold text-[#9ca3af] uppercase tracking-widest">
              Drop your idea here
            </label>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-white/5 rounded-lg text-[#6b7280] hover:text-[#f97316] transition-colors"
              title={isMuted ? "Unmute TTS" : "Mute TTS"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            rows={4}
            className="w-full bg-[#0a0a1a]/80 border border-white/5 rounded-2xl p-5 text-[#f1f1f1] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 transition-all resize-none mb-6 text-lg"
          />

          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                <span>Roast Intensity</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { id: "gentle", label: "Gentle", desc: "Merciful but honest", icon: Smile },
                  { id: "savage", label: "Savage", desc: "Funny but brutal", icon: Flame },
                  { id: "vc", label: "VC Mode", desc: "Passive aggressive", icon: Briefcase },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setIntensity(opt.id)}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all ${
                      intensity === opt.id 
                        ? "bg-gradient-to-br from-[#f97316]/20 to-[#dc2626]/20 border-[#f97316]/50 text-white"
                        : "bg-[#0a0a1a]/50 border-white/5 text-[#6b7280] hover:text-[#d1d5db] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <opt.icon size={16} className={intensity === opt.id ? "text-[#f97316]" : ""} />
                      {opt.label}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRoast}
              disabled={loading || idea.trim().length < 20}
              className="group relative overflow-hidden w-full py-5 rounded-2xl font-black text-xl text-white bg-white disabled:opacity-50 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ea580c] to-[#dc2626] transition-transform group-hover:scale-105" />
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={24} />
                    <span>Rebuilding...</span>
                  </>
                ) : (
                  <>
                    <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span>Roast & Rebuild</span>
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
              className="fixed inset-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-[#f97316] rounded-full blur-[80px] animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60" />
                <Activity className="text-[#f97316] relative z-10 animate-bounce" size={80} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 bg-gradient-to-r from-white to-[#f97316] bg-clip-text text-transparent">
                {loadingMsg}
              </h2>
              <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#f97316] to-[#dc2626]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15, ease: "circOut" }}
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
            <AlertTriangle size={32} />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* The Report Card (Export Area) */}
              <div 
                ref={resultRef} 
                data-export-area 
                className="rounded-[2rem] p-6 md:p-10 space-y-8 relative overflow-hidden"
                style={{ 
                  background: "linear-gradient(145deg, #0f0f2d 0%, #1a0f0f 100%)",
                  border: "2px solid rgba(249, 115, 22, 0.2)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                }}
              >
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ea580c]" style={{ filter: "blur(120px)", opacity: 0.15, borderRadius: "50%" }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8b5cf6]" style={{ filter: "blur(120px)", opacity: 0.15, borderRadius: "50%" }} />

                {/* Header */}
                <div className="flex flex-col items-center text-center pb-6" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.2)" }}>
                      <Flame style={{ color: "#f97316" }} size={24} />
                    </div>
                    <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                      <LayoutTemplate style={{ color: "#8b5cf6" }} size={24} />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-white">
                    IdeaRoaster AI
                  </h2>
                  <p className="text-xs uppercase tracking-[0.2em] font-bold mt-1" style={{ color: "#f97316" }}>Official Roast & Rebuild Report</p>
                </div>

                {/* Score & Type Banner */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Idea Category</p>
                      <p className="text-xl font-black text-white">{result.ideaType}</p>
                    </div>
                    <Layers className="text-[#8b5cf6] opacity-50" size={32} />
                  </div>
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Roast Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-[#f97316]">{result.roastScore.score}</span>
                        <span className="text-sm font-bold text-gray-500">/ 100</span>
                      </div>
                      <p className="text-sm font-semibold mt-1" style={{ color: result.roastScore.score < 40 ? "#ef4444" : result.roastScore.score < 70 ? "#eab308" : "#22c55e" }}>
                        "{result.roastScore.label}"
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-xl" style={{ borderColor: result.roastScore.score < 40 ? "#ef4444" : result.roastScore.score < 70 ? "#eab308" : "#22c55e", color: result.roastScore.score < 40 ? "#ef4444" : result.roastScore.score < 70 ? "#eab308" : "#22c55e" }}>
                      {result.roastScore.score}
                    </div>
                  </div>
                </div>

                {/* The Roast & Weak Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ResultCard title="Savage Roast" text={result.funnyRoast} icon={Flame} onCopy={copyToClipboard} color="#fb923c" bgColor="rgba(251, 146, 60, 0.05)" />
                  <ResultCard title="Weak Points" list={result.whatIsWeak} icon={AlertTriangle} onCopy={copyToClipboard} color="#f87171" bgColor="rgba(248, 113, 113, 0.05)" />
                </div>

                {/* The Rebuild */}
                <div className="space-y-4">
                  <ResultCard title="Better Version" text={result.betterVersion} icon={Target} onCopy={copyToClipboard} color="#60a5fa" bgColor="rgba(96, 165, 250, 0.05)" />
                  <ResultCard title="First Version Plan" list={result.firstVersionPlan} icon={CheckCircle2} onCopy={copyToClipboard} color="#34d399" bgColor="rgba(52, 211, 153, 0.05)" />
                </div>

                {/* Execution Stack Grid */}
                <div className="bg-black/20 border border-white/5 rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black uppercase tracking-widest text-sm text-[#8b5cf6] flex items-center gap-2">
                      <Layers size={18} />
                      Execution Stack
                    </h3>
                    <CopyButton text={JSON.stringify(result.executionStack, null, 2)} onCopy={copyToClipboard} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StackItem label="Tools Needed" value={(result.executionStack?.toolsNeeded || []).join(", ")} />
                    <StackItem label="Sales/Distribution" value={result.executionStack?.salesOrDistribution} />
                    <StackItem label="Operations" value={result.executionStack?.operations} />
                    <StackItem label="Marketing" value={result.executionStack?.marketing} />
                    <StackItem label="Monetization" value={result.executionStack?.paymentsOrMonetization} />
                    <StackItem label="Free Tools" value={(result.executionStack?.freeTools || []).join(", ")} highlight />
                  </div>
                </div>

                {/* Idea DNA Fingerprint */}
                {result.ideaDNA && (
                  <div className="bg-black/20 border border-white/5 rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black uppercase tracking-widest text-sm text-[#e879f9] flex items-center gap-2">
                        <Zap size={18} />
                        Idea DNA Fingerprint
                      </h3>
                    </div>
                    <IdeaDNAChart dna={result.ideaDNA} />
                  </div>
                )}

                {/* Market Traction Simulator */}
                <div className="bg-black/20 border border-white/5 rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black uppercase tracking-widest text-sm text-[#3b82f6] flex items-center gap-2">
                      <Activity size={18} />
                      6-Month Traction Simulator
                    </h3>
                  </div>
                  <TractionSimulator score={result.roastScore.score} />
                </div>

                {/* Boosts & Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* No Cost Boosts */}
                  <div className="bg-[rgba(234,179,8,0.05)] border border-white/5 rounded-3xl p-6 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black uppercase tracking-widest text-sm text-[#eab308] flex items-center gap-2">
                        <Zap size={18} />
                        No-Cost Boosts
                      </h3>
                      <CopyButton text={JSON.stringify(result.noCostComplexityBoosts, null, 2)} onCopy={copyToClipboard} />
                    </div>
                    <div className="space-y-4">
                      {result.noCostComplexityBoosts.map((boost, i) => (
                        <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5">
                          <p className="font-bold text-white mb-1">{boost.feature}</p>
                          <p className="text-sm text-gray-400 mb-2">Why: {boost.whyItFeelsImpressive}</p>
                          <p className="text-xs text-[#eab308] font-bold bg-[#eab308]/10 inline-block px-2 py-1 rounded">How: {boost.howToBuildOrApplyForFree}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risks & Testing */}
                  <div className="bg-[rgba(239,68,68,0.05)] border border-white/5 rounded-3xl p-6 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black uppercase tracking-widest text-sm text-[#ef4444] flex items-center gap-2">
                        <ShieldAlert size={18} />
                        Risk & Testing
                      </h3>
                      <CopyButton text={JSON.stringify(result.riskAndTesting, null, 2)} onCopy={copyToClipboard} />
                    </div>
                    <div className="space-y-4">
                      {result.riskAndTesting.slice(0, 3).map((rt, i) => ( // Show max 3 on UI to keep it clean, full in JSON if they copy
                        <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5">
                          <p className="font-bold text-white mb-1">Risk: {rt.risk}</p>
                          <p className="text-sm text-gray-400 mb-1">Test: {rt.test}</p>
                          <p className="text-xs text-[#ef4444] font-bold">Fix: {rt.fix}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pitch & Make It Win */}
                <div className="space-y-4">
                  <ResultCard title="Pivot Pitch" text={result.pivotPitch} icon={TrendingUp} onCopy={copyToClipboard} color="#c084fc" bgColor="rgba(192, 132, 252, 0.05)" />
                  <ResultCard title="Make It Win" text={result.makeItWin} icon={Target} onCopy={copyToClipboard} color="#f97316" bgColor="rgba(249, 115, 22, 0.1)" highlightBorder />
                </div>

                <div className="pt-6 flex justify-between items-center" style={{ opacity: 0.5 }}>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">idearoaster.ai</p>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Roasted & Rebuilt</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={handleShareToX}
                  disabled={sharing}
                  className="w-full relative group overflow-hidden py-4 rounded-2xl font-black text-lg text-white transition-all disabled:opacity-50 shadow-lg shadow-[#1DA1F2]/20"
                >
                  <div className="absolute inset-0 bg-[#1DA1F2]" />
                  <div className="relative flex items-center justify-center gap-2">
                    {sharing ? <RefreshCw className="animate-spin" size={20} /> : <Share2 size={20} />}
                    <span>Post Report to X</span>
                  </div>
                </button>

                <button
                  onClick={exportAsImage}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-lg font-bold transition-all text-[#f1f1f1]"
                >
                  <Download size={20} />
                  Download Report Card
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => copyToClipboard(getFullReportText())}
                  className="flex items-center justify-center gap-2 py-3 px-6 bg-transparent hover:bg-white/5 rounded-xl text-sm font-bold transition-all text-gray-400 hover:text-white"
                >
                  <Copy size={16} />
                  Copy Full Text Report
                </button>
              </div>
              
              <p className="text-center text-xs text-[#4b5563] font-medium max-w-sm mx-auto leading-relaxed">
                Tapping 'Post to X' will automatically copy your Report Card image.<br/>
                <strong>Just Paste (Ctrl+V) it into your post field!</strong>
              </p>
            {/* Multi-Agent Debate Panel */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 rounded-[2rem] overflow-hidden"
              style={{ border: "2px solid rgba(167,139,250,0.2)", background: "linear-gradient(145deg, #0d0d2b 0%, #1a0a2e 100%)" }}
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <span>🤖</span> Multi-Agent Debate
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">3 AI agents debate your idea simultaneously in parallel</p>
                  </div>
                  <button
                    onClick={handleDebate}
                    disabled={debateLoading}
                    className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                  >
                    {debateLoading ? <RefreshCw className="animate-spin" size={18} /> : <span>⚡</span>}
                    {debateLoading ? "Agents Debating..." : debate ? "Re-Run Debate" : "Start Debate"}
                  </button>
                </div>

                {debateError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold mb-4">
                    {debateError}
                  </div>
                )}

                {debateLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["🔥 The Critic", "🚀 The Builder", "💰 The VC"].map((label) => (
                      <div key={label} className="bg-white/5 rounded-2xl p-5 animate-pulse">
                        <p className="text-white font-black mb-3">{label}</p>
                        <div className="h-2 bg-white/10 rounded mb-2 w-full" />
                        <div className="h-2 bg-white/10 rounded mb-2 w-5/6" />
                        <div className="h-2 bg-white/10 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                )}

                {debate && <DebatePanel debate={debate} />}

                {!debate && !debateLoading && (
                  <div className="text-center py-8">
                    <p className="text-5xl mb-3">🤖</p>
                    <p className="font-bold text-gray-500">Click "Start Debate" to pit 3 AI agents against your idea</p>
                  </div>
                )}
              </div>
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <footer className="mt-24 text-[#4b5563] text-xs font-bold tracking-widest uppercase text-center pb-8">
        Built for Builders • Ideas are cheap, execution is everything
      </footer>
    </div>
  );
}

function ResultCard({ title, text, list, onCopy, icon: Icon, color, bgColor, highlightBorder }: any) {
  return (
    <div 
      style={{ backgroundColor: bgColor, border: `1px solid ${highlightBorder ? color : 'rgba(255, 255, 255, 0.05)'}` }}
      className="rounded-3xl p-6 relative group hover:border-white/10 transition-all h-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2" style={{ color }}>
          {Icon && <Icon size={18} />}
          {title}
        </h3>
        <CopyButton text={list ? list.join("\n") : text} onCopy={onCopy} color={color} />
      </div>
      {text && <p className="text-[#f1f1f1] text-base leading-relaxed font-medium">{text}</p>}
      {list && (
        <ul className="space-y-3">
          {list.map((item: string, i: number) => (
            <li key={i} className="flex gap-3 text-[#f1f1f1] text-sm font-medium p-3 rounded-xl bg-black/20 border border-white/5">
              <span className="font-bold shrink-0 mt-0.5" style={{ color }}>{i + 1}.</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StackItem({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className={`p-3 rounded-xl border ${highlight ? 'bg-[#34d399]/10 border-[#34d399]/30' : 'bg-black/30 border-white/5'}`}>
      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-[#34d399]' : 'text-gray-300'}`}>{value}</p>
    </div>
  );
}

function CopyButton({ text, onCopy, color = "#6b7280" }: any) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-xl transition-all hover:bg-white/10 active:scale-90"
      style={{ color }}
      title="Copy to clipboard"
    >
      {copied ? <span className="text-[10px] font-bold tracking-tighter text-[#10b981]">COPIED</span> : <Copy size={16} />}
    </button>
  );
}

function TractionSimulator({ score }: { score: number }) {
  const generateData = () => {
    const data = [];
    let currentUsers = score < 40 ? 500 : 100;

    for (let month = 1; month <= 6; month++) {
      if (score >= 70) {
        // Hockey stick growth
        currentUsers = Math.floor(currentUsers * (1.5 + (score / 100)));
      } else if (score >= 40) {
        // Linear/slow growth
        currentUsers = Math.floor(currentUsers + (score * 10));
      } else {
        // Initial spike then crash
        if (month === 1) currentUsers = 1200; // Fake launch spike
        else currentUsers = Math.max(0, Math.floor(currentUsers * 0.3)); // Crash
      }
      
      data.push({
        month: `Month ${month}`,
        users: currentUsers,
      });
    }
    return data;
  };

  const data = generateData();
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";
  const message = score >= 70 
    ? "Projected Hockey Stick Growth 🚀" 
    : score >= 40 
      ? "Slow & Steady Linear Growth 🐢" 
      : "The Post-Launch Crash & Burn 📉";

  return (
    <div className="w-full h-64 flex flex-col">
      <div className="text-center mb-4">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{message}</p>
      </div>
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0a1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Area type="monotone" dataKey="users" stroke={color} strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function IdeaDNAChart({ dna }: { dna: any }) {
  const radarData = [
    { label: "Market Size", value: dna.marketSize },
    { label: "Monetization", value: dna.monetizationPotential },
    { label: "Speed", value: dna.speedToMarket },
    { label: "Innovation", value: dna.innovationLevel },
    { label: "Low Competition", value: 100 - dna.competition },
    { label: "Easy to Build", value: 100 - dna.executionDifficulty },
  ];
  const bars = [
    { label: "Market Size", value: dna.marketSize, color: "#e879f9" },
    { label: "Monetization", value: dna.monetizationPotential, color: "#22c55e" },
    { label: "Innovation", value: dna.innovationLevel, color: "#3b82f6" },
    { label: "Speed to Market", value: dna.speedToMarket, color: "#f97316" },
    { label: "Competition", value: dna.competition, color: "#ef4444", invert: true },
    { label: "Exec. Difficulty", value: dna.executionDifficulty, color: "#eab308", invert: true },
  ];
  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="w-full md:w-72 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: "bold" }} />
            <Radar name="Idea" dataKey="value" stroke="#e879f9" fill="#e879f9" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3 w-full">
        {bars.map(({ label, value, color, invert }) => (
          <div key={label} className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
              <span className="text-sm font-black" style={{ color }}>{value}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${value}%`, backgroundColor: invert ? (value > 60 ? "#ef4444" : "#22c55e") : color }}
              />
            </div>
            {invert && <p className="text-[10px] text-gray-600 mt-1">{value > 60 ? "⚠️ High" : "✅ Low"}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DebatePanel({ debate }: { debate: DebateResult }) {
  const verdictConfig: Record<string, { color: string; label: string; emoji: string }> = {
    FUNDABLE: { color: "#22c55e", label: "FUNDABLE", emoji: "🏆" },
    BACK_TO_DRAWING_BOARD: { color: "#ef4444", label: "BACK TO DRAWING BOARD", emoji: "💀" },
  };
  const vConfig = verdictConfig[debate.overallVerdict] || { color: "#eab308", label: debate.overallVerdict, emoji: "🤔" };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {debate.agents.map((agent) => (
          <motion.div
            key={agent.role}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-5 border border-white/5 bg-black/30"
          >
            <div className="flex justify-between items-start mb-3">
              <p className="font-black text-white text-base">{agent.emoji} {agent.agentName}</p>
              <span
                className="text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shrink-0 ml-2"
                style={{ backgroundColor: `${agent.color}22`, color: agent.color }}
              >
                {agent.verdict}
              </span>
            </div>
            <p className="text-sm text-gray-300 italic mb-3 leading-relaxed">"{agent.opening}"</p>
            <ul className="space-y-2">
              {agent.points.map((pt, i) => (
                <li key={i} className="text-xs text-gray-400 flex gap-2">
                  <span style={{ color: agent.color }} className="shrink-0 font-black mt-0.5">▸</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <div
        className="rounded-2xl p-5 text-center border"
        style={{ borderColor: `${vConfig.color}40`, backgroundColor: `${vConfig.color}11` }}
      >
        <p className="text-2xl mb-1">{vConfig.emoji}</p>
        <p className="font-black text-lg tracking-widest uppercase" style={{ color: vConfig.color }}>
          Panel Verdict: {vConfig.label}
        </p>
      </div>
    </div>
  );
}

export default App;