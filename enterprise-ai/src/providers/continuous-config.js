/**
 * Continuous governance configuration — intervals, thresholds, priorities, alerts.
 * All values overridable via env. Never auto-promotes; never runs paid media generation.
 */
function numEnv(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

function listEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw || !String(raw).trim()) return [...fallback];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Default probe intervals (ms) by lifecycle tier. */
export function continuousIntervals() {
  return {
    READY: numEnv("AIOS_HEALTH_INTERVAL_READY_MS", 30 * 60 * 1000),
    PRODUCTION_CERTIFIED: numEnv("AIOS_HEALTH_INTERVAL_CERTIFIED_MS", 15 * 60 * 1000),
    MISSION_CRITICAL: numEnv("AIOS_HEALTH_INTERVAL_MISSION_MS", 5 * 60 * 1000),
    DEFAULT: numEnv("AIOS_HEALTH_INTERVAL_DEFAULT_MS", 60 * 60 * 1000),
  };
}

export function continuousThresholds() {
  return {
    /** Consecutive failures before MC → PRODUCTION_CERTIFIED */
    missionCriticalFailToCertified: numEnv("AIOS_DOWNGRADE_MC_FAILURES", 1),
    /** Consecutive failures before PRODUCTION_CERTIFIED → READY */
    certifiedFailToReady: numEnv("AIOS_DOWNGRADE_CERT_FAILURES", 3),
    /** Consecutive failures before READY stays failed / alert */
    readyFailAlert: numEnv("AIOS_READY_FAIL_ALERT", 1),
    /** Recovery retries before downgrade/failover */
    recoveryRetries: numEnv("AIOS_RECOVERY_RETRIES", 2),
    /** Delay between recovery retries (ms) */
    recoveryRetryDelayMs: numEnv("AIOS_RECOVERY_RETRY_DELAY_MS", 1500),
    /** Latency alert threshold (ms) */
    latencyAlertMs: numEnv("AIOS_HEALTH_LATENCY_ALERT_MS", 15000),
    /** History retention */
    historyLimit: numEnv("AIOS_CONTINUOUS_HISTORY_LIMIT", 100),
    governanceHistoryLimit: numEnv("AIOS_GOVERNANCE_HISTORY_LIMIT", 500),
  };
}

/**
 * Factory provider priority (highest first). Configurable via env CSV.
 * Example: AIOS_PRIORITY_CODING=anthropic,openai,ollama
 */
export function factoryPriorities() {
  return {
    coding: listEnv("AIOS_PRIORITY_CODING", ["anthropic", "openai", "ollama"]),
    education: listEnv("AIOS_PRIORITY_EDUCATION", ["gemini", "anthropic", "ollama", "openai", "wolfram"]),
    media: listEnv("AIOS_PRIORITY_MEDIA", ["heygen", "elevenlabs", "openai-images"]),
    infrastructure: listEnv("AIOS_PRIORITY_INFRASTRUCTURE", [
      "playwright",
      "supabase",
      "github",
      "browserbase",
      "sentry",
      "vercel",
    ]),
  };
}

/** Alert channels: console | file | webhook (webhook URL via AIOS_ALERT_WEBHOOK_URL). */
export function alertChannels() {
  return listEnv("AIOS_ALERT_CHANNELS", ["console", "file"]);
}

export function continuousConfig() {
  return {
    intervals: continuousIntervals(),
    thresholds: continuousThresholds(),
    priorities: factoryPriorities(),
    alertChannels: alertChannels(),
    alertWebhookUrl: process.env.AIOS_ALERT_WEBHOOK_URL || null,
    /** Never auto-run paid media generation in continuous health */
    mediaGenerationAllowed: false,
    autoPromote: false,
  };
}

export function intervalForLifecycle(stage, intervals = continuousIntervals()) {
  if (stage === "MISSION_CRITICAL") return intervals.MISSION_CRITICAL;
  if (stage === "PRODUCTION_CERTIFIED") return intervals.PRODUCTION_CERTIFIED;
  if (stage === "READY") return intervals.READY;
  return intervals.DEFAULT;
}
