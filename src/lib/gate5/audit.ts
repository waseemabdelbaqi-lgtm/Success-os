import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { JORDAN_COUNTRY_ID } from "@/src/lib/global-curriculum/profiles/jordan";
import type { GapCode, GapRecord, Gate5Readiness } from "@/src/lib/gate5/types";
import { validateBookVersion } from "@/src/lib/curriculum-factory/validation/validate-book";
import { getFactoryQueueStats } from "@/src/lib/curriculum-factory/queue/factory-queue";
import { getReviewBacklog } from "@/src/lib/curriculum-factory/review/workbench";
import { scoreBookCompleteness } from "@/src/lib/curriculum-factory/completeness/score";

function mapBlockerToGap(blockerCode: string | null, bookType: string, status: string): GapCode {
  if (blockerCode === "subject_list_not_discovered") return "OFFICIAL_SOURCE_NOT_FOUND";
  if (blockerCode === "edition_unverified_nccd_unreachable") return "EDITION_UNCERTAIN";
  if (blockerCode === "rights_review_required" || status === "BLOCKED_BY_RIGHTS") return "RIGHTS_REVIEW_REQUIRED";
  if (status === "SUBJECT_REVIEW") return "SUBJECT_REVIEW_PENDING";
  if (status === "LANGUAGE_REVIEW") return "LANGUAGE_REVIEW_PENDING";
  if (status === "TECHNICAL_REVIEW") return "TECHNICAL_REVIEW_PENDING";
  if (status === "CORRECTIONS_REQUIRED") return "CONTENT_INCOMPLETE";
  if (status === "FAILED") return "IMPORT_FAILED";
  if (bookType !== "sos_companion" && status === "BLOCKED_BY_SOURCE") return "SOURCE_UNAVAILABLE";
  return "CONTENT_INCOMPLETE";
}

