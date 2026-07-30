/**
 * AIOS Cost Engine — estimate + track spend, enforce monthly budgets.
 * Never stores secrets. Media generation estimates are informational unless approved.
 */
import fs from "node:fs";
import path from "node:path";
import {
  getProviderCapabilities,
  normalizeProviderId,
  Capabilities,
} from "./capability-registry.js";

const COST_REL = "data/master-ai-orchestrator/routing/cost-ledger.json";

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

export function costLedgerPath(rootDir = process.cwd()) {
  return path.join(rootDir, COST_REL);
}

export function loadCostLedger(rootDir = process.cwd()) {
  try {
    return JSON.parse(fs.readFileSync(costLedgerPath(rootDir), "utf8"));
  } catch {
    return { version: 1, month: monthKey(), byProvider: {}, entries: [] };
  }
}

export function saveCostLedger(ledger, rootDir = process.cwd()) {
  const file = costLedgerPath(rootDir);
  ensureDir(file);
  const payload = {
    ...ledger,
    month: monthKey(),
    entries: (ledger.entries || []).slice(-2000),
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return file;
}

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function estimateTokensFromText(text = "") {
  const s = String(text || "");
  if (!s) return 0;
  return Math.max(1, Math.ceil(s.length / 4));
}

/**
 * Estimate request cost before execution.
 */
export function estimateRequestCost({
  providerId,
  taskType = "chat",
  capability = null,
  inputTokens = null,
  outputTokens = null,
  prompt = "",
  expectedOutputTokens = 500,
  imageCount = 1,
  speechChars = 0,
  browserSessions = 1,
} = {}) {
  const id = normalizeProviderId(providerId);
  const meta = getProviderCapabilities(id);
  if (!meta) {
    return {
      ok: false,
      providerId: id,
      estimatedTotalUsd: null,
      error: "UNKNOWN_PROVIDER",
    };
  }
  const cost = meta.cost || {};
  const inTok =
    inputTokens != null ? Number(inputTokens) : estimateTokensFromText(prompt);
  const outTok =
    outputTokens != null ? Number(outputTokens) : Number(expectedOutputTokens) || 0;

  let tokensCost = 0;
  if (cost.inputPer1kTokens != null || cost.outputPer1kTokens != null) {
    tokensCost =
      (inTok / 1000) * Number(cost.inputPer1kTokens || 0) +
      (outTok / 1000) * Number(cost.outputPer1kTokens || 0);
  }

  let mediaCost = 0;
  const cap = capability || taskType;
  if (cap === Capabilities.IMAGE_GENERATION || cap === "image_generation") {
    mediaCost += Number(cost.imageGeneration || 0) * Number(imageCount || 1);
  }
  if (cap === Capabilities.AVATAR_VIDEO || cap === "avatar_video") {
    mediaCost += Number(cost.avatarVideo || 0);
  }
  if (cap === Capabilities.SPEECH || cap === "speech") {
    mediaCost += (Number(speechChars || 0) / 1000) * Number(cost.speechPer1kChars || 0);
  }
  if (
    cap === Capabilities.BROWSER_AUTOMATION ||
    cap === Capabilities.CLOUD_BROWSER ||
    cap === "browser_automation" ||
    cap === "cloud_browser"
  ) {
    mediaCost += Number(cost.browserSession || 0) * Number(browserSessions || 1);
  }
  if (cap === "education" && cost.query) {
    mediaCost += Number(cost.query);
  }

  const estimatedTotalUsd = Number((tokensCost + mediaCost).toFixed(6));
  return {
    ok: true,
    providerId: id,
    taskType,
    capability: cap,
    tokens: { input: inTok, output: outTok },
    apiUsageEstimate: tokensCost,
    mediaGenerationCost: mediaCost,
    browserSessionCost:
      cap === Capabilities.CLOUD_BROWSER || cap === "cloud_browser"
        ? Number(cost.browserSession || 0) * Number(browserSessions || 1)
        : 0,
    estimatedTotalUsd,
    currency: "USD",
  };
}

export function getMonthlySpend(providerId, rootDir = process.cwd()) {
  const id = normalizeProviderId(providerId);
  const ledger = loadCostLedger(rootDir);
  const month = monthKey();
  if (ledger.month !== month) return 0;
  return Number(ledger.byProvider?.[id]?.spentUsd || 0);
}

export function checkBudget({
  providerId,
  estimatedTotalUsd = 0,
  rootDir = process.cwd(),
  warnRatio = Number(process.env.AIOS_BUDGET_WARN_RATIO || 0.8),
} = {}) {
  const id = normalizeProviderId(providerId);
  const meta = getProviderCapabilities(id);
  const budget = Number(meta?.limits?.monthlyBudgetUsd || 0);
  const spent = getMonthlySpend(id, rootDir);
  const projected = spent + Number(estimatedTotalUsd || 0);

  if (!budget || budget <= 0) {
    return {
      ok: true,
      providerId: id,
      budgetUsd: budget,
      spentUsd: spent,
      projectedUsd: projected,
      warning: false,
      blocked: false,
      remainingUsd: null,
    };
  }

  const warning = projected >= budget * warnRatio;
  const blocked = projected > budget;
  return {
    ok: !blocked,
    providerId: id,
    budgetUsd: budget,
    spentUsd: spent,
    projectedUsd: projected,
    remainingUsd: Number((budget - spent).toFixed(6)),
    warning,
    blocked,
    message: blocked
      ? `Monthly budget exceeded for ${id}: projected $${projected.toFixed(4)} > $${budget}`
      : warning
        ? `Approaching monthly budget for ${id}: $${projected.toFixed(4)} / $${budget}`
        : null,
  };
}

export function recordActualCost({
  providerId,
  estimatedTotalUsd = 0,
  actualTotalUsd = null,
  taskType = "chat",
  rootDir = process.cwd(),
  meta = {},
} = {}) {
  const id = normalizeProviderId(providerId);
  const ledger = loadCostLedger(rootDir);
  const month = monthKey();
  if (ledger.month !== month) {
    ledger.month = month;
    ledger.byProvider = {};
    ledger.entries = [];
  }
  const actual = actualTotalUsd != null ? Number(actualTotalUsd) : Number(estimatedTotalUsd);
  const prev = ledger.byProvider[id] || { spentUsd: 0, requests: 0 };
  ledger.byProvider[id] = {
    spentUsd: Number((prev.spentUsd + actual).toFixed(6)),
    requests: prev.requests + 1,
  };
  ledger.entries.push({
    at: new Date().toISOString(),
    providerId: id,
    taskType,
    estimatedTotalUsd: Number(estimatedTotalUsd),
    actualTotalUsd: actual,
    meta,
  });
  saveCostLedger(ledger, rootDir);
  return ledger.byProvider[id];
}

export function costDashboard(rootDir = process.cwd()) {
  const ledger = loadCostLedger(rootDir);
  const month = monthKey();
  const rows = Object.entries(ledger.byProvider || {}).map(([providerId, v]) => {
    const meta = getProviderCapabilities(providerId);
    const budget = Number(meta?.limits?.monthlyBudgetUsd || 0);
    const spent = Number(v.spentUsd || 0);
    return {
      providerId,
      spentUsd: spent,
      requests: v.requests || 0,
      budgetUsd: budget,
      remainingUsd: budget > 0 ? Number((budget - spent).toFixed(6)) : null,
      utilization: budget > 0 ? Number((spent / budget).toFixed(3)) : null,
    };
  });
  return {
    month: ledger.month || month,
    providers: rows,
    totalSpentUsd: Number(rows.reduce((a, r) => a + r.spentUsd, 0).toFixed(6)),
    recent: (ledger.entries || []).slice(-50),
  };
}
