/**
 * AIOS Intelligent Provider Router.
 * Selects best READY+ provider by lifecycle, capability, performance, cost, load.
 * Never routes below READY. Never auto-promotes. Deterministic explanations.
 */
import {
  Capabilities,
  getProviderCapabilities,
  listCapabilityRegistry,
  normalizeProviderId,
  providerSupportsCapability,
  resolveRequiredCapability,
  PROVIDER_CAPABILITIES,
} from "./capability-registry.js";
import {
  checkBudget,
  costDashboard,
  estimateRequestCost,
  recordActualCost,
} from "./cost-engine.js";
import {
  beginProviderLoad,
  endProviderLoad,
  getProviderMetrics,
  metricsDashboard,
  recordFailoverEvent,
  recordProviderExecution,
  recordRoutingDecision,
} from "./router-metrics.js";
import { loadHealthState } from "./health-store.js";
import {
  ProviderLifecycle,
  isGreenStatus,
  normalizeLifecycleStage,
} from "./status-model.js";
import { factoryPriorities } from "./continuous-config.js";
import { FACTORY_PROVIDERS } from "./health-runner.js";

const LIFECYCLE_RANK = Object.freeze({
  [ProviderLifecycle.MISSION_CRITICAL]: 3,
  [ProviderLifecycle.PRODUCTION_CERTIFIED]: 2,
  [ProviderLifecycle.READY]: 1,
});

const MAX_FALLBACKS = Number(process.env.AIOS_ROUTER_MAX_FALLBACKS || 3);
const MAX_RETRIES = Number(process.env.AIOS_ROUTER_MAX_RETRIES || 2);

function factoryForTask(taskType, factoryHint = null) {
  if (factoryHint) return factoryHint;
  const t = String(taskType || "").toLowerCase();
  if (["coding", "chat", "reasoning", "long_context"].includes(t)) return "coding";
  if (["education", "documents", "vision"].includes(t) && t !== "vision") return "education";
  if (["education"].includes(t)) return "education";
  if (["image_generation", "avatar_video", "speech"].includes(t)) return "media";
  if (["browser_automation", "cloud_browser", "infra_read"].includes(t)) return "infrastructure";
  if (t === "vision" || t === "documents") return "education";
  return "coding";
}

function healthRecordMap(rootDir) {
  const state = loadHealthState(rootDir);
  const map = new Map();
  for (const p of state?.providers || []) {
    map.set(normalizeProviderId(p.providerId), p);
    map.set(p.providerId, p);
  }
  return map;
}

function isEligibleLifecycle(rec) {
  if (!rec) return false;
  const stage = normalizeLifecycleStage(rec.lifecycleStage);
  // Never route below READY — requires green status + READY+ lifecycle
  if (!LIFECYCLE_RANK[stage]) return false;
  return isGreenStatus(rec.status);
}

/**
 * Score candidate — higher is better. Deterministic ordering for ties.
 */
export function scoreCandidate(candidate) {
  const life = LIFECYCLE_RANK[candidate.lifecycleStage] || 0;
  const reliability = Number(candidate.reliabilityScore || 0);
  const success = Number(candidate.successRate ?? reliability);
  const latency = Number(candidate.latencyMs);
  const latencyScore = Number.isFinite(latency)
    ? Math.max(0, Math.min(1, 2000 / Math.max(1, latency)))
    : 0.5;
  const cost = Number(candidate.estimatedCostUsd);
  const costScore = Number.isFinite(cost)
    ? Math.max(0, Math.min(1, 1 / (1 + cost * 100)))
    : 0.5;
  const load = Number(candidate.currentLoad || 0);
  const loadScore = Math.max(0, 1 - load / 10);
  const priorityBoost = Math.max(0, 20 - Number(candidate.factoryPriority || 20)) / 20;

  const total =
    life * 1000 +
    reliability * 100 +
    success * 50 +
    latencyScore * 30 +
    costScore * 20 +
    loadScore * 15 +
    priorityBoost * 10;

  return {
    total: Number(total.toFixed(6)),
    parts: { life, reliability, success, latencyScore, costScore, loadScore, priorityBoost },
  };
}

function compareCandidates(a, b) {
  if (b.score.total !== a.score.total) return b.score.total - a.score.total;
  // Deterministic tie-break: lower factoryPriority, then providerId
  if (a.factoryPriority !== b.factoryPriority) return a.factoryPriority - b.factoryPriority;
  return String(a.providerId).localeCompare(String(b.providerId));
}

/**
 * Build ranked eligible providers for a task.
 */
