/**
 * Gemini-powered elementary lesson rebuild:
 * - warm Jordanian Arabic teaching script
 * - photoreal teacher + board slide images
 * Then local bake uses those assets + ar-JO-SanaNeural voice.
 *
 * Requires: GEMINI_API_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { withAiAssistantTitle } from './ai-assistant-teacher.js';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'ai-lessons', 'g1-math');
const SCRIPTS = path.join(OUT, 'scripts');
const FACES = path.join(OUT, 'faces');
const SLIDES = path.join(OUT, 'slides');

function key() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

export function geminiReady() {
  return Boolean(key());
}

async function geminiGenerate({ model, parts, responseModalities }) {
  const k = key();
  if (!k) throw Object.assign(new Error('NO_GEMINI_API_KEY'), { status: 503 });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(k)}`;
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };
  if (responseModalities) {
    body.generationConfig.responseModalities = responseModalities;
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data?.error?.message || `GEMINI_${r.status}`;
    throw Object.assign(new Error(msg), { status: r.status, details: data });
  }
  return data;
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('\n').trim();
}

function extractInlineImages(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((p) => p.inlineData?.data || p.inline_data?.data)
    .map((p) => ({
      mime: p.inlineData?.mimeType || p.inline_data?.mime_type || 'image/png',
      b64: p.inlineData?.data || p.inline_data?.data,
    }));
}

const BEAT_PLAN = [
  { id: '01', title: 'ترحيب دافئ', board: 'welcome' },
  { id: '02', title: 'ما هو خط الأعداد؟', board: 'numberline' },
  { id: '03', title: 'نبدأ من العدد الأول', board: 'start3' },
  { id: '04', title: 'قفزات الجمع', board: 'jumps' },
  { id: '05', title: 'النتيجة 3+2', board: 'answer5' },
  { id: '06', title: 'تحدي 2+3', board: 'challenge' },
  { id: '07', title: 'الحل معاً', board: 'solve' },
  { id: '08', title: 'تمرين 4+1', board: 'activity' },
  { id: '09', title: 'خطأ شائع', board: 'check' },
  { id: '10', title: 'القاعدة الذهبية', board: 'rule' },
  { id: '11', title: 'مراجعة', board: 'remember' },
  { id: '12', title: 'وداع وتشجيع', board: 'bye' },
];

export async function geminiRewriteScripts() {
  const teacher = withAiAssistantTitle('أ. لاما النوري');
  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
  const prompt = `أنت كاتبة سكربت حصص يوتيوب أردنية للصف الأول.
المعلمة: ${teacher} (لقب ثابت: معلّمة مساعدة).
الموضوع: الجمع باستخدام خط الأعداد.
اكتب 12 مقطعاً صوتياً بالعربية الفصحى المبسّطة بلهجة أردنية دافئة (كلمات مثل: هلق، يا أبطالي، إن شاء الله sparingly).
كل مقطع 35–55 كلمة، طبيعي كأنه تصوير حي مثل دروس أ. رشا الحجاج (ستايل فقط، لا تنسخ محتواها ولا اسمها).
أرجع JSON فقط بهذا الشكل:
{"beats":[{"id":"01","title":"...","spoken":"..."}, ...]}
المعرفات يجب أن تكون من 01 إلى 12 بالترتيب.`;

  const data = await geminiGenerate({
    model,
    parts: [{ text: prompt }],
  });
  const text = extractText(data).replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('GEMINI_SCRIPT_NOT_JSON');
    parsed = JSON.parse(m[0]);
  }
  const beats = parsed.beats || [];
  if (beats.length < 10) throw new Error('GEMINI_SCRIPT_TOO_SHORT');
  fs.mkdirSync(SCRIPTS, { recursive: true });
  const saved = [];
  for (const plan of BEAT_PLAN) {
    const hit = beats.find((b) => String(b.id).padStart(2, '0') === plan.id) || beats[Number(plan.id) - 1];
    const spoken = String(hit?.spoken || hit?.text || '').trim();
    if (!spoken) continue;
    const file = path.join(SCRIPTS, `beat-${plan.id}.txt`);
    fs.writeFileSync(file, `${spoken}\n`, 'utf8');
    saved.push({ id: plan.id, title: hit?.title || plan.title, file, chars: spoken.length });
  }
  if (saved.length < 10) throw new Error('GEMINI_SCRIPT_SAVE_FAILED');
  return { model, teacher, saved, provider: 'gemini' };
}

export async function geminiGenerateTeacherFaces() {
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const base =
    'Photoreal young Jordanian female elementary AI assistant teacher, mid-20s, Levantian features, olive skin, dusty-rose hijab, cream blouse, bright home teaching studio, YouTube educator framing, upper body, cinematic natural light, fictional person, no watermark, no text logo';
  const prompts = [
    { name: 'idle.png', text: `${base}, mouth gently closed, warm smile, looking at camera` },
    { name: 'talk.png', text: `${base}, mouth slightly open mid-speech, lively teaching expression, same face and outfit` },
  ];
  fs.mkdirSync(FACES, { recursive: true });
  const out = [];
  for (const p of prompts) {
    const data = await geminiGenerate({
      model,
      parts: [{ text: p.text }],
      responseModalities: ['TEXT', 'IMAGE'],
    });
    const imgs = extractInlineImages(data);
    if (!imgs.length) throw new Error(`GEMINI_NO_IMAGE_${p.name}`);
    const buf = Buffer.from(imgs[0].b64, 'base64');
    const dest = path.join(FACES, p.name);
    fs.writeFileSync(dest, buf);
    out.push({ file: dest, bytes: buf.length, model });
  }
  return { provider: 'gemini', model, faces: out };
}

export async function geminiGenerateBoardSlides() {
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  fs.mkdirSync(SLIDES, { recursive: true });
  const slides = [
    { id: 'welcome', prompt: 'Clean Arabic grade-1 math whiteboard slide, burgundy and cream, big equation 3+2=؟, title الجمع بخط الأعداد, Success OS style, no people' },
    { id: 'numberline', prompt: 'Educational whiteboard showing number line 0 to 10, Arabic labels, burgundy gold style for kids grade 1, no people' },
    { id: 'jumps', prompt: 'Whiteboard number line with jumps from 3 to 5, arrows, kids math, burgundy gold, Arabic, no people' },
  ];
  const out = [];
  for (const s of slides) {
    const data = await geminiGenerate({
      model,
      parts: [{ text: s.prompt }],
      responseModalities: ['TEXT', 'IMAGE'],
    });
    const imgs = extractInlineImages(data);
    if (!imgs.length) continue;
    const dest = path.join(SLIDES, `${s.id}.png`);
    fs.writeFileSync(dest, Buffer.from(imgs[0].b64, 'base64'));
    out.push({ id: s.id, file: dest });
  }
  return { provider: 'gemini', model, slides: out };
}

function regenVoiceLocal() {
  fs.mkdirSync(path.join(OUT, 'audio'), { recursive: true });
  const results = [];
  for (const plan of BEAT_PLAN) {
    const txt = path.join(SCRIPTS, `beat-${plan.id}.txt`);
    const mp3 = path.join(OUT, 'audio', `beat-${plan.id}.mp3`);
    if (!fs.existsSync(txt)) continue;
    const r = spawnSync(
      'edge-tts',
      ['--voice', 'ar-JO-SanaNeural', '--rate=-5%', '--file', txt, '--write-media', mp3],
      { encoding: 'utf8' },
    );
    results.push({ id: plan.id, ok: r.status === 0, err: r.stderr?.slice(0, 200) });
  }
  return results;
}

function rebakeVideoLocal() {
  const script = path.join(ROOT, 'scripts', 'bake-g1-math-lesson-video.py');
  const r = spawnSync('python3', [script], { encoding: 'utf8', timeout: 240000 });
  return { ok: r.status === 0, stdout: (r.stdout || '').slice(-500), stderr: (r.stderr || '').slice(-500) };
}

/**
 * Full Gemini rebuild pipeline for G1 math lesson.
 * steps: scripts | faces | slides | voice | bake | all
 */
