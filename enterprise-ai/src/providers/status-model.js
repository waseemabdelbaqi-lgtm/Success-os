/**
 * Canonical AIOS provider health status model.
 * READY requires authenticated live probe evidence — never slot/adapter/credentials alone.
 */

export const HEALTH_SCHEMA_VERSION = 3;

/**
 * Canonical provider lifecycle (no skipping):
 *   SLOT → CONFIGURED → LIVE_VERIFIED → READY → PRODUCTION_CERTIFIED ⭐
 *
 * Failure statuses (AUTH_FAILED, NETWORK_FAILED, …) are orthogonal and
 * never advance the ladder. Green is only READY or PRODUCTION_CERTIFIED.
 */
export const ProviderLifecycle = Object.freeze({
  SLOT: "SLOT",
  CONFIGURED: "CONFIGURED",
  LIVE_VERIFIED: "LIVE_VERIFIED",
  READY: "READY",
  PRODUCTION_CERTIFIED: "PRODUCTION_CERTIFIED",
});

export const LIFECYCLE_ORDER = Object.freeze([
  ProviderLifecycle.SLOT,
  ProviderLifecycle.CONFIGURED,
  ProviderLifecycle.LIVE_VERIFIED,
  ProviderLifecycle.READY,
  ProviderLifecycle.PRODUCTION_CERTIFIED,
]);

export const LIFECYCLE_LADDER = Object.freeze([
  { stage: ProviderLifecycle.SLOT, label: "SLOT", mark: "" },
  { stage: ProviderLifecycle.CONFIGURED, label: "CONFIGURED", mark: "" },
  { stage: ProviderLifecycle.LIVE_VERIFIED, label: "LIVE VERIFIED", mark: "" },
  { stage: ProviderLifecycle.READY, label: "READY", mark: "" },
  { stage: ProviderLifecycle.PRODUCTION_CERTIFIED, label: "PRODUCTION CERTIFIED", mark: "⭐" },
]);

/** Canonical provider statuses (detail / failure codes). */
export const CanonicalStatus = Object.freeze({
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
  SLOT: "SLOT",
  ADAPTER_AVAILABLE: "ADAPTER_AVAILABLE",
  NOT_INSTALLED: "NOT_INSTALLED",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  CREDENTIALS_DETECTED: "CREDENTIALS_DETECTED",
  CREDENTIALS_NOT_REQUIRED: "CREDENTIALS_NOT_REQUIRED",
  CONFIGURED: "CONFIGURED",
  LIVE_VERIFIED: "LIVE_VERIFIED",
  PROBE_PENDING: "PROBE_PENDING",
  PROBE_RUNNING: "PROBE_RUNNING",
  READY: "READY",
  PRODUCTION_CERTIFIED: "PRODUCTION_CERTIFIED",
  DEGRADED: "DEGRADED",
  RATE_LIMITED: "RATE_LIMITED",
  AUTH_FAILED: "AUTH_FAILED",
  MODEL_UNAVAILABLE: "MODEL_UNAVAILABLE",
  NETWORK_FAILED: "NETWORK_FAILED",
  PROBE_FAILED: "PROBE_FAILED",
  BROWSER_NOT_INSTALLED: "BROWSER_NOT_INSTALLED",
  BROWSER_LAUNCH_FAILED: "BROWSER_LAUNCH_FAILED",
  LOCAL_APP_UNAVAILABLE: "LOCAL_APP_UNAVAILABLE",
  TEST_ASSERTION_FAILED: "TEST_ASSERTION_FAILED",
  REMOTE_TESTING_BLOCKED: "REMOTE_TESTING_BLOCKED",
  DISABLED: "DISABLED",
  NOT_TESTED: "NOT_TESTED",
});

/** Live probe execution result (orthogonal to status). */
export const LiveProbeResult = Object.freeze({
  PASSED: "PASSED",
  FAILED: "FAILED",
  NOT_RUN: "NOT_RUN",
  NOT_VERIFIED: "NOT_VERIFIED",
  RUNNING: "RUNNING",
});

/** Display colour buckets (section 2). */
export const StatusColor = Object.freeze({
  green: "green",
  yellow: "yellow",
  grey: "grey",
  red: "red",
});