export function rankProvidersForTask({
  taskType = "chat",
  factory = null,
  capability = null,
  prompt = "",
  priority = "normal",
  rootDir = process.cwd(),
  preferred = [],
  estimatedInputTokens = null,
  estimatedOutputTokens = 500,
} = {}) {
  const requiredCapability = capability || resolveRequiredCapability(taskType);
  const factoryId = factoryForTask(taskType, factory);
  const priorities = factoryPriorities()[factoryId] || FACTORY_PROVIDERS[factoryId] || [];
  const health = healthRecordMap(rootDir);
  const preferredSet = new Set((preferred || []).map(normalizeProviderId));

  const rejected = [];
  const candidates = [];
  const seen = new Set();

  const universe = new Set([
    ...priorities,
    ...Object.keys(PROVIDER_CAPABILITIES),
    ...preferredSet,
  ]);

  for (const rawId of universe) {
    const providerId = normalizeProviderId(rawId);
    if (seen.has(providerId)) continue;
    seen.add(providerId);
    const meta = getProviderCapabilities(providerId);
    if (!meta) {
      rejected.push({ providerId, reason: "UNKNOWN_PROVIDER" });
      continue;
    }
    if (!providerSupportsCapability(providerId, requiredCapability)) {
      rejected.push({
        providerId,
        reason: "UNSUPPORTED_CAPABILITY",
        requiredCapability,
        capabilities: meta.capabilities,
      });
      continue;
    }

    const rec = health.get(providerId) || health.get(rawId);
    const stage = normalizeLifecycleStage(rec?.lifecycleStage);
    if (!isEligibleLifecycle(rec)) {
      rejected.push({
        providerId,
        reason: "BELOW_READY",
        lifecycleStage: stage || "SLOT",
        status: rec?.status || "NOT_TESTED",
        message: "Never route work to providers below READY",
      });
      continue;
    }

    const metrics = getProviderMetrics(providerId, rootDir);
    const costEstimate = estimateRequestCost({
      providerId,
      taskType,
      capability: requiredCapability,
      prompt,
      inputTokens: estimatedInputTokens,
      expectedOutputTokens: estimatedOutputTokens,
    });
    const budget = checkBudget({
      providerId,
      estimatedTotalUsd: costEstimate.estimatedTotalUsd,
      rootDir,
    });
    if (budget.blocked) {
      rejected.push({
        providerId,
        reason: "BUDGET_EXCEEDED",
        budget,
      });
      continue;
    }

    const rpm = Number(meta.limits?.rpm || 60);
    if (metrics.currentLoad >= rpm) {
      rejected.push({
        providerId,
        reason: "PROVIDER_LIMIT_LOAD",
        currentLoad: metrics.currentLoad,
        rpm,
      });
      continue;
    }

    const factoryPriority = priorities.includes(providerId)
      ? priorities.indexOf(providerId) + 1
      : priorities.length + 10;

    const candidate = {
      providerId,
      displayName: meta.displayName,
      factory: factoryId,
      lifecycleStage: stage,
      status: rec.status,
      displayMark: rec.displayMark,
      capability: requiredCapability,
      reliabilityScore: metrics.reliabilityScore,
      successRate: metrics.successRate,
      latencyMs: metrics.averageLatencyMs ?? (rec.latencyMs === "NOT_TESTED" ? null : rec.latencyMs),
      p95LatencyMs: metrics.p95LatencyMs,
      currentLoad: metrics.currentLoad,
      estimatedCostUsd: costEstimate.estimatedTotalUsd,
      costEstimate,
      budget,
      factoryPriority,
      preferred: preferredSet.has(providerId),
      fallbackAvailable: true,
      priority,
    };
    candidate.score = scoreCandidate(candidate);
    candidates.push(candidate);
  }

  candidates.sort(compareCandidates);
  // Preferred boost only among same lifecycle rank
  if (preferredSet.size) {
    candidates.sort((a, b) => {
      const lifeDiff = (LIFECYCLE_RANK[b.lifecycleStage] || 0) - (LIFECYCLE_RANK[a.lifecycleStage] || 0);
      if (lifeDiff !== 0) return lifeDiff;
      if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
      return compareCandidates(a, b);
    });
  }

  // Annotate fallback availability
  for (const c of candidates) {
    c.fallbackAvailable = candidates.some((x) => x.providerId !== c.providerId);
  }

  return {
    taskType,
    factory: factoryId,
    requiredCapability,
    candidates,
    rejected,
    selected: candidates[0] || null,
  };
}

/**
 * Deterministic routing explanation.
 */
