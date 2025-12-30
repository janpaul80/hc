"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignInButton, UserButton, useUser, useClerk, useAuth } from "@clerk/nextjs";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import {
  Paperclip,
  Github,
  Globe,
  ArrowRight,
  RefreshCw,
  Music,
  Cpu,
  Cookie,
  Sparkles,
  Zap,
  Image,
  FileText,
  Link2,
  ChevronDown,
  AudioWaveform,
  X,
  Code2,
  Rocket,
  CheckCircle,
  Loader2,
  MessageSquare,
  MessageCircle
} from "lucide-react";

// Model list matching the "vibe" design
const models = [
  { id: "heft-orchestrator", name: "Heft Orchestrator", provider: "openai", pro: true },
  { id: "codestral", name: "Codestral 2501", provider: "mistral", pro: true },
  { id: "mistral-large", name: "Mistral Large 3", provider: "mistral", pro: true },
  { id: "mistral-medium", name: "Mistral Medium", provider: "mistral", pro: false },
  { id: "grok-4", name: "Grok 4 (thinking)", provider: "xai", pro: true },
  { id: "deepseek-v3.1", name: "DeepSeek v3.1", provider: "deepseek", pro: false },
  { id: "llama-4", name: "Llama 4 Maverick", provider: "meta", pro: true },
  { id: "kimi-k2", name: "Kimi K2 Thinking", provider: "kimi", pro: true },
  { id: "flux.2-pro", name: "Flux.2-Pro", provider: "flux", pro: true },
  { id: "sora", name: "Sora Video Gen", provider: "openai", pro: true },
];

const ModelIcon = ({ provider }: { provider: string }) => {
  switch (provider) {
    case 'anthropic':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 18H7.5L9.5 13.5H14.5L16.5 18H20L12 2ZM12 7.5L13.8 11.5H10.2L12 7.5Z" fill="#ff7f50" />
        </svg>
      );
    case 'openai':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5153-4.9066 6.0462 6.0462 0 0 0-4.445-2.9155 6.0073 6.0073 0 0 0-5.6381 2.3848 6.0134 6.0134 0 0 0-5.4505-1.0888 6.0524 6.0524 0 0 0-4.0026 3.4936 6.0073 6.0073 0 0 0 .8093 6.2202 5.9847 5.9847 0 0 0 .5154 4.9056 6.0462 6.0462 0 0 0 4.4451 2.9155 6.0072 6.0072 0 0 0 5.638-2.3858 6.0134 6.0134 0 0 0 5.4515 1.0888 6.0524 6.0524 0 0 0 4.0026-3.4936 6.0073 6.0073 0 0 0-.8094-6.2202ZM12.0947 15.6637l-1.339-1.339s.0232-.0163.064-.0408l2.0543-1.1856c.1537-.0897.2842-.217.3789-.3684l1.339-2.1265s.0337-.0245.0932-.0164l2.1266 1.339s.0163.0245.0163.064l.0163 2.502c-.001.1711-.0618.3364-.1714.4716L15.341 16.326s-.0245.0337-.064.049l-3.2642 .0163s-.0163 0-.0163-.0163V15.6637Zm-.2082-1.3061-2.1265-1.339s-.0163-.0245-.0163-.064l.0163-4.098c.002-.1711.0628-.3364.1724-.4716L11.3344 7.221s.0245-.0337.064-.049l2.1265 1.339s.0163.0245.0163.064l-.0163 4.098c-.002.1711-.0628.3364-.1724.4716l-1.339 1.1857s-.0246.0337-.064.049l-.048-.0245ZM6.6579 16.326l-1.339-2.1265s-.0245-.0337-.0163-.0933l1.1857-1.339s.0337-.0245.049-.0163l4.098 2.1265s.0245.0163.0245.064l1.339 2.1265s.0245.0337.0163.0932l-1.1857 1.339s-.0337.0245-.049.0164L6.6579 16.326Zm-.2082-2.3333-2.1265-1.339s-.0163-.0245-.0163-.064l.0163-4.098c.002-.1711.0628-.3364.1724-.4716l1.339-1.1857s.0245-.0337.064-.049l2.1265 1.339s.0163.0245.0163.064l-.0163 4.098c-.002.1711-.0628.3364-.1724.4716l-1.339 1.1857s-.0245.0337-.064.049l-.048-.0245ZM11.1224 4.6579l1.339 2.1265s.0245.0337.0163.0932l-1.1856 1.339s-.0337.0245-.049.0164L7.1461 6.1065s-.0245-.0163-.0245-.064L5.7826 3.916s-.0245-.0337-.0163-.0932l1.1856-1.3389s.0337-.0245.049-.0164L10.9714 4.542l.151.1159Z" fill="white" />
        </svg>
      );
    case 'deepseek':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#3B82F6" />
          <path d="M12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18C15.314 18 18 15.314 18 12C18 8.686 15.314 6 12 6ZM12 16C9.791 16 8 14.209 8 12C8 9.791 9.791 8 12 8C14.209 8 16 9.791 16 12C16 14.209 14.209 16 12 16Z" fill="white" />
        </svg>
      );
    case 'mistral':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 22L12 18L20 22L12 2Z" fill="#f97316" />
        </svg>
      );
    case 'flux':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="#8B5CF6" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
          <path d="M21 15L16 10L5 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'meta':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" fill="#0668E1" />
          <path d="M12 6c-3.313 0-6 2.687-6 6s2.687 6 6 6 6-2.687 6-6-2.687-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z" fill="#0668E1" />
        </svg>
      );
    case 'kimi':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 19.5h20L12 2z" fill="#FF4F00" />
        </svg>
      );
    case 'xai':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="white" />
        </svg>
      );
    default:
      return <div className="w-5 h-5 rounded-full bg-gray-500 flex-shrink-0" />;
  }
};

