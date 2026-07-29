/**
 * AIOS health runner — config / live / full modes with provider & factory filters.
 */
import { openaiConfigured, openaiHealthCheck, openaiModelConfigured } from "./openai.js";
import { anthropicConfigured, anthropicHealthCheck, anthropicModelConfigured } from "./anthropic.js";
import { geminiConfigured, geminiHealthCheck, geminiModelConfigured } from "./gemini.js";
import { ollamaConfigured, ollamaHealthCheck } from "./ollama-fallback.js";
import {
  wolframHealthCheck,
  heygenHealthCheck,
  elevenlabsHealthCheck,
  openaiImagesHealthCheck,
  githubHealthCheck,
  supabaseHealthCheck,
  browserbaseHealthCheck,
  playwrightHealthCheck,
  sentryHealthCheck,
  vercelHealthCheck,
} from "./infra-health.js";
import {
  CanonicalStatus,
  LiveProbeResult,
  PROVIDER_FACTORY,
  PROVIDER_META,
  colorForStatus,
  redactSecrets,
  toCanonicalStatus,
} from "./status-model.js";
import {
  appendHistory,
  buildDashboardFromState,
  createEmptyProviderRecord,
  evaluateAlerts,
  loadHealthState,
  normalizeProviderRecord,
  saveHealthState,
} from "./health-store.js";
import { firstEnv } from "./base.js";