const GREEN = new Set([CanonicalStatus.READY, CanonicalStatus.PRODUCTION_CERTIFIED]);
const YELLOW = new Set([
  CanonicalStatus.DEGRADED,
  CanonicalStatus.RATE_LIMITED,
  CanonicalStatus.PROBE_PENDING,
  CanonicalStatus.PROBE_RUNNING,
  CanonicalStatus.CREDENTIALS_DETECTED,
  CanonicalStatus.CREDENTIALS_NOT_REQUIRED,
  CanonicalStatus.CONFIGURED,
  CanonicalStatus.LIVE_VERIFIED,
  CanonicalStatus.LOCAL_APP_UNAVAILABLE,
]);
const RED = new Set([
  CanonicalStatus.AUTH_FAILED,
  CanonicalStatus.MODEL_UNAVAILABLE,
  CanonicalStatus.NETWORK_FAILED,
  CanonicalStatus.PROBE_FAILED,
  CanonicalStatus.BROWSER_NOT_INSTALLED,
  CanonicalStatus.BROWSER_LAUNCH_FAILED,
  CanonicalStatus.TEST_ASSERTION_FAILED,
  CanonicalStatus.REMOTE_TESTING_BLOCKED,
]);
const GREY = new Set([
  CanonicalStatus.SLOT,
  CanonicalStatus.ADAPTER_AVAILABLE,
  CanonicalStatus.NOT_CONFIGURED,
  CanonicalStatus.NOT_INSTALLED,
  CanonicalStatus.DISABLED,
  CanonicalStatus.NOT_IMPLEMENTED,
  CanonicalStatus.NOT_TESTED,
]);

export function colorForStatus(status) {
  if (GREEN.has(status)) return StatusColor.green;
  if (YELLOW.has(status)) return StatusColor.yellow;
  if (RED.has(status)) return StatusColor.red;
  if (GREY.has(status)) return StatusColor.grey;
  return StatusColor.grey;
}

export function colorForLifecycle(stage) {
  if (stage === ProviderLifecycle.PRODUCTION_CERTIFIED || stage === ProviderLifecycle.READY) {
    return StatusColor.green;
  }
  if (stage === ProviderLifecycle.LIVE_VERIFIED || stage === ProviderLifecycle.CONFIGURED) {
    return StatusColor.yellow;
  }
  return StatusColor.grey;
}

/**
 * READY evidence gate.
 * Missing any required field → cannot be READY / PRODUCTION_CERTIFIED.
 */
export function hasReadyEvidence(record = {}) {
  const err = record.errorCode;
  const errOk = !err || err === "none" || err === null;
  return (
    record.authenticated === true &&
    record.liveProbeExecuted === true &&
    (record.result === "success" || record.liveProbe === LiveProbeResult.PASSED) &&
    Boolean(record.testedAt || record.completedAt) &&
    record.testedAt !== "NOT_TESTED" &&
    (record.latencyMs == null || Number.isFinite(Number(record.latencyMs))) &&
    errOk &&
    (record.status === CanonicalStatus.READY ||
      record.status === CanonicalStatus.PRODUCTION_CERTIFIED ||
      record.status === CanonicalStatus.LIVE_VERIFIED)
  );
}

/**
 * PRODUCTION CERTIFIED requires READY evidence plus stability / approval.
 * Media also requires generationVerified. Never auto-certify from SLOT/CONFIGURED.
 */
export function hasProductionCertificationEvidence(record = {}) {
  const streak = Number(process.env.AIOS_PRODUCTION_CERTIFY_STREAK || 3);
  const media = ["heygen", "elevenlabs", "openai-images", "blender"].includes(record.providerId);
  const envFlag =
    process.env[`AIOS_CERTIFY_${String(record.providerId || "").toUpperCase().replace(/-/g, "_")}`] ===
    "true";
  const readyOk =
    hasReadyEvidence({ ...record, status: CanonicalStatus.READY, errorCode: record.errorCode === "none" ? null : record.errorCode }) ||
    record.status === CanonicalStatus.READY ||
    record.status === CanonicalStatus.PRODUCTION_CERTIFIED;
  if (!readyOk) return false;
  if (media && !record.generationVerified) return false;
  if (record.productionCertified === true || envFlag) return true;
  return Number(record.consecutiveSuccesses || 0) >= streak;
}

