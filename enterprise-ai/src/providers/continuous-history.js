/**
 * Continuous governance history + alerts (no secrets).
 */
import fs from "node:fs";
import path from "node:path";
import { redactSecrets } from "./status-model.js";
import { alertChannels, continuousConfig, continuousThresholds } from "./continuous-config.js";

const GOV_REL = "data/master-ai-orchestrator/health/continuous-governance.json";
const ALERT_REL = "data/master-ai-orchestrator/health/continuous-alerts.json";

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

export function governancePath(rootDir = process.cwd()) {
  return path.join(rootDir, GOV_REL);
}

export function alertsPath(rootDir = process.cwd()) {
  return path.join(rootDir, ALERT_REL);
}

export function loadGovernanceState(rootDir = process.cwd()) {
  try {
    return JSON.parse(fs.readFileSync(governancePath(rootDir), "utf8"));
  } catch {
    return {
      version: 1,
      lastTickAt: null,
      nextDueByProvider: {},
      history: [],
      downgrades: [],
      failovers: [],
      recoveries: [],
      certifications: [],
      scheduler: { running: false, startedAt: null },
    };
  }
}

export function saveGovernanceState(state, rootDir = process.cwd()) {
  const file = governancePath(rootDir);
  ensureDir(file);
  const limit = continuousThresholds().governanceHistoryLimit;
  const payload = {
    ...state,
    history: (state.history || []).slice(-limit),
    downgrades: (state.downgrades || []).slice(-limit),
    failovers: (state.failovers || []).slice(-limit),
    recoveries: (state.recoveries || []).slice(-limit),
    certifications: (state.certifications || []).slice(-limit),
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return file;
}

export function loadAlertLog(rootDir = process.cwd()) {
  try {
    return JSON.parse(fs.readFileSync(alertsPath(rootDir), "utf8"));
  } catch {
    return { version: 1, entries: [] };
  }
}

export function appendAlertLog(entries, rootDir = process.cwd()) {
  const prev = loadAlertLog(rootDir);
  const list = Array.isArray(entries) ? entries : [entries];
  const next = {
    version: 1,
    savedAt: new Date().toISOString(),
    entries: [...(prev.entries || []), ...list.map(sanitizeAlert)].slice(-1000),
  };
  const file = alertsPath(rootDir);
  ensureDir(file);
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return file;
}

function sanitizeAlert(alert) {
  return {
    ...alert,
    message: redactSecrets(alert.message),
    error: alert.error != null ? redactSecrets(alert.error) : undefined,
    safeErrorMessage:
      alert.safeErrorMessage != null ? redactSecrets(alert.safeErrorMessage) : undefined,
  };
}

/**
 * Rich history entry for continuous governance (never secrets).
 */
export function buildHistoryEntry({
  providerId,
  statusBefore,
  statusAfter,
  lifecycleBefore,
  lifecycleAfter,
  timestamp = new Date().toISOString(),
  latencyMs = null,
  providerVersion = null,
  model = null,
  probeType = null,
  success = null,
  errorClassification = null,
  eventType = "probe",
  note = null,
  meta = {},
} = {}) {
  return {
    providerId,
    eventType,
    statusBefore: statusBefore || null,
    statusAfter: statusAfter || null,
    lifecycleBefore: lifecycleBefore || null,
    lifecycleAfter: lifecycleAfter || null,
    timestamp,
    latencyMs: latencyMs === "NOT_TESTED" ? null : latencyMs,
    providerVersion,
    model: model === "NOT_TESTED" ? null : model,
    probeType,
    success: success == null ? null : Boolean(success),
    errorClassification: errorClassification
      ? redactSecrets(String(errorClassification))
      : null,
    note: note ? redactSecrets(String(note)) : null,
    meta,
  };
}

export async function dispatchAlerts(alerts, rootDir = process.cwd()) {
  if (!alerts?.length) return { dispatched: 0, channels: [] };
  const cfg = continuousConfig();
  const channels = cfg.alertChannels.length ? cfg.alertChannels : alertChannels();
  const stamped = alerts.map((a) => ({
    ...sanitizeAlert(a),
    at: a.at || new Date().toISOString(),
  }));

  if (channels.includes("file")) {
    appendAlertLog(stamped, rootDir);
  }
  if (channels.includes("console")) {
    for (const a of stamped) {
      console.error(
        JSON.stringify({
          aiosAlert: true,
          type: a.type,
          providerId: a.providerId,
          severity: a.severity || "warning",
          message: a.message,
        }),
      );
    }
  }
  if (channels.includes("webhook") && cfg.alertWebhookUrl) {
    try {
      await fetch(cfg.alertWebhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "aios-continuous", alerts: stamped }),
      });
    } catch {
      /* webhook optional */
    }
  }
  return { dispatched: stamped.length, channels };
}

export function classifyProbeError(record = {}) {
  const status = record.status || "";
  if (status === "AUTH_FAILED") return "AUTHENTICATION_FAILURE";
  if (status === "RATE_LIMITED") return "QUOTA_RATE_LIMIT";
  if (status === "NETWORK_FAILED") return "NETWORK_FAILURE";
  if (status === "MODEL_UNAVAILABLE") return "MODEL_UNAVAILABLE";
  if (status === "PROBE_FAILED") return "PROBE_FAILED";
  if (status === "LOCAL_APP_UNAVAILABLE") return "LOCAL_APP_UNAVAILABLE";
  if (String(record.safeErrorMessage || "").toLowerCase().includes("timeout")) {
    return "TIMEOUT";
  }
  return status || "UNKNOWN";
}
