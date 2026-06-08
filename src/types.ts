/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DreamReport {
  problemStatement: string;
  marketOpportunity: string;
  targetAudience: string;
  businessModel: string;
  revenueStreams: string[];
  risks: string[];
  nextSteps: string[];
}

export interface SWOTItem {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface Competitor {
  name: string;
  strengths: string;
  weaknesses: string;
  marketShare: string;
}

export interface ValidationReport {
  score: number; // 0 - 100 overall score
  marketScore: number;
  competitionScore: number;
  successProbability: number; // percentage
  swot: SWOTItem;
  competitors: Competitor[];
  customerPersona: {
    name: string;
    role: string;
    demographics: string;
    painPoints: string[];
    goals: string[];
    buyingBehavior: string;
  };
  executiveSummary: string;
}

export interface FinancialYearProjection {
  year: number;
  revenue: number;
  expenses: number;
  netProfit: number;
}

export interface BusinessPlan {
  executiveSummary: string;
  companyOverview: string;
  productStrategy: string;
  marketStrategy: string;
  operationsPlan: string;
  financialProjections: {
    startCost: number;
    year1: FinancialYearProjection;
    year2: FinancialYearProjection;
    year3: FinancialYearProjection;
    breakEvenMonths: number;
  };
  fundingStrategy: string;
}

export interface MVPBuilder {
  techSpecs: {
    stack: string[];
    keyRequirements: string[];
  };
  architecture: string; // visual markdown or diagram description
  userFlows: string[];
  databaseSchema: string; // SQL, custom schemas
  apiDocs: {
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    description: string;
    payload?: string;
    response?: string;
  }[];
  roadmap: {
    phase: string;
    duration: string;
    tasks: string[];
  }[];
}

export interface PitchDeckSlide {
  title: string;
  subtitle: string;
  points: string[];
  visualPrompt?: string; 
}

export interface PitchDeck {
  story: string;
  slides: PitchDeckSlide[];
}

export interface MarketingPlan {
  brandIdentity: {
    tagline: string;
    colors: string[];
    attributes: string[];
  };
  brandVoice: string;
  contentStrategy: string[];
  socialMediaPlan: {
    platform: string;
    frequency: string;
    postIdeas: string[];
  }[];
  adCampaign: {
    name: string;
    platform: string;
    copy: string;
    estimatedBudget: string;
  };
  seoKeywords: string[];
  emailTemplate: {
    subject: string;
    body: string;
  };
}

export interface FundingReport {
  discoveredGrants: {
    name: string;
    amount: string;
    eligibility: string;
    deadline: string;
  }[];
  outreachPlan: {
    investorSegments: string[];
    pitchStrategy: string;
  };
  investorEmailTemplate: {
    subject: string;
    body: string;
  };
  fundraisingPlan: {
    milestone: string;
    targetAmount: string;
    duration: string;
  }[];
}

export interface PremiumAgentConsultation {
  agentId: string;
  chatHistory: {
    sender: "user" | "agent";
    text: string;
    timestamp: string;
  }[];
}

export interface StartupIdea {
  id: string;
  title: string;
  industry: string;
  rawIdea: string;
  createdAt: string;
  premiumUnlocked: {
    validator: boolean;
    businessPlan: boolean;
    mvp: boolean;
    pitchDeck: boolean;
    marketing: boolean;
    funding: boolean;
  };
  dreamReport?: DreamReport;
  validationReport?: ValidationReport;
  businessPlan?: BusinessPlan;
  mvpBuilder?: MVPBuilder;
  pitchDeck?: PitchDeck;
  marketingPlan?: MarketingPlan;
  fundingReport?: FundingReport;
  unlockedPremiumAgents: string[]; // list of premium agent ids unlocked for this idea
  premiumAgentConsultations: PremiumAgentConsultation[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlockedAt?: string;
  category: string;
}

export const DEFAULT_BADGES: Badge[] = [
  { id: "first-idea", name: "Spark of Genius", description: "Created your first startup concept on DreamPort AI", iconName: "lightbulb", category: "creation" },
  { id: "validated", name: "Certified Truth", description: "Validated your startup concept using the Startup Validator Agent", iconName: "shield-check", category: "validation" },
  { id: "finance-whiz", name: "Capital Strategist", description: "Formulated your business plan & initial financial forecast", iconName: "wallet", category: "finance" },
  { id: "mvp-builder", name: "Launch Engineer", description: "Created developer specification, user flows and DB schemas", iconName: "cpu", category: "tech" },
  { id: "pitch-perfect", name: "Storyteller", description: "Generated an investor pitch deck slide structure", iconName: "presentation", category: "growth" },
  { id: "blockchain-pioneer", name: "Celo Pioneer", description: "Connected your Celo wallet & signed first agent micropayment", iconName: "coins", category: "blockchain" },
];

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: "Ideation" | "Validation" | "Product" | "Finance" | "Growth" | "Blockchain";
  lessons: {
    id: string;
    title: string;
    content: string;
    xpReward: number;
  }[];
  quiz: QuizQuestion[];
  userChallenge: string;
  xpReward: number;
}

export interface UserState {
  xp: number;
  level: number;
  earnedBadgeIds: string[];
  walletConnected: boolean;
  walletAddress: string | null;
  walletType: "metamask" | "valora" | "minipay" | null;
  balanceCUSD: number;
  balanceCELO: number;
  completedCourseIds: string[];
  username?: string | null;
  role?: string | null;
}

export interface SystemAuditLogs {
  id: string;
  action: string;
  amount?: string;
  currency?: string;
  txHash?: string;
  timestamp: string;
  status: "success" | "pending" | "failed";
}

export interface DBState {
  ideas: StartupIdea[];
  userState: UserState;
  auditLogs: SystemAuditLogs[];
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration: number;
}

