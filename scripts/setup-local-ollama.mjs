#!/usr/bin/env node
/**
 * Automatic local curriculum AI setup (Step 1).
 * Detects hardware → installs Ollama if missing → selects a safe Qwen model
 * → downloads → starts loopback service → runs Arabic + JSON probes.
 *
 * Does NOT start curriculum book processing.
 * Does NOT expose Ollama beyond 127.0.0.1.
 */

import { spawn, execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'data', 'local-ai', 'step1-report.json');
const OLLAMA_HOST = '127.0.0.1:11434';
const BASE = `http://${OLLAMA_HOST}`;

const ARABIC_PROMPT =
  'اشرح مفهوم الجمع لطالب في الصف الأول بجملتين، ثم أعط مثالاً واحداً وسؤال اختيار من متعدد مع الإجابة.';

function sh(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  }).trim();
}

function trySh(cmd) {
  try {
    return sh(cmd);
  } catch {
    return '';
  }
}

function detectHardware() {
  const platform = os.platform();
  const release = os.release();
  const arch = os.arch();
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const diskAvailBytes = (() => {
    try {
      const out = sh("df -B1 / | awk 'NR==2{print $4}'");
      return Number(out) || 0;
    } catch {
      return 0;
    }
  })();

  let gpu = 'none';
  const nvidia = trySh(
    'nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null',
  );
  if (nvidia) gpu = nvidia.split('\n')[0].trim();
  else {
    const lspci = trySh("lspci 2>/dev/null | rg -i 'vga|3d|display' | head -1");
    if (lspci) gpu = lspci;
  }

  const osPretty =
    trySh("grep ^PRETTY_NAME= /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '\"'") ||
    `${platform} ${release}`;

  return {
    os: osPretty,
    platform,
    arch,
    cpu: cpus[0]?.model || 'unknown',
    cpuCores: cpus.length,
    ramBytes: totalMem,
    ramGiB: Math.round((totalMem / 1024 ** 3) * 10) / 10,
    availableRamBytes: freeMem,
    availableRamGiB: Math.round((freeMem / 1024 ** 3) * 10) / 10,
    usableMemoryGiB: Math.round((totalMem / 1024 ** 3) * 10) / 10,
    gpu,
    diskAvailBytes,
    diskAvailGiB: Math.round((diskAvailBytes / 1024 ** 3) * 10) / 10,
  };
}

/** Prefer Qwen-family instruct tags verified against the live Ollama library. */
async function verifyOllamaTag(tag) {
  try {
    const res = await fetch(`https://ollama.com/library/${tag.split(':')[0]}/tags`);
    if (!res.ok) return false;
    const html = await res.text();
    return html.includes(tag) || html.includes(tag.replace(':', '%3A'));
  } catch {
    return false;
  }
}

async function selectModel(hardware) {
  const usable = hardware.usableMemoryGiB;
  /** Ordered preference within the hardware tier. */
  let candidates;
  if (usable >= 48) {
    candidates = ['qwen3:30b', 'qwen2.5:32b', 'qwen3:14b', 'qwen2.5:14b', 'qwen3:8b', 'qwen2.5:7b'];
  } else if (usable >= 24) {
    candidates = ['qwen3:14b', 'qwen2.5:14b', 'qwen3:8b', 'qwen2.5:7b'];
  } else {
    // Low-resource: 7B–9B class only
    candidates = ['qwen3:8b', 'qwen2.5:7b', 'qwen2.5:7b-instruct', 'qwen3:4b'];
  }

  for (const tag of candidates) {
    // Confirm registry listing, then accept.
    const ok = await verifyOllamaTag(tag);
    if (ok) {
      return {
        model: tag,
        tier: usable >= 48 ? '30b-class' : usable >= 24 ? '14b-class' : '7b-9b-class',
        reason: `Selected ${tag} for ~${usable}GiB usable memory (verified on Ollama library).`,
      };
    }
  }
  throw new Error('No compatible Qwen model tag found on Ollama library.');
}