export async function runGeminiLessonRebuild({ steps = ['all'] } = {}) {
  if (!geminiReady()) {
    throw Object.assign(new Error('NO_GEMINI_API_KEY'), {
      status: 503,
      messageAr: 'أضف GEMINI_API_KEY إلى .env.local ثم أعد تشغيل السيرفر.',
      required: ['GEMINI_API_KEY'],
    });
  }
  const want = new Set(steps.includes('all') ? ['scripts', 'faces', 'slides', 'voice', 'bake'] : steps);
  const report = { provider: 'gemini', teacher: withAiAssistantTitle('أ. لاما النوري'), steps: {} };
  if (want.has('scripts')) report.steps.scripts = await geminiRewriteScripts();
  if (want.has('faces')) {
    try {
      report.steps.faces = await geminiGenerateTeacherFaces();
    } catch (e) {
      report.steps.faces = { error: e.message, skipped: true };
    }
  }
  if (want.has('slides')) {
    try {
      report.steps.slides = await geminiGenerateBoardSlides();
    } catch (e) {
      report.steps.slides = { error: e.message, skipped: true };
    }
  }
  if (want.has('voice')) report.steps.voice = regenVoiceLocal();
  if (want.has('bake')) report.steps.bake = rebakeVideoLocal();

  // stamp manifest
  const manifestPath = path.join(OUT, 'manifest.json');
  try {
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    m.teacher = withAiAssistantTitle('أ. لاما النوري');
    m.teacherTitle = 'معلّمة مساعدة';
    m.producer = 'gemini';
    m.producedAt = new Date().toISOString();
    fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));
  } catch {
    /* optional */
  }
  return report;
}
