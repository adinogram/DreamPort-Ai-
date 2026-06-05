/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  Lightbulb,
  Coins,
  Target,
  Briefcase,
  Code2,
  Presentation,
  Megaphone,
  Lock,
  Unlock,
  BookOpen,
  Award,
  CheckCircle2,
  Wallet,
  Send,
  Plus,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Play,
  Sparkles,
  Layers,
  Activity,
  FileText,
  X,
  UserCheck,
  MessageSquare
} from "lucide-react";

import {
  StartupIdea,
  UserState,
  SystemAuditLogs,
  LearningCourse,
  DBState,
  Badge,
  DreamReport,
  ValidationReport,
  BusinessPlan,
  MVPBuilder,
  PitchDeck,
  MarketingPlan,
  FundingReport
} from "./types";

export default function App() {
  // Global State parsed from /api/db
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [userState, setUserState] = useState<UserState>({
    xp: 0,
    level: 1,
    earnedBadgeIds: [],
    walletConnected: false,
    walletAddress: null,
    walletType: null,
    balanceCUSD: 10.0,
    balanceCELO: 5.0,
    completedCourseIds: [],
  });
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogs[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected state
  const [activeTab, setActiveTab] = useState<"dashboard" | "dream" | "agents" | "marketplace" | "academy" | "celo">("dashboard");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>("");
  const [activeAgentModule, setActiveAgentModule] = useState<string>("validator");
  
  // Quiz and Course state
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeQuizQuestionIdx, setActiveQuizQuestionIdx] = useState<number>(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // Pitch Deck slides stepper
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);

  // Consult state (Premium agents chat)
  const [selectedMarketplaceAgent, setSelectedMarketplaceAgent] = useState<string>("Legal Expert");
  const [marketplaceMessage, setMarketplaceMessage] = useState<string>("");
  const [isConsulting, setIsConsulting] = useState<boolean>(false);

  // Forms State
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaIndustry, setNewIdeaIndustry] = useState("SaaS");
  const [newIdeaDesc, setNewIdeaDesc] = useState("");
  const [isCreatingIdea, setIsCreatingIdea] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Blockchain signing Modal Sim
  const [pendingUnlock, setPendingUnlock] = useState<{
    moduleKey: string;
    cost: number;
    currency: "cUSD" | "CELO";
    label: string;
  } | null>(null);
  const [isSigningTransaction, setIsSigningTransaction] = useState(false);

  // Load state from API
  const fetchState = async () => {
    try {
      const res = await fetch("/api/db");
      const data = await res.json();
      setIdeas(data.ideas || []);
      setUserState(data.userState || {
        xp: 150,
        level: 1,
        earnedBadgeIds: [],
        walletConnected: false,
        walletAddress: null,
        walletType: null,
        balanceCUSD: 10.0,
        balanceCELO: 5.0,
        completedCourseIds: [],
      });
      setAuditLogs(data.auditLogs || []);
      
      // Auto-select first idea if none is selected
      if (data.ideas && data.ideas.length > 0 && !selectedIdeaId) {
        setSelectedIdeaId(data.ideas[0].id);
      }
    } catch (e) {
      console.error("API Fetch Error, using client state", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle || !newIdeaDesc) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newIdeaTitle,
          industry: newIdeaIndustry,
          rawIdea: newIdeaDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewIdeaTitle("");
        setNewIdeaDesc("");
        setIsCreatingIdea(false);
        await fetchState();
        setSelectedIdeaId(data.idea.id);
        setActiveTab("dream");
      }
    } catch (err) {
      console.error("Failed to generate idea", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDB = async () => {
    if (!window.confirm("Verify: Reset all persistent startup architectures?")) return;
    setIsLoading(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      await fetchState();
      setSelectedIdeaId("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Reports
  const handleGenerateReport = async (moduleKey: string) => {
    if (!selectedIdeaId) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/ideas/${selectedIdeaId}/generate/${moduleKey}`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchState();
      } else {
        const errData = await res.json();
        alert(errData.error || "Generation error");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Simulate Celo Stablecoin Transaction signing
  const triggerUnlockRequest = (moduleKey: string, cost: number, currency: "cUSD" | "CELO", label: string) => {
    if (!userState.walletConnected) {
      alert("Please connect your wallet first in the Account panel!");
      setActiveTab("celo");
      return;
    }
    setPendingUnlock({ moduleKey, cost, currency, label });
  };

  const executeSigning = async () => {
    if (!pendingUnlock || !selectedIdeaId) return;
    setIsSigningTransaction(true);
    try {
      // Simulate on-chain delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const response = await fetch(`/api/ideas/${selectedIdeaId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleKey: pendingUnlock.moduleKey,
          cost: pendingUnlock.cost,
          currency: pendingUnlock.currency,
          txHash,
        }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        await fetchState();
        setPendingUnlock(null);
      }
    } catch (e) {
      console.error(e);
      alert("Web3 signing rejected or failed.");
    } finally {
      setIsSigningTransaction(false);
    }
  };

  const activeIdea = ideas.find((i) => i.id === selectedIdeaId);

  // Mock Modules prices
  const MODULE_METADATA: Record<string, { label: string; icon: any; cost: number; currency: "cUSD" | "CELO"; desc: string }> = {
    validator: { label: "Startup Validator", icon: ShieldCheck, cost: 0.2, currency: "cUSD", desc: "Perplexity-style web search, structured SWOT charts and VC viability scoring." },
    businessPlan: { label: "Business Planner", icon: Briefcase, cost: 0.5, currency: "cUSD", desc: "Operational roadmaps, financial tables, and interactive 3-year P&L bar charts." },
    mvp: { label: "MVP Specification", icon: Code2, cost: 0.4, currency: "cUSD", desc: "Tech stacks, visual API schemas, database CREATE scripts, and project timelines." },
    pitchDeck: { label: "Investor Pitch Deck", icon: Presentation, cost: 0.3, currency: "cUSD", desc: "Investor story builder accompanied by responsive visual slideshow frames." },
    marketing: { label: "Marketing Planner", icon: Megaphone, cost: 0.3, currency: "cUSD", desc: "Taglines, content calendars, keyword arrays, and standard growth campaign templates." },
    funding: { label: "Funding Catalyst", icon: Coins, cost: 0.4, currency: "cUSD", desc: "Grant trackers, standard outreach files, and fundraising runway milestones." },
  };

  // Learning Agent Static Courses
  const COURSES: LearningCourse[] = [
    {
      id: "course-1",
      title: "De-risking Clean Architecture",
      description: "Master fast iteration and SWOT indicators using automated agents.",
      difficulty: "Beginner",
      category: "Ideation",
      lessons: [
        { id: "c1-l1", title: "Idea Expansion vs. Scope Creep", content: "Successful operators isolate their core problem statement immediately. Guard against trying to launch secondary visuals, dashboards, or unrequested multiplayer suites at Day 1.", xpReward: 50 },
        { id: "c1-l2", title: "Decoding Market Validation Metrics", content: "VCs look for competitor share gaps. Leverage professional validation agents to outline concrete TAM frameworks instead of using fabricated mock spreadsheets.", xpReward: 50 },
      ],
      xpReward: 100,
      userChallenge: "Draft a literal human-centered problem statement representing standard consumer pain.",
      quiz: [
        {
          id: "q1-1",
          question: "What is the primary danger when prototyping a simple startup workspace?",
          options: [
            "Over-engineering secondary architectures and unsolicited visual tabs too early",
            "Not having enough complex smart contract parameters",
            "Relying solely on clean, robust off-white light styles",
            "Limiting content strictly to human interfaces"
          ],
          correctIndex: 0,
          explanation: "In startup validation, over-engineering unrequested visual components acts as a semantic trigger that generates technical baggage and reduces conversion speed.",
        }
      ]
    },
    {
      id: "course-2",
      title: "Stablecoin Micropayments with Celo",
      description: "Learn how MiniPay wallets optimize pay-as-you-go developer tools.",
      difficulty: "Intermediate",
      category: "Blockchain",
      lessons: [
        { id: "c2-l1", title: "The MiniPay Ecosystem", content: "MiniPay provides instant sub-cent transactions directly within popular mobile browsers, using Celo's ERC-20 stablecoins like cUSD and stable network blocks.", xpReward: 50 },
        { id: "c2-l2", title: "Signing Microtransactions securely", content: "By triggering small, on-demand payloads (e.g. 0.2 cUSD), founders bypass costly monthly SaaS subscriptions in favor of flexible, utility-based processing.", xpReward: 50 },
      ],
      xpReward: 100,
      userChallenge: "Simulate a 0.2 cUSD on-chain confirmation from a Celo transaction logs window.",
      quiz: [
        {
          id: "q2-1",
          question: "Which stable asset is primarily integrated within Celo's mobile MiniPay network?",
          options: [
            "cUSD (Celo Dollar)",
            "Wrapped Bitcoin",
            "Arbitrum tokens",
            "Ethereum mainnet gas credits"
          ],
          correctIndex: 0,
          explanation: "Celo's network utilizes native stable assets such as cUSD to maintain fast, low-gas micropayment operations for millions of mobile users worldwide.",
        }
      ]
    }
  ];

  const handleStartCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveQuizQuestionIdx(0);
    setSelectedQuizAnswer(null);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const handleSelectQuizAnswer = (idx: number) => {
    setSelectedQuizAnswer(idx);
  };

  const handleSubmitQuizAnswer = (course: LearningCourse) => {
    if (selectedQuizAnswer === null) return;
    const isCorrect = selectedQuizAnswer === course.quiz[activeQuizQuestionIdx].correctIndex;
    if (isCorrect) setQuizScore((prev) => prev + 1);
    
    if (activeQuizQuestionIdx + 1 < course.quiz.length) {
      setActiveQuizQuestionIdx((prev) => prev + 1);
      setSelectedQuizAnswer(null);
    } else {
      setQuizCompleted(true);
      // Give XP points on first completion!
      if (!userState.completedCourseIds.includes(course.id)) {
        const totalXPGained = course.xpReward + course.lessons.reduce((acc, l) => acc + l.xpReward, 0);
        const updatedCompleted = [...userState.completedCourseIds, course.id];
        const newXP = userState.xp + totalXPGained;
        const newLvl = Math.floor(newXP / 500) + 1;
        
        const newEarnedBadges = [...userState.earnedBadgeIds];
        if (!newEarnedBadges.includes("finance-whiz") && course.id === "course-1") {
          newEarnedBadges.push("finance-whiz");
        }

        const updatedUserState = {
          ...userState,
          xp: newXP,
          level: newLvl,
          completedCourseIds: updatedCompleted,
          earnedBadgeIds: newEarnedBadges,
        };

        setUserState(updatedUserState);
        
        // Push state update to server
        fetch("/api/user-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedUserState),
        }).then(() => fetchState());
      }
    }
  };

  // Add simulated funds to wallet
  const handleClaimFaucet = async () => {
    const updated = {
      ...userState,
      balanceCUSD: parseFloat((userState.balanceCUSD + 5.0).toFixed(2)),
      balanceCELO: parseFloat((userState.balanceCELO + 2.0).toFixed(2)),
    };
    setUserState(updated);
    await fetch("/api/user-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    fetchState();
  };

  const handleToggleWallet = async () => {
    const updated = {
      ...userState,
      walletConnected: !userState.walletConnected,
      walletAddress: !userState.walletConnected ? "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" : null,
      walletType: !userState.walletConnected ? "minipay" : null,
    };
    setUserState(updated);
    await fetch("/api/user-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    fetchState();
  };

  // Premium Marketplace consultations
  const handleSendMarketplaceChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketplaceMessage || !activeIdea || isConsulting) return;
    
    const userMsg = marketplaceMessage;
    setMarketplaceMessage("");
    setIsConsulting(true);

    try {
      const res = await fetch(`/api/ideas/${selectedIdeaId}/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedMarketplaceAgent,
          userMessage: userMsg,
        }),
      });
      if (res.ok) {
        await fetchState();
      } else {
        const d = await res.json();
        alert(d.error || "Consultation locked. Purchase in AI Workplace or Marketplace first.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsConsulting(false);
    }
  };

  const handlePurchaseMarketplaceAgent = async (agentName: string) => {
    if (!activeIdea) return;
    const cost = 0.3;
    triggerUnlockRequest(agentName, cost, "cUSD", `${agentName} Consultation Agent`);
  };

  return (
    <div id="dreamport-app-root" className="flex h-screen w-full bg-[#030712] text-white font-sans overflow-hidden relative">
      
      {/* Sleek Mesh Gradient Blurs */}
      <div className="absolute top-[-100px] left-[-150px] w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[550px] h-[550px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-white/5 backdrop-blur-2xl flex flex-col z-20 shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">DreamPort <span className="text-cyan-400">AI</span></span>
        </div>

        <div className="p-4">
          <button
            onClick={() => setIsCreatingIdea(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 active:scale-[0.98] rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/15"
          >
            <Plus className="w-4 h-4" /> Incubate New Idea
          </button>
        </div>

        {/* Startup Selector */}
        <div className="px-4 pb-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Venture Context</label>
          <div className="relative mt-1">
            <select
              value={selectedIdeaId}
              onChange={(e) => setSelectedIdeaId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="" disabled className="bg-slate-900">Select active startup...</option>
              {ideas.map((idea) => (
                <option key={idea.id} value={idea.id} className="bg-slate-900">
                  ⚡ {idea.title} ({idea.industry})
                </option>
              ))}
            </select>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2">Workspace Hub</div>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "dashboard" ? "bg-white/10 text-white border-l-2 border-cyan-400 font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Founder Dashboard</span>
          </button>

          <button
            onClick={() => {
              if (!activeIdea) {
                alert("Please incubate or select a startup idea context first!");
                setIsCreatingIdea(true);
                return;
              }
              setActiveTab("dream");
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "dream" ? "bg-white/10 text-white border-l-2 border-cyan-400 font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span>Dream Agent (Free)</span>
          </button>

          <button
            onClick={() => {
              if (!activeIdea) {
                alert("Please incubate or select a startup idea context first!");
                setIsCreatingIdea(true);
                return;
              }
              setActiveTab("agents");
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "agents" ? "bg-white/10 text-white border-l-2 border-cyan-400 font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>AI Workplace (Premium)</span>
          </button>

          <button
            onClick={() => {
              if (!activeIdea) {
                alert("Please incubate or select a startup idea context first!");
                setIsCreatingIdea(true);
                return;
              }
              setActiveTab("marketplace");
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "marketplace" ? "bg-white/10 text-white border-l-2 border-cyan-400 font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Consulting Agents</span>
          </button>

          <div className="pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2">Education & Ledger</div>
          <button
            onClick={() => setActiveTab("academy")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "academy" ? "bg-white/10 text-white border-l-2 border-cyan-400 font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span>Founder Academy</span>
          </button>

          <button
            onClick={() => setActiveTab("celo")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "celo" ? "bg-white/10 text-white border-l-2 border-cyan-400 font-bold" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Wallet className="w-4 h-4 text-yellow-500" />
            <span>Celo Wallet Sandbox</span>
          </button>
        </nav>

        {/* Founder XP Badge Panel */}
        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level Progress</span>
              <span className="text-xs font-bold text-white bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30">LVL {userState.level}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (userState.xp % 500) / 5)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
              <span>{userState.xp % 500} / 500 XP</span>
              <span className="text-[9px] font-mono text-cyan-400">TOTAL: {userState.xp} XP</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-white/[0.01]">
        
        {/* Header Ribbon */}
        <header className="h-16 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900/60 rounded-full px-4 py-1 flex items-center gap-2 border border-white/10 text-xs">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-slate-300">
                Active: <span className="font-semibold text-white">{activeIdea ? activeIdea.title : "None Selected"}</span>
              </span>
            </div>
          </div>

          {/* Wallet status */}
          <div className="flex items-center gap-3">
            {userState.walletConnected ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="font-mono text-slate-300 text-[11px] font-semibold">
                  {userState.walletAddress?.slice(0, 6)}...{userState.walletAddress?.slice(-4)}
                </span>
                <div className="w-px h-3 bg-white/15"></div>
                <span className="font-bold text-emerald-400 font-mono">{userState.balanceCUSD} cUSD</span>
              </div>
            ) : (
              <button
                onClick={handleToggleWallet}
                className="bg-white/5 hover:bg-white/10 hover:border-white/20 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold transition-all text-slate-300"
              >
                Connect Celo Wallet
              </button>
            )}

            <button
              onClick={handleClaimFaucet}
              disabled={!userState.walletConnected}
              className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 disabled:opacity-50 disabled:pointer-events-none active:scale-95 border border-yellow-500/20 rounded-full text-[10px] font-bold text-yellow-500 transition-all flex items-center gap-1"
              title="Add simulated Celo testnet assets to your connected wallet"
            >
              <Coins className="w-3 h-3" /> Faucet
            </button>
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-8 relative">

          {/* 1. FOUNDER DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-white">Hello, Entrepreneur.</h1>
                  <p className="text-slate-400 text-sm">Empower your venture using on-demand intelligence agents, local storage states, and MiniPay-ready assets.</p>
                </div>
                <button
                  onClick={handleResetDB}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[10px] font-mono tracking-wider uppercase transition-all"
                >
                  Reset Framework Data
                </button>
              </div>

              {/* Dynamic Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-md">
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Ideas Registered</div>
                  <div className="text-3xl font-extrabold text-white">{ideas.length}</div>
                  <div className="text-[10px] text-slate-400 mt-2">Durable JSON local files</div>
                </div>

                <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-md">
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Wallet Connected</div>
                  <div className="text-3xl font-extrabold text-white">{userState.walletConnected ? "CONNECTED" : "DISCONNECT"}</div>
                  <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 text-cyan-400">
                    <Wallet className="w-3 h-3" /> {userState.walletType ? `Mock ${userState.walletType}` : "None"}
                  </div>
                </div>

                <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-md">
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Academy Progress</div>
                  <div className="text-3xl font-extrabold text-white">{userState.completedCourseIds.length} / 2</div>
                  <div className="text-[10px] text-slate-400 mt-2">Courses complete for badges</div>
                </div>

                <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-5 backdrop-blur-sm shadow-md">
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Estimated Valuation</div>
                  <div className="text-3xl font-extrabold text-white font-mono">${(ideas.length * 15000 + userState.xp * 100).toLocaleString()}</div>
                  <div className="text-[10px] opacity-70 text-cyan-400 mt-2">Calculated startup asset value</div>
                </div>
              </div>

              {/* Startup Selection Overlay Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Active startup Summary */}
                <div className="lg:col-span-2 space-y-6">
                  {activeIdea ? (
                    <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20">{activeIdea.industry}</span>
                          <h3 className="text-2xl font-bold mt-2 text-white">{activeIdea.title}</h3>
                          <p className="text-slate-400 text-xs mt-1 italic">"{activeIdea.rawIdea}"</p>
                        </div>
                      </div>

                      <div className="w-full h-px bg-white/5 my-4"></div>

                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Operating Roadmap Progress</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          onClick={() => setActiveTab("dream")}
                          className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl transition-all text-left"
                        >
                          <div className="text-slate-400 text-[10px] font-medium">1. Incubator</div>
                          <div className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                            {activeIdea.dreamReport ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>}
                            <span>Dream</span>
                          </div>
                        </button>

                        <button
                          onClick={() => { setActiveTab("agents"); setActiveAgentModule("validator"); }}
                          className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl transition-all text-left"
                        >
                          <div className="text-slate-400 text-[10px] font-medium">2. Validation SWOT</div>
                          <div className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                            {activeIdea.validationReport ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : (activeIdea.premiumUnlocked.validator ? <Lock className="w-3.5 h-3.5 text-yellow-500" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />)}
                            <span>Competitors</span>
                          </div>
                        </button>

                        <button
                          onClick={() => { setActiveTab("agents"); setActiveAgentModule("businessPlan"); }}
                          className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl transition-all text-left"
                        >
                          <div className="text-slate-400 text-[10px] font-medium">3. Projections Plan</div>
                          <div className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                            {activeIdea.businessPlan ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : (activeIdea.premiumUnlocked.businessPlan ? <Lock className="w-3.5 h-3.5 text-yellow-500" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />)}
                            <span>Finance P&L</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/[0.04] border border-dashed border-white/15 rounded-2xl p-12 text-center">
                      <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white">No active startup currently configured</h3>
                      <p className="text-slate-400 text-xs max-w-sm mx-auto mt-2">Generate your very first concept document to unlock the automated operating agents.</p>
                      <button
                        onClick={() => setIsCreatingIdea(true)}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl text-xs font-bold font-semibold text-white transition-all shadow-md active:scale-95"
                      >
                        Launch First Incubator
                      </button>
                    </div>
                  )}

                  {/* Audit Logs list */}
                  <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">On-Chain & System Activity Logs</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {auditLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="text-stone-300 font-medium">{log.action}</div>
                            <div className="text-[10px] text-stone-500 mt-1">{new Date(log.timestamp).toLocaleTimeString() || "Pending block"}</div>
                          </div>
                          <div className="text-right">
                            {log.amount && (
                              <span className="font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded font-mono text-[10px]">
                                -{log.amount} {log.currency}
                              </span>
                            )}
                            {log.txHash && (
                              <a
                                href={`https://celoscan.io/tx/${log.txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] font-mono block text-amber-500 hover:underline mt-1"
                              >
                                {log.txHash.substring(0, 10)}...
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {auditLogs.length === 0 && <div className="text-slate-500 italic text-center py-4">No logged operations.</div>}
                    </div>
                  </div>
                </div>

                {/* Badges Panel */}
                <div className="space-y-6">
                  <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Makers Achievements</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {DEFAULT_BADGES.map((b) => {
                        const earned = userState.earnedBadgeIds.includes(b.id);
                        return (
                          <div
                            key={b.id}
                            className={`p-3 rounded-xl border flex flex-col items-center text-center relative transition-all ${
                              earned
                                ? "bg-cyan-950/20 border-cyan-500/20 text-white"
                                : "bg-black/25 border-white/5 text-slate-500 grayscale opacity-40"
                            }`}
                            title={b.description}
                          >
                            <Award className={`w-8 h-8 mb-1.5 ${earned ? "text-cyan-400 animate-pulse" : "text-slate-500"}`} />
                            <div className="text-[10px] font-bold tracking-tight">{b.name}</div>
                            {earned && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Micro-Payments Pricing Helper widget */}
                  <div className="bg-gradient-to-br from-indigo-950/20 to-cyan-950/10 border border-indigo-500/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Stablecoin Micropayments</h4>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        DreamPort actions use direct on-chain stable payments via the Celo Network. Connect MetaMask, miniPay, or Valora to seamlessly pay as you go.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. DREAM AGENT */}
          {activeTab === "dream" && activeIdea && (
            <div className="space-y-8 animate-fade-in text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">MODULE ONE • Incubator</span>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Dream Agent Incubator</h1>
                  <p className="text-slate-400 text-sm mt-1">Transform crude business descriptions into formal startup opportunity blueprints.</p>
                </div>
                <div className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold tracking-wider rounded border border-cyan-500/20 uppercase">
                  FREE TIER
                </div>
              </div>

              {/* Formulation Box */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white/[0.04] border border-white/5 rounded-2xl p-6 backdrop-blur-sm h-fit">
                  <h3 className="font-bold text-white mb-2">Raw Startup Input</h3>
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl mb-4">
                    <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">"{activeIdea.rawIdea}"</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Industry:</span>
                      <span className="text-slate-300 font-semibold">{activeIdea.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Config:</span>
                      <span className="text-slate-300 font-semibold">Gemini 3.5 Flash</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGenerateReport("dream")}
                    disabled={isGenerating}
                    className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50 active:scale-[0.98] rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {activeIdea.dreamReport ? "Re-Incubate Concept" : "Incubate Opportunity"}
                  </button>
                </div>

                {/* Output Dream Opportunity */}
                <div className="lg:col-span-2 space-y-6">
                  {isGenerating ? (
                    <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                      <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h4 className="font-bold text-stone-200">Processing Idea Formulation...</h4>
                      <p className="text-slate-500 text-xs max-w-sm mt-1">Structured templates are generated using real-time generative models on Gemini.</p>
                    </div>
                  ) : activeIdea.dreamReport ? (
                    <div className="space-y-6">
                      <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                        <h3 className="text-lg font-bold text-white mb-4">Generative Business Analysis</h3>
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">The Core Problem</span>
                            <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">{activeIdea.dreamReport.problemStatement}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Market TAM Opportunity</span>
                            <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">{activeIdea.dreamReport.marketOpportunity}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Target Customer Audience</span>
                            <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">{activeIdea.dreamReport.targetAudience}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Structured Monetization Strategy</span>
                            <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">{activeIdea.dreamReport.businessModel}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-950/10 border border-red-500/10 rounded-2xl p-5">
                          <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-mono mb-2">Primary Risk Risks</h4>
                          <ul className="space-y-1.5">
                            {activeIdea.dreamReport.risks.map((r, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span> <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-cyan-950/10 border border-cyan-500/10 rounded-2xl p-5">
                          <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono mb-2">Actionable Next Steps</h4>
                          <ul className="space-y-1.5">
                            {activeIdea.dreamReport.nextSteps.map((s, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-cyan-400 mt-0.5">→</span> <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/[0.04] border border-dashed border-white/10 rounded-2xl p-16 text-center">
                      <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-bounce" />
                      <h4 className="text-base font-bold text-slate-300">Awaiting Concept Incubation</h4>
                      <p className="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto">Click 'Incubate Opportunity' to let Gemini transform your initial concept parameters.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. PREMIUM AGENTS WORKPLACE */}
          {activeTab === "agents" && activeIdea && (
            <div className="space-y-8 animate-fade-in text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">MODULE TWO • Venture Intelligence Studio</span>
                  <h1 className="text-3xl font-extrabold text-white mt-1">AI Workplace</h1>
                  <p className="text-slate-400 text-sm mt-1">Utilize stable micropayments on Celo to generate advanced financial, technical and strategic documents.</p>
                </div>
              </div>

              {/* Sub Navigation tabs */}
              <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl w-fit gap-1 overflow-x-auto">
                {Object.entries(MODULE_METADATA).map(([key, meta]) => {
                  const Icon = meta.icon;
                  const unlocked = activeIdea.premiumUnlocked[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveAgentModule(key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        activeAgentModule === key ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-stone-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{meta.label}</span>
                      {unlocked ? (
                        <span className="text-[8px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded uppercase font-bold border border-green-500/20">Unlocked</span>
                      ) : (
                        <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded font-mono font-bold border border-yellow-500/20">{meta.cost} cUSD</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Locked/Unlocked Logic Container */}
              {(() => {
                const meta = MODULE_METADATA[activeAgentModule];
                const activeModuleUnlocked = activeIdea.premiumUnlocked[activeAgentModule];
                const currentReportData =
                  activeAgentModule === "validator"
                    ? activeIdea.validationReport
                    : activeAgentModule === "businessPlan"
                    ? activeIdea.businessPlan
                    : activeAgentModule === "mvp"
                    ? activeIdea.mvpBuilder
                    : activeAgentModule === "pitchDeck"
                    ? activeIdea.pitchDeck
                    : activeAgentModule === "marketing"
                    ? activeIdea.marketingPlan
                    : activeIdea.fundingReport;

                if (!activeModuleUnlocked) {
                  return (
                    <div className="bg-gradient-to-br from-[#0c0f1d] to-[#04060f] border border-white/10 rounded-2xl p-12 text-center max-w-2xl mx-auto relative overflow-hidden shadow-2xl animate-fade-in">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
                      <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mx-auto mb-6">
                        <Lock className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-extrabold text-white">Unlock premium {meta?.label} Agent</h3>
                      <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                        {meta?.desc}
                      </p>

                      <div className="flex bg-black/40 border border-white/5 rounded-xl p-4 w-fit mx-auto gap-12 mt-6">
                        <div className="text-left">
                          <div className="text-slate-500 text-[10px] tracking-wider uppercase font-bold">Pricing</div>
                          <div className="text-2xl font-black font-semibold text-white mt-1">
                            {meta?.cost} <span className="text-indigo-400 text-xs font-bold">{meta?.currency}</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-slate-500 text-[10px] tracking-wider uppercase font-bold">Network fee</div>
                          <div className="text-2xl font-black font-semibold text-white mt-1">
                            &lt;0.001 <span className="text-green-400 text-xs font-bold">CELO</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-center gap-4 mt-8">
                        <button
                          onClick={() => triggerUnlockRequest(activeAgentModule, meta!.cost, meta!.currency, meta!.label)}
                          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 rounded-xl text-xs font-bold font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2"
                        >
                          <Wallet className="w-4 h-4" /> Authorize Micropayment
                        </button>
                      </div>
                    </div>
                  );
                }

                // UNLOCKED STATE
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
                    
                    {/* Run action controls */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 backdrop-blur-sm h-fit">
                        <h3 className="text-sm font-bold text-white mb-1">{meta?.label} Status</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                          On-chain micropayment completed! Your business context is securely prepared for agent logic execution.
                        </p>
                        <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl mb-4">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Contract Active
                          </div>
                          <div className="text-[9px] font-mono mt-1 text-slate-500 overflow-hidden text-ellipsis">cUSD Sign-Key Activated</div>
                        </div>

                        <button
                          onClick={() => handleGenerateReport(activeAgentModule)}
                          disabled={isGenerating}
                          className="w-full mt-2 py-2 w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50 active:scale-95 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {currentReportData ? "Update Document Data" : "Initiate System Compiler"}
                        </button>
                      </div>
                    </div>

                    {/* Report Output visualization panel */}
                    <div className="lg:col-span-3">
                      {isGenerating ? (
                        <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
                          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                          <h4 className="font-bold text-stone-200">Executing Deep Generative Pipeline...</h4>
                          <p className="text-slate-500 text-xs mt-1.5 max-w-sm">The model is structure-indexing comparative SWOT charts and financial projection sheets.</p>
                        </div>
                      ) : currentReportData ? (
                        <div className="space-y-6">

                          {/* DYNAMIC COMPONENT DISPLAY BASED ON ACTIVE TAB */}
                          
                          {/* A. STARTUP VALIDATOR REPORT */}
                          {activeAgentModule === "validator" && (() => {
                            const val = currentReportData as ValidationReport;
                            return (
                              <div className="space-y-6 animate-fade-in">
                                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                                  <h3 className="text-lg font-bold mb-4">Validation Dashboard Index</h3>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Viability Score</div>
                                      <div className="text-3xl font-mono text-cyan-400 font-black mt-1">{val.score}/100</div>
                                    </div>
                                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Market Size Index</div>
                                      <div className="text-3xl font-mono text-cyan-400 font-black mt-1">{val.marketScore}/100</div>
                                    </div>
                                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Competition Score</div>
                                      <div className="text-3xl font-mono text-cyan-400 font-black mt-1">{val.competitionScore}/100</div>
                                    </div>
                                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Success Chance</div>
                                      <div className="text-3xl font-mono text-green-400 font-black mt-1">{val.successProbability}%</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-white/[0.04] p-5 border border-white/5 rounded-2xl">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Target Profile Personas</h4>
                                    <div className="space-y-2 text-xs">
                                      <div><span className="text-slate-500">Representative Name:</span> <span className="font-semibold text-white">{val.customerPersona?.name}</span></div>
                                      <div><span className="text-slate-500">Professional Role:</span> <span className="text-white">{val.customerPersona?.role}</span></div>
                                      <div><span className="text-slate-500">Demographics:</span> <span className="text-stone-300">{val.customerPersona?.demographics}</span></div>
                                      <div className="mt-2"><span className="text-slate-500 block mb-1">Observed Pinpoints:</span></div>
                                      <ul className="space-y-1 pl-3 list-disc text-stone-300">
                                        {val.customerPersona?.painPoints?.map((p, i) => <li key={i}>{p}</li>)}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="bg-white/[0.04] p-5 border border-white/5 rounded-2xl">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Observed Competitors</h4>
                                    <div className="space-y-3">
                                      {val.competitors?.map((comp, idx) => (
                                        <div key={idx} className="p-3 bg-black/30 border border-white/5 rounded-xl text-xs">
                                          <div className="flex justify-between font-bold">
                                            <span className="text-cyan-400">{comp.name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">Share: {comp.marketShare}</span>
                                          </div>
                                          <div className="text-[11px] text-stone-300 mt-1"><span className="text-green-400 font-bold">Strength:</span> {comp.strengths}</div>
                                          <div className="text-[11px] text-stone-300"><span className="text-red-400 font-bold">Friction:</span> {comp.weaknesses}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-6">
                                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Core SWOT Vectors</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl">
                                      <div className="text-[10px] text-emerald-400 font-bold uppercase font-mono">Strengths</div>
                                      <ul className="space-y-1 mt-2 text-xs text-stone-300 pl-2 list-disc">
                                        {val.swot?.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                                      </ul>
                                    </div>
                                    <div className="p-4 bg-red-950/10 border border-red-500/10 rounded-xl">
                                      <div className="text-[10px] text-red-400 font-bold uppercase font-mono">Weaknesses</div>
                                      <ul className="space-y-1 mt-2 text-xs text-stone-300 pl-2 list-disc">
                                        {val.swot?.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                                      </ul>
                                    </div>
                                    <div className="p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-xl">
                                      <div className="text-[10px] text-cyan-400 font-bold uppercase font-mono">Opportunities</div>
                                      <ul className="space-y-1 mt-2 text-xs text-stone-300 pl-2 list-disc">
                                        {val.swot?.opportunities?.map((o, i) => <li key={i}>{o}</li>)}
                                      </ul>
                                    </div>
                                    <div className="p-4 bg-orange-950/10 border border-orange-500/10 rounded-xl">
                                      <div className="text-[10px] text-orange-400 font-bold uppercase font-mono">Threats</div>
                                      <ul className="space-y-1 mt-2 text-xs text-stone-300 pl-2 list-disc">
                                        {val.swot?.threats?.map((t, i) => <li key={i}>{t}</li>)}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* B. BUSINESS PLAN COMPONENT */}
                          {activeAgentModule === "businessPlan" && (() => {
                            const bp = currentReportData as BusinessPlan;
                            return (
                              <div className="space-y-6 animate-fade-in">
                                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                                  <h3 className="text-lg font-bold mb-2">Executive Summary Strategy</h3>
                                  <p className="text-xs text-stone-300 leading-relaxed font-mono whitespace-pre-wrap">{bp.executiveSummary}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-5">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Product Strategy Detail</h4>
                                    <p className="text-xs text-stone-300 leading-relaxed">{bp.productStrategy}</p>
                                  </div>
                                  <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-5">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-semibold">GTM Roadmaps</h4>
                                    <p className="text-xs text-stone-300 leading-relaxed">{bp.marketStrategy}</p>
                                  </div>
                                </div>

                                {/* Financial section and styled CSS Projection charts */}
                                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Interactive 3-Year Projection Models</h4>
                                  
                                  {/* styled custom CSS bar projection comparisons */}
                                  <div className="space-y-4">
                                    {[bp.financialProjections?.year1, bp.financialProjections?.year2, bp.financialProjections?.year3].map((yr) => {
                                      if (!yr) return null;
                                      const rev = yr.revenue || 120000;
                                      const exp = yr.expenses || 70000;
                                      const maxVal = Math.max(bp.financialProjections?.year3?.revenue || 900000, 100000);
                                      return (
                                        <div key={yr.year} className="p-3 bg-black/40 border border-white/5 rounded-xl">
                                          <div className="flex justify-between items-center mb-1 text-xs">
                                            <span className="font-bold text-stone-200">Year {yr.year} Projections</span>
                                            <span className="text-stone-400 font-mono">
                                              REV: <span className="text-green-400 font-bold">${rev.toLocaleString()}</span> | 
                                              EXP: <span className="text-red-400">${exp.toLocaleString()}</span>
                                            </span>
                                          </div>
                                          {/* Visual Bars overlay */}
                                          <div className="space-y-1.5 mt-2">
                                            {/* Revenue Bar */}
                                            <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-mono text-slate-500 w-8">REV</span>
                                              <div className="flex-1 bg-slate-800 h-2.5 rounded overflow-hidden">
                                                <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-full rounded" style={{ width: `${(rev / maxVal) * 100}%` }}></div>
                                              </div>
                                            </div>
                                            {/* Expenses Bar */}
                                            <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-mono text-slate-500 w-8">EXP</span>
                                              <div className="flex-1 bg-slate-800 h-2.5 rounded overflow-hidden">
                                                <div className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded" style={{ width: `${(exp / maxVal) * 100}%` }}></div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="grid grid-cols-3 gap-4 mt-6">
                                    <div className="bg-black/30 border border-white/5 p-3 rounded-xl text-center">
                                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Base Boot-up costs</div>
                                      <div className="text-lg font-extrabold text-white font-mono mt-1">${bp.financialProjections?.startCost?.toLocaleString() || "12,000"}</div>
                                    </div>
                                    <div className="bg-black/30 border border-white/5 p-3 rounded-xl text-center">
                                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Break-Even point</div>
                                      <div className="text-lg font-extrabold text-white font-mono mt-1">{bp.financialProjections?.breakEvenMonths || 6} Months</div>
                                    </div>
                                    <div className="bg-cyan-950/20 border border-cyan-800/30 p-3 rounded-xl text-center">
                                      <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Net Yr 3 Cashflow</div>
                                      <div className="text-lg font-extrabold text-emerald-400 font-mono mt-1">${(bp.financialProjections?.year3?.netProfit || bp.financialProjections?.year3?.revenue - bp.financialProjections?.year3?.expenses).toLocaleString()}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* C. MVP BUILDER SPECIFICATIONS */}
                          {activeAgentModule === "mvp" && (() => {
                            const mvp = currentReportData as MVPBuilder;
                            return (
                              <div className="space-y-6 animate-fade-in text-white">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-5 md:col-span-1">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Architectural Stacks</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {mvp.techSpecs?.stack?.map((stk, idx) => (
                                        <span key={idx} className="bg-slate-800 border border-white/5 py-1 px-2.5 rounded-lg text-xs font-mono font-medium text-slate-300">{stk}</span>
                                      ))}
                                    </div>
                                    <div className="mt-4">
                                      <span className="text-[10px] text-slate-500 font-bold block mb-1">CTO Requirements</span>
                                      <ul className="space-y-1 text-xs text-stone-300">
                                        {mvp.techSpecs?.keyRequirements?.map((rq, idx) => <li key={idx}>• {rq}</li>)}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-5 md:col-span-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-semibold">Microservices Schema Model</h4>
                                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                                      <p className="text-xs text-cyan-400 leading-relaxed font-mono whitespace-pre-wrap">{mvp.architecture}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Click to copy DB script container */}
                                <div className="bg-[#0c0f1d] border border-indigo-500/20 rounded-2xl p-6 relative">
                                  <div className="absolute right-4 top-4 text-[10px] font-mono text-slate-500">PostgreSQL Schema</div>
                                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 font-semibold">PostgreSQL Relational DB Script</h4>
                                  <pre className="p-4 bg-black rounded-xl text-xs font-mono text-emerald-400 border border-white/5 overflow-x-auto whitespace-pre-wrap">
                                    {mvp.databaseSchema || `CREATE TABLE ideas (\n  id SERIAL PRIMARY KEY,\n  title VARCHAR(128),\n  raw_concept TEXT\n);`}
                                  </pre>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(mvp.databaseSchema);
                                      alert("Copied database schema script to clipboard!");
                                    }}
                                    className="mt-3 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-[10px] font-bold text-indigo-400 border border-indigo-500/20 transition-colors"
                                  >
                                    Copy Script Payload
                                  </button>
                                </div>

                                <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-6">
                                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 font-semibold font-mono">Express REST Endpoint specifications</h4>
                                  <div className="space-y-2">
                                    {mvp.apiDocs?.map((api, k) => (
                                      <div key={k} className="p-3 bg-black/40 border border-white/5 rounded-xl text-xs flex justify-between items-center">
                                        <div>
                                          <span className="font-bold font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded mr-3">
                                            {api.method}
                                          </span>
                                          <span className="font-mono text-stone-300 font-semibold">{api.endpoint}</span>
                                          <div className="text-[11px] text-slate-500 mt-1">{api.description}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* D. Pitch Deck Interactive Slides Slider */}
                          {activeAgentModule === "pitchDeck" && (() => {
                            const pd = currentReportData as PitchDeck;
                            if (!pd.slides || pd.slides.length === 0) return <div className="text-slate-400">Blank report. Regenerate.</div>;
                            const activeSlide = pd.slides[activeSlideIdx] || pd.slides[0];
                            return (
                              <div className="space-y-6 animate-fade-in text-white">
                                <div className="bg-white/[0.04] p-5 border border-white/5 rounded-2xl">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Company Narrative</h4>
                                  <p className="text-xs text-stone-300 italic">{pd.story}</p>
                                </div>

                                {/* Presentational Slide Frame */}
                                <div className="bg-slate-900 border-2 border-cyan-500/30 aspect-video rounded-2xl p-8 flex flex-col justify-between relative shadow-lg">
                                  <div className="absolute right-4 top-4 text-[10px] text-cyan-500/60 font-mono font-bold">SLIDE {activeSlideIdx + 1} OF {pd.slides.length}</div>
                                  <div>
                                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">DREAMPORT PRESENTATIVE BLUEPRINT</div>
                                    <h2 className="text-2xl font-black mt-2 text-white">{activeSlide.title}</h2>
                                    <h4 className="text-xs text-slate-400 font-medium italic mt-1">{activeSlide.subtitle}</h4>
                                  </div>

                                  <div className="my-4">
                                    <ul className="space-y-2">
                                      {activeSlide.points?.map((pt, idx) => (
                                        <li key={idx} className="text-xs text-stone-300 flex items-start gap-2">
                                          <span className="text-cyan-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                                          <span>{pt}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="text-[9px] text-slate-500 italic flex justify-between uppercase mt-4">
                                    <span>Venture Target: {activeIdea.title}</span>
                                    <span>Visual cue: {activeSlide.visualPrompt || "Cinematic interface design element"}</span>
                                  </div>
                                </div>

                                {/* Pagination controller */}
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => setActiveSlideIdx((prev) => Math.max(0, prev - 1))}
                                    disabled={activeSlideIdx === 0}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-xs transition-all font-bold"
                                  >
                                    Previous Frame
                                  </button>
                                  <div className="flex gap-1.5">
                                    {pd.slides.map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-2.5 h-2.5 rounded-full ${i === activeSlideIdx ? "bg-cyan-400" : "bg-slate-700"}`}
                                      ></div>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => setActiveSlideIdx((prev) => Math.min(pd.slides.length - 1, prev + 1))}
                                    disabled={activeSlideIdx === pd.slides.length - 1}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-xs transition-all font-bold"
                                  >
                                    Next Frame
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* E. MARKETING COMPONENT */}
                          {activeAgentModule === "marketing" && (() => {
                            const mkt = currentReportData as MarketingPlan;
                            return (
                              <div className="space-y-6 animate-fade-in text-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-white/[0.04] border border-white/5 p-5 rounded-2xl">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Palette & Brand Attributes</h4>
                                    <div className="space-y-2 mt-1">
                                      <div><span className="text-[10px] text-slate-500 uppercase font-bold">Tagline:</span> <span className="text-xs font-semibold block italic">"{mkt.brandIdentity?.tagline}"</span></div>
                                      <div className="mt-2"><span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Color Palette (Click copies):</span></div>
                                      <div className="flex gap-2">
                                        {mkt.brandIdentity?.colors?.map((col, k) => (
                                          <div
                                            key={k}
                                            onClick={() => {
                                              navigator.clipboard.writeText(col);
                                              alert(`Copied hex value: "${col}"`);
                                            }}
                                            className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-[9px] font-mono text-slate-300 hover:border-cyan-500/40 cursor-pointer"
                                          >
                                            🎨 {col}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white/[0.04] border border-white/5 p-5 rounded-2xl">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-semibold">Ad campaign outline</h4>
                                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-xs">
                                      <div className="font-bold text-cyan-400 font-mono">{mkt.adCampaign?.name} ({mkt.adCampaign?.platform})</div>
                                      <div className="text-stone-300 mt-1 leading-relaxed">"{mkt.adCampaign?.copy}"</div>
                                      <div className="text-[10px] text-slate-500 mt-2 font-semibold">Budget Limit: {mkt.adCampaign?.estimatedBudget || "0.2 cUSD test"}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">Observed Keywords list</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {mkt.seoKeywords?.map((kw, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-slate-800/80 border border-white/5 text-[10px] rounded font-mono text-slate-400">#{kw}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* F. FUNDING AND GRANTS */}
                          {activeAgentModule === "funding" && (() => {
                            const fun = currentReportData as FundingReport;
                            return (
                              <div className="space-y-6 animate-fade-in text-white">
                                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Discovered Celo & AI Grant Pools</h3>
                                  <div className="space-y-3">
                                    {fun.discoveredGrants?.map((g, idx) => (
                                      <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs flex justify-between items-start">
                                        <div>
                                          <div className="font-bold text-cyan-400 text-sm">{g.name}</div>
                                          <div className="text-stone-400 text-[10px] mt-1"><span className="text-slate-500 font-bold block">Eligibility:</span> {g.eligibility}</div>
                                        </div>
                                        <div className="text-right">
                                          <span className="font-bold text-green-400 font-mono text-sm block">{g.amount}</span>
                                          <span className="text-[9px] text-slate-500 block mt-1">Deadline: {g.deadline}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-5">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-semibold">Investor Segment outreach Strategy</h4>
                                  <p className="text-xs text-stone-300 leading-relaxed font-mono whitespace-pre-wrap">{fun.outreachPlan?.pitchStrategy}</p>
                                </div>
                              </div>
                            );
                          })()}

                        </div>
                      ) : (
                        <div className="bg-white/[0.04] border border-dashed border-white/10 rounded-2xl p-16 text-center">
                          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-pulse" />
                          <h4 className="text-base font-bold text-slate-300">Awaiting Compilation</h4>
                          <p className="text-slate-500 text-xs mt-1.5 max-w-sm mx-auto">Click 'Initiate System Compiler' to execute our specialized neural model templates onto this module.</p>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}
            </div>
          )}

          {/* 4. AI AGENT MARKETPLACE */}
          {activeTab === "marketplace" && activeIdea && (
            <div className="space-y-8 animate-fade-in text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">PREMIUM PLUGINS • Consultation Hub</span>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Consulting Agents Marketplace</h1>
                  <p className="text-slate-400 text-sm mt-1">Acquire permanent consultation templates of specialized advisor profiles for your venture project.</p>
                </div>
              </div>

              {/* Grid of Custom Premium Agents available */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Legal Expert", role: "Venture incorporation, SAFT structures & stable assets setup.", unlockedKey: "Legal Expert" },
                  { name: "Growth Specialist", role: "Viral loops, programmatic hashtags calendars, and product hunt campaigns.", unlockedKey: "Growth Specialist" },
                  { name: "Product Manager", role: "Backlog prioritizations, technical agile epics design, and roadmap blocks.", unlockedKey: "Product Manager" },
                ].map((pagent) => {
                  const alreadyUnlocked = activeIdea.unlockedPremiumAgents?.includes(pagent.unlockedKey);
                  return (
                    <div
                      key={pagent.name}
                      onClick={() => {
                        if (alreadyUnlocked) setSelectedMarketplaceAgent(pagent.name);
                      }}
                      className={`p-5 rounded-2xl border backdrop-blur-sm relative transition-all ${
                        selectedMarketplaceAgent === pagent.name && alreadyUnlocked
                          ? "bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-500/5 cursor-pointer"
                          : alreadyUnlocked
                          ? "bg-white/[0.04] border-white/5 hover:border-white/15 cursor-pointer text-slate-300"
                          : "bg-black/40 border-white/5 opacity-80"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-md">{pagent.name}</h4>
                        {alreadyUnlocked ? (
                          <span className="text-[8px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 uppercase font-black font-semibold">Unlocked</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePurchaseMarketplaceAgent(pagent.unlockedKey); }}
                            className="text-[9px] bg-yellow-500/10 hover:bg-yellow-500/25 text-yellow-500 px-2.5 py-1 rounded font-mono font-bold border border-yellow-500/20 flex items-center gap-1.5 transition-all"
                          >
                            <Coins className="w-3 h-3" /> Unlock 0.3 cUSD
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{pagent.role}</p>
                    </div>
                  );
                })}
              </div>

              {/* Chat panel box if selected marketplace agent is unlocked */}
              {(() => {
                const consultation = activeIdea.premiumAgentConsultations?.find((c) => c.agentId === selectedMarketplaceAgent);
                const isAgentUnlocked = activeIdea.unlockedPremiumAgents?.includes(selectedMarketplaceAgent);

                if (!isAgentUnlocked) {
                  return (
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center max-w-md mx-auto">
                      <Lock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-white">Consultation is Locked</h4>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                        Authorize a 0.3 cUSD standard transaction key using MetaMask or miniPay wallet tokens to unlock interactive consulting loops.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col h-[400px] overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{selectedMarketplaceAgent} Session Chat</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Real-time LLM consultation context loaded</span>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {consultation?.chatHistory?.map((chat, idx) => (
                        <div key={idx} className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                          chat.sender === "user" ? "bg-cyan-600/10 text-stone-200 border border-cyan-500/20 ml-auto" : "bg-black/50 text-white border border-white/5 mr-auto"
                        }`}>
                          <div className="font-bold text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                            {chat.sender === "user" ? "You" : selectedMarketplaceAgent}
                          </div>
                          <p className="font-mono whitespace-pre-wrap">{chat.text}</p>
                        </div>
                      ))}
                      {!consultation?.chatHistory?.length && (
                        <div className="text-slate-500 italic text-center py-12">
                          Ask your first expert advice item to start the consultation loop for free.
                        </div>
                      )}
                    </div>

                    {/* Chat input footer */}
                    <form onSubmit={handleSendMarketplaceChat} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
                      <input
                        type="text"
                        value={marketplaceMessage}
                        onChange={(e) => setMarketplaceMessage(e.target.value)}
                        placeholder={`Message ${selectedMarketplaceAgent}...`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                      />
                      <button
                        type="submit"
                        disabled={isConsulting || !marketplaceMessage}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        {isConsulting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 5. ACADEMY & COURSES */}
          {activeTab === "academy" && (
            <div className="space-y-8 animate-fade-in text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase font-bold">KNOWLEDGE • Entrepreneur Incubator</span>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Founder Academy</h1>
                  <p className="text-slate-400 text-sm mt-1">Study agile architectural metrics, finish quizzes, level up your profile levels and win milestones.</p>
                </div>
              </div>

              {/* Grid of Courses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {COURSES.map((course) => {
                  const isCompleted = userState.completedCourseIds.includes(course.id);
                  return (
                    <div key={course.id} className="bg-white/[0.04] p-6 border border-white/10 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-bold tracking-widest uppercase">{course.category}</span>
                          <span className="text-xs font-bold font-mono text-amber-500">+{course.xpReward} XP</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1.5">{course.title}</h3>
                        <p className="text-slate-400 text-xs mb-4 leading-relaxed">{course.description}</p>

                        <div className="space-y-2 mt-4">
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lessons Map:</div>
                          {course.lessons.map((lesson) => (
                            <div key={lesson.id} className="p-3 bg-black/30 border border-white/5 rounded-xl text-xs">
                              <div className="font-semibold text-white">{lesson.title}</div>
                              <p className="text-slate-400 text-[11px] leading-relaxed mt-1.5">{lesson.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/5">
                        {isCompleted ? (
                          <div className="text-green-400 text-xs font-bold leading-none flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 shrink-0" /> Checked Out (Level Achieved)
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartCourse(course.id)}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl text-xs font-bold text-white transition-all scale-100 hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
                          >
                            <Play className="w-3 h-3 fill-current" /> Start Quiz Validation
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quiz Modal Overlay Sim */}
              {selectedCourseId && (() => {
                const course = COURSES.find((c) => c.id === selectedCourseId);
                if (!course) return null;
                const question = course.quiz[activeQuizQuestionIdx];
                return (
                  <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0b0f1d] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-6 relative shadow-2xl">
                      <button
                        onClick={() => setSelectedCourseId(null)}
                        className="absolute right-4 top-4 hover:bg-white/10 p-1.5 rounded-full text-slate-500 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>

                      {!quizCompleted ? (
                        <div className="space-y-4">
                          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">COURSE EVALUATION PORTAL</div>
                          <h4 className="text-lg font-black text-white">{course.title} Quiz</h4>
                          <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                            <span className="text-[11px] text-slate-500 uppercase tracking-widest">{activeQuizQuestionIdx + 1} of {course.quiz.length} • Question</span>
                            <div className="text-stone-200 mt-1 sm:text-sm font-semibold">{question.question}</div>
                          </div>

                          <div className="space-y-2 pt-2">
                            {question.options.map((opt, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSelectQuizAnswer(idx)}
                                type="button"
                                className={`w-full text-left p-3 rounded-xl text-xs border transition-all ${
                                  selectedQuizAnswer === idx
                                    ? "bg-cyan-500/10 border-cyan-500/60 text-white font-bold"
                                    : "bg-white/5 border-white/5 hover:border-white/10 text-slate-300"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => handleSubmitQuizAnswer(course)}
                            disabled={selectedQuizAnswer === null}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-indigo-500 disabled:opacity-50 font-bold text-xs font-semibold rounded-xl text-white transition-all active:scale-[0.98]"
                          >
                            Submit Answer Payload
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-6 py-4">
                          <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Course Quiz Completed!</h3>
                            <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
                              Excellent score: {quizScore} / {course.quiz.length} points logged. XP state upgraded successfully!
                            </p>
                          </div>

                          <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-xs max-w-sm mx-auto text-stone-300 italic">
                            "{course.quiz[0].explanation}"
                          </div>

                          <button
                            onClick={() => setSelectedCourseId(null)}
                            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 font-bold rounded-xl text-xs font-semibold text-white transition-all"
                          >
                            Return to Academy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6. CELO WALLET SANDBOX */}
          {activeTab === "celo" && (
            <div className="space-y-8 animate-fade-in text-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase font-bold">BLOCKCHAIN • Celo Mainnet Ledger</span>
                  <h1 className="text-3xl font-extrabold text-white mt-1">Celo Account Sandbox</h1>
                  <p className="text-slate-400 text-sm mt-1">Manage external wallets connectors, monitor gas prices, track transaction logs, or fetch free cUSD stables.</p>
                </div>
              </div>

              {/* Wallets panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Account card */}
                <div className="bg-[#0b0f1d] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Simulated Wallet Engine</span>
                      <span className="text-[9px] bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded font-black font-semibold">CELO MAINNET</span>
                    </div>

                    <div className="space-y-2 mt-4 text-xs">
                      <div>
                        <span className="text-slate-500">Address Hash:</span>
                        <div className="font-mono text-stone-300 font-semibold text-[10px] mt-0.5 select-all">
                          {userState.walletAddress || "Disconnected. Toggle connection to acquire mockup hex hashes."}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Stable balance:</span>
                        <span className="text-emerald-400 font-mono font-bold">{userState.balanceCUSD} cUSD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Celo reserve:</span>
                        <span className="text-amber-500 font-mono font-bold">{userState.balanceCELO} CELO</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 gap-3 flex flex-col pt-4 border-t border-white/5">
                    <button
                      onClick={handleToggleWallet}
                      className="w-full text-center py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 border-none font-bold text-xs font-semibold text-white rounded-xl transition-all hover:opacity-90 leading-none"
                    >
                      {userState.walletConnected ? "Disconnect Ledger Wallet" : "Connect MiniPay / MetaMask"}
                    </button>
                    <button
                      onClick={handleClaimFaucet}
                      disabled={!userState.walletConnected}
                      className="w-full text-center py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-xs font-bold text-amber-500 border border-white/5 transition-all text-stone-300 font-semibold"
                    >
                      Request Faucet cUSD Assets
                    </button>
                  </div>
                </div>

                {/* Network stats widget */}
                <div className="bg-white/[0.04] p-5 border border-white/5 rounded-2xl md:col-span-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-semibold">Celo Gas Cost Estimations</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <div className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Calculated block number</div>
                      <div className="text-lg font-mono text-white mt-1">#24,849,292</div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <div className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Block confirmation elapsed</div>
                      <div className="text-lg font-mono text-green-400 mt-1">1.2 seconds</div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <div className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Gas price rating</div>
                      <div className="text-lg font-mono text-amber-500 mt-1">5.2 Gwei</div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <div className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Simulated consensus status</div>
                      <div className="text-lg font-mono text-cyan-400 mt-1">PoS Validation Active</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl mt-4 text-[11px] text-slate-400 leading-relaxed font-mono">
                    Transactions triggered on-demand bypass standard authorization delays by compiling and writing micro-receipt hashes to our audit tables instantly. Works in offline test pipelines seamlessly!
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* NEW STARTUP INCUBATOR MODAL */}
      {isCreatingIdea && (
        <div className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f1d] border border-white/10 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-fade-in text-white">
            <button
              onClick={() => setIsCreatingIdea(false)}
              className="absolute right-4 top-4 hover:bg-white/10 p-1.5 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">CREATOR ENGINE</span>
            <h2 className="text-xl font-extrabold text-white mt-1">Incubate Startup Venture</h2>
            <p className="text-slate-400 text-xs mt-1">Input baseline concept description parameters to boot an interactive AI operating agent.</p>

            <form onSubmit={handleCreateIdea} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Venture Working Title</label>
                <input
                  type="text"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  placeholder="e.g. SolarScale AI"
                  className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none placeholder:text-slate-600 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Target industry area</label>
                <select
                  value={newIdeaIndustry}
                  onChange={(e) => setNewIdeaIndustry(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="SaaS" className="bg-slate-900">⚡ SaaS / Software Platform</option>
                  <option value="Fintech" className="bg-slate-900">⚡ Fintech & Stablecoin Micropayments</option>
                  <option value="GreenTech" className="bg-slate-900">⚡ GreenTech & Renewable networks</option>
                  <option value="AI Agency" className="bg-slate-900">⚡ Artificial Intelligence Automation</option>
                  <option value="EdTech" className="bg-slate-900">⚡ EdTech / Open-Source Learning</option>
                  <option value="Marketplace" className="bg-slate-900">⚡ Creator Marketplace & Web3</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Venture concept summary (Be as detailed as possible!)</label>
                <textarea
                  value={newIdeaDesc}
                  onChange={(e) => setNewIdeaDesc(e.target.value)}
                  placeholder="e.g., 'I want to build a decentralized billing workspace for gig workers in Africa that handles automated customer invoices and parses payments into stable local currencies using Celo rails...'"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none placeholder:text-slate-600 leading-relaxed font-mono resize-none"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50 font-bold text-xs font-semibold rounded-xl text-white transition-all scale-100 hover:scale-[1.01]"
              >
                {isLoading ? "Writing payload state..." : "Launch Concept Phase"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WEB3 MINIPAY SIGNING TRANSACTION MODAL */}
      {pendingUnlock && (
        <div className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0f1d] border border-cyan-500/30 rounded-3xl w-full max-w-sm p-6 space-y-6 relative shadow-2xl shadow-cyan-500/10 text-white text-left animate-zoom-in">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-md mx-auto mb-4">
                <Coins className="w-6 h-6 text-white animate-bounce" />
              </div>
              <span className="text-[9px] text-gradient bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-black tracking-widest font-mono uppercase">Celo Ledger Signature</span>
              <h3 className="text-lg font-black mt-1 text-white">Sign Micropayment Request</h3>
              <p className="text-slate-400 text-xs mt-1.5">Confirm secure, instant pay-as-you-go stably backed settlement.</p>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-mono text-[10px] text-slate-300 font-semibold">DreamPort AI API Controller</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Method payload:</span>
                <span className="bg-indigo-950/40 text-indigo-400 border border-indigo-800/20 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">unlockModule("{pendingUnlock.moduleKey}")</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-slate-500 font-bold">Transaction Value:</span>
                <span className="text-emerald-400 font-mono font-black text-sm">{pendingUnlock.cost} {pendingUnlock.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Slippage Gas:</span>
                <span className="text-green-500 font-mono text-[11px]">&lt; 0.0001 CELO</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setPendingUnlock(null)}
                disabled={isSigningTransaction}
                className="w-full py-2.5 bg-white/5 disabled:opacity-50 hover:bg-white/10 rounded-xl text-xs font-bold transition-all text-slate-400"
              >
                Cancel Sign
              </button>
              <button
                onClick={executeSigning}
                disabled={isSigningTransaction}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-500/10 transition-all flex items-center justify-center gap-1.5"
              >
                {isSigningTransaction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-4 h-4" />}
                Confirm Sign
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
