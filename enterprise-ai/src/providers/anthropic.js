import { firstEnv, httpJson, ProviderNotConfiguredError } from "./base.js";

export function anthropicConfigured() {
  return Boolean(firstEnv(["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"]));
}

export async function anthropicChat({ system, user, maxTokens = 2000 }) {
  const cred = firstEnv(["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"]);
  if (!cred) throw new ProviderNotConfiguredError("anthropic");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  const data = await httpJson("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": cred.value,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: {
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    },
  });
  const text = (data?.content || []).map((c) => c.text || "").join("\n");
  return { provider: "anthropic", model, text };
}
