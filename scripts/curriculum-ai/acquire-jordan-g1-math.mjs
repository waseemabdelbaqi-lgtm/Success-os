#!/usr/bin/env node
/**
 * Acquire the official Jordan G1 Math Sem1 Student Book (Step 2 — acquisition only).
 *
 * Search order:
 *  1) Existing project files
 *  2) Private curriculum storage
 *  3) Database records
 *  4) Official NCCD sources
 *  5) Official MoE sources
 *
 * Does not invent files. Does not use unofficial PDF repositories.
 * Does not begin lesson generation.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const BOOK_DIR = path.join(ROOT, 'data/curriculum-ai/jordan/g1-s1-math-student');
const SOURCE_DIR = path.join(BOOK_DIR, 'source');

const OFFICIAL_PDF_URL =
  'https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf';
const CATALOG_URL = 'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68';
const OFFICIAL_TITLE_AR = 'الرياضيات — الصف الأول — الفصل الدراسي الأول — كتاب الطالب';

function ensureDirs() {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(path.join(BOOK_DIR, 'extraction/checkpoints'), { recursive: true });
  fs.mkdirSync(path.join(BOOK_DIR, 'extraction/pages'), { recursive: true });
}

function findLocalPdfs() {
  const hits = [];
  const roots = [
    path.join(ROOT, 'library'),
    path.join(ROOT, 'data'),
    path.join(ROOT, 'app/jordan-books'),
    path.join(ROOT, 'public'),
  ];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const walk = (dir, depth = 0) => {
      if (depth > 6) return;
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(full, depth + 1);
        else if (/\.pdf$/i.test(ent.name)) hits.push(full);
      }
    };
    walk(root);
  }
  return hits;
}

async function probeUrl(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'SUCCESS-OS-Curriculum-Indexer/1.0', Accept: '*/*' },
    });
    clearTimeout(t);
    return { ok: res.ok, status: res.status, error: null };
  } catch (err) {
    clearTimeout(t);
    return { ok: false, status: 0, error: String(err?.message || err) };
  }
}