export function explainRoute(decision) {
  const selected = decision.selected;
  if (!selected) {
    return {
      ok: false,
      explanation: `No eligible provider for task=${decision.taskType} capability=${decision.requiredCapability}. Rejected: ${(decision.rejected || [])
        .map((r) => `${r.providerId}:${r.reason}`)
        .join(", ") || "none"}`,
      ranking: [],
      rejected: decision.rejected || [],
    };
  }
  const ranking = (decision.candidates || []).map((c, i) => ({
    rank: i + 1,
    providerId: c.providerId,
    lifecycleStage: c.lifecycleStage,
    score: c.score.total,
    reliabilityScore: c.reliabilityScore,
    successRate: c.successRate,
    latencyMs: c.latencyMs,
    estimatedCostUsd: c.estimatedCostUsd,
    currentLoad: c.currentLoad,
    factoryPriority: c.factoryPriority,
  }));
  return {
    ok: true,
    selected: selected.providerId,
    lifecycleStage: selected.lifecycleStage,
    explanation: [
      `Selected ${selected.providerId} for task=${decision.taskType} capability=${decision.requiredCapability}.`,
      `Policy: MISSION_CRITICAL > PRODUCTION_CERTIFIED > READY; then reliability, success rate, latency, cost, load.`,
      `Lifecycle=${selected.lifecycleStage} score=${selected.score.total}.`,
      `Reliability=${selected.reliabilityScore} successRate=${selected.successRate ?? "n/a"} latencyMs=${selected.latencyMs ?? "n/a"} costUsd=${selected.estimatedCostUsd}.`,
      `Fallbacks: ${(decision.candidates || []).slice(1, 4).map((c) => c.providerId).join(", ") || "none"}.`,
      selected.budget?.warning ? `Budget warning: ${selected.budget.message}` : null,
    ]
      .filter(Boolean)
      .join(" "),
    ranking,
    rejected: decision.rejected || [],
    scoreParts: selected.score.parts,
  };
}

/**
 * Route a task (select only — does not execute provider APIs).
 */
export function routeTask(options = {}) {
  const decision = rankProvidersForTask(options);
  const explained = explainRoute(decision);
  const payload = {
    ok: Boolean(decision.selected),
    action: "ROUTE",
    taskType: decision.taskType,
    factory: decision.factory,
    requiredCapability: decision.requiredCapability,
    selected: decision.selected,
    candidates: decision.candidates,
    rejected: decision.rejected,
    explanation: explained.explanation,
    ranking: explained.ranking,
    scoreParts: explained.scoreParts,
    autoPromote: false,
    routedBelowReady: false,
  };
  if (options.persist !== false) {
    recordRoutingDecision(
      {
        taskType: decision.taskType,
        factory: decision.factory,
        selected: decision.selected?.providerId || null,
        ranking: explained.ranking?.slice(0, 5),
        rejectedCount: decision.rejected.length,
      },
      options.rootDir,
    );
  }
  return payload;
}

/**
 * Simulate routing + cost without execution.
 */
export function simulateRoute(options = {}) {
  const routed = routeTask({ ...options, persist: options.persist !== false });
  const costs = (routed.candidates || []).map((c) => ({
    providerId: c.providerId,
    estimatedTotalUsd: c.estimatedCostUsd,
    budget: c.budget,
  }));
  return {
    ...routed,
    action: "SIMULATE",
    costs,
    selectedCost: routed.selected?.costEstimate || null,
  };
}

/**
 * Execute with automatic fallback across ranked providers.
 * executor(candidate, attempt) => { ok, latencyMs, costUsd?, error?, result? }
 */