const ALL_PROVIDER_IDS = [
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

const FACTORY_PROVIDERS = {
  coding: ["openai", "anthropic", "ollama", "cursor"],
  education: ["anthropic", "gemini", "wolfram", "openai"],
  media: ["heygen", "elevenlabs", "openai-images", "blender"],
  infrastructure: ["github", "supabase", "browserbase", "playwright", "sentry", "vercel"],
};

function envPresent(keys) {
  return keys.some((k) => {
    const v = process.env[k];
    return Boolean(v && String(v).trim() && !String(v).startsWith("change-me"));
  });
}

function credentialsFor(id) {
  switch (id) {
    case "openai":
    case "openai-images":
      return openaiConfigured();
    case "anthropic":
      return anthropicConfigured();
    case "gemini":
      return geminiConfigured();
    case "ollama":
    case "ollama-local":
      return true; // local; reachability checked in probe
    case "wolfram":
      return Boolean(firstEnv(["WOLFRAM_APP_ID", "WOLFRAM_ALPHA_APPID"]));
    case "heygen":
      return envPresent(["HEYGEN_API_KEY"]);
    case "elevenlabs":
      return envPresent(["ELEVENLABS_API_KEY"]);
    case "github":
      return envPresent(["GITHUB_TOKEN", "GH_TOKEN"]);
    case "supabase":
      return (
        envPresent(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]) &&
        envPresent(["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
      );
    case "browserbase":
      return envPresent(["BROWSERBASE_API_KEY"]);
    case "playwright":
      return null; // install check
    case "sentry":
      return envPresent(["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN", "SENTRY_AUTH_TOKEN"]);
    case "vercel":
      return envPresent(["VERCEL_TOKEN"]);
    case "blender":
      return envPresent(["BLENDER_BIN", "BLENDER_PATH"]);
    case "cursor":
      return Boolean(process.env.CURSOR_AGENT || process.env.CURSOR_TRACE_ID || process.env.TERM_PROGRAM);
    default:
      return false;
  }
}

function safeErrorFromProbe(probe, canonical) {
  if (canonical === CanonicalStatus.READY) return "none";
  const msg =
    probe.lastError ||
    probe.errorCategory ||
    probe.detail ||
    (canonical === CanonicalStatus.NOT_CONFIGURED
      ? "missing API key or model configuration"
      : canonical === CanonicalStatus.NOT_INSTALLED
        ? "Playwright not installed"
        : canonical === CanonicalStatus.SLOT
          ? "credentials missing"
          : canonical);
  return redactSecrets(String(msg));
}

function mapProbeToPartial(providerId, probe, { mode, liveExecuted }) {
  const meta = PROVIDER_META[providerId] || {};
  const startedAt = probe.startedAt || probe.checkedAt || new Date().toISOString();
  const completedAt = probe.checkedAt || new Date().toISOString();
  const credentialsDetected = Boolean(
    probe.keyDetected || probe.configured || credentialsFor(providerId),
  );

  let enriched = {
    ...probe,
    providerId,
    adapterAvailable: meta.adapterAvailable !== false,
    credentialsDetected,
    slotWhenUnconfigured: Boolean(meta.slotWhenUnconfigured),
    probeSkippedNoCredentials: !credentialsDetected && !liveExecuted,
    liveProbeExecuted: Boolean(liveExecuted && (probe.minimalRequestPassed != null || probe.status)),
    authenticated: Boolean(probe.authenticationValid),
    notInstalled: probe.errorCategory === "NOT_INSTALLED" || /not installed/i.test(String(probe.lastError || "")),
  };

  // Playwright: explicit NOT_INSTALLED
  if (providerId === "playwright" && enriched.notInstalled) {
    enriched.status = "NOT_INSTALLED";
  }

  // Config-only: never READY
  if (mode === "config") {
    if (!meta.adapterAvailable) {
      return {
        providerId,
        status: CanonicalStatus.SLOT,
        liveProbe: LiveProbeResult.NOT_RUN,
        liveProbeExecuted: false,
        authenticated: false,
        credentialsDetected,
        result: "config_only",
        testedAt: completedAt,
        startedAt,
        completedAt,
        latencyMs: "NOT_TESTED",
        model: "NOT_TESTED",
        errorCode: credentialsDetected ? "CONFIG_ONLY" : "credentials missing",
        safeErrorMessage: credentialsDetected
          ? "credentials appear present — live probe not run"
          : "credentials missing",
        connectionReady: false,
        generationVerified: false,
      };
    }
    if (providerId === "playwright") {
      // install detect without browser launch in config mode
      return {
        providerId,
        status: credentialsDetected || probe.configured ? CanonicalStatus.CREDENTIALS_DETECTED : CanonicalStatus.NOT_INSTALLED,
        liveProbe: LiveProbeResult.NOT_RUN,
        liveProbeExecuted: false,
        authenticated: false,
        credentialsDetected: Boolean(probe.configured),
        result: "config_only",
        testedAt: completedAt,
        startedAt,
        completedAt,
        model: "NOT_TESTED",
        latencyMs: "NOT_TESTED",
        errorCode: probe.configured ? "CONFIG_ONLY" : "NOT_INSTALLED",
        safeErrorMessage: probe.configured
          ? "package resolvable — browser live probe not run"
          : "Playwright not installed",
      };
    }
    if (!credentialsDetected) {
      const status = meta.slotWhenUnconfigured
        ? CanonicalStatus.SLOT
        : CanonicalStatus.NOT_CONFIGURED;
      return {
        providerId,
        status,
        liveProbe: LiveProbeResult.NOT_RUN,
        liveProbeExecuted: false,
        authenticated: false,
        credentialsDetected: false,
        result: "config_only",
        testedAt: completedAt,
        startedAt,
        completedAt,
        latencyMs: "NOT_TESTED",
        model: probe.model || "NOT_TESTED",
        errorCode: status === CanonicalStatus.SLOT ? "credentials missing" : "missing API key or model configuration",
        safeErrorMessage:
          status === CanonicalStatus.SLOT
            ? providerId === "heygen"
              ? "requires HEYGEN credentials and a real API probe"
              : providerId === "openai-images"
                ? "depends on valid OpenAI configuration and image generation permission"
                : "credentials missing"
            : "missing API key or model configuration",
        connectionReady: false,
        generationVerified: false,
      };
    }
    return {
      providerId,
      status: CanonicalStatus.CREDENTIALS_DETECTED,
      liveProbe: LiveProbeResult.NOT_VERIFIED,
      liveProbeExecuted: false,
      authenticated: false,
      credentialsDetected: true,
      result: "config_only",
      testedAt: completedAt,
      startedAt,
      completedAt,
      latencyMs: "NOT_TESTED",
      model: probe.model || process.env[`${providerId.toUpperCase()}_MODEL`] || "NOT_TESTED",
      errorCode: "CREDENTIALS_DETECTED",
      safeErrorMessage: "credentials appear present — awaiting live authenticated probe",
      connectionReady: false,
      generationVerified: false,
    };
  }

  // Live / full
  const isLlm = ["openai", "anthropic", "gemini"].includes(providerId);
  const isInfra = ["github", "supabase", "browserbase", "sentry", "vercel"].includes(providerId);
  const isMedia = ["heygen", "elevenlabs", "openai-images"].includes(providerId);

  let status = toCanonicalStatus(enriched, { mode: "live" });
  let liveProbeFinal = LiveProbeResult.NOT_RUN;
  let liveProbeExecuted = false;

  // Playwright: never use API-credential logic; follow probe status machine.
  if (providerId === "playwright") {
    const raw = String(probe.status || probe.errorCategory || "");
    liveProbeExecuted = Boolean(probe.liveProbeExecuted ?? liveExecuted);
    if (raw === "READY" && probe.authenticationValid && probe.minimalRequestPassed) {
      status = CanonicalStatus.READY;
      liveProbeFinal = LiveProbeResult.PASSED;
    } else if (raw === "NOT_INSTALLED" || enriched.notInstalled) {
      status = CanonicalStatus.NOT_INSTALLED;
      liveProbeFinal = LiveProbeResult.FAILED;
    } else if (raw === "CREDENTIALS_NOT_REQUIRED") {
      status = CanonicalStatus.CREDENTIALS_NOT_REQUIRED;
      liveProbeFinal = LiveProbeResult.NOT_VERIFIED;
    } else if (raw === "BROWSER_NOT_INSTALLED") {
      status = CanonicalStatus.BROWSER_NOT_INSTALLED;
      liveProbeFinal = LiveProbeResult.FAILED;
    } else if (raw === "BROWSER_LAUNCH_FAILED") {
      status = CanonicalStatus.BROWSER_LAUNCH_FAILED;
      liveProbeFinal = LiveProbeResult.FAILED;
    } else if (raw === "LOCAL_APP_UNAVAILABLE") {
      status = CanonicalStatus.LOCAL_APP_UNAVAILABLE;
      liveProbeFinal = LiveProbeResult.FAILED;
    } else if (raw === "TEST_ASSERTION_FAILED") {
      status = CanonicalStatus.TEST_ASSERTION_FAILED;
      liveProbeFinal = LiveProbeResult.FAILED;
    } else if (raw === "REMOTE_TESTING_BLOCKED") {
      status = CanonicalStatus.REMOTE_TESTING_BLOCKED;
      liveProbeFinal = LiveProbeResult.FAILED;
    } else if (raw === "PROBE_RUNNING") {
      status = CanonicalStatus.PROBE_RUNNING;
      liveProbeFinal = LiveProbeResult.RUNNING;
    } else {
      status = CanonicalStatus.PROBE_FAILED;
      liveProbeFinal = LiveProbeResult.FAILED;
    }
  } else if (!credentialsDetected && providerId !== "ollama") {
    // Missing credentials: never green; LLM → FAILED, specialty slots → SLOT/NOT_RUN, infra → NOT_RUN
    if (meta.slotWhenUnconfigured || isMedia) {
      status = CanonicalStatus.SLOT;
      liveProbeFinal = LiveProbeResult.NOT_RUN;
      liveProbeExecuted = false;
    } else if (isLlm) {
      status = CanonicalStatus.NOT_CONFIGURED;
      liveProbeFinal = LiveProbeResult.FAILED;
      liveProbeExecuted = true;
    } else if (isInfra) {
      status = CanonicalStatus.NOT_CONFIGURED;
      liveProbeFinal = LiveProbeResult.NOT_RUN;
      liveProbeExecuted = false;
    } else {
      status = CanonicalStatus.NOT_CONFIGURED;
      liveProbeFinal = LiveProbeResult.NOT_RUN;
      liveProbeExecuted = false;
    }
  } else if (providerId === "ollama" && probe.status === "READY" && probe.authenticationValid && probe.minimalRequestPassed) {
    status = CanonicalStatus.READY;
    liveProbeFinal = LiveProbeResult.PASSED;
    liveProbeExecuted = true;
  } else if (probe.status === "READY" && probe.authenticationValid && probe.minimalRequestPassed) {
    status = CanonicalStatus.READY;
    liveProbeFinal = LiveProbeResult.PASSED;
    liveProbeExecuted = true;
  } else {
    // Credentials present (or ollama reachable) but probe did not succeed
    liveProbeExecuted = true;
    const raw = String(probe.status || probe.errorCategory || "");
    if (raw === "AUTHENTICATION_FAILED" || raw === "AUTH_FAILED") status = CanonicalStatus.AUTH_FAILED;
    else if (raw === "MODEL_UNAVAILABLE") status = CanonicalStatus.MODEL_UNAVAILABLE;
    else if (raw === "RATE_LIMITED") status = CanonicalStatus.RATE_LIMITED;
    else if (
      raw === "NETWORK_ERROR" ||
      raw === "NETWORK_FAILED" ||
      raw === "HTTP_TIMEOUT" ||
      raw === "TIMEOUT" ||
      /timeout|aborted|fetch failed/i.test(String(probe.lastError || probe.errorCategory || ""))
    ) {
      status = CanonicalStatus.NETWORK_FAILED;
    } else if (raw === "NOT_CONFIGURED" || raw === "MODEL_NOT_CONFIGURED") {
      status = CanonicalStatus.NOT_CONFIGURED;
    } else {
      status = CanonicalStatus.PROBE_FAILED;
    }
    liveProbeFinal = LiveProbeResult.FAILED;
  }

  const ready =
    status === CanonicalStatus.READY &&
    probe.authenticationValid === true &&
    probe.minimalRequestPassed === true;

  const generationVerified = false; // never auto for media
  const connectionReady = ready;

  let safeError;
  if (ready) safeError = "none";
  else if (providerId === "playwright") {
    safeError = probe.lastError || status;
  } else if (!credentialsDetected && isMedia) {
    safeError =
      providerId === "heygen"
        ? "requires HEYGEN credentials and a real API probe"
        : providerId === "openai-images"
          ? "depends on valid OpenAI configuration and image generation permission"
          : "credentials missing";
  } else if (!credentialsDetected && isLlm) {
    safeError = "missing API key or model configuration";
  } else if (!credentialsDetected && providerId === "supabase") {
    safeError = "SUPABASE_URL and required keys missing";
  } else if (!credentialsDetected) {
    safeError = "credentials missing";
  } else if (providerId === "heygen" && probe.errorCategory) {
    safeError = probe.lastError || probe.errorCategory;
  } else {
    safeError = safeErrorFromProbe(probe, status);
  }

  const latencyOut =
    probe.latencyMs != null && Number.isFinite(Number(probe.latencyMs))
      ? Number(probe.latencyMs)
      : ready
        ? "NOT_TESTED"
        : "NOT_TESTED";

  return {
    providerId,
    status: ready ? CanonicalStatus.READY : status,
    liveProbe: ready ? LiveProbeResult.PASSED : liveProbeFinal,
    liveProbeExecuted: ready ? true : liveProbeExecuted,
    authenticated: ready ? true : Boolean(probe.authenticationValid),
    credentialsDetected: providerId === "playwright" ? false : credentialsDetected,
    result: ready ? "success" : liveProbeFinal === LiveProbeResult.NOT_RUN ? "not_run" : "failure",
    testedAt: completedAt,
    startedAt,
    completedAt,
    latencyMs: latencyOut,
    model: probe.model || (ready ? "unknown" : "NOT_TESTED"),
    endpoint: probe.endpoint || probe.targetURL || "NOT_TESTED",
    errorCode: ready ? "none" : status,
    safeErrorMessage: ready ? "none" : safeError,
    connectionReady: isMedia ? Boolean(probe.connectionReady || connectionReady) : ready,
    generationVerified: isMedia ? Boolean(probe.generationVerified) : ready ? true : false,
    deployPolicy: providerId === "vercel" ? "NEVER_AUTO_DEPLOY" : null,
    displayColor: colorForStatus(ready ? CanonicalStatus.READY : status),
    // Playwright evidence fields
    packageInstalled: probe.packageInstalled ?? null,
    packageVersion: probe.packageVersion ?? null,
    browserInstalled: probe.browserInstalled ?? null,
    browserVersion: probe.browserVersion ?? null,
    targetType: probe.targetType || (providerId === "playwright" ? "LOCAL" : null),
    targetURL: probe.targetURL || null,
    diagnostic: probe.diagnostic || null,
  };
}

async function runConfigChecks(ids) {
  const out = [];
  for (const id of ids) {
    const startedAt = new Date().toISOString();
    let probe = { provider: id, configured: false, checkedAt: startedAt };
    if (id === "playwright") {
      try {
        await import("playwright");
        probe.configured = true;
      } catch {
        try {
          await import("@playwright/test");
          probe.configured = true;
        } catch {
          probe.configured = false;
          probe.lastError = "playwright not installed";
          probe.errorCategory = "NOT_INSTALLED";
        }
      }
    } else if (id === "openai") {
      probe.configured = openaiConfigured();
      probe.modelConfigured = openaiModelConfigured();
      probe.model = (process.env.OPENAI_MODEL || "").trim() || null;
      probe.keyDetected = probe.configured;
    } else if (id === "anthropic") {
      probe.configured = anthropicConfigured();
      probe.modelConfigured = anthropicModelConfigured();
      probe.model = (process.env.ANTHROPIC_MODEL || "").trim() || null;
      probe.keyDetected = probe.configured;
    } else if (id === "gemini") {
      probe.configured = geminiConfigured();
      probe.modelConfigured = geminiModelConfigured();
      probe.model = (process.env.GEMINI_MODEL || "").trim() || null;
      probe.keyDetected = probe.configured;
    } else if (id === "ollama") {
      probe.configured = await ollamaConfigured();
      probe.model = (process.env.OLLAMA_MODEL || "").trim() || null;
      probe.keyDetected = probe.configured;
    } else {
      probe.configured = Boolean(credentialsFor(id));
      probe.keyDetected = probe.configured;
    }
    probe.checkedAt = new Date().toISOString();
    out.push(mapProbeToPartial(id, probe, { mode: "config", liveExecuted: false }));
  }
  return out;
}

async function runLiveProbe(id) {
  const startedAt = new Date().toISOString();
  // Skip network for providers with no credentials (except local ollama/playwright install checks).
  const creds = credentialsFor(id);
  if (creds === false && id !== "ollama" && id !== "playwright") {
    const probe = {
      provider: id,
      configured: false,
      keyDetected: false,
      authenticationValid: false,
      minimalRequestPassed: false,
      status: "NOT_CONFIGURED",
      checkedAt: new Date().toISOString(),
      startedAt,
      lastError: "credentials missing",
    };
    return mapProbeToPartial(id, probe, { mode: "live", liveExecuted: false });
  }
  let probe;
  switch (id) {
    case "openai":
      probe = await openaiHealthCheck();
      break;
    case "anthropic":
      probe = await anthropicHealthCheck();
      break;
    case "gemini":
      probe = await geminiHealthCheck();
      break;
    case "ollama":
      probe = await ollamaHealthCheck();
      break;
    case "wolfram":
      probe = await wolframHealthCheck();
      break;
    case "heygen":
      probe = await heygenHealthCheck();
      break;
    case "elevenlabs":
      probe = await elevenlabsHealthCheck();
      break;
    case "openai-images":
      probe = await openaiImagesHealthCheck();
      break;
    case "github":
      probe = await githubHealthCheck();
      break;
    case "supabase":
      probe = await supabaseHealthCheck();
      break;
    case "browserbase":
      probe = await browserbaseHealthCheck();
      break;
    case "playwright":
      probe = await playwrightHealthCheck();
      break;
    case "sentry":
      probe = await sentryHealthCheck();
      break;
    case "vercel": {
      probe = await vercelHealthCheck();
      // Hard guarantee: health never deploys
      probe.deployPolicy = "NEVER_AUTO_DEPLOY";
      probe.autoAction = "never-auto-deploy";
      break;
    }
    default:
      probe = {
        provider: id,
        status: "NOT_IMPLEMENTED",
        authenticationValid: false,
        minimalRequestPassed: false,
        checkedAt: new Date().toISOString(),
        lastError: "NOT_IMPLEMENTED",
      };
  }
  probe.startedAt = startedAt;
  probe.checkedAt = probe.checkedAt || new Date().toISOString();
  return mapProbeToPartial(id, probe, { mode: "live", liveExecuted: true });
}

function resolveProviderIds({ provider, factory } = {}) {
  if (provider) {
    const id = provider === "claude" ? "anthropic" : provider === "ollama-local" ? "ollama" : provider;
    return ALL_PROVIDER_IDS.includes(id) || id === "cursor" || id === "blender" ? [id] : [id];
  }
  if (factory) {
    const list = FACTORY_PROVIDERS[factory] || [];
    return list.filter((id) => ALL_PROVIDER_IDS.includes(id) || id === "cursor" || id === "blender");
  }
  return [...ALL_PROVIDER_IDS];
}

/**
 * Factory readiness from live probe records (section 8).
 */
export function computeFactoryReadiness(records = []) {
  const byId = new Map(records.map((r) => [r.providerId, r]));
  const ready = (id) => byId.get(id)?.status === CanonicalStatus.READY;

  const codingReady = ["openai", "anthropic", "ollama"].filter(ready);
  const educationReady = ["anthropic", "gemini", "wolfram", "openai"].filter(ready);
  const mediaConnection = ["heygen", "elevenlabs", "openai-images"].filter(
    (id) => byId.get(id)?.connectionReady || byId.get(id)?.status === CanonicalStatus.READY,
  );
  const mediaGeneration = ["heygen", "elevenlabs", "openai-images"].filter(
    (id) => byId.get(id)?.generationVerified,
  );

  let coding;
  if (codingReady.includes("openai") || codingReady.includes("anthropic")) {
    coding = codingReady.length >= 1 ? "READY" : "NOT_READY";
  } else if (codingReady.includes("ollama")) {
    coding = "READY_WITH_LOCAL_ONLY";
  } else {
    coding = "NOT_READY";
  }

  let education = educationReady.length >= 1 ? "PARTIAL" : "NOT_READY";
  if (educationReady.length === 0) education = "NOT_READY";

  let media = "NOT_READY";
  if (mediaGeneration.length > 0) media = "READY";
  else if (mediaConnection.length > 0) media = "PARTIAL";
  else {
    const anyCreds = ["heygen", "elevenlabs", "openai-images"].some(
      (id) => byId.get(id)?.credentialsDetected,
    );
    media = anyCreds ? "PARTIAL_CONFIGURATION_ONLY" : "NOT_READY";
  }

  return {
    policy: {
      coding: "ANY_REQUIRED",
      education: "MINIMUM_COUNT",
      media: "CUSTOM",
    },
    coding: {
      status: coding,
      readyProviders: codingReady,
      note: coding === "READY_WITH_LOCAL_ONLY" ? "Ollama live READY; cloud coding providers not configured" : null,
    },
    education: {
      status: education,
      readyProviders: educationReady,
    },
    media: {
      status: media,
      connectionReady: mediaConnection,
      generationVerified: mediaGeneration,
      note: "CONNECTION_READY does not imply GENERATION_VERIFIED",
    },
  };
}

/**
 * Run health in config | live | full mode.
 */
export async function runHealthCommand({
  mode = "live",
  provider = null,
  factory = null,
  rootDir = process.cwd(),
  persist = true,
} = {}) {
  const normalizedMode = ["config", "live", "full"].includes(mode) ? mode : "live";
  const ids = resolveProviderIds({ provider, factory }).filter((id) =>
    ALL_PROVIDER_IDS.includes(id),
  );
  const previous = loadHealthState(rootDir);
  const prevById = new Map((previous?.providers || []).map((p) => [p.providerId, p]));

  let partials = [];
  if (normalizedMode === "config") {
    partials = await runConfigChecks(ids);
  } else {
    // live or full — run live probes (full also merges config metadata)
    const livePartials = [];
    for (const id of ids) {
      livePartials.push(await runLiveProbe(id));
    }
    if (normalizedMode === "full") {
      const configPartials = await runConfigChecks(ids);
      const confById = new Map(configPartials.map((p) => [p.providerId, p]));
      partials = livePartials.map((lp) => ({
        ...confById.get(lp.providerId),
        ...lp,
        // live wins for status; keep config note if still credentials-only
      }));
    } else {
      partials = livePartials;
    }
  }

  // Merge into full provider list for dashboard (untested providers stay NOT_TESTED or previous)
  const allIds = provider || factory ? ids : ALL_PROVIDER_IDS;
  const records = [];
  const historyEntries = [];

  if (provider || factory) {
    // Keep previous records for others
    const updated = new Map((previous?.providers || []).map((p) => [p.providerId, p]));
    for (const partial of partials) {
      const rec = normalizeProviderRecord(partial, prevById.get(partial.providerId));
      updated.set(rec.providerId, rec);
      historyEntries.push({
        providerId: rec.providerId,
        status: rec.status,
        liveProbe: rec.liveProbe,
        testedAt: rec.testedAt,
        latencyMs: rec.latencyMs,
        model: rec.model,
        safeErrorMessage: rec.safeErrorMessage,
        mode: normalizedMode,
      });
    }
    for (const id of ALL_PROVIDER_IDS) {
      records.push(updated.get(id) || createEmptyProviderRecord(id));
    }
  } else {
    const byPartial = new Map(partials.map((p) => [p.providerId, p]));
    for (const id of allIds) {
      const partial = byPartial.get(id) || {
        providerId: id,
        status: CanonicalStatus.NOT_TESTED,
        liveProbe: LiveProbeResult.NOT_RUN,
        liveProbeExecuted: false,
        authenticated: false,
        result: "not_tested",
        testedAt: "NOT_TESTED",
        safeErrorMessage: "NOT_TESTED",
      };
      const rec = normalizeProviderRecord(partial, prevById.get(id));
      records.push(rec);
      historyEntries.push({
        providerId: rec.providerId,
        status: rec.status,
        liveProbe: rec.liveProbe,
        testedAt: rec.testedAt,
        latencyMs: rec.latencyMs,
        model: rec.model,
        safeErrorMessage: rec.safeErrorMessage,
        mode: normalizedMode,
      });
    }
  }

  const checkedAt = new Date().toISOString();
  const factories = computeFactoryReadiness(records);
  const alerts = evaluateAlerts(previous, records);
  const state = {
    checkedAt,
    mode: normalizedMode,
    filter: { provider: provider || null, factory: factory || null },
    providers: records,
    factories,
    alerts,
    ready: records.filter((r) => r.status === CanonicalStatus.READY).map((r) => r.providerId),
    vercelAutoDeployBlocked: true,
    secretsExposed: false,
  };

  let snapshotPath = null;
  if (persist) {
    snapshotPath = saveHealthState(state, rootDir);
    appendHistory(historyEntries, rootDir);
    // Also write legacy last-probe.json for older readers
    try {
      const { saveHealthSnapshot, buildInfrastructureDashboard } = await import("./live-status.js");
      saveHealthSnapshot(
        {
          checkedAt,
          providers: records.map((r) => ({
            provider: r.providerId,
            status: r.status === CanonicalStatus.READY ? "READY" : r.status,
            authenticationValid: r.authenticated,
            minimalRequestPassed: r.status === CanonicalStatus.READY,
            latencyMs: r.latencyMs === "NOT_TESTED" ? null : r.latencyMs,
            model: r.model === "NOT_TESTED" ? null : r.model,
            checkedAt: r.testedAt === "NOT_TESTED" ? checkedAt : r.testedAt,
            configured: r.credentialsDetected,
            lastError: r.safeErrorMessage,
          })),
          ready: state.ready,
          dashboard: buildInfrastructureDashboard(
            records.map((r) => ({
              provider: r.providerId,
              status: r.status === CanonicalStatus.READY ? "READY" : r.status,
              authenticationValid: r.authenticated,
              minimalRequestPassed: r.status === CanonicalStatus.READY,
              latencyMs: r.latencyMs === "NOT_TESTED" ? null : r.latencyMs,
              model: r.model === "NOT_TESTED" ? null : r.model,
              checkedAt: r.testedAt === "NOT_TESTED" ? null : r.testedAt,
            })),
            { checkedAt },
          ),
        },
        rootDir,
      );
    } catch {
      /* legacy snapshot optional */
    }
  }

  const dashboard = buildDashboardFromState(state, rootDir);

  return {
    ...state,
    dashboard,
    snapshotPath,
    modes: {
      config: normalizedMode === "config",
      live: normalizedMode === "live" || normalizedMode === "full",
      full: normalizedMode === "full",
      singleProvider: Boolean(provider),
      factory: Boolean(factory),
    },
  };
}

export { ALL_PROVIDER_IDS, FACTORY_PROVIDERS, PROVIDER_FACTORY };
