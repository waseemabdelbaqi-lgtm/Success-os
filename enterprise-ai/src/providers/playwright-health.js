/**
 * Playwright live health probe.
 * READY requires: package + Chromium + browser launch + local page smoke + persisted evidence.
 * Package install alone is never READY. Remote URLs blocked unless PLAYWRIGHT_ALLOW_REMOTE=true.
 */
import { createRequire } from "node:module";
import { ProviderStatus } from "./errors.js";
import { CanonicalStatus } from "./status-model.js";

const require = createRequire(import.meta.url);

function baseReport() {
  return {
    provider: "playwright",
    configured: false,
    keyDetected: false,
    packageInstalled: false,
    packageVersion: null,
    browserInstalled: false,
    browserVersion: null,
    networkReachable: false,
    authenticationValid: false,
    minimalRequestPassed: false,
    liveProbeExecuted: false,
    latencyMs: null,
    status: CanonicalStatus.NOT_INSTALLED,
    errorCategory: null,
    lastError: null,
    targetType: "LOCAL",
    targetURL: "NOT_TESTED",
    model: "NOT_TESTED",
    endpoint: "local-chromium",
    checkedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
  };
}

export function resolvePlaywrightBaseUrl() {
  const raw = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000").trim();
  const allowRemote = process.env.PLAYWRIGHT_ALLOW_REMOTE === "true";
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    const err = new Error("PLAYWRIGHT_BASE_URL_INVALID");
    err.code = "PLAYWRIGHT_BASE_URL_INVALID";
    throw err;
  }
  const host = parsed.hostname.toLowerCase();
  const local =
    host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1";
  if (!local && !allowRemote) {
    const err = new Error(`REMOTE_TESTING_BLOCKED:${host}`);
    err.code = "REMOTE_TESTING_BLOCKED";
    throw err;
  }
  return { origin: parsed.origin, path: "/", redacted: `${parsed.origin}/` };
}

function detectPackage() {
  try {
    const pkg = require("playwright/package.json");
    return { ok: true, version: pkg.version || null, from: "playwright" };
  } catch {
    try {
      const pkg = require("@playwright/test/package.json");
      return { ok: true, version: pkg.version || null, from: "@playwright/test" };
    } catch {
      return { ok: false, version: null, from: null };
    }
  }
}

async function importChromium() {
  try {
    const mod = await import("playwright");
    return mod.chromium;
  } catch {
    const mod = await import("@playwright/test");
    return mod.chromium;
  }
}

/**
 * Full Playwright health probe used by AIOS health runner.
 */