export function buildExpectedVsActualAudit(): {
  generatedAt: string;
  expected: number;
  rows: Array<Record<string, unknown>>;
  summary: Record<string, number>;
} {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  const cells = db
    .prepare(
      `SELECT c.*,
              f.id AS factory_job_id, f.status AS factory_status, f.blocker_code, f.blocker_detail,
              f.book_id AS factory_book_id, f.book_version_id
       FROM inventory_matrix_cells c
       LEFT JOIN factory_jobs f ON f.inventory_cell_id = c.id
       WHERE c.country_id=? AND c.deleted_at IS NULL
       ORDER BY c.grade_code, c.term_code, c.subject_title_ar, c.book_type`,
    )
    .all(JORDAN_COUNTRY_ID) as Array<Record<string, unknown>>;

  const summary: Record<string, number> = {
    expected: cells.length,
    exists: 0,
    sourceVerified: 0,
    rightsResolved: 0,
    structured: 0,
    contentComplete: 0,
    activitiesComplete: 0,
    answersComplete: 0,
    subjectReviewed: 0,
    languageReviewed: 0,
    technicallyReviewed: 0,
    published: 0,
    studentRouteWorking: 0,
    finalComplete: 0,
  };

  const rows: Array<Record<string, unknown>> = [];
  for (const c of cells) {
    const bookId = (c.factory_book_id || c.structured_book_id || null) as string | null;
    let versionId = (c.book_version_id as string) || null;
    let lessons = 0;
    let activities = 0;
    let answers = 0;
    let published = false;
    let subjectReviewed = false;
    let languageReviewed = false;
    let technicalReviewed = false;

    if (bookId) {
      summary.exists += 1;
      const ver = versionId
        ? { id: versionId }
        : (db.prepare(`SELECT id FROM book_versions WHERE book_id=? ORDER BY version_number DESC LIMIT 1`).get(bookId) as
            | { id: string }
            | undefined);
      if (ver?.id) {
        versionId = ver.id;
        lessons = (
          db
            .prepare(
              `SELECT COUNT(*) AS n FROM lessons l JOIN units u ON u.id=l.unit_id WHERE u.book_version_id=? AND l.deleted_at IS NULL`,
            )
            .get(ver.id) as { n: number }
        ).n;
        activities = (
          db
            .prepare(
              `SELECT COUNT(*) AS n FROM activities a JOIN lessons l ON l.id=a.lesson_id JOIN units u ON u.id=l.unit_id WHERE u.book_version_id=?`,
            )
            .get(ver.id) as { n: number }
        ).n;
        answers = (
          db
            .prepare(
              `SELECT COUNT(*) AS n FROM answers ans JOIN questions q ON q.id=ans.question_id
               JOIN activities a ON a.id=q.activity_id JOIN lessons l ON l.id=a.lesson_id
               JOIN units u ON u.id=l.unit_id WHERE u.book_version_id=?`,
            )
            .get(ver.id) as { n: number }
        ).n;
        published =
          (
            db.prepare(`SELECT COUNT(*) AS n FROM published_versions WHERE book_version_id=?`).get(ver.id) as {
              n: number;
            }
          ).n > 0;
        subjectReviewed =
          (
            db
              .prepare(
                `SELECT COUNT(*) AS n FROM review_tasks WHERE book_version_id=? AND review_type='SUBJECT_REVIEW' AND status='approved'`,
              )
              .get(ver.id) as { n: number }
          ).n > 0;
        languageReviewed =
          (
            db
              .prepare(
                `SELECT COUNT(*) AS n FROM review_tasks WHERE book_version_id=? AND review_type='LANGUAGE_REVIEW' AND status='approved'`,
              )
              .get(ver.id) as { n: number }
          ).n > 0;
        technicalReviewed =
          (
            db
              .prepare(
                `SELECT COUNT(*) AS n FROM review_tasks WHERE book_version_id=? AND review_type='TECHNICAL_REVIEW' AND status='approved'`,
              )
              .get(ver.id) as { n: number }
          ).n > 0;
      }
    }

    const sourceVerified = String(c.subject_list_status) === "verified" || String(c.discovery_source || "").includes("nccd");
    const rightsResolved = !["rights_review_required", "restricted", "unavailable"].includes(String(c.rights_status));
    const structured = lessons > 0;
    const contentComplete = structured && lessons > 0 && activities > 0;
    const activitiesComplete = activities > 0;
    const answersComplete = answers > 0 && answers >= activities;
    const editionOk = String(c.edition_label) !== "NEEDS VERIFICATION";
    const finalComplete =
      published &&
      subjectReviewed &&
      languageReviewed &&
      technicalReviewed &&
      editionOk &&
      String(c.completeness_claim) === "complete";

    if (sourceVerified) summary.sourceVerified += 1;
    if (rightsResolved) summary.rightsResolved += 1;
    if (structured) summary.structured += 1;
    if (contentComplete) summary.contentComplete += 1;
    if (activitiesComplete) summary.activitiesComplete += 1;
    if (answersComplete) summary.answersComplete += 1;
    if (subjectReviewed) summary.subjectReviewed += 1;
    if (languageReviewed) summary.languageReviewed += 1;
    if (technicalReviewed) summary.technicallyReviewed += 1;
    if (published) summary.published += 1;
    if (bookId && published) summary.studentRouteWorking += 1; // published engine books have reader route pattern
    if (finalComplete) summary.finalComplete += 1;

    rows.push({
      inventoryCellId: c.id,
      stage: c.stage_code,
      grade: c.grade_code,
      semester: c.term_code,
      pathway: c.pathway_code,
      subject: c.subject_title_ar,
      bookType: c.book_type,
      edition: c.edition_label,
      factoryStatus: c.factory_status,
      exists: Boolean(bookId),
      sourceVerified,
      rightsResolved,
      structured,
      contentComplete,
      activitiesComplete,
      answersComplete,
      subjectReviewed,
      languageReviewed,
      technicallyReviewed: technicalReviewed,
      published,
      studentRouteWorking: Boolean(bookId && published),
      finalStatus: finalComplete
        ? "COMPLETE"
        : c.factory_status || c.matrix_status || "UNKNOWN",
      lessons,
      activities,
      answers,
      bookId,
      versionId,
      auditedAt: t,
    });
  }

  // Persist snapshot
  db.prepare(
    `INSERT INTO jordan_audit_snapshots (id, snapshot_json, verdict, next_country_ready, created_at)
     VALUES (?,?,?,?,?)`,
  ).run(
    uuid(),
    JSON.stringify({ type: "gate5_expected_vs_actual", summary, sample: rows.slice(0, 20) }),
    "GATE5_AUDIT",
    0,
    t,
  );

  return { generatedAt: t, expected: cells.length, rows, summary };
}

