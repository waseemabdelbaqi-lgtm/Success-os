#!/usr/bin/env node
/**
 * Hard rule: no provider is green unless last probe was live authenticated success.
 */
import assert from "node:assert/strict";
import {
  buildInfrastructureDashboard,
  displayColorForProbe,
  isLiveAuthenticatedReady,
  toInfrastructureRow,
} from "../providers/live-status.js";
import { ProviderStatus } from "../providers/errors.js";
import { summarizeFactories } from "../factories/registry.js";

// Credentials-only must never be green
assert.equal(
  isLiveAuthenticatedReady({
    status: ProviderStatus.READY,
    authenticationValid: false,
    minimalRequestPassed: true,
    checkedAt: new Date().toISOString(),
  }),
  false,
);
assert.equal(
  isLiveAuthenticatedReady({
    status: "CONFIGURED",
    authenticationValid: true,
    minimalRequestPassed: true,
    checkedAt: new Date().toISOString(),
  }),
  false,
);
assert.equal(
  displayColorForProbe({
    status: ProviderStatus.READY,
    authenticationValid: true,
    minimalRequestPassed: false,
    checkedAt: new Date().toISOString(),
  }),
  "neutral",
);

// Full live auth success → green
const liveOk = {
  provider: "openai",
  status: ProviderStatus.READY,
  authenticationValid: true,
  minimalRequestPassed: true,
  latencyMs: 120,
  checkedAt: "2026-07-18T00:00:00.000Z",
};
assert.equal(isLiveAuthenticatedReady(liveOk), true);
assert.equal(displayColorForProbe(liveOk), "green");

const row = toInfrastructureRow(liveOk);
assert.equal(row.displayColor, "green");
assert.equal(row.النتيجة, "نجاح");
assert.equal(row["زمن الاستجابة"], "120ms");
assert.equal(row["آخر خطأ"], "—");
assert.equal(row.Status, "READY");
assert.equal(row.Latency, "120 ms");

// Ollama live success (model + latency card fields)
const ollamaOk = {
  provider: "ollama",
  status: ProviderStatus.READY,
  authenticationValid: true,
  minimalRequestPassed: true,
  model: "qwen3:8b",
  latencyMs: 1021,
  checkedAt: "2026-07-18T00:00:00.000Z",
};
const ollamaRow = toInfrastructureRow(ollamaOk);
assert.equal(ollamaRow.displayColor, "green");
assert.equal(ollamaRow.Model, "qwen3:8b");
assert.equal(ollamaRow.Status, "READY");
assert.equal(ollamaRow.Latency, "1021 ms");

const dashWithOllama = buildInfrastructureDashboard([ollamaOk], {
  checkedAt: ollamaOk.checkedAt,
});
assert.ok(dashWithOllama.providers.find((p) => p.id === "ollama")?.displayColor === "green");
assert.equal(dashWithOllama.providers.find((p) => p.id === "ollama")?.Model, "qwen3:8b");
// ollama-local alias must also paint the ollama row
const dashAlias = buildInfrastructureDashboard(
  [{ ...ollamaOk, provider: "ollama-local" }],
  { checkedAt: ollamaOk.checkedAt },
);
assert.equal(dashAlias.providers.find((p) => p.id === "ollama")?.displayColor, "green");

// Keys present without probe → not green, Arabic fields populated
const keysOnly = toInfrastructureRow({
  provider: "heygen",
  status: "CONFIGURED",
  configured: true,
  authenticationValid: false,
  minimalRequestPassed: false,
  checkedAt: null,
  lastError: "NO_LIVE_AUTHENTICATED_PROBE",
});
assert.equal(keysOnly.displayColor, "neutral");
assert.notEqual(keysOnly.displayColor, "green");
assert.equal(keysOnly.النتيجة, "لم يُختبر");
assert.ok(keysOnly["آخر خطأ"]);

const dash = buildInfrastructureDashboard(
  [
    liveOk,
    {
      provider: "heygen",
      status: ProviderStatus.NOT_CONFIGURED,
      authenticationValid: false,
      minimalRequestPassed: false,
      checkedAt: "2026-07-18T00:00:00.000Z",
    },
  ],
  { checkedAt: "2026-07-18T00:00:00.000Z" },
);
assert.equal(dash.greenCount, 1);
assert.ok(dash.providers.every((p) => p.displayColor === "green" || p.displayColor === "neutral"));
assert.ok(dash.providers.find((p) => p.id === "openai")?.displayColor === "green");
assert.ok(dash.providers.find((p) => p.id === "heygen")?.displayColor === "neutral");
assert.ok(dash.providers.find((p) => p.id === "vercel")?.displayColor === "neutral");
assert.match(dash.rule, /أخضر/);

// Factory readyProviders must ignore credential-only detection
const fakeDetection = {
  checkedAt: new Date().toISOString(),
  providers: [
    { id: "heygen", configured: true, detail: "credentials present" },
    { id: "elevenlabs", configured: true, detail: "credentials present" },
    { id: "openai-images", configured: true, detail: "credentials present" },
    { id: "anthropic", configured: true, detail: "credentials present" },
    { id: "openai", configured: true, detail: "credentials present" },
    { id: "gemini", configured: false, detail: "missing" },
    { id: "wolfram", configured: true, detail: "credentials present" },
    { id: "cursor", configured: true, detail: "surface" },
    { id: "ollama-local", configured: false, detail: "offline" },
    { id: "blender", configured: false, detail: "slot" },
  ],
};
const summaryNoProbe = await summarizeFactories({
  providerDetection: fakeDetection,
  liveProbes: [],
});
const media = summaryNoProbe.factories.find((f) => f.id === "media");
assert.ok(media);
assert.deepEqual(media.readyProviders, []);
assert.ok(media.credentialedProviders.includes("heygen"));
assert.equal(media.readiness, "AWAITING_LIVE_PROBE");
assert.ok(media.providers.every((p) => p.displayColor !== "green"));

const summaryWithLive = await summarizeFactories({
  providerDetection: fakeDetection,
  liveProbes: [liveOk],
});
const coding = summaryWithLive.factories.find((f) => f.id === "coding");
assert.ok(coding.readyProviders.includes("openai"));
assert.ok(coding.providers.find((p) => p.id === "openai")?.displayColor === "green");
assert.ok(coding.providers.find((p) => p.id === "anthropic")?.displayColor !== "green");

console.log("live-status.test.mjs: OK");
