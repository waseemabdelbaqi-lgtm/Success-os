/**
 * Persisted live probe results + history + alerts.
 * Never stores secret values.
 */
import fs from "node:fs";
import path from "node:path";
import {
  CanonicalStatus,
  HEALTH_SCHEMA_VERSION,
  LIFECYCLE_LADDER_LABELS,
  LiveProbeResult,
  ProviderLifecycle,
  colorForLifecycle,
  colorForStatus,
  deriveLifecycleStage,
  displayMarkForLifecycle,
  emptyResultFields,
  hasReadyEvidence,
  isGreenStatus,
  lifecycleProgress,
  PROVIDER_FACTORY,
  PROVIDER_META,
  redactSecrets,
} from "./status-model.js";

const STATE_REL = "data/master-ai-orchestrator/health/provider-health-state.json";
const HISTORY_REL = "data/master-ai-orchestrator/health/provider-health-history.json";
const AUDIT_REL = "data/master-ai-orchestrator/health/provider-trust-audit.json";
const DEFAULT_HISTORY_LIMIT = Number(process.env.AIOS_HEALTH_HISTORY_LIMIT || 20);
const LATENCY_ALERT_MS = Number(process.env.AIOS_HEALTH_LATENCY_ALERT_MS || 15000);

export function healthStatePath(rootDir = process.cwd()) {
  return path.join(rootDir, STATE_REL);
}

export function healthHistoryPath(rootDir = process.cwd()) {
  return path.join(rootDir, HISTORY_REL);
}

