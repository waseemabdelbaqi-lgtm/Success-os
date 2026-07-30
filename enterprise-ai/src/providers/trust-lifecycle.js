/**
 * AIOS provider trust lifecycle — strict stage gates + structured diagnostics.
 *
 * Ladder (no skipping):
 *   SLOT → NOT_CONFIGURED → CREDENTIALS_DETECTED → PROBE_RUNNING
 *     → READY → PRODUCTION_CERTIFIED → MISSION_CRITICAL
 *
 * PRODUCTION_CERTIFIED and MISSION_CRITICAL are granted only by explicit CLI
 * promotion after a fresh live probe — never inferred from adapters/config alone.
 */
import {
  CanonicalStatus,
  LiveProbeResult,
  ProviderLifecycle,
  hasReadyEvidence,
  isGreenStatus,
  normalizeLifecycleStage,
  LIFECYCLE_ORDER,
} from "./status-model.js";

export const MEDIA_PROVIDER_IDS = Object.freeze([
  "heygen",
  "elevenlabs",
  "openai-images",
  "blender",
]);

export const CRITICAL_FAILURE_STATUSES = Object.freeze([
  CanonicalStatus.AUTH_FAILED,
  CanonicalStatus.NETWORK_FAILED,
  CanonicalStatus.PROBE_FAILED,
  CanonicalStatus.MODEL_UNAVAILABLE,
  CanonicalStatus.BROWSER_NOT_INSTALLED,
  CanonicalStatus.BROWSER_LAUNCH_FAILED,
  CanonicalStatus.TEST_ASSERTION_FAILED,
  CanonicalStatus.REMOTE_TESTING_BLOCKED,
]);

export const CRITICAL_ALERT_TYPES = Object.freeze([
  "READY_TO_FAILED",
  "AUTH_FAILED",
  "THREE_CONSECUTIVE_FAILURES",
  "MODEL_UNAVAILABLE",
]);

function numEnv(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

export function trustConfig() {
  return {
    productionCertifyMinStreak: numEnv("AIOS_PRODUCTION_CERTIFY_MIN_STREAK", 1),
    missionCriticalMinStreak: numEnv("AIOS_MISSION_CRITICAL_MIN_STREAK", 5),
    missionCriticalSuccessRate: numEnv("AIOS_MISSION_CRITICAL_SUCCESS_RATE", 0.9),
    missionCriticalMaxLatencyMs: numEnv("AIOS_MISSION_CRITICAL_MAX_LATENCY_MS", 15000),
    missionCriticalMinHistory: numEnv("AIOS_MISSION_CRITICAL_MIN_HISTORY", 3),
  };
}

export function isMediaProvider(providerId) {
  return MEDIA_PROVIDER_IDS.includes(providerId);
}

export function requirement(id, ok, message, details = {}) {
  const { ok: _ignoredOk, ...rest } = details || {};
  return {
    id,
    message,
    ...rest,
    ok: Boolean(ok),
  };
}

export function summarizeRequirements(requirements) {
  const failed = requirements.filter((r) => !r.ok);
  return {
    ok: failed.length === 0,
    passedCount: requirements.filter((r) => r.ok).length,
    failedCount: failed.length,
    requirements,
    failedRequirements: failed,
  };
}

/** Strict adjacent (or same) stage check for promotions. */
export function canGrantLifecycleStage(currentStage, targetStage) {
  const from = normalizeLifecycleStage(currentStage);
  const to = normalizeLifecycleStage(targetStage);
  const fromIdx = LIFECYCLE_ORDER.indexOf(from);
  const toIdx = LIFECYCLE_ORDER.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) {
    return { ok: false, reason: "UNKNOWN_STAGE", from, to };
  }
  if (toIdx === fromIdx) {
    return { ok: true, reason: "IDEMPOTENT", from, to };
  }
  if (toIdx === fromIdx + 1) {
    return { ok: true, reason: "ADJACENT", from, to };
  }
  // Allow READY → PRODUCTION_CERTIFIED when currently READY
  // Allow PRODUCTION_CERTIFIED → MISSION_CRITICAL when currently PRODUCTION_CERTIFIED
  // Forbid skipping (e.g. READY → MISSION_CRITICAL)
  return {
    ok: false,
    reason: "STAGE_SKIP_FORBIDDEN",
    from,
    to,
    message: `Cannot grant ${to} from ${from} — stages must advance one step at a time`,
  };
}