export async function executeWithFallback({
  taskType = "chat",
  factory = null,
  capability = null,
  prompt = "",
  rootDir = process.cwd(),
  preferred = [],
  executor,
  maxFallbacks = MAX_FALLBACKS,
  maxRetries = MAX_RETRIES,
} = {}) {
  if (typeof executor !== "function") {
    return {
      ok: false,
      error: "EXECUTOR_REQUIRED",
      message: "executeWithFallback requires an executor function",
    };
  }
  const routed = routeTask({
    taskType,
    factory,
    capability,
    prompt,
    rootDir,
    preferred,
  });
  if (!routed.selected) {
    return {
      ok: false,
      error: "NO_ELIGIBLE_PROVIDER",
      rejected: routed.rejected,
      explanation: routed.explanation,
    };
  }

  const queue = routed.candidates.slice(0, Math.max(1, maxFallbacks + 1));
  const attempts = [];
  let lastError = null;

  for (let i = 0; i < queue.length; i += 1) {
    const candidate = queue[i];
    beginProviderLoad(candidate.providerId, rootDir);
    let succeeded = false;
    try {
      for (let retry = 0; retry <= maxRetries; retry += 1) {
        const started = Date.now();
        try {
          const result = await executor(candidate, { attempt: retry + 1, index: i });
          const latencyMs = result.latencyMs ?? Date.now() - started;
          const costUsd =
            result.costUsd ??
            candidate.estimatedCostUsd ??
            0;
          const ok = result.ok !== false;
          recordProviderExecution({
            providerId: candidate.providerId,
            success: ok,
            latencyMs,
            costUsd: ok ? costUsd : 0,
            rootDir,
          });
          if (ok) {
            recordActualCost({
              providerId: candidate.providerId,
              estimatedTotalUsd: candidate.estimatedCostUsd,
              actualTotalUsd: costUsd,
              taskType,
              rootDir,
            });
            if (i > 0) {
              recordFailoverEvent(
                {
                  from: queue[0].providerId,
                  to: candidate.providerId,
                  reason: lastError || "PRIMARY_FAILED",
                  taskType,
                },
                rootDir,
              );
            }
            succeeded = true;
            attempts.push({
              providerId: candidate.providerId,
              retry,
              ok: true,
              latencyMs,
              costUsd,
            });
            return {
              ok: true,
              providerId: candidate.providerId,
              result: result.result ?? result,
              attempts,
              failover: i > 0,
              routed,
              costUsd,
              latencyMs,
            };
          }
          lastError = result.error || "EXECUTION_FAILED";
          attempts.push({
            providerId: candidate.providerId,
            retry,
            ok: false,
            error: lastError,
            latencyMs,
          });
        } catch (err) {
          const latencyMs = Date.now() - started;
          lastError = String(err?.message || err);
          recordProviderExecution({
            providerId: candidate.providerId,
            success: false,
            latencyMs,
            costUsd: 0,
            rootDir,
          });
          attempts.push({
            providerId: candidate.providerId,
            retry,
            ok: false,
            error: lastError,
            latencyMs,
          });
        }
        if (retry < maxRetries) {
          // bounded retry — never indefinite
          await new Promise((r) => setTimeout(r, 50 * (retry + 1)));
        }
      }
    } finally {
      endProviderLoad(candidate.providerId, rootDir);
    }
    if (!succeeded && i < queue.length - 1) {
      recordFailoverEvent(
        {
          from: candidate.providerId,
          to: queue[i + 1].providerId,
          reason: lastError || "RETRY_EXHAUSTED",
          taskType,
        },
        rootDir,
      );
    }
  }

  return {
    ok: false,
    error: "ALL_PROVIDERS_FAILED",
    message: lastError,
    attempts,
    routed,
  };
}

export function benchmarkRouting({
  tasks = ["chat", "coding", "education", "reasoning"],
  rootDir = process.cwd(),
} = {}) {
  const results = tasks.map((taskType) => {
    const routed = routeTask({ taskType, rootDir, persist: false });
    return {
      taskType,
      selected: routed.selected?.providerId || null,
      lifecycleStage: routed.selected?.lifecycleStage || null,
      estimatedCostUsd: routed.selected?.estimatedCostUsd ?? null,
      candidateCount: routed.candidates.length,
      rejectedCount: routed.rejected.length,
      top3: (routed.candidates || []).slice(0, 3).map((c) => c.providerId),
    };
  });
  return {
    ok: true,
    action: "BENCHMARK",
    results,
    summary: {
      routed: results.filter((r) => r.selected).length,
      unresolved: results.filter((r) => !r.selected).length,
    },
  };
}

export function routerDashboard(rootDir = process.cwd()) {
  const metrics = metricsDashboard(rootDir);
  const costs = costDashboard(rootDir);
  const capabilities = listCapabilityRegistry();
  const sample = ["chat", "coding", "education", "image_generation", "browser_automation"].map(
    (taskType) => {
      const r = routeTask({ taskType, rootDir, persist: false });
      return {
        taskType,
        selected: r.selected?.providerId || null,
        ranking: (r.candidates || []).slice(0, 5).map((c) => ({
          providerId: c.providerId,
          lifecycleStage: c.lifecycleStage,
          score: c.score.total,
        })),
      };
    },
  );
  return {
    capabilities,
    activeRouting: sample,
    currentRankings: sample,
    costDashboard: costs,
    reliabilityDashboard: metrics.providers,
    liveRequestRouting: metrics.recentDecisions,
    fallbackEvents: metrics.recentFailovers,
    providerLoad: metrics.providers.map((p) => ({
      providerId: p.providerId,
      currentLoad: p.currentLoad,
      requestsDay: p.requestsDay,
    })),
    factoryUtilization: Object.fromEntries(
      ["coding", "education", "media", "infrastructure"].map((factory) => {
        const r = routeTask({ taskType: factory === "media" ? "speech" : factory === "infrastructure" ? "browser_automation" : factory === "education" ? "education" : "coding", factory, rootDir, persist: false });
        return [
          factory,
          {
            selected: r.selected?.providerId || null,
            eligible: r.candidates.length,
            rejected: r.rejected.length,
          },
        ];
      }),
    ),
  };
}

export { Capabilities, listCapabilityRegistry, resolveRequiredCapability };
