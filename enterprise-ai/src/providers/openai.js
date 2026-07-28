import { firstEnv, httpJson, ProviderNotConfiguredError } from "./base.js";

export function openaiConfigured() {
  return Boolean(firstEnv(["OPENAI_API_KEY", "OPENAI_CONTENT_API_KEY"]));
}

export async function openaiChat({ system, user, maxTokens = 2000 }) {
  const cred = firstEnv(["OPENAI_API_KEY", "OPENAI_CONTENT_API_KEY"]);
  if (!cred) throw new ProviderNotConfiguredError("openai");
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini";
  const data = await httpJson("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cred.value}`,
      "Content-Type": "application/json",
    },
    body: {
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
  });
  const text = data?.choices?.[0]?.message?.content || "";
  return { provider: "openai", model, text };
}
