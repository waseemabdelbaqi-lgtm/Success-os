/** Local Ollama fallback used when cloud keys are absent. */

export async function ollamaConfigured() {
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function ollamaChat({ system, user, maxTokens = 1200 }) {
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "qwen3:8b";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      options: { temperature: 0.2, num_predict: maxTokens },
    }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`OLLAMA_HTTP_${res.status}`);
  const data = await res.json();
  return { provider: "ollama-local", model, text: data?.message?.content || "" };
}
