/**
 * AI Gateway — provider-independent routing via live registry.
 */
import { chatViaRegistry, registrySnapshot, routeForRole } from "../providers/registry.js";
import { openaiChat, openaiConfigured } from "../providers/openai.js";
import { anthropicChat, anthropicConfigured } from "../providers/anthropic.js";
import { geminiChat, geminiConfigured } from "../providers/gemini.js";
import { ollamaChat, ollamaConfigured } from "../providers/ollama-fallback.js";

const adapters = {
  openai: { configured: openaiConfigured, chat: openaiChat },
  anthropic: { configured: anthropicConfigured, chat: anthropicChat },
  gemini: { configured: geminiConfigured, chat: geminiChat },
  "ollama-local": { configured: ollamaConfigured, chat: ollamaChat },
};

export function registerProvider(id, adapter) {
  if (!id || typeof adapter?.chat !== "function" || typeof adapter?.configured !== "function") {
    throw new Error("INVALID_PROVIDER_ADAPTER");
  }
  adapters[id] = adapter;
  return Object.keys(adapters);
}

export function listGatewayProviders() {
  return [...new Set([...Object.keys(adapters), ...registrySnapshot().adapters])];
}

/**
 * @param {object} opts
 * @param {string} [opts.role] - agent role for routing
 * @param {string[]} [opts.preferred] - legacy preferred order (mapped to first role hint)
 */
export async function gatewayChat({
  role = "default",
  preferred,
  system,
  user,
  maxTokens = 1600,
  json = false,
  requireLive = false,
  signal,
  allowOllama = true,
} = {}) {
  if (process.env.AIOS_FORCE_OFFLINE_STUB === "true" && !requireLive) {
    return {
      provider: "offline-stub",
      model: "none",
      text: JSON.stringify({
        mode: "OFFLINE_STUB",
        summary: "AIOS offline stub response for deterministic tests",
        taskId: "",
        agent: role,
        status: "needs_review",
        assumptions: [],
        sources: [],
        filesProposed: [],
        patches: [],
        testsRequired: [],
        risks: [],
        tokenUsage: {},
        estimatedCost: null,
        errors: [],
      }),
      tokenUsage: {},
      estimatedCost: null,
      tried: [{ provider: "forced-offline", status: "stub" }],
      stub: true,
      gateway: "aios-ai-gateway",
      routing: preferred ? { order: preferred } : routeForRole(role),
    };
  }

  try {
    // If legacy preferred list provided, temporarily map first entry as role preferred via env-less order
    const effectiveRole = role;
    const result = await chatViaRegistry({
      role: effectiveRole,
      system,
      user,
      maxTokens,
      json,
      signal,
      allowOllama,
    });
    return { ...result, stub: false, gateway: "aios-ai-gateway" };
  } catch (err) {
    if (requireLive) throw err;
    return {
      provider: "offline-stub",
      model: "none",
      text: JSON.stringify({
        mode: "OFFLINE_STUB",
        summary: "No live provider available",
        status: "failed",
        errors: [String(err?.status || err?.message || err)],
        assumptions: [],
        sources: [],
        filesProposed: [],
        patches: [],
        testsRequired: [],
        risks: [],
        tokenUsage: {},
        estimatedCost: null,
      }),
      tokenUsage: {},
      estimatedCost: null,
      tried: err?.tried || [],
      stub: true,
      gateway: "aios-ai-gateway",
    };
  }
}
