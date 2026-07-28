/**
 * Local Ollama curriculum AI (Node/CJS-friendly).
 * Server-side only — binds exclusively to http://127.0.0.1:11434.
 * Never expose this client through a public Cloudflare tunnel proxy.
 */

const LOOPBACK = process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL?.trim() || 'qwen3:8b';

export const LOCAL_AI_ARABIC_PROBE =
  'اشرح مفهوم الجمع لطالب في الصف الأول بجملتين، ثم أعط مثالاً واحداً وسؤال اختيار من متعدد مع الإجابة.';

function assertLoopback(baseUrl = LOOPBACK) {
  const host = new URL(baseUrl).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') {
    throw new Error('OLLAMA_MUST_STAY_ON_LOOPBACK');
  }
  return baseUrl;
}

export function getLocalOllamaConfig() {
  return { baseUrl: assertLoopback(), model: DEFAULT_MODEL };
}

export async function ollamaGenerateText({
  prompt,
  system,
  maxOutputTokens = 1200,
  temperature = 0.2,
  json = false,
  think = false,
  model = DEFAULT_MODEL,
} = {}) {
  const baseUrl = assertLoopback();
  const body = {
    model,
    stream: false,
    think,
    messages: [
      {
        role: 'system',
        content:
          system ||
          'أنت مساعد تعليمي محلي لمنصة Success OS. أجب بالعربية الفصحى المبسطة عندما يكون السؤال بالعربية.',
      },
      { role: 'user', content: prompt },
    ],
    options: { temperature, num_predict: maxOutputTokens },
  };
  if (json) body.format = 'json';

  const r = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`OLLAMA_${r.status}`);
  const d = await r.json();
  const text = (d?.message?.content || d?.response || '').trim();
  if (!text) throw new Error('OLLAMA_EMPTY_RESPONSE');
  return text;
}

export async function ollamaIsReady() {
  try {
    const baseUrl = assertLoopback();
    const r = await fetch(`${baseUrl}/api/tags`);
    if (!r.ok) return false;
    const d = await r.json();
    const names = (d.models || []).map((m) => m.name || '');
    return names.some((n) => n === DEFAULT_MODEL || n.startsWith(`${DEFAULT_MODEL}:`));
  } catch {
    return false;
  }
}
