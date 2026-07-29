/**
 * Live Provider Registry — routing, fallbacks, circuit breakers, concurrency.
 */
import { openaiChat, openaiConfigured, openaiHealthCheck, openaiModelConfigured } from "./openai.js";
import { anthropicChat, anthropicConfigured, anthropicHealthCheck, anthropicModelConfigured } from "./anthropic.js";
import { geminiChat, geminiConfigured, geminiHealthCheck, geminiModelConfigured } from "./gemini.js";
import { ollamaChat, ollamaConfigured, ollamaHealthCheck, ollamaModelConfigured } from "./ollama-fallback.js";
import { ProviderStatus, AiosProviderError } from "./errors.js";
import { runHealthCommand } from "./health-runner.js";
import { CanonicalStatus } from "./status-model.js";

const ROLE_ROUTES = {
  engineering: ["openai", "anthropic", "gemini", "ollama-local"],
  architecture: ["openai", "anthropic", "gemini", "ollama-local"],
  frontend: ["openai", "anthropic", "gemini", "ollama-local"],
  backend: ["openai", "anthropic", "gemini", "ollama-local"],
  database: ["openai", "anthropic", "gemini", "ollama-local"],
  security: ["openai", "anthropic", "gemini", "ollama-local"],
  performance: ["openai", "anthropic", "gemini", "ollama-local"],
  debugging: ["openai", "anthropic", "gemini", "ollama-local"],
  curriculum: ["anthropic", "openai", "gemini", "ollama-local"],
  documentation: ["anthropic", "openai", "gemini", "ollama-local"],
  research: ["gemini", "openai", "anthropic", "ollama-local"],
  verification: ["gemini", "openai", "anthropic", "ollama-local"],
  multimodal: ["gemini", "openai", "anthropic", "ollama-local"],
  testing: ["local", "openai", "anthropic", "gemini", "ollama-local"],
  default: ["openai", "anthropic", "gemini", "ollama-local"],
};

const ENV_ROLE_MAP = {
  engineering: "AIOS_ENGINEERING_PROVIDER",
  frontend: "AIOS_FRONTEND_PROVIDER",
  backend: "AIOS_BACKEND_PROVIDER",
  database: "AIOS_DATABASE_PROVIDER",
  security: "AIOS_SECURITY_PROVIDER",
  curriculum: "AIOS_CURRICULUM_PROVIDER",
  documentation: "AIOS_DOCUMENTATION_PROVIDER",
  research: "AIOS_RESEARCH_PROVIDER",
  verification: "AIOS_VERIFICATION_PROVIDER",
  multimodal: "AIOS_MULTIMODAL_PROVIDER",
  testing: "AIOS_TESTING_PROVIDER",
  default: "AIOS_DEFAULT_PROVIDER",
};

const adapters = {
  openai: { configured: openaiConfigured, modelConfigured: openaiModelConfigured, chat: openaiChat, health: openaiHealthCheck },
  anthropic: { configured: anthropicConfigured, modelConfigured: anthropicModelConfigured, chat: anthropicChat, health: anthropicHealthCheck },
  gemini: { configured: geminiConfigured, modelConfigured: geminiModelConfigured, chat: geminiChat, health: geminiHealthCheck },
  "ollama-local": {
    configured: ollamaConfigured,
    modelConfigured: ollamaModelConfigured,
    chat: ollamaChat,
    health: ollamaHealthCheck,
  },
  ollama: {
    configured: ollamaConfigured,
    modelConfigured: ollamaModelConfigured,
    chat: ollamaChat,
    health: ollamaHealthCheck,
  },
};

const circuits = new Map(); // provider -> { failures, openUntil }
const inflight = new Map(); // provider -> count
const MAX_INFLIGHT = Number(process.env.AIOS_PROVIDER_CONCURRENCY || 2);
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 60_000;

function circuitOpen(id) {
  const c = circuits.get(id);
  return Boolean(c?.openUntil && c.openUntil > Date.now());
}

function markSuccess(id) {
  circuits.set(id, { failures: 0, openUntil: 0 });
}

