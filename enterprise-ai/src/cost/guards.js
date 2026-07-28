/**
 * Cost and usage guards — never invent prices when unknown.
 */
import fs from "node:fs";
import path from "node:path";

const state = {
  day: new Date().toISOString().slice(0, 10),
  dailyEstimatedUsd: 0,
  tasks: [],
};

function resetDayIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.day !== today) {
    state.day = today;
    state.dailyEstimatedUsd = 0;
    state.tasks = [];
  }
}

export function estimateCostUsd({ provider, inputTokens = 0, outputTokens = 0 }) {
  // Optional pricing table via env JSON; if absent → UNKNOWN
  const raw = process.env.AIOS_PROVIDER_PRICING_JSON;
  if (!raw) return null;
  try {
    const table = JSON.parse(raw);
    const p = table[provider];
    if (!p) return null;
    const inCost = ((inputTokens || 0) / 1000) * Number(p.inputPer1k || 0);
    const outCost = ((outputTokens || 0) / 1000) * Number(p.outputPer1k || 0);
    return Number((inCost + outCost).toFixed(6));
  } catch {
    return null;
  }
}

export function assertCostBudget({ estimatedCost, promptChars = 0 }) {
  resetDayIfNeeded();
  const enabled = process.env.AIOS_COST_LIMIT_ENABLED !== "false";
  if (!enabled) return { ok: true };

  const maxTask = Number(process.env.AIOS_MAX_TASK_COST_USD || 5);
  const maxDaily = Number(process.env.AIOS_MAX_DAILY_COST_USD || 20);
  const maxPrompt = Number(process.env.AIOS_MAX_PROMPT_CHARS || 120000);

  if (promptChars > maxPrompt) {
    return {
      ok: false,
      reason: "PROMPT_TOO_LARGE",
      detail: `promptChars=${promptChars} max=${maxPrompt}`,
    };
  }
  if (estimatedCost != null && estimatedCost > maxTask) {
    return { ok: false, reason: "TASK_COST_LIMIT", detail: estimatedCost };
  }
  if (estimatedCost != null && state.dailyEstimatedUsd + estimatedCost > maxDaily) {
    return { ok: false, reason: "DAILY_COST_LIMIT", detail: state.dailyEstimatedUsd };
  }
  return { ok: true, estimatedCost: estimatedCost ?? "UNKNOWN", dailyEstimatedUsd: state.dailyEstimatedUsd };
}

export function recordUsage(entry) {
  resetDayIfNeeded();
  const estimatedCost = entry.estimatedCost ?? estimateCostUsd(entry);
  if (typeof estimatedCost === "number") state.dailyEstimatedUsd += estimatedCost;
  const row = {
    ...entry,
    estimatedCost: estimatedCost == null ? "UNKNOWN" : estimatedCost,
    at: new Date().toISOString(),
  };
  state.tasks.push(row);
  return row;
}

export function costStatus() {
  resetDayIfNeeded();
  return {
    day: state.day,
    dailyEstimatedUsd: state.dailyEstimatedUsd,
    maxDaily: Number(process.env.AIOS_MAX_DAILY_COST_USD || 20),
    maxTask: Number(process.env.AIOS_MAX_TASK_COST_USD || 5),
    enabled: process.env.AIOS_COST_LIMIT_ENABLED !== "false",
    tasksTracked: state.tasks.length,
  };
}

export function persistUsage(projectRoot = process.cwd()) {
  const dir = path.join(projectRoot, "data/master-ai-orchestrator/usage");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${state.day}.json`);
  // Strip any accidental secrets
  const safe = state.tasks.map(({ provider, model, inputTokens, outputTokens, totalTokens, estimatedCost, durationMs, retries, at }) => ({
    provider,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCost,
    durationMs,
    retries,
    at,
  }));
  fs.writeFileSync(file, `${JSON.stringify({ day: state.day, dailyEstimatedUsd: state.dailyEstimatedUsd, tasks: safe }, null, 2)}\n`);
  return file;
}