export function classifyGaps(auditRows?: Array<Record<string, unknown>>): {
  gaps: GapRecord[];
  byCode: Record<string, number>;
} {
  applyMigrations();
  const db = getBookEngineDb();
  const rows =
    auditRows ||
    (buildExpectedVsActualAudit().rows as Array<Record<string, unknown>>);

  const gaps: GapRecord[] = [];
  for (const r of rows) {
    if (r.finalStatus === "COMPLETE") continue;

    let gapCode: GapCode = "CONTENT_INCOMPLETE";
    let issue = "Item not fully complete";
    let action = "Continue production and review";
    let role = "content_writer";
    let priority: GapRecord["priority"] = "P2";
    let continueWork = true;

    const factory = db
      .prepare(`SELECT * FROM factory_jobs WHERE inventory_cell_id=? LIMIT 1`)
      .get(r.inventoryCellId) as Record<string, unknown> | undefined;

    if (factory?.blocker_code || String(r.factoryStatus || "").startsWith("BLOCKED")) {
      gapCode = mapBlockerToGap(
        factory?.blocker_code ? String(factory.blocker_code) : null,
        String(r.bookType),
        String(r.factoryStatus || ""),
      );
      issue = String(factory?.blocker_detail || factory?.blocker_code || "Blocked");
      if (gapCode === "EDITION_UNCERTAIN") {
        action = "Verify official edition/year on NCCD/MoE and update inventory";
        role = "source_verifier";
        priority = "P0";
      } else if (gapCode === "OFFICIAL_SOURCE_NOT_FOUND") {
        action = "Discover official vocational subject list from NCCD without inventing subjects";
        role = "curriculum_researcher";
        priority = "P0";
      } else if (gapCode === "RIGHTS_REVIEW_REQUIRED") {
        action = "Human rights classification decision";
        role = "rights_reviewer";
        priority = "P0";
      }
    } else if (!r.published && r.factoryStatus === "SUBJECT_REVIEW") {
      gapCode = "SUBJECT_REVIEW_PENDING";
      issue = "Companion draft awaiting human subject review before complete publication";
      action = "Subject expert review of explanations, activities, and answers";
      role = "subject_reviewer";
      priority = "P1";
    } else if (r.published && String(r.edition) === "NEEDS VERIFICATION") {
      gapCode = "EDITION_UNCERTAIN";
      issue =
        "Companion published for student use, but official edition/year alignment remains NEEDS VERIFICATION — not CONTENT COMPLETE";
      action = "Verify NCCD edition metadata; keep companion claim honest until aligned and specialist-approved";
      role = "source_verifier";
      priority = "P1";
    } else if (r.published && !(r.subjectReviewed && r.languageReviewed && r.technicallyReviewed)) {
      gapCode = "SUBJECT_REVIEW_PENDING";
      issue = "Published companion still missing full review evidence for COMPLETE status";
      action = "Complete subject/language/technical approvals; keep completeness_claim honest";
      role = "final_approver";
      priority = "P1";
    } else if (!r.exists && String(r.bookType) === "sos_companion") {
      gapCode = "STRUCTURE_INCOMPLETE";
      issue = "Companion engine book not linked";
      action = "Re-run factory worker for this inventory cell";
      role = "technical_editor";
      priority = "P1";
    } else if (String(r.edition) === "NEEDS VERIFICATION" && String(r.bookType) !== "sos_companion") {
      gapCode = "EDITION_UNCERTAIN";
      issue = "Official edition/academic year NEEDS VERIFICATION";
      action = "Close Gate 1 edition verification";
      role = "source_verifier";
      priority = "P0";
      continueWork = true;
    }

    gaps.push({
      country: "Jordan",
      curriculum: "national",
      stage: String(r.stage || ""),
      grade: String(r.grade || ""),
      semester: String(r.semester || ""),
      pathway: String(r.pathway || ""),
      subject: String(r.subject || ""),
      bookType: String(r.bookType || ""),
      edition: String(r.edition || ""),
      gapCode,
      issue,
      evidence: `factoryStatus=${r.factoryStatus}; exists=${r.exists}; published=${r.published}; lessons=${r.lessons}`,
      requiredAction: action,
      responsibleRole: role,
      priority,
      otherWorkMayContinue: continueWork,
      inventoryCellId: String(r.inventoryCellId || ""),
      factoryJobId: factory?.id ? String(factory.id) : undefined,
      bookId: r.bookId ? String(r.bookId) : undefined,
    });
  }

  const byCode: Record<string, number> = {};
  for (const g of gaps) byCode[g.gapCode] = (byCode[g.gapCode] || 0) + 1;
  return { gaps, byCode };
}