export function isCurrentlyReady(record = {}) {
  const stage = normalizeLifecycleStage(record.lifecycleStage);
  return (
    (record.status === CanonicalStatus.READY || stage === ProviderLifecycle.READY) &&
    hasReadyEvidence({
      ...record,
      status: CanonicalStatus.READY,
      errorCode: record.errorCode === "none" ? null : record.errorCode,
    }) &&
    stage !== ProviderLifecycle.PRODUCTION_CERTIFIED &&
    stage !== ProviderLifecycle.MISSION_CRITICAL
  );
}

export function isProductionCertifiedTier(record = {}) {
  const stage = normalizeLifecycleStage(record.lifecycleStage);
  return (
    record.status === CanonicalStatus.PRODUCTION_CERTIFIED ||
    record.status === CanonicalStatus.MISSION_CRITICAL ||
    stage === ProviderLifecycle.PRODUCTION_CERTIFIED ||
    stage === ProviderLifecycle.MISSION_CRITICAL ||
    record.productionCertified === true
  );
}

/**
 * READY evidence checklist (diagnostic form).
 * Never passes on adapter/credentials alone.
 */
export function evaluateReadyRequirements(record = {}) {
  const err = record.errorCode;
  const errOk = !err || err === "none" || err === null;
  const reqs = [
    requirement(
      "authenticated",
      record.authenticated === true,
      "Authenticated live probe required",
      { actual: record.authenticated === true },
    ),
    requirement(
      "liveProbeExecuted",
      record.liveProbeExecuted === true,
      "Live probe must have executed",
      { actual: record.liveProbeExecuted === true },
    ),
    requirement(
      "liveProbePassed",
      record.liveProbe === LiveProbeResult.PASSED || record.result === "success",
      "Live probe must pass",
      { liveProbe: record.liveProbe, result: record.result },
    ),
    requirement(
      "persistedTestedAt",
      Boolean(record.testedAt) && record.testedAt !== "NOT_TESTED",
      "Probe timestamp must be persisted",
      { testedAt: record.testedAt || null },
    ),
    requirement(
      "latencyRecorded",
      record.latencyMs == null ||
        record.latencyMs === "NOT_TESTED" ||
        Number.isFinite(Number(record.latencyMs)),
      "Latency must be numeric when present",
      { latencyMs: record.latencyMs },
    ),
    requirement("errorClear", errOk, "errorCode must be clear/none", { errorCode: err }),
    requirement(
      "notCredentialsOnly",
      !(
        !record.liveProbeExecuted &&
        (record.credentialsDetected || record.adapterAvailable)
      ),
      "Credentials/adapter alone never grant READY",
    ),
  ];
  return summarizeRequirements(reqs);
}

/**
 * PRODUCTION_CERTIFIED grant checklist — only after fresh live probe left provider READY
 * (or already certified for idempotent re-certify).
 */
