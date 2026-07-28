/**
 * Ollama local fallback — optional, never forced for complex curriculum/repo edits.
 */
import { AiosProviderError, ProviderStatus, normalizeProviderError, withRetries } from "./errors.js";
import { recordUsage } from "../cost/guards.js";

export async function ollamaConfigured() {
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

export function ollamaModelConfigured() {
  return Boolean(process.env.OLLAMA_MODEL && String(process.env.OLLAMA_MODEL).trim());
}

export async function ollamaHealthCheck() {
  const started = Date.now();
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = (process.env.OLLAMA_MODEL || "").trim() || null;
  const report = {
    provider: "ollama",
    configured: false,
    keyDetected: false,
    modelConfigured: Boolean(model),
    model,
    modelInstalled: false,
    networkReachable: false,
    authenticationValid: true,
    minimalRequestPassed: false,
    latencyMs: null,
    status: ProviderStatus.OPTIONAL_OFFLINE,
    errorCategory: null,
  };
  try {
    const tagsRes = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3000) });
    report.networkReachable = tagsRes.ok;
    if (!tagsRes.ok) return report;
    const tags = await tagsRes.json();
    const names = (tags.models || []).map((m) => m.name);
    report.configured = true;
    report.modelInstalled = model ? names.some((n) => n === model || n.startsWith(`${model}:`) || n.startsWith(`${model}`)) : false;
    if (!model) {
      report.status = ProviderStatus.MODEL_NOT_CONFIGURED;
      report.errorCategory = ProviderStatus.MODEL_NOT_CONFIGURED;
      report.latencyMs = Date.now() - started;
      return report;
    }
    if (!report.modelInstalled) {
      report.status = ProviderStatus.MODEL_UNAVAILABLE;
      report.errorCategory = ProviderStatus.MODEL_UNAVAILABLE;
      report.latencyMs = Date.now() - started;
      return report;
    }
    const r = await ollamaChat({
      system: "You are a health probe.",
      user: "Return exactly: AIOS_OK",
      maxTokens: 16,
    });
    report.minimalRequestPassed = String(r.text || "").trim() === "AIOS_OK";
    report.latencyMs = Date.now() - started;
    report.status = report.minimalRequestPassed ? ProviderStatus.READY : ProviderStatus.PROVIDER_ERROR;
  } catch (err) {
    report.latencyMs = Date.now() - started;
    report.status = ProviderStatus.OPTIONAL_OFFLINE;
    report.errorCategory = normalizeProviderError("ollama", err).status;
  }
  return report;
}

export async function ollamaChat({ system, user, maxTokens = 1200, signal } = {}) {
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = (process.env.OLLAMA_MODEL || "").trim();
  if (!model) {
    throw new AiosProviderError(ProviderStatus.MODEL_NOT_CONFIGURED, "MODEL_NOT_CONFIGURED", {
      provider: "ollama",
    });
  }
  const started = Date.now();
  const retries = Number(process.env.AIOS_MAX_RETRIES || 3);
  try {
    const data = await withRetries(
      async () => {
        const res = await fetch(`${base}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            stream: false,
            think: false,
            messages: [
              { role: "system", content: system || "" },
              { role: "user", content: user || "" },
            ],
            options: { temperature: 0.2, num_predict: maxTokens },
          }),
          signal: signal || AbortSignal.timeout(Number(process.env.AIOS_REQUEST_TIMEOUT_MS || 180000)),
        });
        if (!res.ok) throw new Error(`OLLAMA_HTTP_${res.status}`);
        return res.json();
      },
      { retries, signal },
    );
    const text = data?.message?.content || "";
    recordUsage({
      provider: "ollama",
      model,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      estimatedCost: 0,
      durationMs: Date.now() - started,
      retries,
    });
    return {
      provider: "ollama-local",
      model,
      text,
      tokenUsage: { inputTokens: null, outputTokens: null, totalTokens: null },
      estimatedCost: 0,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    throw normalizeProviderError("ollama", err);
  }
}
