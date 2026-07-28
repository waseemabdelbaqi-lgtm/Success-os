/**
 * Agent registry — modular specialists. New agents register here without touching app code.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gatewayChat } from "../gateway/ai-gateway.js";
import { parseJsonLoose } from "./base.js";
import { runTestingAgent } from "./testing.js";
import { runVideoAgent } from "./video.js";
import { runVoiceAgent } from "./voice.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../config/agents.manifest.json"), "utf8"),
);

async function runJsonAgent(agentId, task, { preferredProviders, systemExtra = "" }) {
  const started = Date.now();
  const system = `You are the Success OS AIOS ${agentId} agent.
${systemExtra}
Return JSON only with keys: summary, findings, recommendations, risks, nextSteps (arrays where sensible).
Never hardcode secrets. Never claim completed code changes unless files are explicitly provided.
Preserve existing Success OS architecture — propose extensions only.`;
  const user = JSON.stringify({
    taskId: task.id,
    title: task.title,
    goal: task.goal,
    complexity: task.complexity,
    context: task.context || {},
  });
  const chat = await gatewayChat({
    preferred: preferredProviders,
    system,
    user,
  });
  const data = parseJsonLoose(chat.text) || {
    summary: String(chat.text || "").slice(0, 800),
    findings: [],
    recommendations: [],
    risks: chat.stub ? ["PROVIDER_KEYS_MISSING"] : [],
    nextSteps: ["Configure AI provider credentials for live agent execution"],
  };
  return {
    agent: agentId,
    provider: chat.provider,
    model: chat.model,
    durationMs: Date.now() - started,
    stub: Boolean(chat.stub),
    output: data,
    tried: chat.tried,
  };
}

const RUNNERS = {
  engineering: (task) =>
    runJsonAgent("engineering", task, {
      preferredProviders: ["openai", "ollama-local", "anthropic"],
      systemExtra: "Focus on architecture, integration, and safe bug-fix plans.",
    }),
  backend: (task) =>
    runJsonAgent("backend", task, {
      preferredProviders: ["openai", "ollama-local"],
      systemExtra: "Focus on APIs, services, auth boundaries, and server-only secrets.",
    }),
  frontend: (task) =>
    runJsonAgent("frontend", task, {
      preferredProviders: ["openai", "ollama-local"],
      systemExtra: "Focus on UI composition, reusable components, and non-breaking UX extensions.",
    }),
  database: (task) =>
    runJsonAgent("database", task, {
      preferredProviders: ["openai", "ollama-local"],
      systemExtra: "Advise on schema evolution only as plans — never mutate production schema here.",
    }),
  security: (task) =>
    runJsonAgent("security", task, {
      preferredProviders: ["openai", "anthropic", "ollama-local"],
      systemExtra: "Apply OWASP thinking: secrets, validation, sanitization, least privilege.",
    }),
  performance: (task) =>
    runJsonAgent("performance", task, {
      preferredProviders: ["openai", "ollama-local"],
      systemExtra: "Identify latency, bundle, caching, and scalability risks.",
    }),
  curriculum: (task) =>
    runJsonAgent("curriculum", task, {
      preferredProviders: ["anthropic", "ollama-local", "openai"],
      systemExtra:
        "Educational content only. Never copy copyrighted textbook prose. Prefer original Success OS content aligned to official outcomes.",
    }),
  research: (task) =>
    runJsonAgent("research", task, {
      preferredProviders: ["gemini", "ollama-local", "openai"],
      systemExtra:
        "Official curriculum research and verification. No pirated sources. Confidence must be VERIFIED|PARTIAL|UNVERIFIED.",
    }),
  translation: (task) =>
    runJsonAgent("translation", task, {
      preferredProviders: ["openai", "anthropic", "ollama-local"],
      systemExtra: "i18n / multilingual educational language quality.",
    }),
  accessibility: (task) =>
    runJsonAgent("accessibility", task, {
      preferredProviders: ["openai", "ollama-local"],
      systemExtra: "WCAG-oriented accessibility review and remediation plans.",
    }),
  documentation: (task) =>
    runJsonAgent("documentation", task, {
      preferredProviders: ["anthropic", "openai", "ollama-local"],
      systemExtra: "Produce concise ADRs, setup notes, and operator docs.",
    }),
  deployment: (task) =>
    runJsonAgent("deployment", task, {
      preferredProviders: ["openai", "ollama-local"],
      systemExtra: "Release, infra, rollback, and environment readiness plans.",
    }),
  monitoring: (task) =>
    runJsonAgent("monitoring", task, {
      preferredProviders: ["openai", "ollama-local"],
      systemExtra: "Observability, alerts, SLOs, and operational dashboards.",
    }),
  video: runVideoAgent,
  voice: runVoiceAgent,
  testing: runTestingAgent,
  // Back-compat aliases from earlier orchestrator naming
  "gpt-engineering": (task) => RUNNERS.engineering(task),
  "claude-curriculum": (task) => RUNNERS.curriculum(task),
  "gemini-research": (task) => RUNNERS.research(task),
};

export function listAgents() {
  return MANIFEST.agents.map((a) => ({
    ...a,
    runnable: Boolean(RUNNERS[a.id]),
  }));
}

export function getAgentRunner(agentId) {
  return RUNNERS[agentId] || null;
}

export function registerAgent(agentId, runner) {
  if (typeof runner !== "function") throw new Error("INVALID_AGENT_RUNNER");
  RUNNERS[agentId] = runner;
}
