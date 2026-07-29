/**
 * Anthropic provider adapter — official `@anthropic-ai/sdk`.
 */
import Anthropic from "@anthropic-ai/sdk";
import { firstEnv } from "./base.js";
import {
  AiosProviderError,
  ProviderStatus,
  normalizeProviderError,
  withRetries,
} from "./errors.js";
import { estimateCostUsd, recordUsage, assertCostBudget } from "../cost/guards.js";

export function anthropicConfigured() {
  return Boolean(firstEnv(["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"]));
}

export function anthropicModelConfigured() {
  return Boolean(process.env.ANTHROPIC_MODEL && String(process.env.ANTHROPIC_MODEL).trim());
}

function client() {
  const cred = firstEnv(["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"]);
  if (!cred) {
    throw new AiosProviderError(ProviderStatus.NOT_CONFIGURED, "NOT_CONFIGURED", { provider: "anthropic" });
  }
  return new Anthropic({
    apiKey: cred.value,
    timeout: Number(process.env.AIOS_REQUEST_TIMEOUT_MS || 180000),
  });
}

function requireModel() {
  const model = (process.env.ANTHROPIC_MODEL || "").trim();
  if (!model) {
    throw new AiosProviderError(ProviderStatus.MODEL_NOT_CONFIGURED, "MODEL_NOT_CONFIGURED", {
      provider: "anthropic",
    });
  }
  return model;
}

export async function anthropicChat({ system, user, maxTokens = 2000, signal, stream = false } = {}) {
  const model = requireModel();
  const promptChars = String(system || "").length + String(user || "").length;
  const budget = assertCostBudget({ estimatedCost: null, promptChars });
  if (!budget.ok) throw new AiosProviderError(ProviderStatus.PROVIDER_ERROR, budget.reason, { provider: "anthropic" });

  const started = Date.now();
  const retries = Number(process.env.AIOS_MAX_RETRIES || 3);
  try {
    const data = await withRetries(
      async () => {
        const c = client();
        if (stream) {
          const s = c.messages.stream(
            {
              model,
              max_tokens: maxTokens,
              system: system || "",
              messages: [{ role: "user", content: user || "" }],
            },
            { signal },
          );
          const final = await s.finalMessage();
          return final;
        }
        return c.messages.create(
          {
            model,
            max_tokens: maxTokens,
            system: system || "",
            messages: [{ role: "user", content: user || "" }],
          },
          { signal },
        );
      },
      { retries, signal },
    );
    const text = (data.content || []).map((c) => c.text || "").join("\n");
    const inputTokens = data.usage?.input_tokens ?? null;
    const outputTokens = data.usage?.output_tokens ?? null;
    const totalTokens =
      inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null;
    const estimatedCost = estimateCostUsd({
      provider: "anthropic",
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
    });
    recordUsage({
      provider: "anthropic",
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      durationMs: Date.now() - started,
      retries,
    });
    return {
      provider: "anthropic",
      model,
      text,
      tokenUsage: { inputTokens, outputTokens, totalTokens },
      estimatedCost: estimatedCost == null ? "UNKNOWN" : estimatedCost,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    throw normalizeProviderError("anthropic", err);
  }
}

export async function anthropicHealthCheck({ signal } = {}) {
  const started = Date.now();
  const report = {
    provider: "anthropic",
    configured: anthropicConfigured(),
    keyDetected: anthropicConfigured(),
    modelConfigured: anthropicModelConfigured(),
    model: (process.env.ANTHROPIC_MODEL || "").trim() || null,
    networkReachable: false,
    authenticationValid: false,
    minimalRequestPassed: false,
    latencyMs: null,
    status: ProviderStatus.NOT_CONFIGURED,
    errorCategory: null,
    lastError: null,
    checkedAt: new Date().toISOString(),
  };
  if (!report.configured) return report;
  if (!report.modelConfigured) {
    report.status = ProviderStatus.MODEL_NOT_CONFIGURED;
    report.errorCategory = ProviderStatus.MODEL_NOT_CONFIGURED;
    report.lastError = ProviderStatus.MODEL_NOT_CONFIGURED;
    return report;
  }
  try {
    const r = await anthropicChat({
      system: "You are a health probe.",
      user: "Return exactly: AIOS_OK",
      maxTokens: 16,
      signal,
    });
    report.networkReachable = true;
    report.authenticationValid = true;
    report.latencyMs = Date.now() - started;
    report.minimalRequestPassed = String(r.text || "").trim() === "AIOS_OK";
    report.status = report.minimalRequestPassed ? ProviderStatus.READY : ProviderStatus.PROVIDER_ERROR;
    if (!report.minimalRequestPassed) {
      report.errorCategory = "UNEXPECTED_RESPONSE";
      report.lastError = "UNEXPECTED_RESPONSE";
    }
  } catch (err) {
    const n = normalizeProviderError("anthropic", err);
    report.latencyMs = Date.now() - started;
    report.status = n.status;
    report.errorCategory = n.status;
    report.lastError = n.message || n.status;
    report.networkReachable = n.status !== ProviderStatus.NETWORK_ERROR;
    report.authenticationValid = n.status !== ProviderStatus.AUTHENTICATION_FAILED;
  }
  report.checkedAt = new Date().toISOString();
  return report;
}