function markFailure(id) {
  const old = circuits.get(id) || { failures: 0, openUntil: 0 };
  const failures = old.failures + 1;
  circuits.set(id, {
    failures,
    openUntil: failures >= FAILURE_THRESHOLD ? Date.now() + COOLDOWN_MS : 0,
  });
}

async function acquire(id) {
  for (;;) {
    const n = inflight.get(id) || 0;
    if (n < MAX_INFLIGHT) {
      inflight.set(id, n + 1);
      return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
}

function release(id) {
  inflight.set(id, Math.max(0, (inflight.get(id) || 1) - 1));
}

function normalizeProviderId(id) {
  if (!id) return null;
  if (id === "ollama") return "ollama-local";
  if (id === "local") return "local";
  return id;
}

export function routeForRole(role) {
  const envKey = ENV_ROLE_MAP[role] || ENV_ROLE_MAP.default;
  const preferred = normalizeProviderId(process.env[envKey] || process.env.AIOS_DEFAULT_PROVIDER);
  const fallback = normalizeProviderId(process.env.AIOS_FALLBACK_PROVIDER || "ollama");
  const base = [...(ROLE_ROUTES[role] || ROLE_ROUTES.default)];
  const ordered = [];
  if (preferred && preferred !== "local") ordered.push(preferred);
  for (const p of base) {
    const id = normalizeProviderId(p);
    if (id && id !== "local" && !ordered.includes(id)) ordered.push(id);
  }
  if (fallback && fallback !== "local" && !ordered.includes(fallback)) ordered.push(fallback);
  return { role, preferred, fallback, order: ordered };
}

export function circuitBreakerStatus() {
  return [...circuits.entries()].map(([provider, state]) => ({
    provider,
    failures: state.failures,
    open: Boolean(state.openUntil && state.openUntil > Date.now()),
    openUntil: state.openUntil || null,
  }));
}

export async function chatViaRegistry({
  role = "default",
  system,
  user,
  maxTokens = 1600,
  json = false,
  signal,
  allowOllama = true,
} = {}) {
  const routing = routeForRole(role);
  const tried = [];
  for (const id of routing.order) {
    if (id === "ollama-local" && !allowOllama) {
      tried.push({ provider: id, status: "skipped_disallowed" });
      continue;
    }
    if (circuitOpen(id)) {
      tried.push({ provider: id, status: "circuit_open" });
      continue;
    }
    const adapter = adapters[id];
    if (!adapter) {
      tried.push({ provider: id, status: "unknown" });
      continue;
    }
    const configured = await adapter.configured();
    if (!configured) {
      tried.push({ provider: id, status: ProviderStatus.NOT_CONFIGURED });
      continue;
    }
    if (!adapter.modelConfigured()) {
      tried.push({ provider: id, status: ProviderStatus.MODEL_NOT_CONFIGURED });
      continue;
    }
    await acquire(id);
    try {
      const result = await adapter.chat({ system, user, maxTokens, json, signal });
      markSuccess(id);
      return {
        ...result,
        role,
        routing,
        tried,
        selection: id,
      };
    } catch (err) {
      markFailure(id);
      tried.push({
        provider: id,
        status: err?.status || ProviderStatus.PROVIDER_ERROR,
      });
    } finally {
      release(id);
    }
  }
  const err = new AiosProviderError(ProviderStatus.PROVIDER_ERROR, "NO_PROVIDER_AVAILABLE", {
    provider: "registry",
  });
  err.tried = tried;
  throw err;
}

/**
 * Live authenticated health checks (persisted). Green/READY only with probe evidence.
 * Delegates to health-runner (config/live/full capable).
 */
export async function runAllHealthChecks({
  rootDir = process.cwd(),
  persist = true,
  mode = "live",
  provider = null,
  factory = null,
} = {}) {
  const health = await runHealthCommand({ mode, provider, factory, rootDir, persist });
  return {
    checkedAt: health.checkedAt,
    rule: "GREEN_ONLY_AFTER_LIVE_AUTHENTICATED_SUCCESS",
    ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
    mode: health.mode,
    modes: health.modes,
    providers: health.providers,
    ready: health.ready,
    factories: health.factories,
    dashboard: health.dashboard,
    alerts: health.alerts,
    snapshotPath: health.snapshotPath,
    circuitBreakers: circuitBreakerStatus(),
    routingSample: {
      engineering: routeForRole("engineering"),
      curriculum: routeForRole("curriculum"),
      research: routeForRole("research"),
      documentation: routeForRole("documentation"),
      testing: routeForRole("testing"),
      security: routeForRole("security"),
    },
    vercelAutoDeployBlocked: true,
    secretsExposed: false,
    // backward-compat: treat READY records as liveReady
    liveReadyProviders: (health.providers || [])
      .filter((p) => p.status === CanonicalStatus.READY)
      .map((p) => p.providerId),
  };
}

export function registrySnapshot() {
  return {
    adapters: Object.keys(adapters),
    routes: ROLE_ROUTES,
    circuitBreakers: circuitBreakerStatus(),
    concurrency: MAX_INFLIGHT,
  };
}

/**
 * Factory used by CLI / callers — wraps live registry helpers.
 */
export function createProviderRegistry(_opts = {}) {
  return {
    routeForRole,
    chat: chatViaRegistry,
    runAllHealthChecks,
    snapshot: registrySnapshot,
    circuitBreakers: circuitBreakerStatus,
    validateModels: validateConfiguredModels,
  };
}

/**
 * Best-effort model availability check (no silent substitution).
 */
export async function validateConfiguredModels() {
  const reports = [];
  for (const [id, adapter] of Object.entries({
    openai: adapters.openai,
    anthropic: adapters.anthropic,
    gemini: adapters.gemini,
    ollama: adapters.ollama,
  })) {
    const configured = await adapter.configured();
    const modelConfigured = adapter.modelConfigured();
    const model =
      id === "openai"
        ? (process.env.OPENAI_MODEL || "").trim()
        : id === "anthropic"
          ? (process.env.ANTHROPIC_MODEL || "").trim()
          : id === "gemini"
            ? (process.env.GEMINI_MODEL || "").trim()
            : (process.env.OLLAMA_MODEL || "").trim();

    if (!configured) {
      reports.push({
        PROVIDER: id,
        CONFIGURED_MODEL: model || null,
        STATUS: ProviderStatus.NOT_CONFIGURED,
        RECOMMENDED_ACTION: "Add API key / enable provider in .env.local",
      });
      continue;
    }
    if (!modelConfigured || !model) {
      reports.push({
        PROVIDER: id,
        CONFIGURED_MODEL: null,
        STATUS: ProviderStatus.MODEL_NOT_CONFIGURED,
        RECOMMENDED_ACTION: `Set ${id.toUpperCase()}_MODEL in .env.local (do not invent a model name)`,
      });
      continue;
    }

    try {
      const health = await adapter.health();
      if (health.status === ProviderStatus.READY) {
        reports.push({
          PROVIDER: id,
          CONFIGURED_MODEL: model,
          STATUS: ProviderStatus.READY,
          RECOMMENDED_ACTION: "none",
        });
      } else if (
        health.status === ProviderStatus.MODEL_UNAVAILABLE ||
        health.status === ProviderStatus.PROVIDER_ERROR
      ) {
        reports.push({
          PROVIDER: id,
          CONFIGURED_MODEL: model,
          STATUS: ProviderStatus.MODEL_UNAVAILABLE,
          RECOMMENDED_ACTION:
            "Verify the model id is available to this account; do not silently substitute another model",
        });
      } else {
        reports.push({
          PROVIDER: id,
          CONFIGURED_MODEL: model,
          STATUS: health.status,
          RECOMMENDED_ACTION: "Resolve provider health before live tasks",
        });
      }
    } catch {
      reports.push({
        PROVIDER: id,
        CONFIGURED_MODEL: model,
        STATUS: ProviderStatus.MODEL_UNAVAILABLE,
        RECOMMENDED_ACTION: "Health probe failed — verify credentials and model access",
      });
    }
  }
  return reports;
}