/**
 * Derive lifecycle stage. Never skips ahead.
 * Failures keep the highest previously earned non-failure stage when provided.
 */
export function deriveLifecycleStage(record = {}, previousStage = null) {
  const prevIdx = Math.max(0, LIFECYCLE_ORDER.indexOf(previousStage));
  const status = record.status;
  const configured =
    Boolean(record.credentialsDetected) ||
    status === CanonicalStatus.CREDENTIALS_DETECTED ||
    status === CanonicalStatus.CREDENTIALS_NOT_REQUIRED ||
    status === CanonicalStatus.CONFIGURED ||
    record.packageInstalled === true;
  const liveOk =
    record.liveProbe === LiveProbeResult.PASSED ||
    (record.authenticated === true &&
      record.liveProbeExecuted === true &&
      (record.result === "success" || record.minimalRequestPassed === true));
  const readyOk =
    (status === CanonicalStatus.READY || status === CanonicalStatus.PRODUCTION_CERTIFIED) &&
    hasReadyEvidence({
      ...record,
      status: CanonicalStatus.READY,
      errorCode: record.errorCode === "none" ? null : record.errorCode,
    });

  let stage = ProviderLifecycle.SLOT;
  if (configured) stage = ProviderLifecycle.CONFIGURED;
  if (configured && liveOk) stage = ProviderLifecycle.LIVE_VERIFIED;
  if (readyOk) stage = ProviderLifecycle.READY;
  if (readyOk && hasProductionCertificationEvidence(record)) {
    stage = ProviderLifecycle.PRODUCTION_CERTIFIED;
  }

  // Do not regress below previous stage on transient yellow states (PROBE_RUNNING etc.)
  // but DO regress on hard failure after a probe attempt that clears live success.
  const failureStatuses = new Set([
    CanonicalStatus.AUTH_FAILED,
    CanonicalStatus.NETWORK_FAILED,
    CanonicalStatus.PROBE_FAILED,
    CanonicalStatus.MODEL_UNAVAILABLE,
    CanonicalStatus.BROWSER_NOT_INSTALLED,
    CanonicalStatus.BROWSER_LAUNCH_FAILED,
    CanonicalStatus.TEST_ASSERTION_FAILED,
    CanonicalStatus.REMOTE_TESTING_BLOCKED,
    CanonicalStatus.NOT_INSTALLED,
  ]);
  if (failureStatuses.has(status) && !liveOk) {
    // Stay at CONFIGURED if credentials remain, else SLOT
    stage = configured ? ProviderLifecycle.CONFIGURED : ProviderLifecycle.SLOT;
  } else if (!failureStatuses.has(status)) {
    const nextIdx = LIFECYCLE_ORDER.indexOf(stage);
    if (prevIdx > nextIdx && prevIdx >= LIFECYCLE_ORDER.indexOf(ProviderLifecycle.READY) && readyOk) {
      stage = LIFECYCLE_ORDER[prevIdx];
    }
  }

  return stage;
}

export function lifecycleProgress(stage) {
  const idx = LIFECYCLE_ORDER.indexOf(stage);
  return LIFECYCLE_LADDER.map((step, i) => ({
    ...step,
    reached: idx >= 0 && i <= idx,
    current: step.stage === stage,
  }));
}

