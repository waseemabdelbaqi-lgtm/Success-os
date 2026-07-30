/**
 * Agent registry — role-routed via AI Gateway + structured contracts + context selection.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gatewayChat } from "../gateway/ai-gateway.js";
import { validateWithRepair } from "../contracts/agent-output.js";
import { selectContext, formatContextForPrompt } from "../context/selector.js";
import { runTestingAgent } from "./testing.js";
import { runVideoAgent } from "./video.js";
import { runVoiceAgent } from "./voice.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../config/agents.manifest.json"), "utf8"),
);

const ROLE_BY_AGENT = {
  engineering: "engineering",
  backend: "backend",
  frontend: "frontend",
  database: "database",
  security: "security",
  performance: "performance",
  curriculum: "curriculum",
  research: "research",
  translation: "documentation",
  accessibility: "frontend",
  documentation: "documentation",
  deployment: "engineering",
  monitoring: "engineering",
  "gpt-engineering": "engineering",
  "claude-curriculum": "curriculum",
  "gemini-research": "research",
};

async function runStructuredAgent(agentId, task, { systemExtra = "", allowOllama = true } = {}) {
  const started = Date.now();
  const role = ROLE_BY_AGENT[agentId] || "default";
  const ctx = selectContext({
    projectRoot: process.cwd(),
    objective: task.goal,
    agent: agentId,
  });
  const system = `You are the Success OS AIOS ${agentId} agent.
${systemExtra}
Return ONLY JSON matching this schema:
{"taskId":"","agent":"","provider":"","model":"","status":"completed|failed|needs_review","summary":"","assumptions":[],"sources":[],"filesProposed":[],"patches":[],"testsRequired":[],"risks":[],"tokenUsage":{},"estimatedCost":null,"errors":[]}
Never hardcode secrets. Propose extensions only. Cite file paths from context when relevant.`;

  const user = JSON.stringify({
    taskId: task.id,
    title: task.title,
    goal: task.goal,
    complexity: task.complexity,
    executionMode: process.env.AIOS_EXECUTION_MODE || "review",
    contextFiles: ctx.filePaths,
    context: formatContextForPrompt(ctx).slice(0, 20000),
  });

  const chat = await gatewayChat({
    role,
    system,
    user,
    maxTokens: 2200,
    json: true,
    allowOllama: allowOllama && !/curriculum|research/i.test(agentId),
  });

  const validated = await validateWithRepair(
    chat.text,
    {
      taskId: task.id,
      agent: agentId,
      provider: chat.provider,
      model: chat.model,
      status: chat.stub ? "needs_review" : "completed",
      tokenUsage: chat.tokenUsage || {},
      estimatedCost: chat.estimatedCost ?? null,
      fallbackSummary: String(chat.text || "").slice(0, 500),
    },
    async () =>
      (
        await gatewayChat({
          role,
          system: "Repair into valid AIOS agent JSON schema only.",
          user: chat.text,
          maxTokens: 1200,
          json: true,
          allowOllama: false,
        })
      ).text,
  );

  return {
    agent: agentId,
    provider: chat.provider,
    model: chat.model,
    durationMs: Date.now() - started,
    stub: Boolean(chat.stub),
    routing: chat.routing || chat.selection,
    contextFiles: ctx.filePaths,
    contractValid: validated.ok,
    repaired: Boolean(validated.repaired),
    output: {
      ...validated.data,
      summary: validated.data.summary,
      nextSteps: validated.data.testsRequired || [],
      findings: validated.data.assumptions || [],
      recommendations: validated.data.filesProposed || [],
    },
    tried: chat.tried,
    tokenUsage: chat.tokenUsage,
    estimatedCost: chat.estimatedCost,
  };
}

const RUNNERS = {
  engineering: (t) =>
    runStructuredAgent("engineering", t, {
      systemExtra: "Focus on architecture, integration, security-aware engineering plans.",
    }),
  backend: (t) =>
    runStructuredAgent("backend", t, { systemExtra: "APIs, services, auth boundaries; server-only secrets." }),
  frontend: (t) =>
    runStructuredAgent("frontend", t, { systemExtra: "UI composition and non-breaking UX extensions." }),
  database: (t) =>
    runStructuredAgent("database", t, { systemExtra: "Schema advice only — do not mutate production schema." }),
  security: (t) =>
    runStructuredAgent("security", t, {
      systemExtra: "OWASP: secrets, validation, sanitization, least privilege.",
      allowOllama: false,
    }),
  performance: (t) =>
    runStructuredAgent("performance", t, { systemExtra: "Latency, bundle, caching, scalability risks." }),
  curriculum: (t) =>
    runStructuredAgent("curriculum", t, {
      systemExtra: "Educational content. Never copy copyrighted textbooks.",
      allowOllama: false,
    }),
  research: (t) =>
    runStructuredAgent("research", t, {
      systemExtra: "Official research/verification. Confidence VERIFIED|PARTIAL|UNVERIFIED. No pirated sources.",
      allowOllama: false,
    }),
  translation: (t) => runStructuredAgent("translation", t, { systemExtra: "i18n / multilingual quality." }),
  accessibility: (t) => runStructuredAgent("accessibility", t, { systemExtra: "WCAG accessibility remediation plans." }),
  documentation: (t) =>
    runStructuredAgent("documentation", t, { systemExtra: "ADRs, setup notes, operator docs clarity." }),
  deployment: (t) => runStructuredAgent("deployment", t, { systemExtra: "Release/infra/rollback plans only." }),
  monitoring: (t) => runStructuredAgent("monitoring", t, { systemExtra: "Observability, alerts, SLOs." }),
  video: runVideoAgent,
  voice: runVoiceAgent,
  testing: runTestingAgent,
  "gpt-engineering": (t) => RUNNERS.engineering(t),
  "claude-curriculum": (t) => RUNNERS.curriculum(t),
  "gemini-research": (t) => RUNNERS.research(t),
};

export function listAgents() {
  return MANIFEST.agents.map((a) => ({ ...a, runnable: Boolean(RUNNERS[a.id]) }));
}

export function getAgentRunner(agentId) {
  return RUNNERS[agentId] || null;
}

export function registerAgent(agentId, runner) {
  if (typeof runner !== "function") throw new Error("INVALID_AGENT_RUNNER");
  RUNNERS[agentId] = runner;
}
