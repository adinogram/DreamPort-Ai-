/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: "15mb" }));

  // Initialize Gemini AI client
  // Make sure to handle missing GEMINI_API_KEY gracefully
  const apiKey = process.env.GEMINI_API_KEY || "";
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("⚠️ WARNING: GEMINI_API_KEY is not defined. AI features will fallback to premium mock templates.");
  }

  // Persistent mock database path
  const DB_PATH = path.join(__dirname, "db.json");

  // Default badges available
  const DEFAULT_BADGES = [
    { id: "first-idea", name: "Spark of Genius", description: "Created your first startup concept on DreamPort AI", iconName: "lightbulb", category: "creation" },
    { id: "validated", name: "Certified Truth", description: "Validated your startup concept using the Startup Validator Agent", iconName: "shield-check", category: "validation" },
    { id: "finance-whiz", name: "Capital Strategist", description: "Formulated your business plan & initial financial forecast", iconName: "wallet", category: "finance" },
    { id: "mvp-builder", name: "Launch Engineer", description: "Created developer specification, user flows and DB schemas", iconName: "cpu", category: "tech" },
    { id: "pitch-perfect", name: "Storyteller", description: "Generated an investor pitch deck slide structure", iconName: "presentation", category: "growth" },
    { id: "blockchain-pioneer", name: "Celo Pioneer", description: "Connected your Celo wallet & signed first agent micropayment", iconName: "coins", category: "blockchain" },
  ];

  // Helper to read and write local JSON database
  function readDB() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("Error reading database, resetting custom state:", e);
    }
    return {
      ideas: [],
      userState: {
        xp: 150,
        level: 1,
        earnedBadgeIds: [],
        walletConnected: false,
        walletAddress: null,
        walletType: null,
        balanceCUSD: 10.0,
        balanceCELO: 5.0,
        completedCourseIds: [],
      },
      auditLogs: [
        {
          id: "log-" + Date.now(),
          action: "Account created",
          timestamp: new Date().toISOString(),
          status: "success",
        },
      ],
    };
  }

  function writeDB(data: any) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing database:", e);
    }
  }

  // Initialize DB on boot if not existing
  if (!fs.existsSync(DB_PATH)) {
    writeDB(readDB());
  }

  // --- API ROUTING ---

  // 1. Get entire app state
  app.get("/api/db", (req, res) => {
    const db = readDB();
    res.json(db);
  });

  // 2. Set user State (e.g., connect wallet, add custom XP)
  app.post("/api/user-state", (req, res) => {
    const db = readDB();
    db.userState = { ...db.userState, ...req.body };
    writeDB(db);
    res.json({ success: true, userState: db.userState });
  });

  // 3. Create interactive startup idea
  app.post("/api/ideas", (req, res) => {
    const db = readDB();
    const { title, industry, rawIdea } = req.body;
    
    if (!title || !rawIdea) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const newID = "idea-" + Math.random().toString(36).substr(2, 9);
    const newIdea = {
      id: newID,
      title,
      industry: industry || "General",
      rawIdea,
      createdAt: new Date().toISOString(),
      premiumUnlocked: {
        validator: false,
        businessPlan: false,
        mvp: false,
        pitchDeck: false,
        marketing: false,
        funding: false,
      },
      dreamReport: undefined,
      unlockedPremiumAgents: [],
      premiumAgentConsultations: [],
    };

    db.ideas.push(newIdea);
    
    // Add XP reward for idea generator badge
    db.userState.xp += 100;
    if (db.userState.xp >= db.userState.level * 500) {
      db.userState.level += 1;
    }
    if (!db.userState.earnedBadgeIds.includes("first-idea")) {
      db.userState.earnedBadgeIds.push("first-idea");
      db.auditLogs.unshift({
        id: "log-" + Date.now(),
        action: "Earned badge: Spark of Genius",
        timestamp: new Date().toISOString(),
        status: "success",
      });
    }

    db.auditLogs.unshift({
      id: "log-" + Date.now(),
      action: `Created new idea: "${title}"`,
      timestamp: new Date().toISOString(),
      status: "success",
    });

    writeDB(db);
    res.json({ success: true, idea: newIdea, userState: db.userState });
  });

  // 4. Reset DB to default template values
  app.post("/api/reset", (req, res) => {
    const defaultData = {
      ideas: [],
      userState: {
        xp: 150,
        level: 1,
        earnedBadgeIds: [],
        walletConnected: false,
        walletAddress: null,
        walletType: null,
        balanceCUSD: 10.0,
        balanceCELO: 5.0,
        completedCourseIds: [],
      },
      auditLogs: [
        {
          id: "log-" + Date.now(),
          action: "Database state reset to defaults",
          timestamp: new Date().toISOString(),
          status: "success",
        },
      ],
    };
    writeDB(defaultData);
    res.json(defaultData);
  });

  // 5. Micropayment unlocking route simulating Celo MiniPay
  app.post("/api/ideas/:id/unlock", (req, res) => {
    const { id } = req.params;
    const { moduleKey, cost, currency, txHash } = req.body; // currency is 'cUSD' or 'CELO'

    const db = readDB();
    const ideaIdx = db.ideas.findIndex((i: any) => i.id === id);
    if (ideaIdx === -1) {
      return res.status(404).json({ error: "Idea not found." });
    }

    const idea = db.ideas[ideaIdx];
    
    // Check balances
    if (currency === "CELO") {
      if (db.userState.balanceCELO < cost) {
        return res.status(400).json({ error: "Insufficient CELO funds." });
      }
      db.userState.balanceCELO = parseFloat((db.userState.balanceCELO - cost).toFixed(4));
    } else {
      if (db.userState.balanceCUSD < cost) {
        return res.status(400).json({ error: "Insufficient cUSD funds." });
      }
      db.userState.balanceCUSD = parseFloat((db.userState.balanceCUSD - cost).toFixed(4));
    }

    // Unlock requested module
    if (idea.premiumUnlocked[moduleKey] !== undefined) {
      idea.premiumUnlocked[moduleKey] = true;
    } else {
      // It might be a premium agent from marketplace
      if (!idea.unlockedPremiumAgents.includes(moduleKey)) {
        idea.unlockedPremiumAgents.push(moduleKey);
      }
    }

    // Reward XP for completing blockchain payments
    db.userState.xp += 150;
    if (db.userState.xp >= db.userState.level * 500) {
      db.userState.level += 1;
    }

    if (!db.userState.earnedBadgeIds.includes("blockchain-pioneer")) {
      db.userState.earnedBadgeIds.push("blockchain-pioneer");
      db.auditLogs.unshift({
        id: "log-" + Date.now() + "-badge",
        action: "Earned badge: Celo Pioneer",
        timestamp: new Date().toISOString(),
        status: "success",
      });
    }

    // Add transaction audit log
    db.auditLogs.unshift({
      id: "log-" + Date.now(),
      action: `Unlocked AI Agent [${moduleKey}] for idea "${idea.title}"`,
      amount: cost.toString(),
      currency,
      txHash: txHash || "0x" + Math.random().toString(16).substr(2, 64),
      timestamp: new Date().toISOString(),
      status: "success",
    });

    writeDB(db);
    res.json({ success: true, idea, userState: db.userState, auditLogs: db.auditLogs });
  });

  // 6. Interactive chatbot consultation endpoint with Premium Agents
  app.post("/api/ideas/:id/consult", async (req, res) => {
    const { id } = req.params;
    const { agentId, userMessage } = req.body;

    const db = readDB();
    const idea = db.ideas.find((i: any) => i.id === id);
    if (!idea) {
      return res.status(404).json({ error: "Idea not found." });
    }

    // Verify premium status or unlock
    const isUnlocked = idea.unlockedPremiumAgents.includes(agentId);
    if (!isUnlocked) {
      return res.status(403).json({ error: "Consultation agent is locked. Purchase with Celo/cUSD microtransactions." });
    }

    // Find or initialize consultation context
    if (!idea.premiumAgentConsultations) {
      idea.premiumAgentConsultations = [];
    }
    let consultation = idea.premiumAgentConsultations.find((c: any) => c.agentId === agentId);
    if (!consultation) {
      consultation = { agentId, chatHistory: [] };
      idea.premiumAgentConsultations.push(consultation);
    }

    // Store user message
    consultation.chatHistory.push({
      sender: "user",
      text: userMessage,
      timestamp: new Date().toISOString(),
    });

    let liveReply = `Hello! As your Premium AI ${agentId} specialist, I've analyzed your concept for "${idea.title}". Let's refine your execution structure!`;

    if (ai) {
      try {
        const prompt = `
          You are the special premium AI Agent: "${agentId}" advisor.
          Your startup idea context model:
          Title: "${idea.title}"
          Industry: "${idea.industry}"
          Concept description: "${idea.rawIdea}"

          History of chat so far:
          ${consultation.chatHistory.map((m: any) => `${m.sender}: ${m.text}`).join("\n")}

          As an ultra-focused high-caliber ${agentId} expert, reply directly to the user's latest query with actionable, venture-ready advice, specific strategies, metrics to track, and custom tactics. Avoid generalities. Do not reference layout or system details. Limit response to 120 words max.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });

        if (response.text) {
          liveReply = response.text.trim();
        }
      } catch (e: any) {
        console.error("Gemini premium chat failed:", e);
      }
    }

    consultation.chatHistory.push({
      sender: "agent",
      text: liveReply,
      timestamp: new Date().toISOString(),
    });

    // Add minor task XP reward
    db.userState.xp += 20;
    if (db.userState.xp >= db.userState.level * 500) {
      db.userState.level += 1;
    }

    writeDB(db);
    res.json({ success: true, chatHistory: consultation.chatHistory, userState: db.userState });
  });

  // 7. Core AI generator endpoints
  app.post("/api/ideas/:id/generate/:moduleKey", async (req, res) => {
    const { id, moduleKey } = req.params;
    const db = readDB();
    const ideaIdx = db.ideas.findIndex((i: any) => i.id === id);
    
    if (ideaIdx === -1) {
      return res.status(404).json({ error: "Idea not found." });
    }

    const idea = db.ideas[ideaIdx];

    // Ensure it's unlocked for premium features (dreamReport is free, other are premium)
    if (moduleKey !== "dream" && !idea.premiumUnlocked[moduleKey]) {
      return res.status(403).json({ error: `Agent "${moduleKey}" is locked. Complete Micropayment to proceed.` });
    }

    // Trigger AI compilation
    let promptText = "";
    let systemPrompt = "";
    
    switch (moduleKey) {
      case "dream":
        systemPrompt = "You are an elite business mastermind incubator.";
        promptText = `
          Concept: "${idea.rawIdea}"
          Title recommendation matching: "${idea.title}"
          Transform this raw concept into a structured startup summary. Return raw JSON matching fields in the exact JSON format:
          {
            "problemStatement": "string describing user pain point clearly",
            "marketOpportunity": "string describing target TAM, CAGR and value matching",
            "targetAudience": "string on exact segment of customers",
            "businessModel": "string describing how the startup works",
            "revenueStreams": ["stream 1", "stream 2"],
            "risks": ["risk 1", "risk 2"],
            "nextSteps": ["actionable immediate task 1", "actionable task 2"]
          }
          Return ONLY valid parseable JSON. Do not write markdown blocks or backticks.
        `;
        break;

      case "validator":
        systemPrompt = "You are a professional VC investor and market validation analyst.";
        promptText = `
          Concept: "${idea.rawIdea}"
          Industry: "${idea.industry}"
          Conduct an extensive validation report. Return raw JSON matching this format:
          {
            "score": 85, // out of 100 overall score
            "marketScore": 80, // out of 100
            "competitionScore": 75, // out of 100
            "successProbability": 68, // percentage estimate
            "swot": {
              "strengths": ["string", "string"],
              "weaknesses": ["string", "string"],
              "opportunities": ["string", "string"],
              "threats": ["string", "string"]
            },
            "competitors": [
              { "name": "Direct Comp A", "strengths": "strengths summary", "weaknesses": "weaknesses summary", "marketShare": "15%" }
            ],
            "customerPersona": {
              "name": "Alex the Early Adopter",
              "role": "Lead Professional",
              "demographics": "Millennial SaaS operators, $80k income",
              "painPoints": ["friction point 1", "friction point 2"],
              "goals": ["KPI goalA", "goalB"],
              "buyingBehavior": "Willing to spend 0.5hr on trial, needs cUSD ease"
            },
            "executiveSummary": "Detailed VC evaluation statement of viability"
          }
          Return ONLY valid parseable JSON. Do not write markdown blocks or backticks.
        `;
        break;

      case "businessPlan":
        systemPrompt = "You are a Chief Financial Officer and Startup Strategist.";
        promptText = `
          Analyze:
          Title: "${idea.title}"
          Industry: "${idea.industry}"
          Description: "${idea.rawIdea}"
          Create a detailed executive business plan. Return raw JSON matching this format:
          {
            "executiveSummary": "summary string of vision",
            "companyOverview": "company background and structure outline",
            "productStrategy": "detailed core value of MVP product capabilities",
            "marketStrategy": "go-to-market plan with launch pipeline",
            "operationsPlan": "infrastructure requirements, workflows, and core metrics",
            "financialProjections": {
              "startCost": 15000,
              "year1": { "year": 1, "revenue": 120000, "expenses": 80000, "netProfit": 40000 },
              "year2": { "year": 2, "revenue": 340000, "expenses": 180000, "netProfit": 160000 },
              "year3": { "year": 3, "revenue": 890000, "expenses": 420000, "netProfit": 470000 },
              "breakEvenMonths": 8
            },
            "fundingStrategy": "Seed round goals: raising $250k on Celo network or equity"
          }
          Return ONLY valid parseable JSON. Do not write markdown blocks or backticks.
        `;
        break;

      case "mvp":
        systemPrompt = "You are a seasoned Chief Technology Officer and Agile Solutions architect.";
        promptText = `
          Concept: "${idea.rawIdea}"
          Industry: "${idea.industry}"
          Generate technical build specifications. Return raw JSON matching this format:
          {
            "techSpecs": {
              "stack": ["React", "TypeScript", "Tailwind CSS", "Celo Extension Toolkit", "Express"],
              "keyRequirements": ["Fast interactive screens", "Web3 signing capabilities"]
            },
            "architecture": "Clean 3-tiered microservice routing with JSON API layers",
            "userFlows": ["User connects Celo", "Idea registered on-chain", "Agent calculates models"],
            "databaseSchema": "CREATE TABLE ideas (id SERIAL, user_address VARCHAR, idea_doc JSONB, locked BOOLEAN);",
            "apiDocs": [
              { "endpoint": "/api/ideas", "method": "POST", "description": "Registers idea", "payload": "{title, rawIdea}", "response": "{success, id}" }
            ],
            "roadmap": [
              { "phase": "Setup", "duration": "Week 1", "tasks": ["Smart contract setup", "Repo config"] }
            ]
          }
          Return ONLY valid parseable JSON. Do not write markdown blocks or backticks.
        `;
        break;

      case "pitchDeck":
        systemPrompt = "You are a startup founder pitching to tier-1 Venture Capital firms.";
        promptText = `
          Concept: "${idea.rawIdea}"
          Name: "${idea.title}"
          Design a highly compelling slides layout. Return raw JSON matching this format:
          {
            "story": "The ultimate narrative arch for our product...",
            "slides": [
              {
                "title": "Slide Title e.g. The Problem",
                "subtitle": "Clear, bold statement",
                "points": ["Major friction point list item", "Secondary item"],
                "visualPrompt": "Concept art of a robotic desk worker"
              }
            ]
          }
          Generate at least 5 slides: Title, Problem, Solution, Market, Business Model / Progress.
          Return ONLY valid parseable JSON. Do not write markdown blocks or backticks.
        `;
        break;

      case "marketing":
        systemPrompt = "You are a high-conversion Growth Hacker and Marketing Director.";
        promptText = `
          Idea: "${idea.rawIdea}"
          Title: "${idea.title}"
          Create a full launch marketing plan. Return raw JSON matching this format:
          {
            "brandIdentity": {
              "tagline": "Elegant modern tagline",
              "colors": ["Deep Emerald", "Futuristic Teal", "Frost White"],
              "attributes": ["Transparent", "AI-Powered", "Fast"]
            },
            "brandVoice": "Empowering, direct, innovative and user-first",
            "contentStrategy": ["High performance Twitter threads on tech", "Developer portal release documentation"],
            "socialMediaPlan": [
              { "platform": "X/Twitter", "frequency": "Daily", "postIdeas": ["Intro post explaining Celo payments to creators"] }
            ],
            "adCampaign": {
              "name": "Accelerate My Idea",
              "platform": "LinkedIn Ads",
              "copy": "Ready to launch your vision? Get structured MVPs and Pitch Decks in minutes with interactive Celo wallet authentication.",
              "estimatedBudget": "$500 test"
            },
            "seoKeywords": ["AI Startup builder", "Celo startup microtransactions", "Instant business roadmaps"],
            "emailTemplate": {
              "subject": "Launch your dream business today!",
              "body": "Hi there,\\nAre you ready to grow further?\\n..."
            }
          }
          Return ONLY valid parseable JSON. Do not write markdown blocks or backticks.
        `;
        break;

      case "funding":
        systemPrompt = "You are a professional Grants Advisor and Investor Matchmaker.";
        promptText = `
          Idea: "${idea.rawIdea}"
          Title: "${idea.title}"
          Generate a detailed fundraising report. Return raw JSON matching this format:
          {
            "discoveredGrants": [
              { "name": "Celo Community Grants", "amount": "$5,000 to $25,000", "eligibility": "Open Source Celo apps", "deadline": "Rolling" }
            ],
            "outreachPlan": {
              "investorSegments": ["Micro VCs", "Web3 Incubators", "AI Angels"],
              "pitchStrategy": "Highlight Celo integration, fast microtransactions, validated market score."
            },
            "investorEmailTemplate": {
              "subject": "Introduction: "${idea.title}" - Decentralized Accelerator",
              "body": "Dear Investor,\\n\\nI would like to share our venture..."
            },
            "fundraisingPlan": [
              { "milestone": "Pre-Seed", "targetAmount": "$150k USD", "duration": "3 months" }
            ]
          }
          Return ONLY valid parseable JSON. Do not write markdown blocks or backticks.
        `;
        break;

      default:
        return res.status(400).json({ error: "Unknown module key" });
    }

    // Attempt generation
    let generatedData = null;
    if (ai) {
      try {
        const result = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
          },
        });
        
        const text = result.text || "";
        // Clean text if backticks leaked in despite configuration
        let cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        generatedData = JSON.parse(cleaned.trim());
      } catch (err) {
        console.error(`Gemini Generation failed for [${moduleKey}], applying realistic mockup template:`, err);
        generatedData = getMockDataFallback(moduleKey, idea);
      }
    } else {
      // Key absent, use fallback mock
      generatedData = getMockDataFallback(moduleKey, idea);
    }

    // Save outputs on the idea
    if (moduleKey === "dream") {
      idea.dreamReport = generatedData;
    } else if (moduleKey === "validator") {
      idea.validationReport = generatedData;
      // Add badge "validated"
      if (!db.userState.earnedBadgeIds.includes("validated")) {
        db.userState.earnedBadgeIds.push("validated");
      }
    } else if (moduleKey === "businessPlan") {
      idea.businessPlan = generatedData;
      // Add badge "finance"
      if (!db.userState.earnedBadgeIds.includes("finance-whiz")) {
        db.userState.earnedBadgeIds.push("finance-whiz");
      }
    } else if (moduleKey === "mvp") {
      idea.mvpBuilder = generatedData;
      // Add badge "tech"
      if (!db.userState.earnedBadgeIds.includes("mvp-builder")) {
        db.userState.earnedBadgeIds.push("mvp-builder");
      }
    } else if (moduleKey === "pitchDeck") {
      idea.pitchDeck = generatedData;
      // Add badge "pitch-perfect"
      if (!db.userState.earnedBadgeIds.includes("pitch-perfect")) {
        db.userState.earnedBadgeIds.push("pitch-perfect");
      }
    } else if (moduleKey === "marketing") {
      idea.marketingPlan = generatedData;
    } else if (moduleKey === "funding") {
      idea.fundingReport = generatedData;
    }

    // Increment user XP
    db.userState.xp += 100;
    if (db.userState.xp >= db.userState.level * 500) {
      db.userState.level += 1;
    }

    db.ideas[ideaIdx] = idea;
    writeDB(db);

    res.json({ success: true, idea, userState: db.userState });
  });

  // --- START THE APP & CONNECT VITE DEV MIDDLEWARE IN NON-PRODUCTION ---
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend assets
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res, next) => {
      // API routes should not fall under HTML serve
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 DreamPort AI express backend started on http://0.0.0.0:${PORT}`);
  });
}