/** Map legacy ProviderStatus / probe fields → canonical status. */
export function toCanonicalStatus(probe = {}, { mode = "live" } = {}) {
  if (probe.disabled) return CanonicalStatus.DISABLED;
  if (probe.status === CanonicalStatus.READY || probe.status === "READY") {
    const evidence = {
      ...probe,
      authenticated: probe.authenticated ?? probe.authenticationValid,
      liveProbeExecuted: probe.liveProbeExecuted ?? probe.minimalRequestPassed,
      result: probe.result || (probe.minimalRequestPassed ? "success" : "failure"),
      testedAt: probe.testedAt || probe.checkedAt || probe.completedAt,
      status: CanonicalStatus.READY,
      errorCode: probe.errorCode || (probe.minimalRequestPassed ? null : probe.lastError),
    };
    if (
      evidence.authenticated &&
      evidence.liveProbeExecuted &&
      evidence.result === "success" &&
      evidence.testedAt &&
      !evidence.errorCode
    ) {
      return CanonicalStatus.READY;
    }
    return CanonicalStatus.PROBE_FAILED;
  }

  const raw = String(probe.status || probe.errorCategory || "");
  if (raw === "NOT_INSTALLED" || probe.notInstalled) return CanonicalStatus.NOT_INSTALLED;
  if (raw === "AUTHENTICATION_FAILED" || raw === "AUTH_FAILED") return CanonicalStatus.AUTH_FAILED;
  if (raw === "MODEL_UNAVAILABLE") return CanonicalStatus.MODEL_UNAVAILABLE;
  if (raw === "NETWORK_ERROR" || raw === "NETWORK_FAILED") return CanonicalStatus.NETWORK_FAILED;
  if (raw === "RATE_LIMITED") return CanonicalStatus.RATE_LIMITED;
  if (raw === "TIMEOUT") return CanonicalStatus.NETWORK_FAILED;
  if (raw === "DISABLED") return CanonicalStatus.DISABLED;
  if (raw === "DEGRADED") return CanonicalStatus.DEGRADED;
  if (raw === "PROBE_PENDING") return CanonicalStatus.PROBE_PENDING;
  if (raw === "PROBE_RUNNING") return CanonicalStatus.PROBE_RUNNING;
  if (raw === "CREDENTIALS_DETECTED") return CanonicalStatus.CREDENTIALS_DETECTED;
  if (raw === "ADAPTER_AVAILABLE") return CanonicalStatus.ADAPTER_AVAILABLE;
  if (raw === "SLOT") return CanonicalStatus.SLOT;
  if (raw === "NOT_IMPLEMENTED") return CanonicalStatus.NOT_IMPLEMENTED;
  if (raw === "NOT_TESTED") return CanonicalStatus.NOT_TESTED;

  if (probe.liveProbeExecuted && !probe.minimalRequestPassed && !probe.authenticationValid) {
    if (raw === "NOT_CONFIGURED" || raw === "MODEL_NOT_CONFIGURED") {
      return CanonicalStatus.NOT_CONFIGURED;
    }
    return CanonicalStatus.PROBE_FAILED;
  }

  if (probe.credentialsDetected || probe.keyDetected || probe.configured) {
    if (mode === "config") return CanonicalStatus.CREDENTIALS_DETECTED;
    if (!probe.liveProbeExecuted) return CanonicalStatus.CREDENTIALS_DETECTED;
  }

  if (raw === "NOT_CONFIGURED" || raw === "MODEL_NOT_CONFIGURED" || raw === "OPTIONAL_OFFLINE") {
    if (probe.adapterAvailable === false) return CanonicalStatus.SLOT;
    if (probe.probeSkippedNoCredentials && probe.slotWhenUnconfigured) {
      return CanonicalStatus.SLOT;
    }
    return CanonicalStatus.NOT_CONFIGURED;
  }

  if (probe.adapterAvailable && !probe.credentialsDetected && !probe.configured) {
    return probe.slotWhenUnconfigured ? CanonicalStatus.SLOT : CanonicalStatus.ADAPTER_AVAILABLE;
  }

  if (probe.adapterAvailable === false) return CanonicalStatus.SLOT;

  return mode === "config" ? CanonicalStatus.NOT_CONFIGURED : CanonicalStatus.NOT_TESTED;
}

export function liveProbeLabel(probe = {}, canonicalStatus) {
  if (canonicalStatus === CanonicalStatus.READY) return LiveProbeResult.PASSED;
  if (probe.liveProbe === LiveProbeResult.PASSED) return LiveProbeResult.PASSED;
  if (probe.liveProbeExecuted) {
    if (canonicalStatus === CanonicalStatus.NOT_CONFIGURED && !probe.credentialsDetected) {
      return LiveProbeResult.FAILED;
    }
    return LiveProbeResult.FAILED;
  }
  if (probe.credentialsDetected && !probe.liveProbeExecuted) return LiveProbeResult.NOT_VERIFIED;
  return LiveProbeResult.NOT_RUN;
}

