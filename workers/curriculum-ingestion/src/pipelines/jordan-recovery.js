/**
 * Jordan Content Recovery Phase
 * - Separate Jordan from OpenStax
 * - Clean catalog / unique books
 * - Diagnose 10 official URLs
 * - Build Evidence Pack (no lesson until map approved)
 */
import fs from "node:fs";
import path from "node:path";
import {
  getDb,
  upsertCountry,
  upsertSource,
  upsertBook,
  updateBook,
  insertJob,
  updateJob,
  nowIso,
  DATA_ROOT,
  getMetrics,
  listBooks,
} from "../db/store.js";
import { stableBookId } from "../adapters/base.js";
import { RIGHTS, BOOK_STATUS } from "../rights/policy.js";
import {
  VERIFIED_SUBJECT_LISTS,
  GRADE_CATALOG_PAGES,
  BOOK_TYPES,
  SEMESTERS,
  KNOWN_OFFICIAL_PDFS,
  JORDAN_OFFICIAL_SOURCE_REGISTRY,
  isNccdHost,
} from "../jordan/official-source-registry.js";
import { diagnoseUrlBatch, summarizeBlockReasons } from "../jordan/diagnose-url.js";
import { buildEvidencePackSkeleton, jordanContentPass } from "../jordan/evidence-pack-g1-math-s1.js";
import { newId } from "../storage/object-store.js";
import { productionStorageStatus } from "../storage/s3-store.js";
import { productionDatabaseStatus } from "../db/pg-store.js";

const PROBE_URLS = [
  "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf",
  "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/2/MT01/SE/MA.01.ST2.pdf",
  "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
  "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/69",
  "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/72",
  "https://www.nccd.gov.jo/Ar/Pages/textbooks",
  "https://www.nccd.gov.jo/AR/List/__%D8%A7%D9%84%D8%A3%D8%B7%D8%B1____",
  "https://nccd.gov.jo/Ar/Pages/Publications/?MaterialStudy=59",
  "https://moe.gov.jo/",
  "https://moe.gov.jo/ar/node/79818",
];

function ensureRecoveryTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS evidence_packs (
      id TEXT PRIMARY KEY,
      target_json TEXT NOT NULL,
      status TEXT NOT NULL,
      content_json TEXT NOT NULL,
      reviews_json TEXT NOT NULL DEFAULT '{}',
      approved_at TEXT,
      approved_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jordan_url_diagnostics (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      reason_type TEXT,
      reason TEXT,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jordan_recovery_reports (
      id TEXT PRIMARY KEY,
      report_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function quarantineNonJordanSampleLessons() {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM sample_lessons`).all();
  let quarantined = 0;
  for (const row of rows) {
    let content = {};
    try {
      content = JSON.parse(row.content_json || "{}");
    } catch {
      content = {};
    }
    const book = db.prepare(`SELECT * FROM books WHERE id=?`).get(row.book_id);
    const isJordan =
      book?.country_code === "JO" ||
      content?.sourceReference?.country === "Jordan" ||
      content?.curriculum === "Jordanian National Curriculum";
    if (!isJordan) {
      db.prepare(`UPDATE sample_lessons SET status=?, updated_at=? WHERE id=?`).run(
        "QUARANTINED_NON_JORDAN",
        nowIso(),
        row.id,
      );
      quarantined += 1;
    }
  }
  return quarantined;
}

export function wipeProvisionalJordanBooks() {
  const db = getDb();
  // Remove OER from Jordan metrics path (keep OER rows under OER country only).
  const before = db.prepare(`SELECT COUNT(*) AS c FROM books WHERE country_code='JO'`).get().c;
  db.prepare(`DELETE FROM books WHERE country_code='JO'`).run();
  db.prepare(`DELETE FROM units WHERE book_id NOT IN (SELECT id FROM books)`).run();
  db.prepare(`DELETE FROM lessons WHERE book_id NOT IN (SELECT id FROM books)`).run();
  return { deletedJordanBooks: before };
}

export function rebuildCleanJordanCatalog() {
  upsertCountry("JO", "Jordan", "الأردن");
  upsertSource({
    id: "jo-nccd",
    country_code: "JO",
    adapter: "JordanNccdAdapter",
    name: "Jordan NCCD Textbooks",
    catalog_url: "https://www.nccd.gov.jo/Ar/Pages/textbooks",
    rights_default: RIGHTS.OFFICIAL_REFERENCE_ONLY,
    status: "SOURCE_ACCESS_BLOCKED",
    last_error: null,
    last_discovered_at: nowIso(),
  });

  const books = [];
  // Grade catalog pages for all grades (identity only when subjects unverified)
  for (const [code, grade, stage, url] of GRADE_CATALOG_PAGES) {
    const verified = VERIFIED_SUBJECT_LISTS[String(code)];
    if (!verified) {
      books.push({
        id: stableBookId(["JO", "NCCD", "GRADE_PAGE", code]),
        country_code: "JO",
        source_id: "jo-nccd",
        curriculum: "المنهاج الوطني الأردني",
        stage,
        grade,
        grade_code: String(code),
        semester: null,
        subject: null,
        book_type: "grade-catalog-page",
        title: `فهرس كتب ${grade} (NCCD)`,
        title_ar: `فهرس كتب ${grade} (NCCD)`,
        edition: null,
        academic_year: "2025/2026",
        official_url: null,
        catalog_url: url,
        rights_status: RIGHTS.UNKNOWN,
        status: BOOK_STATUS.DISCOVERED,
        language: "ar",
        last_error: null,
        metadata_json: JSON.stringify({
          kind: "grade-catalog-page",
          subjectListStatus: "PENDING_SUBJECT_REVIEW",
          confidence: "PARTIAL",
        }),
      });
      continue;
    }

    for (const subject of verified.subjects) {
      for (const semester of SEMESTERS) {
        for (const bookType of BOOK_TYPES) {
          const hintKey = `${code}|${subject}|${semester}|${bookType}`;
          const known = KNOWN_OFFICIAL_PDFS[hintKey] || null;
          const officialUrl = known?.url || null;
          const rights = RIGHTS.OFFICIAL_REFERENCE_ONLY; // official textbooks: reserved; not auto RIGHTS_RESTRICTED status
          books.push({
            id: stableBookId(["JO", "NCCD", code, subject, semester, bookType]),
            country_code: "JO",
            source_id: "jo-nccd",
            curriculum: "المنهاج الوطني الأردني",
            stage,
            grade,
            grade_code: String(code),
            semester,
            subject,
            book_type: bookType,
            title: `${subject} — ${grade} — ${semester} — ${bookType}`,
            title_ar: `${subject} — ${grade} — ${semester} — ${bookType}`,
            edition: known?.editionHint || "edition-pending-live-confirm",
            academic_year: known?.academicYearHint || "2025/2026",
            official_url: officialUrl,
            catalog_url: verified.catalogUrl,
            rights_status: rights,
            status: BOOK_STATUS.DISCOVERED,
            language: subject.includes("الإنجليزية") ? "en" : "ar",
            last_error: null,
            metadata_json: JSON.stringify({
              kind: "book-slot",
              subjectListConfidence: verified.subjectListConfidence,
              urlConfidence: known?.confidence || "UNVERIFIED",
              nccdHostOk: officialUrl ? isNccdHost(officialUrl) : null,
              rightsEvidence:
                "Official NCCD/MoE textbook slot — copyrighted official material; metadata/reference only until lawful access.",
            }),
          });
        }
      }
    }
  }

  // Deduplicate by id
  const map = new Map(books.map((b) => [b.id, b]));
  const unique = [...map.values()];
  for (const b of unique) upsertBook(b);

  // Unique book slots exclude grade-catalog-page placeholders
  const uniqueBookSlots = unique.filter((b) => b.book_type !== "grade-catalog-page");
  return {
    totalRows: unique.length,
    uniqueJordanBooks: uniqueBookSlots.length,
    gradeCatalogPages: unique.length - uniqueBookSlots.length,
    duplicatesRemovedFromPreviousInflatedMatrix: null, // filled by caller
  };
}

export async function runJordanUrlDiagnostics() {
  const diagnostics = await diagnoseUrlBatch(PROBE_URLS, { timeoutMs: 12000 });
  const db = getDb();
  ensureRecoveryTables(db);
  for (const d of diagnostics) {
    db.prepare(
      `INSERT INTO jordan_url_diagnostics(id,url,reason_type,reason,result_json,created_at)
       VALUES(?,?,?,?,?,?)`,
    ).run(newId("diag"), d.url, d.reasonType, d.reason, JSON.stringify(d), nowIso());
  }
  // Update book access status for known PDF URLs independently
  for (const d of diagnostics) {
    if (!d.url.endsWith(".pdf")) continue;
    const book = listBooks({ country_code: "JO" }).find((b) => b.official_url === d.url);
    if (!book) continue;
    if (d.reasonType === "OK") {
      updateBook(book.id, { status: BOOK_STATUS.DISCOVERED, last_error: null });
    } else {
      updateBook(book.id, {
        status: BOOK_STATUS.SOURCE_ACCESS_BLOCKED,
        last_error: `${d.reasonType}:${d.reason}`,
      });
    }
  }
  return {
    tested: diagnostics.length,
    diagnostics,
    blockReasonsByType: summarizeBlockReasons(diagnostics),
    filesVerified: diagnostics.filter((d) => d.url.endsWith(".pdf") && d.reasonType === "OK").length,
  };
}

export function saveEvidencePack(pack) {
  const db = getDb();
  ensureRecoveryTables(db);
  const ts = nowIso();
  db.prepare(
    `INSERT INTO evidence_packs(id,target_json,status,content_json,reviews_json,created_at,updated_at)
     VALUES(?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       content_json=excluded.content_json,
       status=excluded.status,
       updated_at=excluded.updated_at`,
  ).run(
    pack.id,
    JSON.stringify(pack.target),
    pack.status,
    JSON.stringify(pack),
    "{}",
    ts,
    ts,
  );
  const outDir = path.join(DATA_ROOT, "evidence-packs");
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${pack.id}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(pack, null, 2)}\n`);
  return { id: pack.id, filePath, status: pack.status };
}

export function getEvidencePack(id = "jo-g1-math-s1-evidence-v1") {
  const db = getDb();
  ensureRecoveryTables(db);
  const row = db.prepare(`SELECT * FROM evidence_packs WHERE id=?`).get(id);
  if (!row) return null;
  return {
    ...JSON.parse(row.content_json),
    status: row.status,
    reviews: JSON.parse(row.reviews_json || "{}"),
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
  };
}

export function saveCurriculumMapReviews(id, reviews) {
  const db = getDb();
  ensureRecoveryTables(db);
  const ts = nowIso();
  db.prepare(`UPDATE evidence_packs SET reviews_json=?, updated_at=? WHERE id=?`).run(
    JSON.stringify(reviews),
    ts,
    id,
  );
  return getEvidencePack(id);
}

function evaluateMapApproval(pack, reviews = {}) {
  const units = pack.proposedMapForReview || [];
  for (const u of units) {
    if (reviews[u.id] !== "accepted") return { ok: false, reason: `UNIT_NOT_ACCEPTED:${u.id}` };
    for (const o of u.outcomes || []) {
      if (reviews[o.id] !== "accepted") return { ok: false, reason: `OUTCOME_NOT_ACCEPTED:${o.id}` };
    }
    for (const l of u.lessons || []) {
      if (reviews[l.id] === "rejected") return { ok: false, reason: `LESSON_REJECTED:${l.id}` };
    }
  }
  if (!reviews.__acceptGaps) return { ok: false, reason: "GAPS_NOT_ACKNOWLEDGED" };
  return { ok: true, reason: null };
}

export function approveCurriculumMap(id, { approvedBy = "admin" } = {}) {
  const pack = getEvidencePack(id);
  if (!pack) throw new Error("EVIDENCE_PACK_NOT_FOUND");
  const gate = evaluateMapApproval(pack, pack.reviews || {});
  if (!gate.ok) {
    return { ok: false, reason: gate.reason, status: pack.status };
  }
  const db = getDb();
  const ts = nowIso();
  const content = { ...pack, status: "APPROVED", approvedAt: ts, approvedBy };
  db.prepare(
    `UPDATE evidence_packs SET status=?, content_json=?, approved_at=?, approved_by=?, updated_at=? WHERE id=?`,
  ).run("APPROVED", JSON.stringify(content), ts, approvedBy, ts, id);
  return { ok: true, status: "APPROVED", reason: null };
}

export function getJordanSeparatedMetrics() {
  const db = getDb();
  ensureRecoveryTables(db);
  const count = (sql, params = []) => db.prepare(sql).get(...params)?.c || 0;
  const pack = getEvidencePack();
  const jordanSample = db
    .prepare(
      `SELECT s.* FROM sample_lessons s
       JOIN books b ON b.id = s.book_id
       WHERE b.country_code='JO' AND s.status NOT LIKE 'QUARANTINED%'
       ORDER BY s.updated_at DESC LIMIT 1`,
    )
    .get();
  let sampleLessonStatus = "BLOCKED_PENDING_CURRICULUM_MAP_APPROVAL";
  if (jordanSample?.status) sampleLessonStatus = jordanSample.status;
  else if (pack?.status === "APPROVED") sampleLessonStatus = "MAP_APPROVED_LESSON_NOT_GENERATED";

  const verifiedJordanSources = (pack?.officialSources || []).filter(
    (s) => s.confidence === "VERIFIED",
  ).length;

  return {
    infrastructureStatus: "PASS",
    jordanCurriculumStatus: "FAIL",
    globalProductionStatus: "NOT_READY",
    uniqueJordanBooks: count(
      `SELECT COUNT(*) AS c FROM books WHERE country_code='JO' AND book_type != 'grade-catalog-page'`,
    ),
    jordanGradeCatalogPages: count(
      `SELECT COUNT(*) AS c FROM books WHERE country_code='JO' AND book_type='grade-catalog-page'`,
    ),
    jordanBooksDiscovered: count(`SELECT COUNT(*) AS c FROM books WHERE country_code='JO'`),
    // CRITICAL: OpenStax must never count as Jordan downloadable
    jordanDownloadableBooks: count(
      `SELECT COUNT(*) AS c FROM books
       WHERE country_code='JO'
         AND official_url IS NOT NULL AND official_url != ''
         AND status IN ('VERIFIED','DOWNLOADING','QUEUED')`,
    ),
    openStaxDownloadableBooks: count(
      `SELECT COUNT(*) AS c FROM books WHERE country_code='OER' AND rights_status='OPEN_LICENSE' AND official_url IS NOT NULL`,
    ),
    verifiedJordanBooks: count(
      `SELECT COUNT(*) AS c FROM books WHERE country_code='JO' AND status IN ('VERIFIED','EXTRACTING','STRUCTURED','AI_DRAFT','REVIEW_REQUIRED','APPROVED','PUBLISHED')`,
    ),
    processedJordanBooks: count(
      `SELECT COUNT(*) AS c FROM books WHERE country_code='JO' AND status IN ('STRUCTURED','AI_DRAFT','REVIEW_REQUIRED','APPROVED','PUBLISHED')`,
    ),
    blockedJordanBooks: count(
      `SELECT COUNT(*) AS c FROM books WHERE country_code='JO' AND status='SOURCE_ACCESS_BLOCKED'`,
    ),
    officialReferenceOnlyBooks: count(
      `SELECT COUNT(*) AS c FROM books WHERE country_code='JO' AND rights_status='OFFICIAL_REFERENCE_ONLY'`,
    ),
    unknownRightsBooks: count(
      `SELECT COUNT(*) AS c FROM books WHERE country_code='JO' AND rights_status='UNKNOWN'`,
    ),
    verifiedJordanSources,
    officialJordanUnits: pack?.counts?.verifiedUnits || 0,
    officialJordanLessons: pack?.counts?.verifiedLessons || 0,
    verifiedLearningOutcomes: pack?.counts?.verifiedLearningOutcomes || 0,
    proposedUnits: pack?.counts?.proposedUnits || 0,
    curriculumMapStatus: pack?.status || "MISSING",
    sampleLessonStatus,
    sampleLessonJordanTraceable: Boolean(jordanSample),
    evidencePackId: pack?.id || null,
    mode: pack?.mode || "LEGAL_ORIGINAL_CONTENT_MODE",
    productionDatabase: productionDatabaseStatus(),
    productionStorage: productionStorageStatus(),
    legacyMetrics: getMetrics(),
  };
}

export async function runJordanContentRecovery() {
  const jobId = newId("job");
  const db = getDb();
  ensureRecoveryTables(db);
  insertJob({
    id: jobId,
    type: "jordan-content-recovery",
    country_code: "JO",
    status: "RUNNING",
    started_at: nowIso(),
  });

  try {
    const before = db.prepare(`SELECT COUNT(*) AS c FROM books WHERE country_code='JO'`).get().c;
    quarantineNonJordanSampleLessons();
    wipeProvisionalJordanBooks();
    const catalog = rebuildCleanJordanCatalog();
    catalog.duplicatesRemovedFromPreviousInflatedMatrix = Math.max(0, before - catalog.totalRows);

    const urlReport = await runJordanUrlDiagnostics();
    const diagnosticsByUrl = Object.fromEntries(urlReport.diagnostics.map((d) => [d.url, d]));
    const pack = buildEvidencePackSkeleton({ diagnosticsByUrl });
    const saved = saveEvidencePack(pack);

    const metrics = getJordanSeparatedMetrics();
    const report = {
      jobId,
      mode: "LEGAL_ORIGINAL_CONTENT_MODE",
      infrastructureStatus: "PASS",
      jordanCurriculumStatus: "FAIL",
      globalProductionStatus: "NOT_READY",
      uniqueJordanBooks: metrics.uniqueJordanBooks,
      duplicatesRemoved: catalog.duplicatesRemovedFromPreviousInflatedMatrix,
      jordanUrlsTested: urlReport.tested,
      jordanFilesVerified: urlReport.filesVerified,
      blockReasonsByType: urlReport.blockReasonsByType,
      officialEvidenceSources: pack.officialSources.length,
      verifiedLearningOutcomes: pack.counts.verifiedLearningOutcomes,
      verifiedUnits: pack.counts.verifiedUnits,
      verifiedLessons: pack.counts.verifiedLessons,
      evidencePackId: saved.id,
      curriculumMapStatus: pack.status,
      sampleLessonStatus: metrics.sampleLessonStatus,
      sampleLessonSourceTrace: metrics.sampleLessonJordanTraceable
        ? "JORDAN_TRACEABLE"
        : "NONE_JORDAN_LESSON_PENDING_MAP_APPROVAL",
      productionDatabaseStatus: metrics.productionDatabase,
      productionStorageStatus: metrics.productionStorage,
      openStaxExcludedFromJordan: true,
      jordanContentPass: jordanContentPass({
        verifiedJordanSources: metrics.verifiedJordanSources,
        officialJordanUnits: metrics.officialJordanUnits,
        officialJordanLessons: metrics.officialJordanLessons,
        sampleLessonJordanTraceable: metrics.sampleLessonJordanTraceable,
        curriculumMapStatus: metrics.curriculumMapStatus,
        sampleLessonStatus: metrics.sampleLessonStatus,
      }),
      registrySourceCount: JORDAN_OFFICIAL_SOURCE_REGISTRY.length,
      catalog,
      metrics,
    };

    db.prepare(
      `INSERT INTO jordan_recovery_reports(id,report_json,created_at) VALUES(?,?,?)`,
    ).run(newId("report"), JSON.stringify(report), nowIso());

    const outPath = path.join(DATA_ROOT, "logs", "jordan-content-recovery.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

    updateJob(jobId, {
      status: "COMPLETED",
      progress: 1,
      finished_at: nowIso(),
      result_json: JSON.stringify({
        uniqueJordanBooks: report.uniqueJordanBooks,
        jordanFilesVerified: report.jordanFilesVerified,
        curriculumMapStatus: report.curriculumMapStatus,
        jordanContentPass: report.jordanContentPass,
      }),
    });
    return report;
  } catch (err) {
    updateJob(jobId, {
      status: "FAILED",
      error: String(err?.message || err),
      finished_at: nowIso(),
    });
    throw err;
  }
}
