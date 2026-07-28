#!/usr/bin/env node
import assert from "node:assert/strict";
import { detectProviders } from "../providers/detect.js";
import { planRequest } from "../planning/engine.js";
import { runAIOS } from "../aios.js";
import { validateQuality } from "../quality-validator.js";
import { validateSecurity } from "../security/validator.js";
import { listAgents } from "../agents/registry.js";
import { listGatewayProviders, registerProvider } from "../gateway/ai-gateway.js";

process.env.AIOS_FORCE_OFFLINE_STUB = "true";

const agents = listAgents();
assert.ok(agents.length >= 16, "expected full AIOS agent catalog");

const detection = await detectProviders();
assert.ok(detection.providers.length >= 7);

const plan = planRequest(
  "Research curriculum sources, propose secure backend API changes, improve frontend accessibility, and add tests with documentation",
);
assert.ok(plan.tasks.length >= 5);
assert.ok(plan.complexity?.level);

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

// Future provider registration stays modular
const before = listGatewayProviders().length;
registerProvider("future-demo", {
  configured: async () => false,
  chat: async () => ({ provider: "future-demo", model: "x", text: "{}" }),
});
assert.ok(listGatewayProviders().length === before + 1);

const report = await runAIOS(
  "AIOS smoke: curriculum research + engineering security review + testing documentation",
  { context: { runSmoke: false } },
);
assert.ok(report.system === "SUCCESS-OS-AIOS");
assert.ok(report.executive?.recommendedNextStep);
assert.ok(report.documentation?.path);
assert.ok(report.agentsUsed.length >= 1);

console.log(
  JSON.stringify(
    {
      ok: true,
      agentsRegistered: agents.length,
      gatewayProviders: listGatewayProviders(),
      activeProviders: detection.active,
      tasksCompleted: report.tasksCompleted.length,
      status: report.status,
      executive: report.executive,
      reportPath: report.reportPath,
    },
    null,
    2,
  ),
);
