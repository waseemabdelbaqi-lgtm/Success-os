/**
 * Live-authenticated provider status rules.
 *
 * HARD RULE: a provider may show green (READY / displayColor=green) ONLY when
 * the last health check recorded a successful authenticated live request:
 *   status === READY
 *   && authenticationValid === true
 *   && minimalRequestPassed === true
 *   && checkedAt is present
 *
 * Credential presence alone is NEVER green.
 */

import fs from "node:fs";
import path from "node:path";
import { ProviderStatus } from "./errors.js";

const SNAPSHOT_REL = "data/master-ai-orchestrator/health/last-probe.json";

/** Providers shown on the AI Infrastructure dashboard (display order). */
export const AI_INFRASTRUCTURE_DISPLAY_IDS = Object.freeze([
  "openai",
  "anthropic",
  "gemini",
  "wolfram",
  "heygen",
  "elevenlabs",
  "openai-images",
  "github",
  "supabase",
  "browserbase",
  "playwright",
  "sentry",
  "vercel",
]);

export const DISPLAY_LABELS = Object.freeze({
  openai: "OpenAI",
  anthropic: "Claude",
  gemini: "Gemini",
  wolfram: "Wolfram",
  heygen: "HeyGen",
  elevenlabs: "ElevenLabs",
  "openai-images": "OpenAI Images",
  github: "GitHub",
  supabase: "Supabase",
  browserbase: "Browserbase",
  playwright: "Playwright",
  sentry: "Sentry",
  vercel: "Vercel",
  ollama: "Ollama",
  "ollama-local": "Ollama",
});

export function isLiveAuthenticatedReady(probe = {}) {
  return (
    probe?.status === ProviderStatus.READY &&
    probe?.authenticationValid === true &&
    probe?.minimalRequestPassed === true &&
    Boolean(probe?.checkedAt || probe?.lastCheckedAt)
  );
}

export function displayColorForProbe(probe = {}) {
  return isLiveAuthenticatedReady(probe) ? "green" : "neutral";
}

export function resultLabelAr(probe = {}) {
  if (isLiveAuthenticatedReady(probe)) return "نجاح";
  if (!probe?.checkedAt && !probe?.lastCheckedAt) return "لم يُختبر";
  if (probe?.status === ProviderStatus.NOT_CONFIGURED) return "غير مهيأ";
  if (probe?.status === ProviderStatus.MODEL_NOT_CONFIGURED) return "نموذج غير مضبوط";
  if (probe?.status === ProviderStatus.AUTHENTICATION_FAILED) return "فشل المصادقة";
  if (probe?.status === ProviderStatus.NETWORK_ERROR) return "خطأ شبكة";
  if (probe?.status === ProviderStatus.TIMEOUT) return "انتهت المهلة";
  if (probe?.status === ProviderStatus.RATE_LIMITED) return "حد المعدل";
  if (probe?.status === ProviderStatus.OPTIONAL_OFFLINE) return "غير متصل";
  return "فشل";
}

export function lastErrorForProbe(probe = {}) {
  if (isLiveAuthenticatedReady(probe)) return null;
  return (
    probe?.lastError ||
    probe?.errorCategory ||
    probe?.detail ||
    (probe?.status && probe.status !== ProviderStatus.READY ? probe.status : null) ||
    "NO_LIVE_AUTHENTICATED_PROBE"
  );
}

/**
 * Normalize any probe into the AI Infrastructure dashboard row shape.
 */
export function toInfrastructureRow(probe = {}, { id, label } = {}) {
  const providerId = id || probe.provider || probe.id;
  const checkedAt = probe.checkedAt || probe.lastCheckedAt || null;
  const liveReady = isLiveAuthenticatedReady({ ...probe, checkedAt });
  return {
    id: providerId,
    label: label || DISPLAY_LABELS[providerId] || providerId,
    provider: providerId,
    displayColor: liveReady ? "green" : "neutral",
    liveReady,
    status: liveReady ? ProviderStatus.READY : probe.status || ProviderStatus.NOT_CONFIGURED,
    configured: Boolean(probe.configured || probe.keyDetected),
    // UI fields (Arabic dashboard)
    lastTestAt: checkedAt,
    "آخر اختبار": checkedAt || "—",
    result: resultLabelAr({ ...probe, checkedAt }),
    النتيجة: resultLabelAr({ ...probe, checkedAt }),
    latencyMs: liveReady ? probe.latencyMs ?? null : null,
    "زمن الاستجابة": liveReady && probe.latencyMs != null ? `${probe.latencyMs}ms` : "—",
    lastError: lastErrorForProbe({ ...probe, checkedAt }),
    "آخر خطأ": lastErrorForProbe({ ...probe, checkedAt }) || "—",
    authenticationValid: Boolean(probe.authenticationValid),
    minimalRequestPassed: Boolean(probe.minimalRequestPassed),
    checkedAt,
  };
}

export function snapshotPath(rootDir = process.cwd()) {
  return path.join(rootDir, SNAPSHOT_REL);
}

export function saveHealthSnapshot(snapshot, rootDir = process.cwd()) {
  const file = snapshotPath(rootDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const payload = {
    ...snapshot,
    savedAt: new Date().toISOString(),
    rule: "GREEN_ONLY_AFTER_LIVE_AUTHENTICATED_SUCCESS",
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return file;
}

export function loadHealthSnapshot(rootDir = process.cwd()) {
  const file = snapshotPath(rootDir);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Build dashboard rows from a health snapshot / live checks array.
 * Missing providers are shown as untested (never green).
 */
export function buildInfrastructureDashboard(probes = [], { checkedAt = null } = {}) {
  const byId = new Map();
  for (const p of probes) {
    const id = p.provider || p.id;
    if (!id) continue;
    byId.set(id, { ...p, checkedAt: p.checkedAt || checkedAt || p.lastCheckedAt || null });
    // openai-images may share openai probe when images probe absent
    if (id === "openai" && !byId.has("openai-images")) {
      // do not auto-green openai-images from openai chat probe
    }
  }

  const rows = AI_INFRASTRUCTURE_DISPLAY_IDS.map((id) => {
    const probe = byId.get(id) || {
      provider: id,
      status: ProviderStatus.NOT_CONFIGURED,
      authenticationValid: false,
      minimalRequestPassed: false,
      configured: false,
      checkedAt: checkedAt || null,
      lastError: "NO_LIVE_AUTHENTICATED_PROBE",
    };
    return toInfrastructureRow(probe, { id });
  });

  return {
    rule: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
    ruleEn: "GREEN_ONLY_AFTER_LIVE_AUTHENTICATED_SUCCESS",
    checkedAt: checkedAt || new Date().toISOString(),
    greenCount: rows.filter((r) => r.displayColor === "green").length,
    providers: rows,
  };
}