// Fallback high-fidelity templates in case of connection offline, JSON parse error or missing GEMINI API KEY
function getMockDataFallback(moduleKey: string, idea: any) {
  const genericTitle = idea.title || "SolarScale AI";
  const genericDesc = idea.rawIdea || "Decentralized energy network";

  switch (moduleKey) {
    case "dream":
      return {
        problemStatement: `Unoptimized resource alignment and high transaction barriers prevents standard participants from scaling up effectively.`,
        marketOpportunity: `A multi-billion dollar accessible market expanding rapidly with a cumulative annual growth rate of 12.8% globally.`,
        targetAudience: `Small business operators, entrepreneurs, micro-stakeholders looking for automated business frameworks.`,
        businessModel: `Pay-as-you-go software integrations utilizing secure, instantaneous blockchain micropayment infrastructure.`,
        revenueStreams: [
          "Micro-transaction fees for document automation",
          "Advanced collaborative workspace subscriptions",
          "B2B enterprise customized compliance toolsets"
        ],
        risks: [
          "Regulatory framework shifts across regional jurisdictions",
          "Adoption Friction for non-technical users entering Web3"
        ],
        nextSteps: [
          "Execute Startup Validator Agent to scan existing competitors",
          "Initiate cUSD Business Plan mapping for capital seed round"
        ]
      };

    case "validator":
      return {
        score: 87,
        marketScore: 84,
        competitionScore: 78,
        successProbability: 72,
        swot: {
          strengths: ["Highly tailored automation layer", "Instant pay-as-you-go Celo micropayments removes entry barrier", "Modular structure fits low & high touch startups"],
          weaknesses: ["Dependent on Celo Mainnet connection stability", "UI requires learning curve for Web2 beginners"],
          opportunities: ["Emerging micro-entrepreneur demographic in emerging markets", "Grants and seed matching funding pools from Celo ecosystem"],
          threats: ["Legacy expensive enterprise validation standard tools", "Rapid changes in API model parameters"]
        },
        competitors: [
          { name: "LaunchDash Pro", strengths: "High visuals templates", weaknesses: "No automated financial projections", marketShare: "12%" },
          { name: "Valido Web", strengths: "Simple survey templates", weaknesses: "Manual research took 5 business days", marketShare: "8%" }
        ],
        customerPersona: {
          name: "Daniel the Solopreneur",
          role: "Creative Freelancer & Developer",
          demographics: "Aged 24-38, tech literate, values speed, holds digital tokens",
          painPoints: ["Lacks budget for expensive business consultants", "Needs developer specifications instantly to write code"],
          goals: ["Validate 3 side projects concurrently", "Establish clear GTM with minimum expenditure"],
          buyingBehavior: "Heavy user of browser extensions, prefers direct micro-transacting instead of expensive recurring subscriptions."
        },
        executiveSummary: `Excellent validation score of 87/100 points to a strong customer acquisition channel and minimal capital barrier. The target audience values the swift turnaround time, and competitive analysis shows a gaping hole in actual micro-task automation platforms.`
      };

    case "businessPlan":
      return {
        executiveSummary: `To enable a secure decentralized startup operating framework utilizing generative intelligence and secure stablecoin payment processing on Celo.`,
        companyOverview: `${genericTitle} is structured as a decentralized autonomous startup organization optimized to reduce operational and financial friction across worldwide ventures.`,
        productStrategy: `A web application containing integrated workspace tools. Features robust generative drafting widgets for documents (business plans, pitch decks) unlocked on-demand via cUSD wallet transactions.`,
        marketStrategy: `Leverage micro-entrepreneur associations, developer bootcamps, and digital creation pipelines on socials. Provide transparent free-tier entry, leading to high-converting on-chain micro-actions.`,
        operationsPlan: `Cloud native infrastructure running automated API containers, using secure decentralized keys to protect personal assets and maintain instantaneous data states.`,
        financialProjections: {
          startCost: 12000,
          year1: { year: 1, revenue: 145000, expenses: 75000, netProfit: 70000 },
          year2: { year: 2, revenue: 380000, expenses: 140000, netProfit: 240000 },
          year3: { year: 3, revenue: 950000, expenses: 310000, netProfit: 640000 },
          breakEvenMonths: 6
        },
        fundingStrategy: `Targeting an initial seed grant of $15,000 from the Celo Community Grants Program, supplemented by a $100,000 angel investment round tailored for generative utility.`
      };

    case "mvp":
      return {
        techSpecs: {
          stack: ["React 19", "Vite", "Tailwind CSS v4", "TypeScript", "Express Backend Server", "Celo Extension Toolkit", "@google/genai SDK"],
          keyRequirements: ["Highly responsive UI", "Real-time state validation against Celo wallet payload", "Secure multi-module microtransactions"]
        },
        architecture: `Frontend Application (React Router, Glassmorphism design system) <---> Full Stack Express Engine (API handlers, db.json storage) <---> Google GenAI (Gemini 3.5 Flash) & Celo Smart Contracts (cUSD / CELO tokens)`,
        userFlows: [
          "User signs up & reviews the Founder Dashboard.",
          "Drafts raw idea using free-tier Dream Agent incubator.",
          "Connects MiniPay / MetaMask wallet and signs a 0.2 cUSD validation contract.",
          "Premium agent validates, unlocks SWOT charts, and designs custom developer blueprint."
        ],
        databaseSchema: `CREATE TABLE users (\n  address VARCHAR(42) PRIMARY KEY,\n  xp INTEGER DEFAULT 100,\n  level INTEGER DEFAULT 1\n);\n\nCREATE TABLE startup_ideas (\n  id VARCHAR(64) PRIMARY KEY,\n  user_address VARCHAR(42),\n  title VARCHAR(128),\n  raw_idea TEXT,\n  premium_unlocked JSONB,\n  created_at TIMESTAMP\n);`,
        apiDocs: [
          { endpoint: "/api/db", method: "GET", description: "Fetch overall application state (ideas, userState, auditLogs)" },
          { endpoint: "/api/ideas/:id/unlock", method: "POST", description: "Authorize microtransaction and unlock requested agent capabilities" },
          { endpoint: "/api/ideas/:id/generate/:module", method: "POST", description: "Call Gemini AI to run structured data incubation" }
        ],
        roadmap: [
          { phase: "Phase 1 - Prototype Design", duration: "1 week", tasks: ["Setup glassmorphism UI widgets", "Connect Express mock payment endpoints"] },
          { phase: "Phase 2 - Web3 Integration", duration: "1.5 weeks", tasks: ["Integrate wallet connector for MetaMask & MiniPay", "Validate mainnet balance signatures"] },
          { phase: "Phase 3 - Agent Production", duration: "2 weeks", tasks: ["Connect live Gemini 3.5-flash custom instructions API", "Conduct multi-agent collaboration test suites"] }
        ]
      };

    case "pitchDeck":
      return {
        story: `We are democratizing startup creation. By equipping every individual globally with world-class AI operating agents reachable for pennies with Celo Microtransactions, we eliminate the startup capital lock and build the world's most accessible entrepreneur portal.`,
        slides: [
          { title: "DreamPort AI", subtitle: "The AI Founder Operating System", points: ["Go from raw idea to launch plan in minutes", "Frictionless pay-as-you-go micropayments using MiniPay", "Unlock personalized SWOT, financial statements, and Tech specs"], visualPrompt: "Cinematic digital vault representing security and speed" },
          { title: "The Problem", subtitle: "90% of ideated startups never launch", points: ["High costs of early consulting ($1,000s in validator fees)", "Friction to draft complex code architecture & financial models", "No integrated tracking of XP level progress for developers"], visualPrompt: "Messy, fragmented documents of ideas piled on a desk" },
          { title: "The Solution", subtitle: "On-demand startup agents in your pocket", points: ["Microservices generating high fidelity roadmaps for pennies", "Secure payment tracking using Celo stablecoin cUSD", "Aesthetic responsive design optimized for mobile and desktop founders"], visualPrompt: "Glowing neon compass navigating clean modern workspace" },
          { title: "Market Size & Opportunity", subtitle: "TAM is huge & expanding globally", points: ["Over 580 million entrepreneurs active internationally across emerging states", "High MiniPay mobile wallet volume across East Africa and LATAM", "Evolving creative & gig-economy structures requiring fast MVP builds"], visualPrompt: "Global glowing network connecting major cities" },
          { title: "Business Model & Go-to-Market", subtitle: "Pay-As-You-Go Micropayments", points: ["0.2 cUSD for in-depth competitor validation", "0.5 cUSD for complete 3-year P&L financials and operations sheets", "Premium agent marketplace for Legal, Marketing, and Sales consultancy"], visualPrompt: "Sleek card showing a micro-coin transaction flowing" }
        ]
      };

    case "marketing":
      return {
        brandIdentity: {
          tagline: "Your Vision. Accelerated in Milliseconds.",
          colors: ["#10b981 (Emerald Spark)", "#3b82f6 (Futuristic Blue)", "#f59e0b (Founder Gold)"],
          attributes: ["Agile", "Futuristic", "Transparent", "Empowering"]
        },
        brandVoice: "Encouraging, tech-literate, incredibly authoritative yet accessible to first-time creators.",
        contentStrategy: [
          "Twitter/X Thread series: 'How to validate 5 startup business models in 10 minutes with Celo and Gemini.'",
          "Short form TikTok/Reels showcasing founders generating beautiful MVP architectures instantly.",
          "Interactive newsletter with weekly starter kits in emerging niches."
        ],
        socialMediaPlan: [
          { platform: "X (Twitter)", frequency: "3x daily", postIdeas: ["Visual showcase of generated DB schemas for Web3", "Weekly XP leaderboards of community makers", "Success stories of side hustles launched"] },
          { platform: "LinkedIn", frequency: "2x weekly", postIdeas: ["Deep dive into Celo stablecoin benefits for emerging market entrepreneurs", "The reduction in seed GTM capital in 2026"] }
        ],
        adCampaign: {
          name: "Dream to Launch Suite",
          platform: "Meta / Instagram",
          copy: "Stop sitting on your startup concepts. Connect Valora or MiniPay, enter your raw business dream, and watch AI agents build your complete financial plan and technical specification on the spot.",
          estimatedBudget: "$350 initial validation spend"
        },
        seoKeywords: ["unlocked MVP specification generator", "MiniPay founder operating system", "Celo stablecoin microconsulting", "AI Business Plan compiler"],
        emailTemplate: {
          subject: "Welcome to DreamPort AI - Your Creator Hub is Ready!",
          body: "Hi Founder,\n\nYou have taken the first step toward building your own company. Your dashboard progress is active. Navigate to your ideas panel to unlock validation SWOT sheets or design standard legal agreements.\n\nLet's build!\n\nBest,\nDreamPort AI Team"
        }
      };

    case "funding":
      return {
        discoveredGrants: [
          { name: "Celo Asia/Africa Micropayments Pool", amount: "$10,000 grant", eligibility: "Applications showcasing cUSD micropayments utility", deadline: "Continuous evaluation" },
          { name: "Google AI Studio Developer Initiative", amount: "$5,000 API credits", eligibility: "SaaS projects showcasing excellent Gemini multi-agent logic", deadline: "Rolling monthly" },
          { name: "Web3 Catalyst Accelerator Fund", amount: "$50,000 Seed allocation", eligibility: "Working prototypes built with stablecoin connectivity", deadline: "September 30, 2026" }
        ],
        outreachPlan: {
          investorSegments: ["Emerging Web3 Tech Angels", "Micro-SaaS Incubator Funds", "Fintech Syndicate members"],
          pitchStrategy: "Lead with verified validation scores, high-contrast operational layout, and concrete, un-bloated revenue models."
        },
        investorEmailTemplate: {
          subject: "Pitching: " + genericTitle + " - AI Accelerator & Micropayments Platform",
          body: "Dear Angel Investor,\n\nWe have built " + genericTitle + ", addressing validation friction for international builders. Our MVP generates custom automation models unlocked instantly using Celo stablecoin micropayments.\n\nOur current metrics show an market validation index of 87 points. We are raising our pre-seed round of $150k.\n\nWould you be open to a brief 10-minute demo session?\n\nSincerely,\nFounder, " + genericTitle
        },
        fundraisingPlan: [
          { milestone: "Grant Capital bootstrapping", targetAmount: "$15,000", duration: "1 month" },
          { milestone: "Syndicate Angel Commitment", targetAmount: "$100,000", duration: "3 months" },
          { milestone: "Fully completed public MVP Launch", targetAmount: "$35,000", duration: "Next milestone" }
        ]
      };

    default:
      return {};
  }
}

startServer();
