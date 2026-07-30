#!/usr/bin/env node
/**
 * AIOS Provider Router tests — eligibility, ranking, fallback, cost, budgets, explain.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CanonicalStatus, ProviderLifecycle } from "../providers/status-model.js";
import { normalizeProviderRecord, saveHealthState } from "../providers/health-store.js";
import {
  providerSupportsCapability,
  resolveRequiredCapability,
  Capabilities,
  listCapabilityRegistry,
} from "../providers/capability-registry.js";
import {
  estimateRequestCost,
  checkBudget,
  recordActualCost,
  saveCostLedger,
} from "../providers/cost-engine.js";
import {
  rankProvidersForTask,
  routeTask,
  explainRoute,
  executeWithFallback,
  simulateRoute,
} from "../providers/provider-router.js";
import { saveRouterMetrics } from "../providers/router-metrics.js";

function readyRecord(providerId, extras = {}) {
  return normalizeProviderRecord({
    providerId,
    status: extras.status || CanonicalStatus.READY,
    authenticated: true,
    liveProbeExecuted: true,
    liveProbe: "PASSED",
    result: "success",
    testedAt: "2026-07-18T00:00:00.000Z",
    latencyMs: extras.latencyMs ?? 100,
    model: "test-model",
    credentialsDetected: true,
    consecutiveFailures: 0,
    productionCertified: Boolean(extras.productionCertified),
    missionCritical: Boolean(extras.missionCritical),
    lifecycleStage:
      extras.lifecycleStage ||
      (extras.missionCritical
        ? ProviderLifecycle.MISSION_CRITICAL
        : extras.productionCertified
          ? ProviderLifecycle.PRODUCTION_CERTIFIED
          : ProviderLifecycle.READY),
    ...extras,
  });
}

function fixtureRoot(providers) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aios-router-"));
  saveHealthState(
    {
      checkedAt: new Date().toISOString(),
      mode: "test",
      providers,
      factories: {},
      alerts: [],
    },
    tmp,
  );
  saveRouterMetrics({ version: 1, providers: {}, decisions: [], failovers: [] }, tmp);
  saveCostLedger({ version: 1, month: "2026-07", byProvider: {}, entries: [] }, tmp);
  return tmp;
}

// Capability registry rejects unsupported tasks
assert.equal(providerSupportsCapability("heygen", Capabilities.CHAT), false);
assert.equal(providerSupportsCapability("heygen", Capabilities.AVATAR_VIDEO), true);
assert.equal(providerSupportsCapability("openai", Capabilities.IMAGE_GENERATION), true);
assert.equal(providerSupportsCapability("playwright", Capabilities.BROWSER_AUTOMATION), true);
assert.equal(resolveRequiredCapability("coding"), Capabilities.CODING);
assert.ok(listCapabilityRegistry().length >= 8);

{
  const tmp = fixtureRoot([
    readyRecord("openai"),
    readyRecord("heygen"),
  ]);
  const ranked = rankProvidersForTask({ taskType: "avatar_video", rootDir: tmp, persist: false });
  assert.ok(ranked.rejected.some((r) => r.providerId === "openai" && r.reason === "UNSUPPORTED_CAPABILITY"));
  assert.equal(ranked.selected?.providerId, "heygen");
  fs.rmSync(tmp, { recursive: true, force: true });
}

// Only READY or higher are eligible
{
  const tmp = fixtureRoot([
    normalizeProviderRecord({
      providerId: "openai",
      status: CanonicalStatus.CREDENTIALS_DETECTED,
      credentialsDetected: true,
      authenticated: false,
      liveProbeExecuted: false,
      lifecycleStage: ProviderLifecycle.CREDENTIALS_DETECTED,
    }),
    readyRecord("anthropic"),
  ]);
  const ranked = rankProvidersForTask({ taskType: "coding", rootDir: tmp });
  assert.ok(ranked.rejected.some((r) => r.providerId === "openai" && r.reason === "BELOW_READY"));
  assert.ok(!ranked.candidates.some((c) => c.providerId === "openai"));
  assert.equal(ranked.selected?.providerId, "anthropic");
  fs.rmSync(tmp, { recursive: true, force: true });
}

// Routing prefers higher lifecycle states (MISSION_CRITICAL > PRODUCTION_CERTIFIED > READY)
{
  const tmp = fixtureRoot([
    readyRecord("openai", { latencyMs: 50 }),
    readyRecord("anthropic", {
      productionCertified: true,
      status: CanonicalStatus.PRODUCTION_CERTIFIED,
      lifecycleStage: ProviderLifecycle.PRODUCTION_CERTIFIED,
      latencyMs: 200,
    }),
    readyRecord("gemini", {
      productionCertified: true,
      missionCritical: true,
      status: CanonicalStatus.MISSION_CRITICAL,
      lifecycleStage: ProviderLifecycle.MISSION_CRITICAL,
      latencyMs: 300,
    }),
  ]);
  const ranked = rankProvidersForTask({ taskType: "chat", rootDir: tmp });
  assert.equal(ranked.selected?.providerId, "gemini");
  assert.equal(ranked.candidates[0].lifecycleStage, ProviderLifecycle.MISSION_CRITICAL);
  assert.ok(
    ranked.candidates.findIndex((c) => c.providerId === "anthropic") <
      ranked.candidates.findIndex((c) => c.providerId === "openai"),
  );
  fs.rmSync(tmp, { recursive: true, force: true });
}

// Fallback works correctly (bounded)
{
  const tmp = fixtureRoot([
    readyRecord("openai", {
      missionCritical: true,
      productionCertified: true,
      status: CanonicalStatus.MISSION_CRITICAL,
      lifecycleStage: ProviderLifecycle.MISSION_CRITICAL,
    }),
    readyRecord("anthropic", {
      productionCertified: true,
      status: CanonicalStatus.PRODUCTION_CERTIFIED,
      lifecycleStage: ProviderLifecycle.PRODUCTION_CERTIFIED,
    }),
  ]);
  const result = await executeWithFallback({
    taskType: "coding",
    rootDir: tmp,
    maxFallbacks: 2,
    maxRetries: 0,
    executor: async (candidate) => {
      if (candidate.providerId === "openai") {
        return { ok: false, error: "PRIMARY_DOWN", latencyMs: 5 };
      }
      return { ok: true, result: { text: "ok" }, latencyMs: 8, costUsd: 0.01 };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.providerId, "anthropic");
  assert.equal(result.failover, true);
  assert.ok(result.attempts.length >= 2);
  fs.rmSync(tmp, { recursive: true, force: true });
}

// Cost estimation is accurate
{
  const est = estimateRequestCost({
    providerId: "openai",
    taskType: "chat",
    inputTokens: 1000,
    expectedOutputTokens: 1000,
  });
  assert.equal(est.ok, true);
  assert.equal(est.tokens.input, 1000);
  assert.equal(est.tokens.output, 1000);
  const expected =
    (1000 / 1000) * Number(process.env.AIOS_COST_OPENAI_INPUT_1K || 0.005) +
    (1000 / 1000) * Number(process.env.AIOS_COST_OPENAI_OUTPUT_1K || 0.015);
  assert.equal(est.estimatedTotalUsd, Number(expected.toFixed(6)));

  const img = estimateRequestCost({
    providerId: "openai-images",
    taskType: "image_generation",
    capability: Capabilities.IMAGE_GENERATION,
    imageCount: 2,
  });
  assert.equal(img.mediaGenerationCost, Number(process.env.AIOS_COST_OPENAI_IMAGE || 0.04) * 2);
}

// Budget enforcement works
{
  const tmp = fixtureRoot([readyRecord("openai")]);
  recordActualCost({
    providerId: "openai",
    estimatedTotalUsd: 99,
    actualTotalUsd: 99,
    rootDir: tmp,
  });
  const warn = checkBudget({
    providerId: "openai",
    estimatedTotalUsd: 1,
    rootDir: tmp,
    warnRatio: 0.8,
  });
  assert.equal(warn.warning, true);
  assert.equal(warn.blocked, false);

  const blocked = checkBudget({
    providerId: "openai",
    estimatedTotalUsd: 5,
    rootDir: tmp,
    warnRatio: 0.8,
  });
  assert.equal(blocked.blocked, true);

  const ranked = rankProvidersForTask({
    taskType: "chat",
    rootDir: tmp,
    estimatedInputTokens: 100000,
    estimatedOutputTokens: 100000,
  });
  assert.ok(ranked.rejected.some((r) => r.providerId === "openai" && r.reason === "BUDGET_EXCEEDED"));
  fs.rmSync(tmp, { recursive: true, force: true });
}

// Routing explanations are deterministic
{
  const tmp = fixtureRoot([
    readyRecord("openai", { latencyMs: 120 }),
    readyRecord("anthropic", { latencyMs: 120 }),
  ]);
  const a = explainRoute(rankProvidersForTask({ taskType: "coding", rootDir: tmp }));
  const b = explainRoute(rankProvidersForTask({ taskType: "coding", rootDir: tmp }));
  assert.equal(a.explanation, b.explanation);
  assert.deepEqual(a.ranking, b.ranking);
  const routed = routeTask({ taskType: "coding", rootDir: tmp, persist: false });
  assert.equal(routed.autoPromote, false);
  assert.equal(routed.routedBelowReady, false);
  const sim = simulateRoute({ taskType: "coding", rootDir: tmp, persist: false });
  assert.equal(sim.action, "SIMULATE");
  assert.ok(Array.isArray(sim.costs));
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("provider-router.test.mjs: OK");