const ConnectorsModal = ({ onClose }: { onClose: () => void }) => {
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const toggleConnection = (id: string) => {
    setConnected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const apps = [
    { id: 'github', name: 'GitHub', icon: Github, color: 'text-white' },
    { id: 'slack', name: 'Slack', icon: MessageSquare, color: 'text-purple-400' },
    { id: 'notion', name: 'Notion', icon: FileText, color: 'text-gray-200' },
    { id: 'linear', name: 'Linear', icon: Zap, color: 'text-blue-400' },
    { id: 'discord', name: 'Discord', icon: MessageCircle, color: 'text-indigo-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden relative shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#111]">
          <div>
            <h2 className="text-2xl font-bold text-white">Connectors</h2>
            <p className="text-gray-400 text-sm mt-1">Supercharge HEFTCoder with your favorite tools.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2 transition-colors rounded-lg hover:bg-white/5">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {apps.map(app => (
            <div key={app.id} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-black/50 ${app.color}`}>
                  <app.icon size={20} />
                </div>
                <span className="font-medium text-gray-200">{app.name}</span>
              </div>
              <button
                onClick={() => toggleConnection(app.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${connected[app.id]
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-transparent'
                  }`}
              >
                {connected[app.id] ? 'Connected' : 'Connect'}
              </button>
            </div>
          ))}
          <div className="p-4 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 gap-2 min-h-[100px]">
            <span className="text-xs uppercase tracking-widest font-bold">More Coming Soon</span>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 bg-[#111] flex justify-end">
          <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const { openSignIn } = useClerk();
  const { isSignedIn, user } = useUser();

  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('heft-orchestrator');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [showConnectorsModal, setShowConnectorsModal] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isGithubConnected, setIsGithubConnected] = useState(false);

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const attachDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
      if (attachDropdownRef.current && !attachDropdownRef.current.contains(e.target as Node)) {
        setShowAttachDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpgrade = async (plan: string) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    setLoadingPlan(plan);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userId: user?.id,
          userEmail: user?.emailAddresses[0]?.emailAddress,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Upgrade error:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const getSelectedModelName = () => {
    const model = models.find(m => m.id === selectedModel);
    return model ? model.name : 'Heft Orchestrator';
  };

  const handleSend = () => {
    if (!prompt.trim()) return;
    if (!isSignedIn) {
      openSignIn({ forceRedirectUrl: "/dashboard" });
      return;
    }
    router.push(`/dashboard`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrompt(prev => prev + `\n[Attached: ${file.name}]`);
      setShowAttachDropdown(false);
    }
  };

  const handleGithubConnect = () => {
    setIsGithubConnected(true);
    setShowAttachDropdown(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-blue-900/10 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Connectors Modal */}
      {showConnectorsModal && <ConnectorsModal onClose={() => setShowConnectorsModal(false)} />}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      <Header />

      <main className="relative z-10 pt-40 px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/10 border border-orange-500/20 text-orange-500 text-xs font-medium mb-8 animate-pulse">
            <Zap className="w-3 h-3" />
            <span>v2.1 Orchestrator Mode Live</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent leading-[1.1]">
            Where ideas become <br /> reality
          </h1>
          <p className="text-xl text-gray-400 mb-12 font-light max-w-2xl mx-auto">
            The most powerful autonomous AI agents for building production-ready applications in minutes.
          </p>

          <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-sm relative group focus-within:border-orange-500/50 transition-all">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Build me a SaaS platform for..."
              className="w-full h-24 bg-transparent text-lg text-white placeholder-gray-600 resize-none focus:outline-none p-2 mb-12"
            />

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center gap-2">
              <div className="flex items-center gap-1 sm:gap-3">
                <div className="relative" ref={attachDropdownRef}>
                  <button
                    onClick={() => setShowAttachDropdown(!showAttachDropdown)}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Paperclip size={20} />
                  </button>
                  {showAttachDropdown && (
                    <div className="absolute bottom-full mb-2 left-0 bg-[#1a1a1a] border border-white/10 rounded-xl py-2 w-52 shadow-xl z-50">
                      <button
                        onClick={handleGithubConnect}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white text-left"
                      >
                        <Github size={18} className={isGithubConnected ? "text-green-500" : ""} />
                        {isGithubConnected ? "GitHub Connected" : "Connect GitHub"}
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white text-left"
                      >
                        <Image size={18} /> Import images
                      </button>
                      <button
                        onClick={() => { setShowConnectorsModal(true); setShowAttachDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white text-left"
                      >
                        <Link2 size={18} /> Add connectors
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative" ref={modelDropdownRef}>
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="h-9 px-3 flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <ModelIcon provider={models.find(m => m.id === selectedModel)?.provider || 'anthropic'} />
                    <span className="hidden sm:inline">{getSelectedModelName()}</span>
                    <ChevronDown size={14} className={`transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showModelDropdown && (
                    <div className="absolute bottom-full mb-2 left-0 bg-[#1a1a1a] border border-white/10 rounded-xl py-2 w-64 shadow-2xl z-50 overflow-hidden">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => { setSelectedModel(model.id); setShowModelDropdown(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${selectedModel === model.id ? 'bg-orange-600/10 text-orange-500' : 'text-gray-300'}`}
                        >
                          <div className="flex items-center gap-3">
                            <ModelIcon provider={model.provider} />
                            <span>{model.name}</span>
                          </div>
                          {model.pro && (
                            <span className="text-[10px] text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Pro</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-white transition-colors">
                  <AudioWaveform size={20} />
                </button>
                <button
                  onClick={handleSend}
                  className={`p-3 rounded-xl transition-all ${prompt ? 'bg-orange-600 text-white hover:scale-105 shadow-[0_0_20px_rgba(234,88,12,0.4)]' : 'bg-[#252525] text-gray-600'}`}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { icon: Music, label: 'Clone Spotify' },
              { icon: Cpu, label: 'Idea Logger' },
              { icon: Cookie, label: 'Baking Bliss' },
              { icon: Sparkles, label: 'Surprise Me' },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => setPrompt(chip.label === 'Surprise Me' ? 'Build me something unique and creative' : `Build me a ${chip.label.toLowerCase()} app`)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-all shadow-lg"
              >
                <chip.icon size={16} />
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Trusted By Carousel */}
      <section className="py-20 border-t border-white/5 bg-[#0a0a0a] overflow-hidden select-none">
        <div className="max-w-6xl mx-auto text-center px-6">
          <p className="text-[10px] text-gray-500 mb-10 uppercase tracking-[0.3em] font-black opacity-50">
            Trusted by innovators at
          </p>
          <div className="relative group">
            <div className="flex animate-scroll-right gap-16 items-center w-max">
              {['Coinbase', 'Stripe', 'Vercel', 'Hg', 'Oscar', 'ARK Invest', 'Zillow', 'Microsoft', 'Coinbase', 'Stripe', 'Vercel', 'Hg', 'Oscar', 'ARK Invest', 'Zillow', 'Microsoft'].map((logo, i) => (
                <span key={`${logo}-${i}`} className="text-2xl font-black text-white/20 whitespace-nowrap hover:text-orange-500/50 transition-colors duration-500">{logo}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Orchestrator Banner */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-orange-600 to-orange-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="bg-[#0a0a0a] rounded-2xl p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="space-y-4 animate-pulse-slow">
              <div className="flex items-center gap-2 mb-6 opacity-50">
                <div className="w-3 h-3 rounded-full bg-red-500/50" /><div className="w-3 h-3 rounded-full bg-yellow-500/50" /><div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">U</div>
                <div className="bg-white/5 rounded-2xl px-4 py-3 text-gray-300 text-sm max-w-[85%] border border-white/5">
                  Build me a custom dashboard with real-time analytics and dark mode.
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3 text-orange-200 text-sm max-w-[85%] shadow-[0_0_30px_rgba(234,88,12,0.1)]">
                  Architecting React infrastructure... Setting up Tailwind colors... Injecting Lucide icons...
                </div>
                <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_10px_rgba(234,88,12,0.5)]">AI</div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 text-green-400 text-sm max-w-[85%]">
                  ✓ Done! Deployment live at dashboard-v1.nextcoder.icu
                </div>
                <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
              </div>
            </div>
          </div>
          <div className="text-white">
            <h2 className="text-4xl font-black mb-6 leading-tight">Orchestrator Agents <br />by HEFTCoder</h2>
            <p className="text-xl text-white/80 mb-8 font-light leading-relaxed">
              The most powerful autonomous AI agents for building production-ready applications in minutes.
              Turn <strong>Extended Thinking</strong> on for complex enterprise architectures.
            </p>
            <Link href="/dashboard" className="bg-white text-orange-600 px-8 py-4 rounded-xl font-black text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-2xl inline-block">
              Start Building Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" id="pricing-title">Choose Your Plan</h2>
            <p className="text-gray-500 max-w-lg mx-auto">AI-powered coding with transparent pricing. Credits reset monthly. No surprise overages.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Basic', price: '9', credits: '10,000',
                features: ['GPT-5.1 Orchestrator', 'Auto-Save Projects', 'Public Workspaces'],
                color: 'orange'
              },
              {
                name: 'Pro', price: '25', credits: '50,000', popular: true,
                features: ['VIBE Multi-Agent Mode', 'Private Workspaces', 'High-Power Models', 'Flux.2 PRO Image Gen'],
                color: 'blue'
              },
              {
                name: 'Studio', price: '59', credits: '150,000',
                features: ['Full Orchestration', 'Smart Model Routing', 'Team Workspaces', 'Priority Compute'],
                color: 'purple'
              }
            ].map((plan, i) => (
              <div key={plan.name} className={`relative p-8 rounded-3xl border transition-all hover:translate-y-[-8px] flex flex-col ${plan.popular ? 'bg-gradient-to-b from-blue-900/20 to-black border-blue-500/50 scale-105 shadow-2xl shadow-blue-500/10' : 'bg-[#111] border-white/5 shadow-xl'}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] font-black tracking-widest px-4 py-1 rounded-full uppercase">MOST POPULAR</div>}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  {plan.name === 'Basic' ? (
                    <div>
                      <span className="text-sm font-bold text-green-500 uppercase tracking-wider block mb-1">7 Day Free Trial</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-gray-400">then</span>
                        <span className="text-4xl font-black">${plan.price}</span>
                        <span className="text-gray-600">/mo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">${plan.price}</span>
                      <span className="text-gray-600">/mo</span>
                    </div>
                  )}
                </div>
                <div className={`text-sm font-bold mb-8 uppercase tracking-widest ${plan.color === 'orange' ? 'text-orange-500' : plan.color === 'blue' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {plan.credits} HeftCredits
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex gap-3 text-sm text-gray-400">
                      <CheckCircle className="w-5 h-5 text-orange-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={!!loadingPlan}
                  className={`w-full py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : plan.name === 'Studio' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                >
                  {loadingPlan === plan.name ? <Loader2 className="w-5 h-5 animate-spin" /> : `Choose ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
