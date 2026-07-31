/**
 * Swappable AI provider adapter (Ollama now; Gemini/OpenAI/Claude later).
 */
const PROVIDER = process.env.CURRICULUM_AI_PROVIDER || "ollama";

export async function chatJson({ system, user, timeoutMs = 60000 }) {
  if (PROVIDER === "ollama") return ollamaChatJson({ system, user, timeoutMs });
  // Future: gemini | openai | claude
  throw new Error(`AI_PROVIDER_UNSUPPORTED:${PROVIDER}`);
}

async function ollamaChatJson({ system, user, timeoutMs }) {
  const res = await fetch(process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "qwen3:8b",
      stream: false,
      think: false,
      format: "json",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      options: { temperature: 0.2, num_predict: 400 },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`OLLAMA_HTTP_${res.status}`);
  const data = await res.json();
  const text = data?.message?.content || "";
  return JSON.parse(text);
}

export function getAiProviderName() {
  return PROVIDER;
}
