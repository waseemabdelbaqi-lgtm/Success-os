/**
 * Live authenticated health probes for infrastructure / media / specialty providers.
 * Credential presence alone never yields READY.
 */

import { firstEnv } from "./base.js";
import { ProviderStatus } from "./errors.js";
import { githubConfigured, githubRequest } from "./github.js";

function baseReport(provider) {
  return {
    provider,
    configured: false,
    keyDetected: false,
    modelConfigured: null,
    networkReachable: false,
    authenticationValid: false,
    minimalRequestPassed: false,
    latencyMs: null,
    status: ProviderStatus.NOT_CONFIGURED,
    errorCategory: null,
    lastError: null,
    checkedAt: new Date().toISOString(),
  };
}

async function timed(fn) {
  const started = Date.now();
  try {
    const value = await fn();
    return { ok: true, value, latencyMs: Date.now() - started };
  } catch (err) {
    return { ok: false, err, latencyMs: Date.now() - started };
  }
}

export async function wolframHealthCheck() {
  const report = baseReport("wolfram");
  const cred = firstEnv(["WOLFRAM_APP_ID", "WOLFRAM_ALPHA_APPID"]);
  if (!cred) return report;
  report.configured = true;
  report.keyDetected = true;
  const result = await timed(async () => {
    const url = `https://api.wolframalpha.com/v1/result?appid=${encodeURIComponent(cred.value)}&i=${encodeURIComponent("1+1")}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const text = (await res.text()).trim();
    if (res.status === 401 || res.status === 403) {
      const err = new Error("AUTHENTICATION_FAILED");
      err.status = res.status;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`WOLFRAM_HTTP_${res.status}`);
      err.status = res.status;
      throw err;
    }
    return text;
  });
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    const msg = String(result.err?.message || result.err);
    report.authenticationValid = !/AUTH/i.test(msg);
    report.status = /AUTH/i.test(msg)
      ? ProviderStatus.AUTHENTICATION_FAILED
      : ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = report.status;
    report.lastError = msg;
    return report;
  }
  report.authenticationValid = true;
  report.minimalRequestPassed = /2/.test(String(result.value || ""));
  report.status = report.minimalRequestPassed ? ProviderStatus.READY : ProviderStatus.PROVIDER_ERROR;
  report.lastError = report.minimalRequestPassed ? null : "UNEXPECTED_RESPONSE";
  report.errorCategory = report.lastError;
  return report;
}

export async function heygenHealthCheck() {
  const report = baseReport("heygen");
  const cred = firstEnv(["HEYGEN_API_KEY"]);
  if (!cred) return report;
  report.configured = true;
  report.keyDetected = true;
  const result = await timed(async () => {
    const res = await fetch("https://api.heygen.com/v2/avatars", {
      headers: { "x-api-key": cred.value, Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 401 || res.status === 403) {
      const err = new Error("AUTHENTICATION_FAILED");
      err.status = res.status;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`HEYGEN_HTTP_${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json().catch(() => ({}));
  });
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    const msg = String(result.err?.message || result.err);
    report.authenticationValid = !/AUTH/i.test(msg);
    report.status = /AUTH/i.test(msg)
      ? ProviderStatus.AUTHENTICATION_FAILED
      : ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = report.status;
    report.lastError = msg;
    return report;
  }
  report.authenticationValid = true;
  report.minimalRequestPassed = true;
  report.status = ProviderStatus.READY;
  return report;
}

