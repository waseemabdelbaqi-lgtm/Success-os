#!/usr/bin/env node
import assert from "node:assert/strict";
import { loadAiosEnv } from "../env/load.js";
import { detectProviders } from "../providers/detect.js";
import { planRequest } from "../planning/engine.js";
import { runAIOS } from "../aios.js";
import { validateQuality } from "../quality-validator.js";
import { validateSecurity } from "../security/validator.js";
import { listAgents } from "../agents/registry.js";
import { listGatewayProviders, registerProvider } from "../gateway/ai-gateway.js";
import {
  createProviderRegistry,
  routeForRole,
  registrySnapshot,
  circuitBreakerStatus,
} from "../providers/registry.js";
import { validateAgentOutput, validateWithRepair } from "../contracts/agent-output.js";
import { assertCostBudget, estimateCostUsd } from "../cost/guards.js";
import { selectContext } from "../context/selector.js";
import { getMcpToolRegistry } from "../mcp/bridge.js";
import { ProviderStatus } from "../providers/errors.js";
import { summarizeFactories, factoryForAgent, listFactories } from "../factories/registry.js";

loadAiosEnv({ root: process.cwd() });
process.env.AIOS_FORCE_OFFLINE_STUB = "true";
process.env.AIOS_AUTO_COMMIT = "false";
process.env.AIOS_EXECUTION_MODE = "review";

const agents = listAgents();
assert.ok(agents.length >= 16, "expected full AIOS agent catalog");

const detection = await detectProviders();
assert.ok(detection.providers.length >= 7);

const plan = planRequest(
  "Research curriculum sources, propose secure backend API changes, improve frontend accessibility, and add tests with documentation",
);
assert.ok(plan.tasks.length >= 5);
assert.ok(plan.complexity?.level);
assert.ok(Array.isArray(plan.dependencyWaves));
assert.ok(plan.factoriesInvolved?.includes("coding"));
assert.ok(plan.factoriesInvolved?.includes("education"));
assert.equal(factoryForAgent("engineering"), "coding");
assert.equal(factoryForAgent("curriculum"), "education");
assert.equal(factoryForAgent("video"), "media");
assert.ok(listFactories().length === 3);

const factorySummary = await summarizeFactories({ providerDetection: detection });
assert.equal(factorySummary.system, "SUCCESS-AI-OS");
assert.ok(factorySummary.factories.some((f) => f.id === "coding"));
assert.ok(factorySummary.infrastructure.some((i) => i.id === "vercel" && i.autoAction === "never-auto-deploy"));

const eng = routeForRole("engineering");
assert.equal(eng.order[0], process.env.AIOS_ENGINEERING_PROVIDER || "openai");
const cur = routeForRole("curriculum");
assert.ok(cur.order.includes("anthropic"));
const res = routeForRole("research");
assert.ok(res.order.includes("gemini"));

const snap = registrySnapshot();
assert.ok(snap.adapters.includes("openai"));
assert.ok(Array.isArray(circuitBreakerStatus()));

const contractOk = validateAgentOutput({
  taskId: "t1",
  agent: "engineering",
  provider: "offline-stub",
  model: "none",
  status: "needs_review",
  summary: "ok",
});
assert.equal(contractOk.ok, true);

const repaired = await validateWithRepair(
  JSON.stringify({ taskId: "t2", agent: "x", provider: "p", model: "m", status: "bogus", summary: "" }),
  { taskId: "t2", agent: "x", provider: "p", model: "m" },
  async () =>
    JSON.stringify({
      taskId: "t2",
      agent: "x",
      provider: "p",
      model: "m",
      status: "needs_review",
      summary: "repaired",
    }),
);
assert.equal(repaired.ok, true);
assert.equal(repaired.repaired, true);

assert.equal(estimateCostUsd({ provider: "openai", inputTokens: 10, outputTokens: 10 }), null);
const budget = assertCostBudget({ estimatedCost: null, promptChars: 100 });
assert.equal(budget.ok, true);

const ctx = selectContext({
  projectRoot: process.cwd(),
  objective: "AIOS architecture registry providers",
  agent: "engineering",
});
assert.ok(Array.isArray(ctx.filePaths));

const mcp = getMcpToolRegistry();
assert.ok(mcp.tools.length >= 5);
assert.ok(mcp.restrictions.length >= 1);

const qualityReject = validateQuality({
  merged: {
    summaries: [{ agent: "x", summary: "TODO placeholder content here" }],
    providersUsed: [],
    agentsCompleted: [],
    agentsFailed: [],
  },
});
assert.equal(qualityReject.ok, false);

const securityReject = validateSecurity({
  merged: { engineering: { summary: "set api_key = 'sk-aaaaaaaaaaaaaaaaaaaa'" } },
});
assert.equal(securityReject.ok, false);

const before = listGatewayProviders().length;
registerProvider("future-demo", {
  configured: async () => false,
  chat: async () => ({ provider: "future-demo", model: "x", text: "{}" }),
});
assert.ok(listGatewayProviders().length === before + 1);

const registry = createProviderRegistry();
assert.equal(typeof registry.runAllHealthChecks, "function");

const report = await runAIOS(
  "AIOS smoke: curriculum research + engineering security review + testing documentation",
  { context: { runSmoke: false }, executionMode: "review" },
);
assert.ok(report.system === "SUCCESS-OS-AIOS");
assert.ok(report.version === "3.0.0");
assert.equal(report.executionMode, "REVIEW");
assert.equal(report.review.patchesApplied, false);
assert.equal(report.git.autoPush, false);
assert.equal(report.git.autoDeploy, false);
assert.ok(report.executive?.recommendedNextStep);
assert.ok(report.documentation?.path);
assert.ok(report.agentsUsed.length >= 1);

console.log(
  JSON.stringify(
    {
      ok: true,
      phase: 3,
      agentsRegistered: agents.length,
      gatewayProviders: listGatewayProviders(),
      activeProviders: detection.active,
      routing: { engineering: eng.order, curriculum: cur.order, research: res.order },
      providerStatusesKnown: Object.values(ProviderStatus),
      tasksCompleted: report.tasksCompleted.length,
      status: report.status,
      executionMode: report.executionMode,
      multiAgentLive: report.multiAgentLive,
      executive: report.executive,
      reportPath: report.reportPath,
    },
    null,
    2,
  ),
);
