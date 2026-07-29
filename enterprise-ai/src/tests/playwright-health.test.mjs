#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  detectPlaywrightPackage,
  playwrightHealthCheck,
  resolvePlaywrightBaseUrl,
} from "../providers/playwright-health.js";
import { classifyHeyGenError } from "../providers/infra-health.js";
import { CanonicalStatus, colorForStatus } from "../providers/status-model.js";
import { runHealthCommand } from "../providers/health-runner.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aios-pw-"));

// Package detection
const pkg = detectPlaywrightPackage();
assert.equal(pkg.ok, true, "Playwright package should be installed");
assert.ok(pkg.version, "package version present");

// Remote blocked by default
const prevAllow = process.env.PLAYWRIGHT_ALLOW_REMOTE;
const prevBase = process.env.PLAYWRIGHT_BASE_URL;
process.env.PLAYWRIGHT_ALLOW_REMOTE = "false";
process.env.PLAYWRIGHT_BASE_URL = "https://example.com";
assert.throws(() => resolvePlaywrightBaseUrl(), /REMOTE_TESTING_BLOCKED/);
process.env.PLAYWRIGHT_BASE_URL = "http://localhost:3000";
const local = resolvePlaywrightBaseUrl();
assert.equal(local.origin, "http://localhost:3000");

// HeyGen timeout classification
const timeoutClass = classifyHeyGenError(new Error("The operation was aborted due to timeout"));
assert.equal(timeoutClass.classification, "HTTP_TIMEOUT");
const dnsClass = classifyHeyGenError(Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" }));
assert.equal(dnsClass.classification, "DNS_FAILURE");
const authClass = classifyHeyGenError(new Error("AUTHENTICATION_FAILED"), { httpStatus: 401 });
assert.equal(authClass.classification, "AUTHENTICATION_FAILED");

// Live probe with skipAppProbe — proves package+browser without requiring Next server
const probe = await playwrightHealthCheck({ skipAppProbe: true });
assert.equal(probe.packageInstalled, true);
assert.ok(probe.packageVersion);
assert.equal(probe.browserInstalled, true);
assert.ok(probe.browserVersion);
assert.equal(probe.status, "READY");
assert.equal(probe.authenticationValid, true);
assert.equal(probe.minimalRequestPassed, true);
assert.ok(Number.isFinite(probe.latencyMs));
assert.ok(!JSON.stringify(probe).includes("cookie"));
assert.ok(!("storageState" in probe));

// Full health runner for playwright (may be LOCAL_APP_UNAVAILABLE if app down)
const health = await runHealthCommand({
  mode: "live",
  provider: "playwright",
  rootDir: tmp,
  persist: true,
});
const pw = health.providers.find((p) => p.providerId === "playwright");
assert.ok(pw);
assert.notEqual(pw.status, CanonicalStatus.NOT_INSTALLED);
assert.ok(pw.packageInstalled === true || pw.status === CanonicalStatus.READY || pw.status === CanonicalStatus.LOCAL_APP_UNAVAILABLE);
assert.equal(health.vercelAutoDeployBlocked, true);
// No secrets in persisted file
const stateRaw = fs.readFileSync(path.join(tmp, "data/master-ai-orchestrator/health/provider-health-state.json"), "utf8");
assert.ok(!/sk-[A-Za-z0-9]{10,}/.test(stateRaw));
assert.ok(!/"cookies"\s*:/.test(stateRaw));

// Colour rules
assert.equal(colorForStatus(CanonicalStatus.READY), "green");
assert.equal(colorForStatus(CanonicalStatus.BROWSER_NOT_INSTALLED), "red");
assert.equal(colorForStatus(CanonicalStatus.CREDENTIALS_NOT_REQUIRED), "yellow");

// Restore env
if (prevAllow == null) delete process.env.PLAYWRIGHT_ALLOW_REMOTE;
else process.env.PLAYWRIGHT_ALLOW_REMOTE = prevAllow;
if (prevBase == null) delete process.env.PLAYWRIGHT_BASE_URL;
else process.env.PLAYWRIGHT_BASE_URL = prevBase;

console.log("playwright-health.test.mjs: OK", {
  packageVersion: pkg.version,
  browserVersion: probe.browserVersion,
  probeLatencyMs: probe.latencyMs,
  runnerStatus: pw.status,
});