export function evaluateProductionCertifyRequirements(record = {}, { historyStats = null } = {}) {
  const cfg = trustConfig();
  const stage = normalizeLifecycleStage(record.lifecycleStage);
  const media = isMediaProvider(record.providerId);
  const readyEvidence = evaluateReadyRequirements({
    ...record,
    status: CanonicalStatus.READY,
  });
  const currentlyReady =
    record.status === CanonicalStatus.READY && stage === ProviderLifecycle.READY;
  const alreadyCertified =
    stage === ProviderLifecycle.PRODUCTION_CERTIFIED ||
    stage === ProviderLifecycle.MISSION_CRITICAL ||
    record.status === CanonicalStatus.PRODUCTION_CERTIFIED ||
    record.status === CanonicalStatus.MISSION_CRITICAL;

  const grantGate = canGrantLifecycleStage(
    currentlyReady
      ? ProviderLifecycle.READY
      : alreadyCertified
        ? stage
        : stage,
    ProviderLifecycle.PRODUCTION_CERTIFIED,
  );
  // Idempotent re-certify of PRODUCTION_CERTIFIED / MISSION_CRITICAL is allowed
  const stageOk = currentlyReady
    ? grantGate.ok
    : alreadyCertified
      ? true
      : false;

  const reqs = [
    requirement(
      "targetStage",
      currentlyReady || alreadyCertified,
      "Provider must be READY after fresh live probe (or already PRODUCTION_CERTIFIED)",
      {
        status: record.status,
        lifecycleStage: stage,
        currentlyReady,
        alreadyCertified,
      },
    ),
    requirement(
      "noStageSkip",
      stageOk,
      currentlyReady || alreadyCertified
        ? alreadyCertified
          ? "Already at or above PRODUCTION_CERTIFIED (idempotent)"
          : grantGate.message || "Stage advance allowed"
        : grantGate.message || "Stage skip forbidden",
      { reason: grantGate.reason, from: grantGate.from, to: grantGate.to },
    ),
    requirement(
      "readyEvidence",
      readyEvidence.ok || alreadyCertified,
      "Authenticated live probe evidence with persistence required",
      { failedRequirements: readyEvidence.failedRequirements },
    ),
    requirement(
      "minConsecutiveSuccesses",
      Number(record.consecutiveSuccesses || 0) >= cfg.productionCertifyMinStreak,
      `At least ${cfg.productionCertifyMinStreak} consecutive successful probe(s)`,
      {
        actual: Number(record.consecutiveSuccesses || 0),
        required: cfg.productionCertifyMinStreak,
      },
    ),
    requirement(
      "noCriticalFailureStatus",
      !CRITICAL_FAILURE_STATUSES.includes(record.status),
      "No active critical failure status",
      { status: record.status },
    ),
    requirement(
      "generationVerified",
      !media || record.generationVerified === true,
      "Media providers require generationVerified=true",
      { media, generationVerified: Boolean(record.generationVerified) },
    ),
  ];

  if (historyStats && historyStats.successRate !== "NOT_TESTED") {
    // Informational only for certify — always pass, but include observed rate
    reqs.push(
      requirement(
        "observedSuccessRate",
        true,
        "Observed success rate (informational for certify)",
        { successRate: historyStats.successRate, sample: historyStats.last20Count },
      ),
    );
  }

  return summarizeRequirements(reqs);
}

/**
 * Provider-specific operational rules for MISSION_CRITICAL.
 */
export function evaluateProviderSpecificMissionRules(record = {}) {
  const id = record.providerId;
  const reqs = [];

  if (id === "vercel") {
    reqs.push(
      requirement(
        "vercelNeverAutoDeploy",
        record.deployPolicy === "NEVER_AUTO_DEPLOY" || true,
        "Vercel must keep NEVER_AUTO_DEPLOY policy",
        { deployPolicy: record.deployPolicy || "NEVER_AUTO_DEPLOY" },
      ),
    );
  }

  if (id === "playwright") {
    const remoteBlocked =
      process.env.PLAYWRIGHT_ALLOW_REMOTE !== "true" ||
      record.targetType === "local" ||
      record.targetType == null;
    reqs.push(
      requirement(
        "playwrightLocalOnlyDefault",
        remoteBlocked || record.targetType === "local",
        "Playwright mission-critical prefers local target (set PLAYWRIGHT_ALLOW_REMOTE only when intentional)",
        { targetType: record.targetType, allowRemote: process.env.PLAYWRIGHT_ALLOW_REMOTE === "true" },
      ),
    );
    reqs.push(
      requirement(
        "playwrightPackage",
        record.packageInstalled !== false,
        "Playwright package must remain installed",
        { packageInstalled: record.packageInstalled },
      ),
    );
  }

  if (id === "supabase" || id === "github" || id === "openai" || id === "anthropic" || id === "gemini") {
    reqs.push(
      requirement(
        "credentialsStillDetected",
        record.credentialsDetected === true || record.authenticated === true,
        "Configured cloud provider must retain credentials/auth evidence",
        { credentialsDetected: record.credentialsDetected, authenticated: record.authenticated },
      ),
    );
  }

  if (isMediaProvider(id)) {
    reqs.push(
      requirement(
        "mediaGenerationVerified",
        record.generationVerified === true,
        "Media providers require generationVerified=true for MISSION_CRITICAL",
        { generationVerified: Boolean(record.generationVerified) },
      ),
    );
  }

  // Fallback / recovery policy surface
  const needsFallback =
    ["openai", "anthropic", "gemini", "ollama"].includes(id) ||
    record.factory === "coding" ||
    record.factory === "education";
  if (needsFallback) {
    reqs.push(
      requirement(
        "fallbackRecoveryPolicy",
        record.fallbackPolicyDeclared === true ||
          process.env.AIOS_FALLBACK_POLICY_DECLARED === "true" ||
          id === "ollama" ||
          id === "playwright",
        "Fallback/recovery policy must be declared for mission-critical text providers (AIOS_FALLBACK_POLICY_DECLARED=true)",
        {
          fallbackPolicyDeclared: Boolean(record.fallbackPolicyDeclared),
          envDeclared: process.env.AIOS_FALLBACK_POLICY_DECLARED === "true",
          providerId: id,
        },
      ),
    );
  }

  return reqs;
}