async function tryDownload(url, dest) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SUCCESS-OS-Curriculum-Indexer/1.0', Accept: 'application/pdf,*/*' },
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, status: res.status, bytes: 0, error: `HTTP_${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return { ok: true, status: res.status, bytes: buf.length, error: null };
  } catch (err) {
    clearTimeout(t);
    return { ok: false, status: 0, bytes: 0, error: String(err?.message || err) };
  }
}

function pdfLooksComplete(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const st = fs.statSync(filePath);
  if (st.size < 100_000) return false;
  const fd = fs.openSync(filePath, 'r');
  const head = Buffer.alloc(8);
  fs.readSync(fd, head, 0, 8, 0);
  const tail = Buffer.alloc(2048);
  const tailStart = Math.max(0, st.size - 2048);
  fs.readSync(fd, tail, 0, 2048, tailStart);
  fs.closeSync(fd);
  if (!head.toString('utf8').startsWith('%PDF')) return false;
  if (!tail.includes(Buffer.from('%%EOF'))) return false;
  return true;
}

function sha256(filePath) {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

async function main() {
  ensureDirs();
  const searchOrderResults = [];

  // 1) Existing project files
  const localPdfs = findLocalPdfs().filter((p) => !p.includes('REJECTED_'));
  searchOrderResults.push({
    source: 'existing-project-files',
    result: localPdfs.length
      ? `found ${localPdfs.length} PDF(s): ${localPdfs.slice(0, 5).join(', ')}`
      : 'no PDFs found',
  });

  // 2) Private curriculum storage
  const privateRoots = [
    path.join(ROOT, 'library/jordan-national-curriculum-knowledge'),
    path.join(ROOT, 'library/jordan-educational-reference-library'),
    path.join(ROOT, 'library/jordan-book-production'),
  ];
  const privateHits = privateRoots.filter((p) => fs.existsSync(p));
  searchOrderResults.push({
    source: 'private-curriculum-storage',
    result: privateHits.length ? `present: ${privateHits.join(', ')}` : 'directories missing / empty of official PDFs',
  });

  // 3) Database records
  const dbPath = path.join(ROOT, 'data/book-engine/book-engine.sqlite');
  let dbResult = 'sqlite missing';
  if (fs.existsSync(dbPath)) {
    const probe = spawnSync(
      'python3',
      [
        '-c',
        `import sqlite3; c=sqlite3.connect(${JSON.stringify(dbPath)});
rows=c.execute("select id,title_ar,gate1_verified,official_source_url from books where id like '%g1%math%' or id like '%jo-g1-s1-math%'").fetchall();
print(rows)`,
      ],
      { encoding: 'utf8' },
    );
    dbResult = (probe.stdout || probe.stderr || '').trim().slice(0, 500) || 'query empty';
  }
  searchOrderResults.push({ source: 'database-records', result: dbResult });

  // 4) Official NCCD
  const catalogProbe = await probeUrl(CATALOG_URL);
  const pdfProbe = await probeUrl(OFFICIAL_PDF_URL);
  searchOrderResults.push({
    source: 'official-nccd',
    result: `catalog ${CATALOG_URL} -> status=${catalogProbe.status} error=${catalogProbe.error || 'none'}; pdf ${OFFICIAL_PDF_URL} -> status=${pdfProbe.status} error=${pdfProbe.error || 'none'}`,
  });

  // 5) Official MoE
  const moeProbe = await probeUrl('https://moe.gov.jo/ar/node/79818');
  searchOrderResults.push({
    source: 'official-moe',
    result: `https://moe.gov.jo/ar/node/79818 -> status=${moeProbe.status} error=${moeProbe.error || 'none'}`,
  });

  const blockers = [];
  let downloadStatus = 'pending';
  let localPdfPath = null;
  const rejectedArtifacts = [];

  // Identity of target from archived official catalog HTML (metadata only — already verified offline)
  // Catalog context on NCCD Grade 1 page:
  // "الرياضيات الصف الأول - الفصل الدراسي الأول كتاب الطالب" -> MA.01.ST.BOOK_WEB.pdf

  const dest = path.join(SOURCE_DIR, 'MA.01.ST.BOOK_WEB.pdf');
  const liveAttempt = await tryDownload(OFFICIAL_PDF_URL, `${dest}.partial`);
  if (liveAttempt.ok && pdfLooksComplete(`${dest}.partial`)) {
    fs.renameSync(`${dest}.partial`, dest);
    downloadStatus = 'downloaded';
    localPdfPath = dest;
  } else {
    if (fs.existsSync(`${dest}.partial`)) {
      const rejected = path.join(
        SOURCE_DIR,
        `REJECTED_INCOMPLETE_live_partial_${liveAttempt.bytes || 0}B.pdf`,
      );
      fs.renameSync(`${dest}.partial`, rejected);
      rejectedArtifacts.push(rejected);
    }
    blockers.push(
      `NCCD_LIVE_TLS_BLOCKED: official PDF URL ${OFFICIAL_PDF_URL} could not be downloaded from this environment (status=${liveAttempt.status}, error=${liveAttempt.error || 'connection reset / incomplete'}).`,
    );

    // Wayback truncated capture check (if present)
    const rejectedWayback = fs
      .readdirSync(SOURCE_DIR)
      .filter((f) => f.startsWith('REJECTED_INCOMPLETE_wayback'));
    for (const f of rejectedWayback) {
      rejectedArtifacts.push(path.join(SOURCE_DIR, f));
      blockers.push(
        `WAYBACK_TRUNCATED_CAPTURE_REJECTED: ${f} is an incomplete archive of the official PDF (Wayback stored ~5MiB of ~109MiB; missing %%EOF). Not used.`,
      );
    }
    downloadStatus = rejectedWayback.length ? 'incomplete_capture_rejected' : 'blocked';
  }

  // Do not silently substitute another book.
  const acquisition = {
    target: {
      country: 'Jordan',
      curriculum: 'Jordanian National Curriculum',
      grade: '1',
      semester: '1',
      subject: 'Mathematics',
      bookType: 'Student Book',
    },
    officialTitleAr: OFFICIAL_TITLE_AR,
    officialSourceUrl: OFFICIAL_PDF_URL,
    catalogUrl: CATALOG_URL,
    editionHint: '2025 NCCD web edition (MA.01.ST.BOOK_WEB) — current applicable edition pending MoE node/79818 live confirmation',
    academicYearHint: '2025/2026 (pending MoE live verification)',
    authority: 'المركز الوطني لتطوير المناهج (NCCD) / وزارة التربية والتعليم الأردنية',
    rightsStatus:
      'All rights reserved by NCCD / Jordan MoE. Local extraction for curriculum alignment only; do not republish protected textbook prose.',
    downloadStatus,
    blockers,
    searchOrderResults,
    localPdfPath,
    rejectedArtifacts: rejectedArtifacts.map((p) => path.relative(ROOT, p)),
    identityEvidence: {
      catalogContextAr: 'الرياضيات الصف الأول - الفصل الدراسي الأول كتاب الطالب',
      filename: 'MA.01.ST.BOOK_WEB.pdf',
      catalogArchiveEvidence:
        'https://web.archive.org/web/20260517203233/https://nccd.gov.jo/ar/pages/TextBooksGrade/68',
      semester2SiblingNotUsed:
        'https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/2/MT01/SE/MA.01.ST2.pdf',
    },
    fileVerification: localPdfPath
      ? {
          fileSizeBytes: fs.statSync(localPdfPath).size,
          sha256: sha256(localPdfPath),
          completePdf: pdfLooksComplete(localPdfPath),
        }
      : {
          fileSizeBytes: 0,
          sha256: '',
          completePdf: false,
          expectedApproxBytesFromArchiveHeader: 114618482,
        },
    retrievedAt: new Date().toISOString(),
    step2ExtractionAllowed: Boolean(localPdfPath),
    curriculumGenerationAllowed: false,
  };

  fs.writeFileSync(path.join(BOOK_DIR, 'acquisition.json'), `${JSON.stringify(acquisition, null, 2)}\n`);

  // Placeholder structure for admin UI when blocked
  if (!localPdfPath) {
    const blockedStructure = {
      book: {
        officialTitle: OFFICIAL_TITLE_AR,
        country: 'Jordan',
        curriculum: 'Jordanian National Curriculum',
        grade: '1',
        semester: '1',
        subject: 'Mathematics',
        bookType: 'Student Book',
        edition: acquisition.editionHint,
        academicYear: acquisition.academicYearHint,
        authority: acquisition.authority,
        officialSourceUrl: OFFICIAL_PDF_URL,
        rightsStatus: acquisition.rightsStatus,
        fileSizeBytes: 0,
        pageCount: 0,
        sha256: '',
        language: 'ar',
        catalogUrl: CATALOG_URL,
        verificationStatus: downloadStatus === 'incomplete_capture_rejected'
          ? 'incomplete_capture_rejected'
          : 'download_blocked',
      },
      parts: [],
      specialSections: [],
      extractionWarnings: blockers,
      pagesNeedingReview: [],
      pageCoverage: {
        totalPdfPages: 0,
        extractedPages: 0,
        textPages: 0,
        ocrPages: 0,
        missingPages: [],
      },
      structureComparison: {
        tocSource: 'not available — official PDF not acquired',
        result: 'BLOCKED',
        notes: blockers,
      },
      processing: {
        status: 'blocked_acquisition',
        lastCompletedPage: 0,
        resumable: true,
        processingTimeMs: 0,
      },
    };
    fs.writeFileSync(
      path.join(BOOK_DIR, 'extraction/structure.json'),
      `${JSON.stringify(blockedStructure, null, 2)}\n`,
    );
  }

  console.log(JSON.stringify({
    downloadStatus,
    officialSourceUrl: OFFICIAL_PDF_URL,
    blockers,
    localPdfPath,
  }, null, 2));

  if (!localPdfPath) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