export function healthAuditPath(rootDir = process.cwd()) {
  return path.join(rootDir, AUDIT_REL);
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

export function loadHealthState(rootDir = process.cwd()) {
  try {
    return JSON.parse(fs.readFileSync(healthStatePath(rootDir), "utf8"));
  } catch {
    return null;
  }
}

export function loadHealthHistory(rootDir = process.cwd()) {
  try {
    return JSON.parse(fs.readFileSync(healthHistoryPath(rootDir), "utf8"));
  } catch {
    return { version: HEALTH_SCHEMA_VERSION, limit: DEFAULT_HISTORY_LIMIT, entries: [] };
  }
}

export function createEmptyProviderRecord(providerId) {
  const meta = PROVIDER_META[providerId] || {
    displayName: providerId,
    adapterAvailable: false,
    probeType: "unknown",
  };
  const blanks = emptyResultFields();
  return {
    providerId,
    displayName: meta.displayName,
    factory: PROVIDER_FACTORY[providerId] || "unassigned",
    adapterAvailable: Boolean(meta.adapterAvailable),
    credentialsDetected: false,
    probeType: meta.probeType,
    liveProbeExecuted: false,
    authenticated: false,
    status: CanonicalStatus.NOT_TESTED,
    liveProbe: LiveProbeResult.NOT_RUN,
    result: blanks.result,
    testedAt: blanks.testedAt,
    startedAt: "NOT_TESTED",
    completedAt: "NOT_TESTED",
    latencyMs: blanks.latencyMs,
    model: blanks.model,
    endpoint: "NOT_TESTED",
    errorCode: "NOT_TESTED",
    safeErrorMessage: "NOT_TESTED",
    consecutiveSuccesses: 0,
    consecutiveFailures: 0,
    lastSuccessfulProbeAt: blanks.lastSuccessfulProbeAt,
    lastFailedProbeAt: "NOT_TESTED",
    connectionReady: false,
    generationVerified: false,
    deployPolicy: meta.deployPolicy || null,
    packageInstalled: null,
    packageVersion: null,
    browserInstalled: null,
    browserVersion: null,
    targetType: null,
    targetURL: null,
    lifecycleStage: ProviderLifecycle.SLOT,
    lifecycleProgress: lifecycleProgress(ProviderLifecycle.SLOT),
    productionCertified: false,
    missionCritical: false,
    displayMark: displayMarkForLifecycle(ProviderLifecycle.SLOT),
    displayColor: colorForStatus(CanonicalStatus.NOT_TESTED),
    healthSchemaVersion: HEALTH_SCHEMA_VERSION,
  };
}

export function normalizeProviderRecord(partial = {}, previous = null) {
  const id = partial.providerId || partial.provider || partial.id;
  const base = previous || createEmptyProviderRecord(id);
  const meta = PROVIDER_META[id] || {};
  const status = partial.status || base.status || CanonicalStatus.NOT_TESTED;
  const record = {
    ...base,
    ...partial,
    providerId: id,
    displayName: partial.displayName || meta.displayName || base.displayName || id,
    factory: partial.factory || PROVIDER_FACTORY[id] || base.factory,
    adapterAvailable:
      partial.adapterAvailable != null ? Boolean(partial.adapterAvailable) : base.adapterAvailable,
    credentialsDetected: Boolean(partial.credentialsDetected ?? partial.keyDetected ?? partial.configured),
    probeType: partial.probeType || meta.probeType || base.probeType,
    liveProbeExecuted: Boolean(partial.liveProbeExecuted ?? partial.minimalRequestPassed),
    authenticated: Boolean(partial.authenticated ?? partial.authenticationValid),
    status,
    liveProbe: partial.liveProbe || base.liveProbe || LiveProbeResult.NOT_RUN,
    result: partial.result ?? (status === CanonicalStatus.READY ? "success" : base.result),
    testedAt: partial.testedAt || partial.checkedAt || partial.completedAt || base.testedAt,
    startedAt: partial.startedAt || base.startedAt,
    completedAt: partial.completedAt || partial.checkedAt || base.completedAt,
    latencyMs: partial.latencyMs != null ? partial.latencyMs : base.latencyMs,
    model: partial.model != null && partial.model !== "" ? partial.model : base.model,
    endpoint: partial.endpoint != null ? redactSecrets(partial.endpoint) : base.endpoint,
    errorCode:
      partial.errorCode != null
        ? redactSecrets(partial.errorCode)
        : status === CanonicalStatus.READY
          ? null
          : base.errorCode,
    safeErrorMessage:
      partial.safeErrorMessage != null
        ? redactSecrets(partial.safeErrorMessage)
        : partial.lastError != null
          ? redactSecrets(partial.lastError)
          : status === CanonicalStatus.READY
            ? null
            : base.safeErrorMessage,
    connectionReady: Boolean(
      partial.connectionReady ?? (status === CanonicalStatus.READY || partial.authenticated),
    ),
    generationVerified: Boolean(partial.generationVerified),
    deployPolicy: meta.deployPolicy || partial.deployPolicy || base.deployPolicy,
    packageInstalled:
      partial.packageInstalled != null ? Boolean(partial.packageInstalled) : base.packageInstalled,
    packageVersion: partial.packageVersion ?? base.packageVersion,
    browserInstalled:
      partial.browserInstalled != null ? Boolean(partial.browserInstalled) : base.browserInstalled,
    browserVersion: partial.browserVersion ?? base.browserVersion,
    targetType: partial.targetType ?? base.targetType,
    targetURL: partial.targetURL != null ? redactSecrets(partial.targetURL) : base.targetURL,
    // Never persist cookies / auth / storage
    cookies: undefined,
    passwords: undefined,
    tokens: undefined,
    storageState: undefined,
    healthSchemaVersion: HEALTH_SCHEMA_VERSION,
  };
  delete record.cookies;
  delete record.passwords;
  delete record.tokens;
  delete record.storageState;

  // Fill blanks — never leave empty cells
  for (const key of [
    "testedAt",
    "startedAt",
    "completedAt",
    "latencyMs",
    "model",
    "endpoint",
    "errorCode",
    "safeErrorMessage",
    "lastSuccessfulProbeAt",
    "lastFailedProbeAt",
    "result",
  ]) {
    if (record[key] == null || record[key] === "") {
      record[key] = status === CanonicalStatus.READY && (key === "errorCode" || key === "safeErrorMessage")
        ? "none"
        : "NOT_TESTED";
    }
  }

  if (
    status === CanonicalStatus.READY ||
    status === CanonicalStatus.PRODUCTION_CERTIFIED ||
    status === CanonicalStatus.MISSION_CRITICAL ||
    status === CanonicalStatus.LIVE_VERIFIED
  ) {
    record.errorCode = record.errorCode === "NOT_TESTED" ? "none" : record.errorCode;
    record.safeErrorMessage =
      record.safeErrorMessage === "NOT_TESTED" ? "none" : record.safeErrorMessage;
    if (
      isGreenStatus(status) &&
      !hasReadyEvidence({
        ...record,
        status: CanonicalStatus.READY,
        errorCode: record.errorCode === "none" ? null : record.errorCode,
      })
    ) {
      record.status = CanonicalStatus.PROBE_FAILED;
      record.liveProbe = LiveProbeResult.FAILED;
      record.result = "failure";
      record.safeErrorMessage = record.safeErrorMessage || "MISSING_READY_EVIDENCE";
      record.errorCode = record.errorCode === "none" ? "MISSING_READY_EVIDENCE" : record.errorCode;
    }
  }

  // Consecutive counters (before lifecycle so streak informs certification tiers)
  if (previous) {
    if (isGreenStatus(record.status)) {
      record.consecutiveSuccesses = (previous.consecutiveSuccesses || 0) + 1;
      record.consecutiveFailures = 0;
      record.lastSuccessfulProbeAt = record.testedAt;
    } else if (
      record.liveProbeExecuted ||
      [
        CanonicalStatus.PROBE_FAILED,
        CanonicalStatus.AUTH_FAILED,
        CanonicalStatus.NETWORK_FAILED,
        CanonicalStatus.MODEL_UNAVAILABLE,
        CanonicalStatus.RATE_LIMITED,
      ].includes(record.status)
    ) {
      record.consecutiveFailures = (previous.consecutiveFailures || 0) + 1;
      record.consecutiveSuccesses = 0;
      record.lastFailedProbeAt = record.testedAt;
      if (previous.lastSuccessfulProbeAt && previous.lastSuccessfulProbeAt !== "NOT_TESTED") {
        record.lastSuccessfulProbeAt = previous.lastSuccessfulProbeAt;
      }
    } else {
      record.consecutiveSuccesses = previous.consecutiveSuccesses || 0;
      record.consecutiveFailures = previous.consecutiveFailures || 0;
      if (previous.lastSuccessfulProbeAt) record.lastSuccessfulProbeAt = previous.lastSuccessfulProbeAt;
      if (previous.lastFailedProbeAt) record.lastFailedProbeAt = previous.lastFailedProbeAt;
    }
  } else if (isGreenStatus(record.status)) {
    record.consecutiveSuccesses = 1;
    record.lastSuccessfulProbeAt = record.testedAt;
  }

  // Elevation flags from previous/partial are already on `record` via spread;
  // deriveLifecycleStage reads them before we recompute display flags.
  record.lifecycleStage = deriveLifecycleStage(record, previous?.lifecycleStage || null);
  record.lifecycleProgress = lifecycleProgress(record.lifecycleStage);
  record.missionCritical = record.lifecycleStage === ProviderLifecycle.MISSION_CRITICAL;
  record.productionCertified =
    record.missionCritical ||
    record.lifecycleStage === ProviderLifecycle.PRODUCTION_CERTIFIED;

  // Elevate status to match lifecycle star tiers
  if (
    record.missionCritical &&
    (record.status === CanonicalStatus.READY ||
      record.status === CanonicalStatus.PRODUCTION_CERTIFIED ||
      record.status === CanonicalStatus.MISSION_CRITICAL)
  ) {
    record.status = CanonicalStatus.MISSION_CRITICAL;
  } else if (
    record.productionCertified &&
    (record.status === CanonicalStatus.READY ||
      record.status === CanonicalStatus.PRODUCTION_CERTIFIED)
  ) {
    record.status = CanonicalStatus.PRODUCTION_CERTIFIED;
  }

  record.displayColor =
    colorForLifecycle(record.lifecycleStage) || colorForStatus(record.status);
  record.displayMark = displayMarkForLifecycle(record.lifecycleStage);

  return record;
}

export function evaluateAlerts(previousState, nextRecords) {
  const alerts = [];
  const prevMap = new Map((previousState?.providers || []).map((p) => [p.providerId, p]));
  for (const rec of nextRecords) {
    const prev = prevMap.get(rec.providerId);
    if (
      isGreenStatus(prev?.status) &&
      !isGreenStatus(rec.status) &&
      rec.status !== CanonicalStatus.NOT_CONFIGURED &&
      rec.status !== CanonicalStatus.SLOT &&
      rec.status !== CanonicalStatus.NOT_TESTED
    ) {
      alerts.push({
        type: "READY_TO_FAILED",
        providerId: rec.providerId,
        from: prev.status,
        to: rec.status,
        at: rec.testedAt,
      });
    }
    if (
      rec.consecutiveFailures >= 3 &&
      rec.status !== CanonicalStatus.NOT_CONFIGURED &&
      rec.status !== CanonicalStatus.SLOT &&
      rec.status !== CanonicalStatus.ADAPTER_AVAILABLE
    ) {
      alerts.push({
        type: "THREE_CONSECUTIVE_FAILURES",
        providerId: rec.providerId,
        count: rec.consecutiveFailures,
        at: rec.testedAt,
      });
    }
    if (rec.status === CanonicalStatus.AUTH_FAILED) {
      alerts.push({ type: "AUTH_FAILED", providerId: rec.providerId, at: rec.testedAt });
    }
    if (rec.status === CanonicalStatus.MODEL_UNAVAILABLE) {
      alerts.push({ type: "MODEL_UNAVAILABLE", providerId: rec.providerId, at: rec.testedAt });
    }
    if (
      rec.status === CanonicalStatus.READY &&
      Number.isFinite(Number(rec.latencyMs)) &&
      Number(rec.latencyMs) > LATENCY_ALERT_MS
    ) {
      alerts.push({
        type: "LATENCY_THRESHOLD",
        providerId: rec.providerId,
        latencyMs: rec.latencyMs,
        thresholdMs: LATENCY_ALERT_MS,
        at: rec.testedAt,
      });
    }
    if (rec.status === CanonicalStatus.RATE_LIMITED) {
      alerts.push({ type: "RATE_LIMITED", providerId: rec.providerId, at: rec.testedAt });
    }
  }
  return alerts;
}

export function appendHistory(entries, rootDir = process.cwd(), limit = DEFAULT_HISTORY_LIMIT) {
  const hist = loadHealthHistory(rootDir);
  const next = {
    version: HEALTH_SCHEMA_VERSION,
    limit,
    entries: [...(hist.entries || []), ...entries].slice(-Math.max(1, limit * 50)),
  };
  // Keep last N per provider for dashboard
  const byProvider = new Map();
  for (const e of next.entries) {
    const list = byProvider.get(e.providerId) || [];
    list.push(e);
    byProvider.set(e.providerId, list.slice(-limit));
  }
  next.byProvider = Object.fromEntries(byProvider.entries());
  const file = healthHistoryPath(rootDir);
  ensureDir(file);
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function loadTrustAudit(rootDir = process.cwd()) {
  try {
    return JSON.parse(fs.readFileSync(healthAuditPath(rootDir), "utf8"));
  } catch {
    return { version: HEALTH_SCHEMA_VERSION, entries: [] };
  }
}

/** Persist structured promotion/rejection audit (no secrets). */
export function appendTrustAudit(entries, rootDir = process.cwd()) {
  const list = Array.isArray(entries) ? entries : [entries];
  const prev = loadTrustAudit(rootDir);
  const next = {
    version: HEALTH_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    entries: [...(prev.entries || []), ...list].slice(-500),
  };
  const file = healthAuditPath(rootDir);
  ensureDir(file);
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return file;
}

export function saveHealthState(state, rootDir = process.cwd()) {
  const file = healthStatePath(rootDir);
  ensureDir(file);
  const payload = {
    ...state,
    healthSchemaVersion: HEALTH_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    rule: "GREEN_ONLY_AFTER_LIVE_AUTHENTICATED_SUCCESS",
    ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return file;
}

export function historyStatsFor(providerId, rootDir = process.cwd()) {
  const hist = loadHealthHistory(rootDir);
  const list = hist.byProvider?.[providerId] || [];
  const last20 = list.slice(-20);
  const successes = last20.filter((e) => isGreenStatus(e.status)).length;
  const latencies = last20
    .map((e) => Number(e.latencyMs))
    .filter((n) => Number.isFinite(n));
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : "NOT_TESTED";
  const lastError =
    [...last20].reverse().find((e) => !isGreenStatus(e.status))?.safeErrorMessage ||
    "NOT_TESTED";
  const lastSuccess =
    [...last20].reverse().find((e) => isGreenStatus(e.status))?.testedAt || "NOT_TESTED";
  return {
    last20Count: last20.length,
    successRate: last20.length ? Number((successes / last20.length).toFixed(3)) : "NOT_TESTED",
    averageLatencyMs: avgLatency,
    mostRecentError: lastError,
    lastSuccessfulProbeAt: lastSuccess,
    entries: last20,
  };
}

/** Build dashboard rows from persisted state only (section 4). */
export function buildDashboardFromState(state, rootDir = process.cwd()) {
  const displayIds = [
    "openai",
    "anthropic",
    "gemini",
    "ollama",
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
  ];
  const byId = new Map((state?.providers || []).map((p) => [p.providerId, p]));
  const providers = displayIds.map((id) => {
    const rec = byId.get(id) || createEmptyProviderRecord(id);
    const stats = historyStatsFor(id, rootDir);
    return {
      ...rec,
      Provider: rec.displayName,
      Factory: rec.factory,
      Adapter: rec.adapterAvailable ? "available" : "missing",
      Credentials: rec.credentialsDetected ? "detected" : "missing",
      "Live Probe": rec.liveProbe,
      Status: rec.status,
      Lifecycle: rec.lifecycleStage || ProviderLifecycle.SLOT,
      "Lifecycle Ladder": (rec.lifecycleProgress || [])
        .map((s) => (s.current ? `[${s.label}${s.mark ? ` ${s.mark}` : ""}]` : s.reached ? s.label : "·"))
        .join(" → "),
      productionCertified: Boolean(rec.productionCertified),
      missionCritical: Boolean(rec.missionCritical),
      displayMark: rec.displayMark || displayMarkForLifecycle(rec.lifecycleStage),
      Mark: rec.displayMark || displayMarkForLifecycle(rec.lifecycleStage),
      "Last Tested": rec.testedAt,
      Result: rec.result,
      Latency: rec.latencyMs === "NOT_TESTED" || rec.latencyMs == null ? "NOT_TESTED" : `${rec.latencyMs} ms`,
      "Model or Service": rec.model,
      "Last Successful Test": rec.lastSuccessfulProbeAt,
      "Last Error": rec.safeErrorMessage === "none" ? "none" : rec.safeErrorMessage,
      history: stats,
      displayColor: rec.displayColor || colorForStatus(rec.status),
    };
  });

  return {
    rule: "STRICT_TRUST_LIFECYCLE_NO_STAGE_SKIP",
    ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
    lifecycleLadder: [...LIFECYCLE_LADDER_LABELS],
    trustMarks: {
      SLOT: "⚪",
      NOT_CONFIGURED: "⚪",
      CREDENTIALS_DETECTED: "🟡",
      PROBE_RUNNING: "🟡",
      READY: "🟢",
      PRODUCTION_CERTIFIED: "🟢⭐",
      MISSION_CRITICAL: "🟢⭐⭐",
    },
    checkedAt: state?.checkedAt || null,
    source: state ? "persisted-probe-state" : "empty-not-tested",
    greenCount: providers.filter((p) => p.displayColor === "green").length,
    certifiedCount: providers.filter(
      (p) =>
        p.lifecycleStage === ProviderLifecycle.PRODUCTION_CERTIFIED ||
        p.lifecycleStage === ProviderLifecycle.MISSION_CRITICAL,
    ).length,
    missionCriticalCount: providers.filter(
      (p) => p.lifecycleStage === ProviderLifecycle.MISSION_CRITICAL,
    ).length,
    providers,
    alerts: state?.alerts || [],
    healthSchemaVersion: HEALTH_SCHEMA_VERSION,
  };
}
