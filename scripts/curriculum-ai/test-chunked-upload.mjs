#!/usr/bin/env node
/**
 * Test Local Browser Import: large PDF chunk upload + resume + validation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.env.IMPORT_TEST_BASE || 'http://127.0.0.1:3000';
const FIXTURE = path.join(ROOT, 'tmp/curriculum-ai-fixtures/large-valid-book.pdf');
const REPORT = path.join(
  ROOT,
  'data/curriculum-ai/jordan/grade-01/math/semester-01/student-book/upload-test-report.json',
);

function mustOk(cond, msg) {
  if (!cond) throw new Error(msg);
}

function createLargePdf() {
  fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
  const py = `
import fitz, os, sys
path = sys.argv[1]
os.makedirs(os.path.dirname(path), exist_ok=True)
doc = fitz.open()
# Enough pages + embedded binary padding to exceed 20MB while remaining a valid PDF.
target = 22 * 1024 * 1024
pad = os.urandom(256 * 1024)
for i in range(12):
    page = doc.new_page(width=595, height=842)
    page.insert_text((72, 72), f"Success OS fixture page {i+1} — Jordan Math G1 Sem1", fontsize=14)
    page.insert_text((72, 110), "اختبار رفع كتاب تجريبي كبير", fontsize=16)
    # Attach large files to inflate size without invalidating PDF structure.
    doc.embfile_add(f"pad-{i}.bin", pad * 8)
doc.save(path, garbage=0, deflate=False)
doc.close()
print(os.path.getsize(path))
`;
  const r = spawnSync('python3', ['-c', py, FIXTURE], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || 'pdf_create_failed');
  const size = Number((r.stdout || '').trim());
  mustOk(size > 20 * 1024 * 1024, `fixture too small: ${size}`);
  return size;
}

async function uploadChunked(filePath, { interruptAfterChunks = 0 } = {}) {
  const buf = fs.readFileSync(filePath); // test harness only
  const fileSize = buf.length;
  const init = await fetch(`${BASE}/api/admin/curriculum-ai/books/import?action=init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: 'large-valid-book.pdf', fileSize }),
  }).then((r) => r.json());
  mustOk(init.ok, `init failed: ${JSON.stringify(init)}`);
  const { sessionId, chunkSize, totalChunks } = init;

  let uploaded = 0;
  for (let i = 0; i < totalChunks; i++) {
    if (interruptAfterChunks > 0 && i >= interruptAfterChunks) {
      return { sessionId, chunkSize, totalChunks, interruptedAt: i, fileSize };
    }
    const start = i * chunkSize;
    const end = Math.min(fileSize, start + chunkSize);
    const chunk = buf.subarray(start, end);
    const res = await fetch(
      `${BASE}/api/admin/curriculum-ai/books/import?action=chunk&sessionId=${sessionId}&index=${i}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: chunk,
      },
    );
    const json = await res.json();
    mustOk(res.ok && json.ok, `chunk ${i} failed: ${JSON.stringify(json)}`);
    uploaded += 1;
  }
  return { sessionId, chunkSize, totalChunks, interruptedAt: null, fileSize, uploaded };
}

async function resumeAndComplete(sessionId, filePath, chunkSize, totalChunks, startIndex) {
  const buf = fs.readFileSync(filePath);
  const fileSize = buf.length;

  const status = await fetch(
    `${BASE}/api/admin/curriculum-ai/books/import?sessionId=${sessionId}`,
  ).then((r) => r.json());
  mustOk(status.ok, 'status failed');
  const received = new Set(status.received || []);

  for (let i = startIndex; i < totalChunks; i++) {
    if (received.has(i)) continue;
    const start = i * chunkSize;
    const end = Math.min(fileSize, start + chunkSize);
    const chunk = buf.subarray(start, end);
    const res = await fetch(
      `${BASE}/api/admin/curriculum-ai/books/import?action=chunk&sessionId=${sessionId}&index=${i}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: chunk,
      },
    );
    const json = await res.json();
    mustOk(res.ok && json.ok, `resume chunk ${i} failed: ${JSON.stringify(json)}`);
  }

  // Re-upload an already-received chunk to prove idempotent skip
  if (totalChunks > 0) {
    const i = 0;
    const start = i * chunkSize;
    const end = Math.min(fileSize, start + chunkSize);
    const chunk = buf.subarray(start, end);
    const res = await fetch(
      `${BASE}/api/admin/curriculum-ai/books/import?action=chunk&sessionId=${sessionId}&index=${i}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: chunk,
      },
    );
    const json = await res.json();
    mustOk(res.ok && json.ok && json.skipped === true, 'idempotent chunk skip failed');
  }

  const complete = await fetch(`${BASE}/api/admin/curriculum-ai/books/import?action=complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  }).then(async (r) => ({ status: r.status, json: await r.json() }));
  mustOk(complete.status === 200 && complete.json.ok, `complete failed: ${JSON.stringify(complete)}`);
  return complete.json;
}

async function main() {
  // Ensure Next is up
  const page = await fetch(`${BASE}/admin/curriculum-ai/books/import`);
  mustOk(page.ok, `import page HTTP ${page.status}`);

  const size = createLargePdf();
  console.log('fixture_size', size);

  // Interrupt after 2 chunks
  const interrupted = await uploadChunked(FIXTURE, { interruptAfterChunks: 2 });
  console.log('interrupted', interrupted);

  const statusMid = await fetch(
    `${BASE}/api/admin/curriculum-ai/books/import?sessionId=${interrupted.sessionId}`,
  ).then((r) => r.json());
  mustOk(statusMid.received?.length === 2, `expected 2 chunks, got ${statusMid.received?.length}`);

  const completed = await resumeAndComplete(
    interrupted.sessionId,
    FIXTURE,
    interrupted.chunkSize,
    interrupted.totalChunks,
    2,
  );
  console.log('completed_state', completed.state, completed.pageCount, completed.fileSize);

  const api = await fetch(`${BASE}/api/admin/curriculum-ai/books/import`).then((r) => r.json());
  mustOk(api.verified === true, 'api not verified');
  mustOk(api.status.state === 'VERIFIED', 'status not VERIFIED');
  mustOk(api.extractionEnabled === true, 'extraction button not enabled');
  mustOk(api.previews?.length >= 1, 'missing previews');

  // Preview bytes
  const preview = await fetch(`${BASE}${api.previews[0]}`);
  mustOk(preview.ok, 'preview fetch failed');
  const previewBuf = Buffer.from(await preview.arrayBuffer());
  mustOk(previewBuf.length > 1000, 'preview too small');

  // Arm extraction without starting
  const arm = await fetch(`${BASE}/api/admin/curriculum-ai/books/import?action=arm-extraction`, {
    method: 'POST',
  }).then((r) => r.json());
  mustOk(arm.ok && arm.extractionStarted === false, 'extraction should not auto-start');

  const report = {
    uploadTest: 'PASS',
    maxFileSize: api.maxFileSize,
    chunkResumeTest: 'PASS',
    pdfValidationTest: 'PASS',
    pageCount: completed.pageCount,
    fileSize: completed.fileSize,
    sha256: completed.sha256,
    verified: true,
    extractionEnabled: true,
    extractionStarted: false,
    importPageHttp: page.status,
  };
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