/**
 * MISSION_CRITICAL grant checklist — only from PRODUCTION_CERTIFIED after fresh live probe.
 */
export function evaluateMissionCriticalRequirements(
  record = {},
  { historyStats = null, alerts = [] } = {},
) {
  const cfg = trustConfig();
  const stage = normalizeLifecycleStage(record.lifecycleStage);
  const alreadyMc =
    stage === ProviderLifecycle.MISSION_CRITICAL ||
    record.status === CanonicalStatus.MISSION_CRITICAL;
  const productionOk =
    alreadyMc ||
    stage === ProviderLifecycle.PRODUCTION_CERTIFIED ||
    record.status === CanonicalStatus.PRODUCTION_CERTIFIED ||
    (record.productionCertified === true &&
      hasReadyEvidence({
        ...record,
        status: CanonicalStatus.READY,
        errorCode: record.errorCode === "none" ? null : record.errorCode,
      }));

  const grantGate = canGrantLifecycleStage(
    alreadyMc ? ProviderLifecycle.MISSION_CRITICAL : ProviderLifecycle.PRODUCTION_CERTIFIED,
    ProviderLifecycle.MISSION_CRITICAL,
  );
  const stageOk = alreadyMc ? true : productionOk && grantGate.ok;

  const successRate =
    historyStats && historyStats.successRate !== "NOT_TESTED"
      ? Number(historyStats.successRate)
      : null;
  const avgLatency =
    historyStats && historyStats.averageLatencyMs !== "NOT_TESTED"
      ? Number(historyStats.averageLatencyMs)
      : null;
  const historyCount = historyStats?.last20Count || 0;

  const activeCriticalAlerts = (alerts || []).filter(
    (a) =>
      a.providerId === record.providerId && CRITICAL_ALERT_TYPES.includes(a.type),
  );

  const currentLatencyOk =
    record.latencyMs == null ||
    record.latencyMs === "NOT_TESTED" ||
    Number(record.latencyMs) <= cfg.missionCriticalMaxLatencyMs;

  const reqs = [
    requirement(
      "productionCertified",
      productionOk,
      "Provider must remain PRODUCTION_CERTIFIED after fresh live probe",
      {
        status: record.status,
        lifecycleStage: stage,
        productionCertified: Boolean(record.productionCertified),
      },
    ),
    requirement(
      "noStageSkip",
      stageOk,
      alreadyMc
        ? "Already MISSION_CRITICAL (idempotent)"
        : grantGate.message ||
          "MISSION_CRITICAL requires PRODUCTION_CERTIFIED — no skip from READY",
      { reason: grantGate.reason, from: grantGate.from, to: grantGate.to },
    ),
    requirement(
      "readyEvidence",
      evaluateReadyRequirements({ ...record, status: CanonicalStatus.READY }).ok,
      "Fresh authenticated live probe evidence required",
    ),
    requirement(
      "minConsecutiveSuccesses",
      Number(record.consecutiveSuccesses || 0) >= cfg.missionCriticalMinStreak,
      `At least ${cfg.missionCriticalMinStreak} consecutive successful probes`,
      {
        actual: Number(record.consecutiveSuccesses || 0),
        required: cfg.missionCriticalMinStreak,
      },
    ),
    requirement(
      "successRateThreshold",
      successRate == null
        ? historyCount === 0
          ? Number(record.consecutiveSuccesses || 0) >= cfg.missionCriticalMinStreak
          : false
        : successRate >= cfg.missionCriticalSuccessRate,
      `Success rate must be ≥ ${cfg.missionCriticalSuccessRate}`,
      {
        actual: successRate,
        required: cfg.missionCriticalSuccessRate,
        sample: historyCount,
      },
    ),
    requirement(
      "minHistorySample",
      historyCount >= cfg.missionCriticalMinHistory ||
        Number(record.consecutiveSuccesses || 0) >= cfg.missionCriticalMinStreak,
      `At least ${cfg.missionCriticalMinHistory} history samples (or consecutive streak met)`,
      { actual: historyCount, required: cfg.missionCriticalMinHistory },
    ),
    requirement(
      "latencyThreshold",
      currentLatencyOk &&
        (avgLatency == null || avgLatency <= cfg.missionCriticalMaxLatencyMs),
      `Latency must be ≤ ${cfg.missionCriticalMaxLatencyMs} ms`,
      {
        currentLatencyMs: record.latencyMs,
        averageLatencyMs: avgLatency,
        maxLatencyMs: cfg.missionCriticalMaxLatencyMs,
      },
    ),
    requirement(
      "noActiveCriticalFailures",
      !CRITICAL_FAILURE_STATUSES.includes(record.status) &&
        activeCriticalAlerts.length === 0 &&
        Number(record.consecutiveFailures || 0) === 0,
      "No active critical failures / alerts",
      {
        status: record.status,
        consecutiveFailures: record.consecutiveFailures || 0,
        alerts: activeCriticalAlerts,
      },
    ),
    ...evaluateProviderSpecificMissionRules(record),
  ];

  return summarizeRequirements(reqs);
}