function ollamaInstalled() {
  try {
    execFileSync('ollama', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function installOllama() {
  if (process.platform !== 'linux' && process.platform !== 'darwin') {
    throw new Error(`Automatic Ollama install is only supported on Linux/macOS (got ${process.platform}).`);
  }
  // Ensure zstd on Debian/Ubuntu (required by current Ollama installer).
  if (process.platform === 'linux') {
    try {
      execFileSync('zstd', ['--version'], { stdio: 'ignore' });
    } catch {
      trySh('sudo apt-get update -qq && sudo apt-get install -y -qq zstd');
    }
  }
  sh('curl -fsSL https://ollama.com/install.sh | sh', { stdio: 'inherit', shell: '/bin/bash' });
}

async function waitForOllama(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.ok || r.status === 200) return true;
      const text = await r.text();
      if (/ollama/i.test(text)) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function ensureOllamaServing() {
  return (async () => {
    if (await waitForOllama(2_000)) return { started: false };
    const child = spawn('ollama', ['serve'], {
      env: { ...process.env, OLLAMA_HOST },
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    const ok = await waitForOllama(60_000);
    if (!ok) throw new Error('Failed to start Ollama on 127.0.0.1:11434');
    return { started: true, pid: child.pid };
  })();
}

async function pullModel(model) {
  return new Promise((resolve, reject) => {
    const child = spawn('ollama', ['pull', model], {
      env: { ...process.env, OLLAMA_HOST },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
      process.stdout.write(d);
    });
    child.stderr.on('data', (d) => {
      out += d.toString();
      process.stderr.write(d);
    });
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`ollama pull exited ${code}`));
    });
  });
}

async function modelSizeBytes(model) {
  try {
    const r = await fetch(`${BASE}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    // Prefer details from local list
    const tags = await fetch(`${BASE}/api/tags`).then((x) => x.json());
    const entry = (tags.models || []).find((m) => m.name === model || m.name.startsWith(model));
    return entry?.size || d?.size || null;
  } catch {
    return null;
  }
}

async function chat(model, prompt, { json = false, numPredict = 500 } = {}) {
  const started = Date.now();
  const body = {
    model,
    stream: false,
    think: false,
    messages: [
      {
        role: 'system',
        content:
          'أنت معلم ابتدائي. أجب بالعربية الفصحى المبسطة فقط.',
      },
      { role: 'user', content: prompt },
    ],
    options: { temperature: json ? 0 : 0.2, num_predict: numPredict },
  };
  if (json) body.format = 'json';
  const r = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`chat failed: ${r.status}`);
  const d = await r.json();
  return {
    text: (d?.message?.content || '').trim(),
    latencyMs: Date.now() - started,
    evalCount: d.eval_count,
  };
}

function scoreArabic(text) {
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).join('').length;
  const hasExample = /\d\s*\+\s*\d|مثال/.test(text);
  const hasQuiz = /اختيار|أ\)|ب\)|ج\)|أ\.|ب\.|ج\.|الإجابة|السؤال/.test(text);
  const quizLooksCorrect = /الإجابة[^\n]{0,40}[ب5]|answer[^\n]{0,10}5/i.test(text) || /\b5\b/.test(text);
  return {
    arabicChars: arabic,
    hasExample,
    hasQuiz,
    quizLooksCorrect,
    pass: arabic >= 40 && hasExample && hasQuiz,
  };
}

async function main() {
  const hardware = detectHardware();
  console.log('Hardware:', JSON.stringify(hardware, null, 2));

  let installStatus = ollamaInstalled() ? 'already-installed' : 'missing';
  if (installStatus === 'missing') {
    console.log('Installing Ollama…');
    installOllama();
    installStatus = ollamaInstalled() ? 'installed' : 'install-failed';
  }
  if (installStatus === 'install-failed') throw new Error('Ollama install failed');

  const serve = await ensureOllamaServing();
  console.log('Ollama serving on', BASE, serve);

  const selection = await selectModel(hardware);
  console.log('Selected model:', selection);

  await pullModel(selection.model);
  const downloadSizeBytes = await modelSizeBytes(selection.model);
  const downloadSizeGiB =
    downloadSizeBytes != null
      ? Math.round((downloadSizeBytes / 1024 ** 3) * 10) / 10
      : null;

  const arabic = await chat(selection.model, ARABIC_PROMPT, { numPredict: 500 });
  const arabicScore = scoreArabic(arabic.text);

  let jsonOk = false;
  let jsonText = '';
  let jsonLatencyMs = 0;
  try {
    const jsonResult = await chat(
      selection.model,
      'أرجع فقط JSON صالحاً بهذا الشكل: {"concept":"الجمع","example":"2+3=5","quiz":{"question":"كم يساوي 1+1؟","choices":["1","2","3"],"answer":"2"}}',
      { json: true, numPredict: 256 },
    );
    jsonText = jsonResult.text;
    jsonLatencyMs = jsonResult.latencyMs;
    const parsed = JSON.parse(jsonText);
    jsonOk = Boolean(parsed?.concept && parsed?.quiz?.answer);
  } catch {
    jsonOk = false;
  }

  const pass = arabicScore.pass && jsonOk;
  const report = {
    step: 1,
    curriculumProcessingAllowed: false,
    hardware,
    ollamaInstallationStatus: installStatus,
    ollamaHost: BASE,
    selectedModel: selection.model,
    selectionTier: selection.tier,
    selectionReason: selection.reason,
    downloadSizeBytes,
    downloadSizeGiB,
    downloadSizeLabel: downloadSizeGiB != null ? `${downloadSizeGiB} GB` : 'unknown',
    testResponse: arabic.text,
    responseTimeMs: arabic.latencyMs,
    arabicQualityResult: arabicScore.pass ? 'PASS' : 'FAIL',
    arabicQualityDetails: arabicScore,
    jsonTestResult: jsonOk ? 'PASS' : 'FAIL',
    jsonLatencyMs,
    jsonSample: jsonText.slice(0, 500),
    result: pass ? 'PASS' : 'FAIL',
    geminiApiKeySetup: 'disabled',
    geminiOAuthSetup: 'disabled',
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  // Persist runtime model choice for the app (no secrets).
  const envLocalPath = path.join(ROOT, '.env.local');
  const lines = [
    '# Local curriculum AI (Ollama) — server-only loopback',
    'OLLAMA_BASE_URL=http://127.0.0.1:11434',
    `OLLAMA_MODEL=${selection.model}`,
    'GEMINI_DISABLED=true',
    'ALLOW_CURRICULUM_GENERATION=false',
  ];
  let existing = '';
  if (fs.existsSync(envLocalPath)) existing = fs.readFileSync(envLocalPath, 'utf8');
  // Strip prior Ollama/Gemini setup flags we manage, keep unrelated secrets.
  const kept = existing
    .split(/\r?\n/)
    .filter(
      (line) =>
        !/^\s*(OLLAMA_BASE_URL|OLLAMA_MODEL|GEMINI_DISABLED|ALLOW_CURRICULUM_GENERATION|GEMINI_API_KEY)\s*=/.test(
          line,
        ),
    )
    .join('\n')
    .trimEnd();
  fs.writeFileSync(
    envLocalPath,
    `${kept ? `${kept}\n\n` : ''}${lines.join('\n')}\n`,
  );

  console.log('\n=== STEP 1 REPORT ===');
  console.log(JSON.stringify({
    hardwareDetected: {
      os: hardware.os,
      cpu: hardware.cpu,
      ramGiB: hardware.ramGiB,
      gpu: hardware.gpu,
      diskAvailGiB: hardware.diskAvailGiB,
    },
    ollamaInstallationStatus: installStatus,
    selectedModel: selection.model,
    downloadSize: report.downloadSizeLabel,
    testResponse: arabic.text,
    responseTimeMs: arabic.latencyMs,
    arabicQualityResult: report.arabicQualityResult,
    jsonTestResult: report.jsonTestResult,
    result: report.result,
  }, null, 2));

  if (!pass) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