export async function elevenlabsHealthCheck() {
  const report = baseReport("elevenlabs");
  const cred = firstEnv(["ELEVENLABS_API_KEY"]);
  if (!cred) return report;
  report.configured = true;
  report.keyDetected = true;
  const result = await timed(async () => {
    const res = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": cred.value, Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 401 || res.status === 403) {
      const err = new Error("AUTHENTICATION_FAILED");
      err.status = res.status;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`ELEVENLABS_HTTP_${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json().catch(() => ({}));
  });
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    const msg = String(result.err?.message || result.err);
    report.authenticationValid = !/AUTH/i.test(msg);
    report.status = /AUTH/i.test(msg)
      ? ProviderStatus.AUTHENTICATION_FAILED
      : ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = report.status;
    report.lastError = msg;
    return report;
  }
  report.authenticationValid = true;
  report.minimalRequestPassed = true;
  report.status = ProviderStatus.READY;
  return report;
}

export async function openaiImagesHealthCheck(openaiProbe = null) {
  const report = baseReport("openai-images");
  const cred = firstEnv(["OPENAI_API_KEY", "OPENAI_CONTENT_API_KEY"]);
  if (!cred) return report;
  report.configured = true;
  report.keyDetected = true;
  // Images share OpenAI credentials but require their own authenticated live call.
  const result = await timed(async () => {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${cred.value}` },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 401 || res.status === 403) {
      const err = new Error("AUTHENTICATION_FAILED");
      err.status = res.status;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`OPENAI_IMAGES_HTTP_${res.status}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    const ids = (data.data || []).map((m) => m.id);
    const hasImageModel = ids.some((id) => /dall-e|gpt-image|image/i.test(String(id)));
    return { hasImageModel, count: ids.length };
  });
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    const msg = String(result.err?.message || result.err);
    // Do not inherit chat READY without this probe
    void openaiProbe;
    report.authenticationValid = !/AUTH/i.test(msg);
    report.status = /AUTH/i.test(msg)
      ? ProviderStatus.AUTHENTICATION_FAILED
      : ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = report.status;
    report.lastError = msg;
    return report;
  }
  report.authenticationValid = true;
  report.minimalRequestPassed = Boolean(result.value?.count > 0);
  report.status = report.minimalRequestPassed ? ProviderStatus.READY : ProviderStatus.PROVIDER_ERROR;
  report.lastError = report.minimalRequestPassed ? null : "NO_MODELS_LISTED";
  return report;
}

export async function githubHealthCheck() {
  const report = baseReport("github");
  if (!githubConfigured()) return report;
  report.configured = true;
  report.keyDetected = true;
  const result = await timed(async () => githubRequest("/user"));
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    const msg = String(result.err?.message || result.err);
    report.authenticationValid = !/401|403|AUTH/i.test(msg);
    report.status = /401|403|AUTH/i.test(msg)
      ? ProviderStatus.AUTHENTICATION_FAILED
      : ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = report.status;
    report.lastError = msg;
    return report;
  }
  report.authenticationValid = true;
  report.minimalRequestPassed = Boolean(result.value?.login || result.value?.id);
  report.status = report.minimalRequestPassed ? ProviderStatus.READY : ProviderStatus.PROVIDER_ERROR;
  return report;
}

export async function supabaseHealthCheck() {
  const report = baseReport("supabase");
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || String(key).startsWith("change-me")) return report;
  report.configured = true;
  report.keyDetected = true;
  const result = await timed(async () => {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12000),
    });
    // Some projects use /rest/v1/ as fallback
    if (res.status === 404) {
      const res2 = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(12000),
      });
      if (res2.status === 401 || res2.status === 403) {
        const err = new Error("AUTHENTICATION_FAILED");
        err.status = res2.status;
        throw err;
      }
      if (!res2.ok && res2.status !== 200 && res2.status !== 404) {
        const err = new Error(`SUPABASE_HTTP_${res2.status}`);
        err.status = res2.status;
        throw err;
      }
      return { ok: true, via: "rest" };
    }
    if (res.status === 401 || res.status === 403) {
      const err = new Error("AUTHENTICATION_FAILED");
      err.status = res.status;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`SUPABASE_HTTP_${res.status}`);
      err.status = res.status;
      throw err;
    }
    return { ok: true, via: "auth-health" };
  });
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    const msg = String(result.err?.message || result.err);
    report.authenticationValid = !/AUTH/i.test(msg);
    report.status = /AUTH/i.test(msg)
      ? ProviderStatus.AUTHENTICATION_FAILED
      : ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = report.status;
    report.lastError = msg;
    return report;
  }
  report.authenticationValid = true;
  report.minimalRequestPassed = true;
  report.status = ProviderStatus.READY;
  return report;
}

export async function browserbaseHealthCheck() {
  const report = baseReport("browserbase");
  const cred = firstEnv(["BROWSERBASE_API_KEY"]);
  if (!cred) return report;
  report.configured = true;
  report.keyDetected = true;
  const result = await timed(async () => {
    const res = await fetch("https://www.browserbase.com/v1/projects", {
      headers: { "X-BB-API-Key": cred.value, Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 401 || res.status === 403) {
      const err = new Error("AUTHENTICATION_FAILED");
      err.status = res.status;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`BROWSERBASE_HTTP_${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json().catch(() => ([]));
  });
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    const msg = String(result.err?.message || result.err);
    report.authenticationValid = !/AUTH/i.test(msg);
    report.status = /AUTH/i.test(msg)
      ? ProviderStatus.AUTHENTICATION_FAILED
      : ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = report.status;
    report.lastError = msg;
    return report;
  }
  report.authenticationValid = true;
  report.minimalRequestPassed = true;
  report.status = ProviderStatus.READY;
  return report;
}