export async function playwrightHealthCheck({ skipAppProbe = false } = {}) {
  const report = baseReport();
  const started = Date.now();

  const pkg = detectPackage();
  if (!pkg.ok) {
    report.status = CanonicalStatus.NOT_INSTALLED;
    report.errorCategory = "NOT_INSTALLED";
    report.lastError = "Playwright not installed";
    report.liveProbeExecuted = true;
    report.checkedAt = new Date().toISOString();
    report.latencyMs = Date.now() - started;
    return report;
  }

  report.packageInstalled = true;
  report.packageVersion = pkg.version;
  report.configured = true;
  report.model = `playwright@${pkg.version || "unknown"}`;
  // No API credentials required for local tooling
  report.keyDetected = false;
  report.status = "CREDENTIALS_NOT_REQUIRED";

  let chromium;
  try {
    chromium = await importChromium();
  } catch (err) {
    report.status = "BROWSER_NOT_INSTALLED";
    report.errorCategory = "BROWSER_NOT_INSTALLED";
    report.lastError = String(err?.message || err);
    report.liveProbeExecuted = true;
    report.latencyMs = Date.now() - started;
    report.checkedAt = new Date().toISOString();
    return report;
  }

  let target;
  try {
    target = resolvePlaywrightBaseUrl();
    report.targetURL = target.redacted;
    report.targetType = "LOCAL";
  } catch (err) {
    report.status =
      err?.code === "REMOTE_TESTING_BLOCKED" ? "REMOTE_TESTING_BLOCKED" : CanonicalStatus.PROBE_FAILED;
    report.errorCategory = err?.code || "PROBE_FAILED";
    report.lastError = String(err?.message || err);
    report.liveProbeExecuted = true;
    report.latencyMs = Date.now() - started;
    report.checkedAt = new Date().toISOString();
    return report;
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    report.browserInstalled = true;
    report.browserVersion = browser.version();
  } catch (err) {
    const msg = String(err?.message || err);
    report.status = /Executable doesn't exist|browserType\.launch/i.test(msg)
      ? "BROWSER_NOT_INSTALLED"
      : "BROWSER_LAUNCH_FAILED";
    report.errorCategory = report.status;
    report.lastError = msg.slice(0, 240);
    report.liveProbeExecuted = true;
    report.latencyMs = Date.now() - started;
    report.checkedAt = new Date().toISOString();
    return report;
  }

  try {
    const page = await browser.newPage();
    // Always prove browser can render a local document
    await page.setContent("<html><body data-aios='1'>AIOS_OK</body></html>");
    const localText = (await page.locator("body").innerText()).trim();
    if (localText !== "AIOS_OK") {
      report.status = "TEST_ASSERTION_FAILED";
      report.errorCategory = "TEST_ASSERTION_FAILED";
      report.lastError = "LOCAL_DOCUMENT_ASSERTION_FAILED";
      report.liveProbeExecuted = true;
      report.authenticationValid = false;
      report.minimalRequestPassed = false;
      return report;
    }

    let appOk = skipAppProbe;
    let appDetail = skipAppProbe ? "skipped" : null;
    if (!skipAppProbe) {
      try {
        const res = await page.goto(target.origin + "/", {
          waitUntil: "domcontentloaded",
          timeout: Number(process.env.PLAYWRIGHT_PROBE_TIMEOUT_MS || 30000),
        });
        const status = res?.status() || 0;
        const title = await page.title().catch(() => "");
        const visible = await page.locator("body").isVisible();
        appOk = Boolean(res && status < 500 && title && visible);
        appDetail = appOk
          ? `home status=${status} title_len=${title.length}`
          : `LOCAL_APP_UNAVAILABLE status=${status}`;
        if (!appOk) {
          // App may be down — still record browser success path as non-READY
          report.status = "LOCAL_APP_UNAVAILABLE";
          report.errorCategory = "LOCAL_APP_UNAVAILABLE";
          report.lastError = appDetail;
          report.liveProbeExecuted = true;
          report.authenticationValid = true; // browser runtime ok
          report.minimalRequestPassed = false;
          report.networkReachable = true;
          return report;
        }
      } catch (err) {
        report.status = "LOCAL_APP_UNAVAILABLE";
        report.errorCategory = "LOCAL_APP_UNAVAILABLE";
        report.lastError = String(err?.message || err).slice(0, 240);
        report.liveProbeExecuted = true;
        report.authenticationValid = true;
        report.minimalRequestPassed = false;
        report.networkReachable = false;
        return report;
      }
    }

    report.networkReachable = true;
    report.authenticationValid = true;
    report.minimalRequestPassed = true;
    report.liveProbeExecuted = true;
    report.status = ProviderStatus.READY;
    report.lastError = null;
    report.errorCategory = null;
    report.detail = appDetail || "local smoke ok";
    report.endpoint = report.targetURL;
  } catch (err) {
    report.status = CanonicalStatus.PROBE_FAILED;
    report.errorCategory = "PROBE_FAILED";
    report.lastError = String(err?.message || err).slice(0, 240);
    report.liveProbeExecuted = true;
    report.minimalRequestPassed = false;
  } finally {
    await browser.close().catch(() => undefined);
    report.latencyMs = Date.now() - started;
    report.checkedAt = new Date().toISOString();
    report.completedAt = report.checkedAt;
  }

  return report;
}

export { detectPackage as detectPlaywrightPackage };
