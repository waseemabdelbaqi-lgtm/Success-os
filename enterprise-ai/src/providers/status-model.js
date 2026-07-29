/**
 * Canonical AIOS provider health status model.
 * READY requires authenticated live probe evidence — never slot/adapter/credentials alone.
 */

export const HEALTH_SCHEMA_VERSION = 2;

/** Canonical provider statuses (section 1). */
export const CanonicalStatus = Object.freeze({
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
  SLOT: "SLOT",
  ADAPTER_AVAILABLE: "ADAPTER_AVAILABLE",
  NOT_INSTALLED: "NOT_INSTALLED",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  CREDENTIALS_DETECTED: "CREDENTIALS_DETECTED",
  PROBE_PENDING: "PROBE_PENDING",
  PROBE_RUNNING: "PROBE_RUNNING",
  READY: "READY",
  DEGRADED: "DEGRADED",
  RATE_LIMITED: "RATE_LIMITED",
  AUTH_FAILED: "AUTH_FAILED",
  MODEL_UNAVAILABLE: "MODEL_UNAVAILABLE",
  NETWORK_FAILED: "NETWORK_FAILED",
  PROBE_FAILED: "PROBE_FAILED",
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

const GREEN = new Set([CanonicalStatus.READY]);
const YELLOW = new Set([
  CanonicalStatus.DEGRADED,
  CanonicalStatus.RATE_LIMITED,
  CanonicalStatus.PROBE_PENDING,
  CanonicalStatus.PROBE_RUNNING,
  CanonicalStatus.CREDENTIALS_DETECTED,
]);
const RED = new Set([
  CanonicalStatus.AUTH_FAILED,
  CanonicalStatus.MODEL_UNAVAILABLE,
  CanonicalStatus.NETWORK_FAILED,
  CanonicalStatus.PROBE_FAILED,
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

/**
 * READY evidence gate (section 9).
 * Missing any required field → cannot be READY.
 */
export function hasReadyEvidence(record = {}) {
  return (
    record.authenticated === true &&
    record.liveProbeExecuted === true &&
    (record.result === "success" || record.liveProbe === LiveProbeResult.PASSED) &&
    Boolean(record.testedAt || record.completedAt) &&
    (record.latencyMs == null || Number.isFinite(Number(record.latencyMs))) &&
    !record.errorCode &&
    record.status === CanonicalStatus.READY
  );
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
