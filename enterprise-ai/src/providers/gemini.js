/**
 * Gemini provider adapter — official `@google/genai` SDK.
 * Key priority: GEMINI_API_KEY → GOOGLE_API_KEY → GOOGLE_GENERATIVE_AI_API_KEY
 * Respects GEMINI_DISABLED unless MASTER_ORCHESTRATOR_ALLOW_GEMINI=true or AIOS explicitly enables.
 */
import { GoogleGenAI } from "@google/genai";
import { firstEnv } from "./base.js";
import {
  AiosProviderError,
  ProviderStatus,
  normalizeProviderError,
  withRetries,
} from "./errors.js";
import { estimateCostUsd, recordUsage, assertCostBudget } from "../cost/guards.js";

function geminiAllowed() {
  if (process.env.MASTER_ORCHESTRATOR_ALLOW_GEMINI === "true") return true;
  if (process.env.AIOS_ALLOW_GEMINI === "true") return true;
  // If user set a key + model for AIOS phase 3, allow even if legacy GEMINI_DISABLED=true
  if (firstEnv(["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"]) && geminiModelConfigured()) {
    return true;
  }
  return process.env.GEMINI_DISABLED !== "true";
}

export function geminiConfigured() {
  if (!geminiAllowed()) return false;
  return Boolean(firstEnv(["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"]));
}

export function geminiModelConfigured() {
  return Boolean(process.env.GEMINI_MODEL && String(process.env.GEMINI_MODEL).trim());
}

function apiKey() {
  const cred = firstEnv(["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"]);
  if (!cred) {
    throw new AiosProviderError(ProviderStatus.NOT_CONFIGURED, "NOT_CONFIGURED", { provider: "gemini" });
  }
  return cred.value;
}

function requireModel() {
  const model = (process.env.GEMINI_MODEL || "").trim();
  if (!model) {
    throw new AiosProviderError(ProviderStatus.MODEL_NOT_CONFIGURED, "MODEL_NOT_CONFIGURED", {
      provider: "gemini",
    });
  }
  return model;
}

export async function geminiChat({
  system,
  user,
  maxTokens = 2000,
  multimodalParts = null,
  signal,
} = {}) {
  if (!geminiAllowed()) {
    throw new AiosProviderError(ProviderStatus.NOT_CONFIGURED, "GEMINI_DISABLED", { provider: "gemini" });
  }
  const model = requireModel();
  const promptChars = String(system || "").length + String(user || "").length;
  const budget = assertCostBudget({ estimatedCost: null, promptChars });
  if (!budget.ok) throw new AiosProviderError(ProviderStatus.PROVIDER_ERROR, budget.reason, { provider: "gemini" });

  const started = Date.now();
  const retries = Number(process.env.AIOS_MAX_RETRIES || 3);
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey() });
    const parts = multimodalParts?.length
      ? multimodalParts
      : [{ text: `${system ? `${system}\n\n` : ""}${user || ""}` }];

    const data = await withRetries(
      async () => {
        if (signal?.aborted) throw new Error("TIMEOUT");
        return ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
          config: {
            maxOutputTokens: maxTokens,
            temperature: 0.2,
            systemInstruction: system || undefined,
          },
        });
      },
      { retries, signal },
    );

    const text =
      data?.text ||
      (data?.candidates || [])
        .flatMap((c) => c.content?.parts || [])
        .map((p) => p.text || "")
        .join("\n") ||
      "";

    const usage = data?.usageMetadata || {};
    const inputTokens = usage.promptTokenCount ?? null;
    const outputTokens = usage.candidatesTokenCount ?? null;
    const totalTokens = usage.totalTokenCount ?? null;
    const estimatedCost = estimateCostUsd({
      provider: "gemini",
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
    });
    recordUsage({
      provider: "gemini",
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      durationMs: Date.now() - started,
      retries,
    });
    return {
      provider: "gemini",
      model,
      text,
      tokenUsage: { inputTokens, outputTokens, totalTokens },
      estimatedCost: estimatedCost == null ? "UNKNOWN" : estimatedCost,
      durationMs: Date.now() - started,
      multimodalReady: true,
    };
  } catch (err) {
    throw normalizeProviderError("gemini", err);
  }
}

export async function geminiHealthCheck({ signal } = {}) {
  const started = Date.now();
  const report = {
    provider: "gemini",
    configured: geminiConfigured(),
    keyDetected: Boolean(firstEnv(["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"])),
    modelConfigured: geminiModelConfigured(),
    model: (process.env.GEMINI_MODEL || "").trim() || null,
    networkReachable: false,
    authenticationValid: false,
    minimalRequestPassed: false,
    latencyMs: null,
    status: ProviderStatus.NOT_CONFIGURED,
    errorCategory: null,
    lastError: null,
    checkedAt: new Date().toISOString(),
  };
  if (!report.keyDetected) return report;
  if (!geminiAllowed()) {
    report.status = ProviderStatus.NOT_CONFIGURED;
    report.errorCategory = "GEMINI_DISABLED";
    report.lastError = "GEMINI_DISABLED";
    return report;
  }
  if (!report.modelConfigured) {
    report.status = ProviderStatus.MODEL_NOT_CONFIGURED;
    report.errorCategory = ProviderStatus.MODEL_NOT_CONFIGURED;
    report.lastError = ProviderStatus.MODEL_NOT_CONFIGURED;
    return report;
  }
  try {
    const r = await geminiChat({
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
    const n = normalizeProviderError("gemini", err);
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