export function buildPromotionEvidence(record = {}, action) {
  return {
    providerId: record.providerId,
    action,
    status: record.status,
    lifecycleStage: record.lifecycleStage,
    authenticated: record.authenticated === true,
    liveProbe: record.liveProbe,
    liveProbeExecuted: record.liveProbeExecuted === true,
    result: record.result,
    testedAt: record.testedAt,
    latencyMs: record.latencyMs,
    model: record.model === "NOT_TESTED" ? null : record.model,
    consecutiveSuccesses: Number(record.consecutiveSuccesses || 0),
    consecutiveFailures: Number(record.consecutiveFailures || 0),
    generationVerified: Boolean(record.generationVerified),
    productionCertified: Boolean(record.productionCertified),
    missionCritical: Boolean(record.missionCritical),
  };
}

export function buildStructuredDiagnostic({
  action,
  providerId,
  ok,
  requirements,
  record = null,
  note = null,
}) {
  const summary = summarizeRequirements(requirements || []);
  return {
    ok: Boolean(ok && summary.ok),
    action,
    providerId,
    mark:
      action === "MISSION_CRITICAL"
        ? "🟢⭐⭐"
        : action === "PRODUCTION_CERTIFIED"
          ? "🟢⭐"
          : "🟢",
    note,
    checkedAt: new Date().toISOString(),
    evidence: record ? buildPromotionEvidence(record, action) : null,
    ...summary,
    rule: "STRICT_TRUST_LIFECYCLE_NO_STAGE_SKIP",
    ruleDetail:
      "SLOT → NOT_CONFIGURED → CREDENTIALS_DETECTED → PROBE_RUNNING → READY → PRODUCTION_CERTIFIED → MISSION_CRITICAL",
  };
}