export function runContentQualityScan(): {
  placeholderHits: number;
  shortLessons: number;
  questionsWithoutAnswers: number;
  validationFailures: number;
  samples: string[];
} {
  applyMigrations();
  const db = getBookEngineDb();
  const placeholderHits = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM content_blocks
         WHERE content_json LIKE '%TODO%' OR content_json LIKE '%PLACEHOLDER%'
            OR content_json LIKE '%lorem ipsum%' OR content_json LIKE '%Coming soon%'
            OR content_json LIKE '%Example content%'`,
      )
      .get() as { n: number }
  ).n;

  const shortLessons = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM lessons l
         WHERE (SELECT COUNT(*) FROM content_blocks b WHERE b.lesson_id=l.id) < 2`,
      )
      .get() as { n: number }
  ).n;

  const questionsWithoutAnswers = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM questions q
         WHERE NOT EXISTS (SELECT 1 FROM answers a WHERE a.question_id=q.id)`,
      )
      .get() as { n: number }
  ).n;

  const validationFailures = (
    db.prepare(`SELECT COUNT(*) AS n FROM validation_reports WHERE passed=0`).get() as { n: number }
  ).n;

  const samples = (
    db
      .prepare(
        `SELECT id FROM content_blocks
         WHERE content_json LIKE '%TODO%' OR content_json LIKE '%PLACEHOLDER%' LIMIT 10`,
      )
      .all() as Array<{ id: string }>
  ).map((r) => r.id);

  return { placeholderHits, shortLessons, questionsWithoutAnswers, validationFailures, samples };
}

export function computeGate5Readiness(input: {
  auditSummary: Record<string, number>;
  gapsByCode: Record<string, number>;
  queue: Record<string, number>;
  quality: ReturnType<typeof runContentQualityScan>;
  operationalTestsPassed: boolean;
  globalReusePassed: boolean;
  securityCriticalFailures: number;
  accessibilityCriticalFailures: number;
  backupRestorePassed: boolean;
}): Gate5Readiness {
  const hasExternalBlockers =
    (input.gapsByCode.EDITION_UNCERTAIN || 0) > 0 ||
    (input.gapsByCode.OFFICIAL_SOURCE_NOT_FOUND || 0) > 0 ||
    (input.gapsByCode.RIGHTS_REVIEW_REQUIRED || 0) > 0 ||
    (input.queue.BLOCKED_BY_SOURCE || 0) > 0 ||
    (input.queue.BLOCKED_BY_RIGHTS || 0) > 0;

  const jordanContentComplete = false; // impossible while edition/official blockers remain and finalComplete < expected

  const jordanAuditedWithBlockers =
    hasExternalBlockers &&
    input.quality.placeholderHits === 0 &&
    input.quality.questionsWithoutAnswers === 0;

  const jordanOperationallyComplete =
    input.operationalTestsPassed &&
    input.securityCriticalFailures === 0 &&
    input.accessibilityCriticalFailures === 0;

  const globalEngineReady = input.globalReusePassed && input.backupRestorePassed;

  // Section 24 READY FOR NEXT COUNTRY — all required conditions; currently blocked.
  const ready =
    jordanContentComplete &&
    jordanOperationallyComplete &&
    globalEngineReady &&
    input.securityCriticalFailures === 0 &&
    input.accessibilityCriticalFailures === 0 &&
    (input.queue.SUBJECT_REVIEW || 0) === 0;

  return {
    jordanContentComplete,
    jordanAuditedWithBlockers,
    jordanOperationallyComplete,
    globalEngineReady,
    readyForNextCountry: ready,
    verdict: ready ? "READY_FOR_NEXT_COUNTRY" : "NOT_READY_FOR_THE_NEXT_COUNTRY",
  };
}

export function persistGate5Snapshot(payload: unknown, verdict: string, nextReady: boolean): string {
  applyMigrations();
  const id = uuid();
  getBookEngineDb()
    .prepare(
      `INSERT INTO jordan_audit_snapshots (id, snapshot_json, verdict, next_country_ready, created_at)
       VALUES (?,?,?,?,?)`,
    )
    .run(id, JSON.stringify(payload), verdict, nextReady ? 1 : 0, nowIso());
  return id;
}

export function scoreSampleBooks(limit = 20): Array<Record<string, unknown>> {
  applyMigrations();
  const books = getBookEngineDb()
    .prepare(`SELECT id, title_ar, completeness_claim FROM books WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT ?`)
    .all(limit) as Array<{ id: string; title_ar: string; completeness_claim: string }>;
  return books.map((b) => ({ bookId: b.id, title: b.title_ar, claim: b.completeness_claim, ...scoreBookCompleteness(b.id) }));
}

export function validatePublishedBooks(): {
  checked: number;
  failed: Array<{ bookVersionId: string; critical: string[] }>;
} {
  applyMigrations();
  const rows = getBookEngineDb()
    .prepare(`SELECT book_version_id FROM published_versions`)
    .all() as Array<{ book_version_id: string }>;
  const failed: Array<{ bookVersionId: string; critical: string[] }> = [];
  for (const r of rows) {
    const v = validateBookVersion(r.book_version_id);
    if (!v.passed) failed.push({ bookVersionId: r.book_version_id, critical: v.critical.map((c) => c.code) });
  }
  return { checked: rows.length, failed };
}

export function getLiveTotals(): Record<string, number> {
  applyMigrations();
  const db = getBookEngineDb();
  const q = getFactoryQueueStats();
  const backlog = getReviewBacklog();
  return {
    stages: (
      db
        .prepare(`SELECT COUNT(DISTINCT stage_code) AS n FROM inventory_matrix_cells WHERE country_id=?`)
        .get(JORDAN_COUNTRY_ID) as { n: number }
    ).n,
    grades: (
      db
        .prepare(`SELECT COUNT(DISTINCT grade_code) AS n FROM inventory_matrix_cells WHERE country_id=?`)
        .get(JORDAN_COUNTRY_ID) as { n: number }
    ).n,
    semesters: (
      db
        .prepare(`SELECT COUNT(DISTINCT term_code) AS n FROM inventory_matrix_cells WHERE country_id=?`)
        .get(JORDAN_COUNTRY_ID) as { n: number }
    ).n,
    pathways: (
      db
        .prepare(`SELECT COUNT(DISTINCT pathway_code) AS n FROM inventory_matrix_cells WHERE country_id=?`)
        .get(JORDAN_COUNTRY_ID) as { n: number }
    ).n,
    subjects: (
      db
        .prepare(`SELECT COUNT(DISTINCT subject_title_ar) AS n FROM inventory_matrix_cells WHERE country_id=?`)
        .get(JORDAN_COUNTRY_ID) as { n: number }
    ).n,
    expectedBooks: (
      db.prepare(`SELECT COUNT(*) AS n FROM inventory_matrix_cells WHERE country_id=?`).get(JORDAN_COUNTRY_ID) as {
        n: number;
      }
    ).n,
    engineBooks: (db.prepare(`SELECT COUNT(*) AS n FROM books WHERE deleted_at IS NULL`).get() as { n: number }).n,
    publishedBooks: (db.prepare(`SELECT COUNT(*) AS n FROM published_versions`).get() as { n: number }).n,
    completeClaimBooks: (
      db.prepare(`SELECT COUNT(*) AS n FROM books WHERE completeness_claim='complete'`).get() as { n: number }
    ).n,
    units: (db.prepare(`SELECT COUNT(*) AS n FROM units WHERE deleted_at IS NULL`).get() as { n: number }).n,
    lessons: (db.prepare(`SELECT COUNT(*) AS n FROM lessons WHERE deleted_at IS NULL`).get() as { n: number }).n,
    activities: (db.prepare(`SELECT COUNT(*) AS n FROM activities WHERE deleted_at IS NULL`).get() as { n: number }).n,
    questions: (db.prepare(`SELECT COUNT(*) AS n FROM questions`).get() as { n: number }).n,
    answers: (db.prepare(`SELECT COUNT(*) AS n FROM answers`).get() as { n: number }).n,
    blockedJobs: (q.BLOCKED_BY_SOURCE || 0) + (q.BLOCKED_BY_RIGHTS || 0),
    subjectReviewJobs: q.SUBJECT_REVIEW || 0,
    publishedJobs: q.PUBLISHED || 0,
    openSubjectReviews: backlog.SUBJECT_REVIEW || 0,
    openLanguageReviews: backlog.LANGUAGE_REVIEW || 0,
    openTechnicalReviews: backlog.TECHNICAL_REVIEW || 0,
  };
}
