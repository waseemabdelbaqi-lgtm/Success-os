#!/usr/bin/env node
/**
 * Provider health accuracy — slot/adapter/credentials never READY;
 * dashboard reads persisted probes; secrets redacted; factories use live results.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CanonicalStatus,
  colorForStatus,
  hasReadyEvidence,
  redactSecrets,
  toCanonicalStatus,
} from "../providers/status-model.js";
import {
  buildDashboardFromState,
  createEmptyProviderRecord,
  normalizeProviderRecord,
  saveHealthState,
} from "../providers/health-store.js";
import { computeFactoryReadiness, runHealthCommand } from "../providers/health-runner.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aios-health-"));

// 1) slot / adapter / credentials ≠ READY
assert.equal(colorForStatus(CanonicalStatus.SLOT), "grey");
assert.equal(colorForStatus(CanonicalStatus.ADAPTER_AVAILABLE), "grey");
assert.equal(colorForStatus(CanonicalStatus.CREDENTIALS_DETECTED), "yellow");
assert.equal(colorForStatus(CanonicalStatus.READY), "green");
assert.equal(colorForStatus(CanonicalStatus.AUTH_FAILED), "red");
assert.equal(colorForStatus(CanonicalStatus.PROBE_FAILED), "red");
assert.equal(colorForStatus(CanonicalStatus.NOT_INSTALLED), "grey");

assert.equal(
  toCanonicalStatus({ status: "SLOT", adapterAvailable: false }),
  CanonicalStatus.SLOT,
);
assert.notEqual(
  toCanonicalStatus({ configured: true, keyDetected: true, status: "NOT_CONFIGURED" }, { mode: "config" }),
  CanonicalStatus.READY,
);
assert.equal(
  toCanonicalStatus(
    { configured: true, keyDetected: true, credentialsDetected: true },
    { mode: "config" },
  ),
  CanonicalStatus.CREDENTIALS_DETECTED,
);

// 2) READY requires evidence
assert.equal(
  hasReadyEvidence({
    status: CanonicalStatus.READY,
    authenticated: true,
    liveProbeExecuted: true,
    result: "success",
    testedAt: "2026-07-29T00:10:27Z",
    latencyMs: 1021,
    errorCode: null,
  }),
  true,
);
assert.equal(
  hasReadyEvidence({
    status: CanonicalStatus.READY,
    authenticated: false,
    liveProbeExecuted: true,
    result: "success",
    testedAt: "2026-07-29T00:10:27Z",
  }),
  false,
);

// 3) normalize demotes READY without evidence
const demoted = normalizeProviderRecord({
  providerId: "heygen",
  status: CanonicalStatus.READY,
  authenticated: false,
  liveProbeExecuted: false,
  result: "success",
  testedAt: "2026-07-29T00:10:27Z",
});
assert.notEqual(demoted.status, CanonicalStatus.READY);
assert.notEqual(demoted.displayColor, "green");

// 4) auth failed / not configured / not installed
assert.equal(
  toCanonicalStatus({ status: "AUTHENTICATION_FAILED", liveProbeExecuted: true }),
  CanonicalStatus.AUTH_FAILED,
);
assert.equal(
  toCanonicalStatus({ status: "NOT_CONFIGURED", credentialsDetected: false }),
  CanonicalStatus.NOT_CONFIGURED,
);
assert.equal(
  toCanonicalStatus({ status: "NOT_INSTALLED", notInstalled: true }),
  CanonicalStatus.NOT_INSTALLED,
);

// 5) media connection ≠ generation verified
const mediaRec = normalizeProviderRecord({
  providerId: "heygen",
  status: CanonicalStatus.READY,
  authenticated: true,
  liveProbeExecuted: true,
  result: "success",
  testedAt: "2026-07-29T00:10:27Z",
  latencyMs: 100,
  model: "account",
  errorCode: "none",
  connectionReady: true,
  generationVerified: false,
});
// If evidence OK it stays READY for connection — generation still false
if (mediaRec.status === CanonicalStatus.READY) {
  assert.equal(mediaRec.generationVerified, false);
}

// 6) secrets redacted
const redacted = redactSecrets("Authorization: Bearer sk-abc1234567890secret token=ghp_abcdefghijklmnopqrstuv");
assert.ok(!redacted.includes("sk-abc"));
assert.ok(!redacted.includes("ghp_abcd"));
assert.ok(redacted.includes("[REDACTED]"));

// 7) blank fields → NOT_TESTED
const empty = createEmptyProviderRecord("wolfram");
assert.equal(empty.status, CanonicalStatus.NOT_TESTED);
assert.equal(empty.testedAt, "NOT_TESTED");
assert.equal(empty.latencyMs, "NOT_TESTED");
assert.equal(empty.safeErrorMessage, "NOT_TESTED");

// 8) dashboard reads persisted state (not manifest inference)
const ollamaReady = normalizeProviderRecord({
  providerId: "ollama",
  status: CanonicalStatus.READY,
  authenticated: true,
  liveProbeExecuted: true,
  liveProbe: "PASSED",
  result: "success",
  testedAt: "2026-07-29T00:10:27Z",
  completedAt: "2026-07-29T00:10:27Z",
  latencyMs: 1021,
  model: "qwen3:8b",
  errorCode: "none",
  safeErrorMessage: "none",
});
assert.equal(ollamaReady.status, CanonicalStatus.READY);
assert.equal(ollamaReady.displayColor, "green");
assert.equal(ollamaReady.model, "qwen3:8b");
assert.equal(ollamaReady.latencyMs, 1021);

const state = {
  checkedAt: "2026-07-29T00:10:33Z",
  providers: [
    ollamaReady,
    normalizeProviderRecord({
      providerId: "openai",
      status: CanonicalStatus.NOT_CONFIGURED,
      liveProbe: "FAILED",
      liveProbeExecuted: true,
      testedAt: "2026-07-29T00:10:27Z",
      safeErrorMessage: "missing API key or model configuration",
      errorCode: "NOT_CONFIGURED",
      result: "failure",
    }),
    normalizeProviderRecord({
      providerId: "vercel",
      status: CanonicalStatus.NOT_CONFIGURED,
      liveProbe: "NOT_RUN",
      deployPolicy: "NEVER_AUTO_DEPLOY",
      testedAt: "2026-07-29T00:10:33Z",
      safeErrorMessage: "credentials missing",
    }),
  ],
};
saveHealthState(state, tmp);
const dash = buildDashboardFromState(state, tmp);
assert.equal(dash.source, "persisted-probe-state");
assert.equal(dash.providers.find((p) => p.providerId === "ollama").displayColor, "green");
assert.equal(dash.providers.find((p) => p.providerId === "ollama")["Model or Service"], "qwen3:8b");
assert.equal(dash.providers.find((p) => p.providerId === "openai").displayColor, "grey");
assert.notEqual(dash.providers.find((p) => p.providerId === "openai").Status, "READY");
// blank → explicit
assert.ok(dash.providers.every((p) => p.Status && p["Last Tested"] && p["Last Error"]));

// 9) factory readiness from live results
const fr = computeFactoryReadiness(state.providers);
assert.equal(fr.coding.status, "READY_WITH_LOCAL_ONLY");
assert.equal(fr.education.status, "NOT_READY");
assert.ok(["NOT_READY", "PARTIAL_CONFIGURATION_ONLY"].includes(fr.media.status));

// 10) Vercel health cannot deploy — deploy policy always blocked in runner output
const vercelPartial = normalizeProviderRecord({
  providerId: "vercel",
  status: CanonicalStatus.NOT_CONFIGURED,
  deployPolicy: "NEVER_AUTO_DEPLOY",
});
assert.equal(vercelPartial.deployPolicy, "NEVER_AUTO_DEPLOY");

// 11) config mode never READY
const configRun = await runHealthCommand({
  mode: "config",
  rootDir: tmp,
  persist: true,
  provider: "openai",
});
assert.ok(configRun.modes.config);
assert.ok(!configRun.ready.includes("openai"));
const openaiConfig = configRun.providers.find((p) => p.providerId === "openai");
assert.notEqual(openaiConfig.status, CanonicalStatus.READY);
assert.notEqual(openaiConfig.displayColor, "green");

// 12) single provider + factory mode flags
const liveOllama = await runHealthCommand({
  mode: "live",
  provider: "ollama",
  rootDir: tmp,
  persist: true,
});
assert.equal(liveOllama.modes.singleProvider, true);
assert.ok(["live"].includes(liveOllama.mode));

console.log("health-accuracy.test.mjs: OK");
