#!/usr/bin/env node
/** Quick local Ollama Arabic + JSON probe (no curriculum processing). */

const BASE = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';
const ARABIC =
  'اشرح مفهوم الجمع لطالب في الصف الأول بجملتين، ثم أعط مثالاً واحداً وسؤال اختيار من متعدد مع الإجابة.';

async function chat(prompt, { json = false } = {}) {
  const started = Date.now();
  const body = {
    model: MODEL,
    stream: false,
    think: false,
    messages: [
      { role: 'system', content: 'أنت معلم ابتدائي. أجب بالعربية الفصحى المبسطة فقط.' },
      { role: 'user', content: prompt },
    ],
    options: { temperature: json ? 0 : 0.2, num_predict: json ? 256 : 500 },
  };
  if (json) body.format = 'json';
  const r = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return { text: (d.message?.content || '').trim(), latencyMs: Date.now() - started };
}

const arabic = await chat(ARABIC);
let jsonOk = false;
try {
  const j = await chat(
    'أرجع فقط JSON: {"concept":"الجمع","example":"2+3=5","quiz":{"question":"كم يساوي 1+1؟","choices":["1","2","3"],"answer":"2"}}',
    { json: true },
  );
  JSON.parse(j.text);
  jsonOk = true;
} catch {
  jsonOk = false;
}

const arabicOk =
  (arabic.text.match(/[\u0600-\u06FF]/g) || []).length >= 40 &&
  /\d\s*\+\s*\d|مثال/.test(arabic.text) &&
  /اختيار|أ\)|ب\)|ج\)|أ\.|ب\.|ج\.|الإجابة/.test(arabic.text);

const pass = arabicOk && jsonOk;
console.log(
  JSON.stringify(
    {
      model: MODEL,
      testResponse: arabic.text,
      responseTimeMs: arabic.latencyMs,
      arabicQualityResult: arabicOk ? 'PASS' : 'FAIL',
      jsonTestResult: jsonOk ? 'PASS' : 'FAIL',
      result: pass ? 'PASS' : 'FAIL',
    },
    null,
    2,
  ),
);
process.exit(pass ? 0 : 1);
