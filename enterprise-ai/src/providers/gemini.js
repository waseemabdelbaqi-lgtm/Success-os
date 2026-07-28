import { firstEnv, httpJson, ProviderNotConfiguredError } from "./base.js";

export function geminiConfigured() {
  if (process.env.GEMINI_DISABLED === "true" && process.env.MASTER_ORCHESTRATOR_ALLOW_GEMINI !== "true") {
    return false;
  }
  return Boolean(firstEnv(["GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"]));
}

export async function geminiChat({ system, user, maxTokens = 2000 }) {
  if (!geminiConfigured()) throw new ProviderNotConfiguredError("gemini");
  const cred = firstEnv(["GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"]);
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cred.value)}`;
  const data = await httpJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
    },
  });
  const text = (data?.candidates || [])
    .flatMap((c) => c.content?.parts || [])
    .map((p) => p.text || "")
    .join("\n");
  return { provider: "gemini", model, text };
}
