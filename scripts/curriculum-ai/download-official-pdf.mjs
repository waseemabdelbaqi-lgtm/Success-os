#!/usr/bin/env node
/**
 * Download official Jordan G1 Math Sem1 Student Book from NCCD via real browser.
 * No Wayback. No truncated files. No unofficial sources.
 * Hard timeout: 5 minutes.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'data/curriculum-ai/jordan/g1-s1-math-student/source');
const OUT_FILE = path.join(OUT_DIR, 'MA.01.ST.BOOK_WEB.pdf');
const META_FILE = path.join(path.dirname(OUT_DIR), 'download-attempt.json');
const KNOWN_FALLBACK =
  'https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf';
const CATALOG = 'https://www.nccd.gov.jo/Ar/Pages/textbooks';
const GRADE1 = 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68';
const HARD_MS = 5 * 60 * 1000;
const started = Date.now();

function remaining() {
  return Math.max(1000, HARD_MS - (Date.now() - started));
}

function report(obj) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    META_FILE,
    `${JSON.stringify({ ...obj, at: new Date().toISOString() }, null, 2)}\n`,
  );
  console.log(JSON.stringify(obj, null, 2));
}

function validateBytes(filePath) {
  if (!fs.existsSync(filePath)) return { ok: false, reason: 'missing' };
  const st = fs.statSync(filePath);
  if (st.size <= 20 * 1024 * 1024) return { ok: false, reason: `size_too_small:${st.size}` };
  const fd = fs.openSync(filePath, 'r');
  const head = Buffer.alloc(8);
  fs.readSync(fd, head, 0, 8, 0);
  const tailBuf = Buffer.alloc(4096);
  const tailStart = Math.max(0, st.size - 4096);
  fs.readSync(fd, tailBuf, 0, 4096, tailStart);
  fs.closeSync(fd);
  if (!head.toString('utf8').startsWith('%PDF')) return { ok: false, reason: 'bad_header' };
  if (!tailBuf.includes(Buffer.from('%%EOF'))) return { ok: false, reason: 'missing_eof' };
  const sha256 = createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  return { ok: true, size: st.size, sha256 };
}

function validatePages(filePath) {
  const py = `
import fitz, sys
path = sys.argv[1]
doc = fitz.open(path)
n = doc.page_count
if n <= 0:
    raise SystemExit('no_pages')
# open first and last
_ = doc[0].get_pixmap(matrix=fitz.Matrix(0.2, 0.2))
_ = doc[n-1].get_pixmap(matrix=fitz.Matrix(0.2, 0.2))
print(n)
doc.close()
`;
  const r = spawnSync('python3', ['-c', py, filePath], { encoding: 'utf8', timeout: 120000 });
  if (r.status !== 0) {
    return { ok: false, reason: `page_open_failed:${(r.stderr || r.stdout || '').slice(0, 200)}` };
  }
  const pageCount = Number((r.stdout || '').trim());
  if (!Number.isFinite(pageCount) || pageCount <= 0) {
    return { ok: false, reason: 'pageCount_zero' };
  }
  return { ok: true, pageCount };
}

async function resolveLatestUrl(page) {
  const candidates = [];
  for (const url of [GRADE1, CATALOG]) {
    if (remaining() < 20000) break;
    try {
      const resp = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: Math.min(45000, remaining()),
      });
      console.error('NAV', url, resp?.status());
      await page.waitForTimeout(2500);
      const found = await page.evaluate(() => {
        const out = [];
        for (const a of Array.from(document.querySelectorAll('a[href]'))) {
          const href = a.href || '';
          const ctx = ((a.closest('tr,li,div,td,section') || a).innerText || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 500);
          out.push({ href, ctx, text: (a.innerText || '').trim().slice(0, 120) });
        }
        return out;
      });
      for (const item of found) {
        const h = item.href || '';
        const c = `${item.ctx} ${item.text}`;
        const isPdf = /\.pdf($|\?)/i.test(h) || /Root_Storage/i.test(h);
        if (!isPdf) continue;
        const explicit = /MA\.01\.ST\.BOOK/i.test(h);
        const isMath = /رياضيات|\/Math\//i.test(h + c);
        const isG1 = /الصف الأول|\/G01\/|MA\.01/i.test(h + c);
        const isStudent = /كتاب الطالب|ST\.BOOK|\.ST\./i.test(h + c);
        const isSem2 = /الفصل الدراسي الثاني|ST2|WB2|\/G01\/2\//i.test(h + c);
        const isSem1 =
          explicit ||
          (/الفصل الدراسي الأول|BOOK_WEB/i.test(h + c) && !isSem2);
        if (explicit || (isMath && isG1 && isStudent && isSem1)) {
          candidates.push({
            href: h.split('#')[0],
            score:
              (explicit ? 100 : 0) +
              (isSem1 ? 40 : 0) +
              (isStudent ? 20 : 0) +
              (isG1 ? 10 : 0) +
              (/2025|2026/i.test(h) ? 5 : 0),
            ctx: c.slice(0, 240),
            from: url,
          });
        }
      }
    } catch (err) {
      console.error('resolve_failed', url, String(err?.message || err));
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return {
    officialUrl: best?.href || KNOWN_FALLBACK,
    resolvedFromPage: Boolean(best),
    candidates: candidates.slice(0, 12),
  };
}

async function downloadWithBrowser(context, page, officialUrl) {
  const partial = `${OUT_FILE}.partial`;
  if (fs.existsSync(partial)) fs.unlinkSync(partial);

  await page
    .goto(GRADE1, { waitUntil: 'domcontentloaded', timeout: Math.min(40000, remaining()) })
    .catch(() => null);
  await page.waitForTimeout(1500);
  console.error('cookies', (await context.cookies()).length);

  // A: API request with browser cookies
  for (let attempt = 1; attempt <= 3 && remaining() > 15000; attempt++) {
    try {
      console.error('attempt_request', attempt);
      const resp = await context.request.get(officialUrl, {
        timeout: Math.min(120000, remaining()),
        headers: {
          Referer: GRADE1,
          Accept: 'application/pdf,application/octet-stream,*/*',
        },
        maxRedirects: 10,
      });
      const status = resp.status();
      const body = Buffer.from(await resp.body());
      console.error('request_get', status, body.length, body.slice(0, 5).toString('utf8'));
      if (status >= 200 && status < 300 && body.length > 0) {
        fs.writeFileSync(partial, body);
        return { method: 'context.request.get', status, bytes: body.length, attempt };
      }
    } catch (err) {
      console.error('request_get_failed', attempt, String(err?.message || err));
      await page.waitForTimeout(1500 * attempt);
    }
  }

  // B: download event
  try {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: Math.min(90000, remaining()) }),
      page.evaluate((url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'book.pdf';
        document.body.appendChild(a);
        a.click();
      }, officialUrl),
    ]);
    const tmp = await download.path();
    if (tmp && fs.existsSync(tmp)) {
      fs.copyFileSync(tmp, partial);
      return { method: 'download_event', status: 200, bytes: fs.statSync(partial).size };
    }
  } catch (err) {
    console.error('download_event_failed', String(err?.message || err));
  }

  // C: navigate to PDF
  try {
    const resp = await page.goto(officialUrl, {
      waitUntil: 'commit',
      timeout: Math.min(120000, remaining()),
    });
    if (resp) {
      const status = resp.status();
      const body = Buffer.from(await resp.body());
      console.error('page_goto_pdf', status, body.length);
      if (status >= 200 && status < 300 && body.length > 0) {
        fs.writeFileSync(partial, body);
        return { method: 'page.goto', status, bytes: body.length };
      }
    }
  } catch (err) {
    console.error('page_goto_failed', String(err?.message || err));
  }

  return { method: 'none', status: 0, bytes: 0 };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--disable-http2', '--no-sandbox'],
    });
  } catch {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-http2', '--no-sandbox'],
    });
  }

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    acceptDownloads: true,
    ignoreHTTPSErrors: false,
    extraHTTPHeaders: { 'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8' },
  });
  const page = await context.newPage();

  let resolved;
  try {
    resolved = await resolveLatestUrl(page);
  } catch (err) {
    resolved = {
      officialUrl: KNOWN_FALLBACK,
      resolvedFromPage: false,
      candidates: [],
      resolveError: String(err?.message || err),
    };
  }
  console.error('OFFICIAL_URL', resolved.officialUrl);

  const dl = await downloadWithBrowser(context, page, resolved.officialUrl);
  await browser.close().catch(() => null);

  const partial = `${OUT_FILE}.partial`;
  if (!dl.bytes || !fs.existsSync(partial)) {
    report({
      ok: false,
      failReason: 'DOWNLOAD_FAILED',
      officialUrl: resolved.officialUrl,
      resolved,
      download: dl,
      localFile: null,
      elapsedMs: Date.now() - started,
      needsManualUpload: true,
    });
    process.exit(2);
  }

  const bytesCheck = validateBytes(partial);
  if (!bytesCheck.ok) {
    const rejected = path.join(OUT_DIR, `REJECTED_INVALID_${bytesCheck.reason}_${Date.now()}.bin`);
    fs.renameSync(partial, rejected);
    report({
      ok: false,
      failReason: `VALIDATION_FAILED:${bytesCheck.reason}`,
      officialUrl: resolved.officialUrl,
      resolved,
      download: dl,
      rejected,
      localFile: null,
      elapsedMs: Date.now() - started,
      needsManualUpload: true,
    });
    process.exit(2);
  }

  const pageCheck = validatePages(partial);
  if (!pageCheck.ok) {
    const rejected = path.join(OUT_DIR, `REJECTED_INVALID_${pageCheck.reason}_${Date.now()}.pdf`);
    fs.renameSync(partial, rejected);
    report({
      ok: false,
      failReason: `VALIDATION_FAILED:${pageCheck.reason}`,
      officialUrl: resolved.officialUrl,
      resolved,
      download: dl,
      rejected,
      localFile: null,
      elapsedMs: Date.now() - started,
      needsManualUpload: true,
    });
    process.exit(2);
  }

  fs.renameSync(partial, OUT_FILE);
  report({
    ok: true,
    officialUrl: resolved.officialUrl,
    localFile: OUT_FILE,
    fileSize: bytesCheck.size,
    pageCount: pageCheck.pageCount,
    sha256: bytesCheck.sha256,
    resolved,
    download: dl,
    elapsedMs: Date.now() - started,
  });
}

main().catch((err) => {
  report({
    ok: false,
    failReason: String(err?.message || err),
    localFile: null,
    needsManualUpload: true,
    elapsedMs: Date.now() - started,
  });
  process.exit(1);
});