/** Redact secrets from any diagnostic string. */
export function redactSecrets(value) {
  if (value == null) return value;
  let s = String(value);
  s = s.replace(/(Bearer\s+)[A-Za-z0-9._\-+=/]+/gi, "$1[REDACTED]");
  s = s.replace(/(api[_-]?key|token|secret|authorization)(["']?\s*[:=]\s*["']?)[^&\s"']+/gi, "$1$2[REDACTED]");
  s = s.replace(/sk-[A-Za-z0-9]{10,}/g, "[REDACTED]");
  s = s.replace(/ghp_[A-Za-z0-9]{20,}/g, "[REDACTED]");
  s = s.replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_JWT]");
  s = s.replace(/([?&](key|token|sig|signature|access_token)=)[^&\s]+/gi, "$1[REDACTED]");
  return s;
}

export function emptyResultFields() {
  return {
    status: CanonicalStatus.NOT_TESTED,
    liveProbe: LiveProbeResult.NOT_RUN,
    result: "not_tested",
    testedAt: "NOT_TESTED",
    latencyMs: "NOT_TESTED",
    model: "NOT_TESTED",
    lastError: "NOT_TESTED",
    lastSuccessfulProbeAt: "NOT_TESTED",
  };
}

/** Provider → factory mapping for dashboard. */
export const PROVIDER_FACTORY = Object.freeze({
  openai: "coding",
  anthropic: "coding",
  cursor: "coding",
  "ollama-local": "coding",
  ollama: "coding",
  gemini: "education",
  wolfram: "education",
  heygen: "media",
  elevenlabs: "media",
  "openai-images": "media",
  blender: "media",
  github: "infrastructure",
  supabase: "infrastructure",
  browserbase: "infrastructure",
  playwright: "infrastructure",
  sentry: "infrastructure",
  vercel: "infrastructure",
});

export const PROVIDER_META = Object.freeze({
  openai: { displayName: "OpenAI", adapterAvailable: true, probeType: "authenticated_text", slotWhenUnconfigured: false },
  anthropic: { displayName: "Claude", adapterAvailable: true, probeType: "authenticated_text", slotWhenUnconfigured: false },
  gemini: { displayName: "Gemini", adapterAvailable: true, probeType: "authenticated_text", slotWhenUnconfigured: false },
  ollama: { displayName: "Ollama", adapterAvailable: true, probeType: "local_inference", slotWhenUnconfigured: false },
  "ollama-local": { displayName: "Ollama", adapterAvailable: true, probeType: "local_inference", slotWhenUnconfigured: false },
  wolfram: { displayName: "Wolfram", adapterAvailable: true, probeType: "authenticated_query", slotWhenUnconfigured: true },
  heygen: { displayName: "HeyGen", adapterAvailable: true, probeType: "account_capability", slotWhenUnconfigured: true },
  elevenlabs: { displayName: "ElevenLabs", adapterAvailable: true, probeType: "account_capability", slotWhenUnconfigured: true },
  "openai-images": { displayName: "OpenAI Images", adapterAvailable: true, probeType: "config_only_images", slotWhenUnconfigured: true },
  github: { displayName: "GitHub", adapterAvailable: true, probeType: "authenticated_user", slotWhenUnconfigured: false },
  supabase: { displayName: "Supabase", adapterAvailable: true, probeType: "authorised_read", slotWhenUnconfigured: false },
  browserbase: { displayName: "Browserbase", adapterAvailable: true, probeType: "account_status", slotWhenUnconfigured: false },
  playwright: { displayName: "Playwright", adapterAvailable: true, probeType: "local_browser", slotWhenUnconfigured: false },
  sentry: { displayName: "Sentry", adapterAvailable: true, probeType: "sdk_or_auth", slotWhenUnconfigured: false },
  vercel: { displayName: "Vercel", adapterAvailable: true, probeType: "project_metadata", slotWhenUnconfigured: false, deployPolicy: "NEVER_AUTO_DEPLOY" },
  blender: { displayName: "Blender", adapterAvailable: false, probeType: "offline_tooling", slotWhenUnconfigured: true },
  cursor: { displayName: "Cursor", adapterAvailable: true, probeType: "host_surface", slotWhenUnconfigured: false },
});
