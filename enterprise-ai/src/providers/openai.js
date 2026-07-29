/**
 * OpenAI provider adapter — official `openai` SDK.
 * Model must come from OPENAI_MODEL (no hardcoded expensive defaults).
 */
import OpenAI from "openai";
import { firstEnv } from "./base.js";
import {
  AiosProviderError,
  ProviderStatus,
  normalizeProviderError,
  withRetries,
} from "./errors.js";
import { estimateCostUsd, recordUsage, assertCostBudget } from "../cost/guards.js";

export function openaiConfigured() {
  return Boolean(firstEnv(["OPENAI_API_KEY", "OPENAI_CONTENT_API_KEY"]));
}

export function openaiModelConfigured() {
  return Boolean(process.env.OPENAI_MODEL && String(process.env.OPENAI_MODEL).trim());
}

function client() {
  const cred = firstEnv(["OPENAI_API_KEY", "OPENAI_CONTENT_API_KEY"]);
  if (!cred) throw new AiosProviderError(ProviderStatus.NOT_CONFIGURED, "NOT_CONFIGURED", { provider: "openai" });
  return new OpenAI({ apiKey: cred.value, timeout: Number(process.env.AIOS_REQUEST_TIMEOUT_MS || 180000) });
}

function requireModel() {
  const model = (process.env.OPENAI_MODEL || "").trim();
  if (!model) {
    throw new AiosProviderError(ProviderStatus.MODEL_NOT_CONFIGURED, "MODEL_NOT_CONFIGURED", {
      provider: "openai",
    });
  }
  return model;
}

export async function openaiChat({
  system,
  user,
  maxTokens = 2000,
  json = false,
  signal,
  stream = false,
} = {}) {
  const model = requireModel();
  const promptChars = String(system || "").length + String(user || "").length;
  const budget = assertCostBudget({ estimatedCost: null, promptChars });
  if (!budget.ok) throw new AiosProviderError(ProviderStatus.PROVIDER_ERROR, budget.reason, { provider: "openai" });

  const started = Date.now();
  const retries = Number(process.env.AIOS_MAX_RETRIES || 3);

  try {
    const result = await withRetries(
      async () => {
        const c = client();
        if (stream) {
          const s = await c.chat.completions.create(
            {
              model,
              temperature: 0.2,
              max_tokens: maxTokens,
              response_format: json ? { type: "json_object" } : undefined,
              messages: [
                { role: "system", content: system || "" },
                { role: "user", content: user || "" },
              ],
              stream: true,
            },
            { signal },
          );
          let text = "";
          for await (const chunk of s) {
            if (signal?.aborted) throw new Error("TIMEOUT");
            text += chunk.choices?.[0]?.delta?.content || "";
          }
          return { text, usage: null };
        }

        const data = await c.chat.completions.create(
          {
            model,
            temperature: 0.2,
            max_tokens: maxTokens,
            response_format: json ? { type: "json_object" } : undefined,
            messages: [
              { role: "system", content: system || "" },
              { role: "user", content: user || "" },
            ],
          },
          { signal },
        );
        return {
          text: data.choices?.[0]?.message?.content || "",
          usage: data.usage || null,
        };
      },
      { retries, signal },
    );

    const inputTokens = result.usage?.prompt_tokens ?? null;
    const outputTokens = result.usage?.completion_tokens ?? null;
    const totalTokens =
      result.usage?.total_tokens ??
      (inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null);
    const estimatedCost = estimateCostUsd({
      provider: "openai",
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
    });
    recordUsage({
      provider: "openai",
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      durationMs: Date.now() - started,
      retries,
    });

    return {
      provider: "openai",
      model,
      text: result.text,
      tokenUsage: { inputTokens, outputTokens, totalTokens },
      estimatedCost: estimatedCost == null ? "UNKNOWN" : estimatedCost,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    throw normalizeProviderError("openai", err);
  }
}

export async function openaiHealthCheck({ signal } = {}) {
  const started = Date.now();
  const report = {
    provider: "openai",
    configured: openaiConfigured(),
    keyDetected: openaiConfigured(),
    modelConfigured: openaiModelConfigured(),
    model: (process.env.OPENAI_MODEL || "").trim() || null,
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
    const r = await openaiChat({
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
    const n = normalizeProviderError("openai", err);
    report.latencyMs = Date.now() - started;
    report.status = n.status;
    report.errorCategory = n.status;
    report.lastError = n.message || n.status;
    report.networkReachable = n.status !== ProviderStatus.NETWORK_ERROR ? true : false;
    report.authenticationValid = n.status !== ProviderStatus.AUTHENTICATION_FAILED;
  }
  report.checkedAt = new Date().toISOString();
  return report;
}