export async function playwrightHealthCheck() {
  const report = baseReport("playwright");
  // Module resolution alone is NOT green — require a live Chromium launch probe.
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
    report.configured = true;
  } catch {
    try {
      ({ chromium } = await import("@playwright/test"));
      report.configured = true;
    } catch {
      report.lastError = "playwright not installed";
      report.errorCategory = "NOT_INSTALLED";
      return report;
    }
  }
  const result = await timed(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent("<html><body>AIOS_OK</body></html>");
      const text = await page.locator("body").innerText();
      return text.trim();
    } finally {
      await browser.close();
    }
  });
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    report.authenticationValid = false;
    report.status = ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = ProviderStatus.PROVIDER_ERROR;
    report.lastError = String(result.err?.message || result.err);
    return report;
  }
  // Local tooling: "authenticated" means the runtime successfully executed the probe.
  report.authenticationValid = true;
  report.minimalRequestPassed = String(result.value || "") === "AIOS_OK";
  report.status = report.minimalRequestPassed ? ProviderStatus.READY : ProviderStatus.PROVIDER_ERROR;
  report.lastError = report.minimalRequestPassed ? null : "UNEXPECTED_RESPONSE";
  return report;
}

export async function sentryHealthCheck() {
  const report = baseReport("sentry");
  const dsn = firstEnv(["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"]);
  const token = firstEnv(["SENTRY_AUTH_TOKEN"]);
  if (!dsn && !token) return report;
  report.configured = true;
  report.keyDetected = true;
  if (!token) {
    // DSN alone is not an authenticated API probe — refuse green.
    report.status = ProviderStatus.NOT_CONFIGURED;
    report.lastError = "SENTRY_AUTH_TOKEN required for live authenticated probe";
    report.errorCategory = "PROBE_REQUIRES_AUTH_TOKEN";
    return report;
  }
  const result = await timed(async () => {
    const res = await fetch("https://sentry.io/api/0/", {
      headers: { Authorization: `Bearer ${token.value}` },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 401 || res.status === 403) {
      const err = new Error("AUTHENTICATION_FAILED");
      err.status = res.status;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`SENTRY_HTTP_${res.status}`);
      err.status = res.status;
      throw err;
    }
    return true;
  });
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    const msg = String(result.err?.message || result.err);
    report.authenticationValid = !/AUTH/i.test(msg);
    report.status = /AUTH/i.test(msg)
      ? ProviderStatus.AUTHENTICATION_FAILED
      : ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = report.status;
    report.lastError = msg;
    return report;
  }
  report.authenticationValid = true;
  report.minimalRequestPassed = true;
  report.status = ProviderStatus.READY;
  return report;
}

export async function vercelHealthCheck() {
  const report = baseReport("vercel");
  const cred = firstEnv(["VERCEL_TOKEN"]);
  if (!cred) return report;
  report.configured = true;
  report.keyDetected = true;
  const result = await timed(async () => {
    const res = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${cred.value}` },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 401 || res.status === 403) {
      const err = new Error("AUTHENTICATION_FAILED");
      err.status = res.status;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`VERCEL_HTTP_${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json().catch(() => ({}));
  });
  report.latencyMs = result.latencyMs;
  report.networkReachable = true;
  if (!result.ok) {
    const msg = String(result.err?.message || result.err);
    report.authenticationValid = !/AUTH/i.test(msg);
    report.status = /AUTH/i.test(msg)
      ? ProviderStatus.AUTHENTICATION_FAILED
      : ProviderStatus.PROVIDER_ERROR;
    report.errorCategory = report.status;
    report.lastError = msg;
    return report;
  }
  report.authenticationValid = true;
  report.minimalRequestPassed = true;
  report.status = ProviderStatus.READY;
  // Never auto-deploy even when READY
  report.autoAction = "never-auto-deploy";
  return report;
}

/** Run all infrastructure / media specialty live authenticated probes. */
export async function runInfrastructureHealthChecks() {
  const [
    wolfram,
    heygen,
    elevenlabs,
    openaiImages,
    github,
    supabase,
    browserbase,
    playwright,
    sentry,
    vercel,
  ] = await Promise.all([
    wolframHealthCheck(),
    heygenHealthCheck(),
    elevenlabsHealthCheck(),
    openaiImagesHealthCheck(),
    githubHealthCheck(),
    supabaseHealthCheck(),
    browserbaseHealthCheck(),
    playwrightHealthCheck(),
    sentryHealthCheck(),
    vercelHealthCheck(),
  ]);
  return [
    wolfram,
    heygen,
    elevenlabs,
    openaiImages,
    github,
    supabase,
    browserbase,
    playwright,
    sentry,
    vercel,
  ];
}
