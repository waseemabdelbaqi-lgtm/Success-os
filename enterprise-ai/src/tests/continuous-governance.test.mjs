#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CanonicalStatus, ProviderLifecycle } from "../providers/status-model.js";
import { normalizeProviderRecord, saveHealthState } from "../providers/health-store.js";
import {
  applyAutomaticDowngrade,
  computeFactoryHealthReport,
  rankFactoryProviders,
  selectFallbackProvider,
} from "../providers/continuous-governance.js";
import { continuousConfig, intervalForLifecycle } from "../providers/continuous-config.js";
import {
  buildHistoryEntry,
  loadGovernanceState,
  saveGovernanceState,
} from "../providers/continuous-history.js";

const cfg = continuousConfig();
assert.equal(cfg.autoPromote, false);
assert.equal(cfg.mediaGenerationAllowed, false);
assert.ok(cfg.intervals.READY >= cfg.intervals.PRODUCTION_CERTIFIED);
assert.ok(cfg.intervals.PRODUCTION_CERTIFIED >= cfg.intervals.MISSION_CRITICAL);
assert.equal(intervalForLifecycle("MISSION_CRITICAL"), cfg.intervals.MISSION_CRITICAL);

// MC failure → demote missionCritical flag (auto-downgrade, never promote)
const mc = normalizeProviderRecord({
  providerId: "openai",
  status: CanonicalStatus.AUTH_FAILED,
  authenticated: false,
  liveProbeExecuted: true,
  liveProbe: "FAILED",
  result: "failure",
  testedAt: "2026-07-30T00:00:00.000Z",
  latencyMs: 10,
  errorCode: "AUTH_FAILED",
  safeErrorMessage: "auth failed",
  credentialsDetected: true,
  consecutiveFailures: 1,
  productionCertified: true,
  missionCritical: true,
  lifecycleStage: ProviderLifecycle.MISSION_CRITICAL,
});
const prevMc = {
  ...mc,
  status: CanonicalStatus.MISSION_CRITICAL,
  lifecycleStage: ProviderLifecycle.MISSION_CRITICAL,
  missionCritical: true,
  productionCertified: true,
  consecutiveFailures: 0,
};
const d1 = applyAutomaticDowngrade(mc, prevMc);
assert.equal(d1.downgraded, true);
assert.equal(d1.record.missionCritical, false);
assert.equal(d1.record.productionCertified, true);
assert.ok(d1.alerts.some((a) => a.type === "MISSION_CRITICAL_DOWNGRADE"));
assert.ok(d1.alerts.some((a) => a.type === "CERTIFICATION_REVOKED"));

// PC continued failures → clear productionCertified
const pcFail = normalizeProviderRecord({
  providerId: "openai",
  status: CanonicalStatus.PROBE_FAILED,
  authenticated: false,
  liveProbeExecuted: true,
  liveProbe: "FAILED",
  result: "failure",
  testedAt: "2026-07-30T00:00:00.000Z",
  latencyMs: 10,
  errorCode: "PROBE_FAILED",
  credentialsDetected: true,
  consecutiveFailures: 3,
  productionCertified: true,
  missionCritical: false,
  lifecycleStage: ProviderLifecycle.PRODUCTION_CERTIFIED,
});
const d2 = applyAutomaticDowngrade(pcFail, {
  ...pcFail,
  status: CanonicalStatus.PRODUCTION_CERTIFIED,
  lifecycleStage: ProviderLifecycle.PRODUCTION_CERTIFIED,
  productionCertified: true,
  missionCritical: false,
  consecutiveFailures: 2,
});
assert.equal(d2.downgraded, true);
assert.equal(d2.record.productionCertified, false);
assert.ok(d2.alerts.some((a) => a.type === "CERTIFICATION_REVOKED"));

// Ranking prefers healthy highest priority / tier
const records = [
  normalizeProviderRecord({
    providerId: "openai",
    status: CanonicalStatus.READY,
    authenticated: true,
    liveProbeExecuted: true,
    liveProbe: "PASSED",
    result: "success",
    testedAt: "2026-07-30T00:00:00.000Z",
    latencyMs: 100,
    errorCode: "none",
    credentialsDetected: true,
  }),
  normalizeProviderRecord({
    providerId: "anthropic",
    status: CanonicalStatus.READY,
    authenticated: true,
    liveProbeExecuted: true,
    liveProbe: "PASSED",
    result: "success",
    testedAt: "2026-07-30T00:00:00.000Z",
    latencyMs: 80,
    errorCode: "none",
    credentialsDetected: true,
    productionCertified: true,
  }),
  normalizeProviderRecord({
    providerId: "ollama",
    status: CanonicalStatus.NETWORK_FAILED,
    liveProbeExecuted: true,
    liveProbe: "FAILED",
    result: "failure",
    testedAt: "2026-07-30T00:00:00.000Z",
    credentialsDetected: true,
  }),
];
const ranking = rankFactoryProviders(records, "coding");
assert.equal(ranking.priorities[0], "anthropic");
assert.ok(ranking.selected);
assert.equal(ranking.selected.providerId, "anthropic");

const failover = selectFallbackProvider(records, "anthropic");
assert.equal(failover.to, "openai");

const factoryHealth = computeFactoryHealthReport(records);
assert.ok(factoryHealth.factories.coding);
assert.ok(factoryHealth.factories.coding.overallHealthScore >= 0);
assert.equal(factoryHealth.factories.coding.selectedProvider, "anthropic");
assert.equal(factoryHealth.factories.coding.fallbackAvailability, true);

// History entry never contains raw secret-like fields unchecked
const entry = buildHistoryEntry({
  providerId: "openai",
  statusBefore: "READY",
  statusAfter: "AUTH_FAILED",
  eventType: "auto_downgrade",
  errorClassification: "Bearer sk-secret-should-redact",
  success: false,
});
assert.ok(!String(entry.errorClassification).includes("sk-secret"));

{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aios-gov-"));
  saveHealthState(
    {
      checkedAt: new Date().toISOString(),
      mode: "test",
      providers: records,
      factories: {},
      alerts: [],
    },
    tmp,
  );
  const gov = loadGovernanceState(tmp);
  gov.history = [entry];
  gov.downgrades = [entry];
  saveGovernanceState(gov, tmp);
  const loaded = loadGovernanceState(tmp);
  assert.equal(loaded.history.length, 1);
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("continuous-governance.test.mjs: OK");
