/**
 * Per-provider routing performance metrics (no secrets).
 */
import fs from "node:fs";
import path from "node:path";
import { normalizeProviderId } from "./capability-registry.js";

const METRICS_REL = "data/master-ai-orchestrator/routing/provider-metrics.json";

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

export function metricsPath(rootDir = process.cwd()) {
  return path.join(rootDir, METRICS_REL);
}

export function loadRouterMetrics(rootDir = process.cwd()) {
  try {
    return JSON.parse(fs.readFileSync(metricsPath(rootDir), "utf8"));
  } catch {
    return { version: 1, providers: {}, decisions: [], failovers: [] };
  }
}

export function saveRouterMetrics(state, rootDir = process.cwd()) {
  const file = metricsPath(rootDir);
  ensureDir(file);
  const payload = {
    ...state,
    decisions: (state.decisions || []).slice(-200),
    failovers: (state.failovers || []).slice(-200),
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return file;
}

function emptyProviderMetrics() {
  return {
    latencies: [],
    successes: 0,
    failures: 0,
    totalRequests: 0,
    totalCostUsd: 0,
    dayKey: dayKey(),
    monthKey: monthKey(),
    requestsToday: 0,
    requestsMonth: 0,
    uptimeChecks: 0,
    uptimeSuccesses: 0,
    currentLoad: 0,
  };
}

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export function getProviderMetrics(providerId, rootDir = process.cwd()) {
  const id = normalizeProviderId(providerId);
  const state = loadRouterMetrics(rootDir);
  const raw = state.providers[id] || emptyProviderMetrics();
  const latencies = [...(raw.latencies || [])].map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  const total = raw.totalRequests || 0;
  const successRate = total ? Number((raw.successes / total).toFixed(4)) : null;
  const failureRate = total ? Number((raw.failures / total).toFixed(4)) : null;
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : null;
  const uptime =
    raw.uptimeChecks > 0
      ? Number((raw.uptimeSuccesses / raw.uptimeChecks).toFixed(4))
      : null;

  return {
    providerId: id,
    averageLatencyMs: avgLatency,
    p95LatencyMs: percentile(latencies, 95),
    successRate,
    failureRate,
    uptime,
    throughput: raw.requestsToday || 0,
    averageCostUsd:
      total > 0 ? Number((Number(raw.totalCostUsd || 0) / total).toFixed(6)) : null,
    requestsDay: raw.requestsToday || 0,
    requestsMonth: raw.requestsMonth || 0,
    currentLoad: raw.currentLoad || 0,
    reliabilityScore: computeReliabilityScore({
      successRate: successRate ?? 0,
      uptime: uptime ?? successRate ?? 0,
      avgLatency,
    }),
  };
}

export function computeReliabilityScore({ successRate = 0, uptime = 0, avgLatency = null } = {}) {
  const latencyFactor =
    avgLatency == null ? 1 : Math.max(0.2, Math.min(1, 2000 / Math.max(1, avgLatency)));
  return Number(
    (Math.max(0, Math.min(1, successRate)) * 0.5 +
      Math.max(0, Math.min(1, uptime)) * 0.3 +
      latencyFactor * 0.2).toFixed(4),
  );
}

export function recordRoutingDecision(decision, rootDir = process.cwd()) {
  const state = loadRouterMetrics(rootDir);
  state.decisions = [...(state.decisions || []), { ...decision, at: new Date().toISOString() }];
  saveRouterMetrics(state, rootDir);
}

export function recordFailoverEvent(event, rootDir = process.cwd()) {
  const state = loadRouterMetrics(rootDir);
  state.failovers = [...(state.failovers || []), { ...event, at: new Date().toISOString() }];
  saveRouterMetrics(state, rootDir);
}

export function beginProviderLoad(providerId, rootDir = process.cwd()) {
  const id = normalizeProviderId(providerId);
  const state = loadRouterMetrics(rootDir);
  const cur = state.providers[id] || emptyProviderMetrics();
  cur.currentLoad = Number(cur.currentLoad || 0) + 1;
  state.providers[id] = cur;
  saveRouterMetrics(state, rootDir);
  return cur.currentLoad;
}

export function endProviderLoad(providerId, rootDir = process.cwd()) {
  const id = normalizeProviderId(providerId);
  const state = loadRouterMetrics(rootDir);
  const cur = state.providers[id] || emptyProviderMetrics();
  cur.currentLoad = Math.max(0, Number(cur.currentLoad || 0) - 1);
  state.providers[id] = cur;
  saveRouterMetrics(state, rootDir);
  return cur.currentLoad;
}

export function recordProviderExecution({
  providerId,
  success,
  latencyMs,
  costUsd = 0,
  rootDir = process.cwd(),
} = {}) {
  const id = normalizeProviderId(providerId);
  const state = loadRouterMetrics(rootDir);
  const cur = state.providers[id] || emptyProviderMetrics();
  const today = dayKey();
  const month = monthKey();
  if (cur.dayKey !== today) {
    cur.dayKey = today;
    cur.requestsToday = 0;
  }
  if (cur.monthKey !== month) {
    cur.monthKey = month;
    cur.requestsMonth = 0;
  }
  cur.totalRequests += 1;
  cur.requestsToday += 1;
  cur.requestsMonth += 1;
  cur.uptimeChecks += 1;
  if (success) {
    cur.successes += 1;
    cur.uptimeSuccesses += 1;
  } else {
    cur.failures += 1;
  }
  if (Number.isFinite(Number(latencyMs))) {
    cur.latencies = [...(cur.latencies || []), Number(latencyMs)].slice(-200);
  }
  cur.totalCostUsd = Number((Number(cur.totalCostUsd || 0) + Number(costUsd || 0)).toFixed(6));
  state.providers[id] = cur;
  saveRouterMetrics(state, rootDir);
  return getProviderMetrics(id, rootDir);
}

export function metricsDashboard(rootDir = process.cwd()) {
  const state = loadRouterMetrics(rootDir);
  const providers = Object.keys(state.providers || {}).map((id) => getProviderMetrics(id, rootDir));
  return {
    providers,
    recentDecisions: (state.decisions || []).slice(-30),
    recentFailovers: (state.failovers || []).slice(-30),
  };
}
