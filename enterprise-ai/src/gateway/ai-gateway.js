/**
 * AI Gateway — provider-independent routing.
 * Application code must never call OpenAI/Anthropic/Gemini SDKs directly.
 * All model calls go through this gateway + provider adapters.
 */
import { openaiChat, openaiConfigured } from "../providers/openai.js";
import { anthropicChat, anthropicConfigured } from "../providers/anthropic.js";
import { geminiChat, geminiConfigured } from "../providers/gemini.js";
import { ollamaChat, ollamaConfigured } from "../providers/ollama-fallback.js";

const PROVIDER_ORDER_DEFAULT = ["openai", "anthropic", "gemini", "ollama-local"];

const adapters = {
  openai: {
    configured: openaiConfigured,
    chat: openaiChat,
  },
  anthropic: {
    configured: anthropicConfigured,
    chat: anthropicChat,
  },
  gemini: {
    configured: geminiConfigured,
    chat: geminiChat,
  },
  "ollama-local": {
    configured: ollamaConfigured,
    chat: ollamaChat,
  },
};

/** Register a future provider at runtime without changing app code. */
export function registerProvider(id, adapter) {
  if (!id || typeof adapter?.chat !== "function" || typeof adapter?.configured !== "function") {
    throw new Error("INVALID_PROVIDER_ADAPTER");
  }
  adapters[id] = adapter;
  return Object.keys(adapters);
}

export function listGatewayProviders() {
  return Object.keys(adapters);
}

export async function gatewayChat({
  preferred = PROVIDER_ORDER_DEFAULT,
  system,
  user,
  maxTokens = 1600,
  requireLive = false,
} = {}) {
  if (process.env.AIOS_FORCE_OFFLINE_STUB === "true" && !requireLive) {
    return {
      provider: "offline-stub",
      model: "none",
      text: JSON.stringify({
        mode: "OFFLINE_STUB",
        summary: "AIOS offline stub response for deterministic tests",
        findings: [],
        recommendations: [],
        risks: [],
        nextSteps: ["Unset AIOS_FORCE_OFFLINE_STUB for live providers"],
      }),
      tried: [{ provider: "forced-offline", status: "stub" }],
      stub: true,
      gateway: "aios-ai-gateway",
    };
  }

  const tried = [];
  for (const id of preferred) {
    const adapter = adapters[id];
    if (!adapter) {
      tried.push({ provider: id, status: "unknown_adapter" });
      continue;
    }
    try {
      const ok = await adapter.configured();
      if (!ok) {
        tried.push({ provider: id, status: "not_configured" });
        continue;
      }
      const result = await adapter.chat({ system, user, maxTokens });
      return { ...result, tried, gateway: "aios-ai-gateway" };
    } catch (err) {
      tried.push({ provider: id, status: "error", error: String(err?.message || err) });
    }
  }

  if (requireLive) {
    const err = new Error("NO_LIVE_PROVIDER_AVAILABLE");
    err.tried = tried;
    throw err;
  }

  return {
    provider: "offline-stub",
    model: "none",
    text: JSON.stringify({
      mode: "OFFLINE_STUB",
      note: "AIOS gateway: no live provider credentials. Architecture remains activation-ready.",
      echo: String(user).slice(0, 400),
    }),
    tried,
    stub: true,
    gateway: "aios-ai-gateway",
  };
}
