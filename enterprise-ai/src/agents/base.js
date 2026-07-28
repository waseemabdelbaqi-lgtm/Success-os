import { openaiChat, openaiConfigured } from "../providers/openai.js";
import { anthropicChat, anthropicConfigured } from "../providers/anthropic.js";
import { geminiChat, geminiConfigured } from "../providers/gemini.js";
import { ollamaChat, ollamaConfigured } from "../providers/ollama-fallback.js";

/**
 * Resolve a chat provider with graceful fallback (cloud → ollama → offline stub).
 */
export async function resolveChat(preferredOrder, { system, user, maxTokens = 1600 }) {
  const tried = [];
  for (const id of preferredOrder) {
    try {
      if (id === "openai" && openaiConfigured()) {
        const r = await openaiChat({ system, user, maxTokens });
        return { ...r, tried };
      }
      if (id === "anthropic" && anthropicConfigured()) {
        const r = await anthropicChat({ system, user, maxTokens });
        return { ...r, tried };
      }
      if (id === "gemini" && geminiConfigured()) {
        const r = await geminiChat({ system, user, maxTokens });
        return { ...r, tried };
      }
      if (id === "ollama-local" && (await ollamaConfigured())) {
        const r = await ollamaChat({ system, user, maxTokens });
        return { ...r, tried };
      }
      tried.push({ provider: id, status: "skip_not_configured" });
    } catch (err) {
      tried.push({ provider: id, status: "error", error: String(err?.message || err) });
    }
  }
  // Offline planning stub — keeps orchestrator operational without keys.
  return {
    provider: "offline-stub",
    model: "none",
    text: JSON.stringify({
      mode: "OFFLINE_STUB",
      note: "No AI provider credentials available. Plan/execute scaffolding only.",
      echoUser: String(user).slice(0, 500),
    }),
    tried,
    stub: true,
  };
}

export function parseJsonLoose(text) {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}
