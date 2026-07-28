import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { getReadinessChecks, setReadinessCheck } from "@/src/lib/global-curriculum/repository";
import { JORDAN_COUNTRY_ID } from "@/src/lib/global-curriculum/profiles/jordan";

export type JordanAuditReport = {
  generatedAt: string;
  verdict: "CONTENT_COMPLETE" | "OPERATIONALLY_COMPLETE" | "AUDITED_WITH_BLOCKERS" | "INCOMPLETE";
  nextCountryReady: boolean;
  totals: Record<string, number>;
  blockers: {
    missingSources: number;
    rightsBlockers: number;
    academicReviewBlockers: number;
    technicalBlockers: number;
    failedValidation: number;
    editionUnverifiedOfficial: number;
  };
  sampleBlockers: Array<Record<string, unknown>>;
  studentRoutes: string[];
  adminRoutes: string[];
  notes: string[];
};

function count(sql: string, params: unknown[] = []): number {
  const row = getBookEngineDb().prepare(sql).get(...params) as { n: number };
  return row?.n || 0;
}

export function runJordanFinalAudit(): JordanAuditReport {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();

  const totals = {
    verifiedStages: count(
      `SELECT COUNT(DISTINCT stage_code) AS n FROM inventory_matrix_cells WHERE country_id=? AND stage_code IS NOT NULL`,
      [JORDAN_COUNTRY_ID],
    ),
    verifiedGrades: count(
      `SELECT COUNT(DISTINCT grade_code) AS n FROM inventory_matrix_cells WHERE country_id=?`,
      [JORDAN_COUNTRY_ID],
    ),
    verifiedSemesters: count(
      `SELECT COUNT(DISTINCT term_code) AS n FROM inventory_matrix_cells WHERE country_id=?`,
      [JORDAN_COUNTRY_ID],
    ),
    verifiedPathways: count(
      `SELECT COUNT(DISTINCT pathway_code) AS n FROM inventory_matrix_cells WHERE country_id=? AND pathway_code != 'vocational'`,
      [JORDAN_COUNTRY_ID],
    ),
    verifiedSubjects: count(
      `SELECT COUNT(DISTINCT subject_title_ar) AS n FROM inventory_matrix_cells
       WHERE country_id=? AND subject_list_status='verified'`,
      [JORDAN_COUNTRY_ID],
    ),
    expectedBooks: count(`SELECT COUNT(*) AS n FROM inventory_matrix_cells WHERE country_id=?`, [JORDAN_COUNTRY_ID]),
    discoveredBooks: count(
      `SELECT COUNT(*) AS n FROM inventory_matrix_cells WHERE country_id=? AND matrix_status != 'NOT_DISCOVERED'`,
      [JORDAN_COUNTRY_ID],
    ),
    verifiedBooks: count(
      `SELECT COUNT(*) AS n FROM inventory_matrix_cells
       WHERE country_id=? AND subject_list_status='verified' AND book_type != 'sos_companion'`,
      [JORDAN_COUNTRY_ID],
    ),
    eligibleBooks: count(
      `SELECT COUNT(*) AS n FROM production_jobs WHERE job_type='gate3_book_production' AND status IN ('queued','done','running')`,
    ),
    structuredBooks: count(
      `SELECT COUNT(*) AS n FROM inventory_matrix_cells WHERE country_id=? AND matrix_status IN ('STRUCTURED','CONTENT_COMPLETE','PUBLISHED','COMPLETE')`,
      [JORDAN_COUNTRY_ID],
    ),
    reviewedBooks: count(
      `SELECT COUNT(DISTINCT book_version_id) AS n FROM review_tasks WHERE status IN ('approved','closed')`,
    ),
    publishedInteractiveBooks: count(`SELECT COUNT(*) AS n FROM published_versions`),
    completeBooks: count(
      `SELECT COUNT(*) AS n FROM inventory_matrix_cells WHERE country_id=? AND matrix_status='COMPLETE' AND completeness_claim='complete'`,
      [JORDAN_COUNTRY_ID],
    ),
    totalUnits: count(`SELECT COUNT(*) AS n FROM units WHERE deleted_at IS NULL`),
    completeUnits: count(
      `SELECT COUNT(*) AS n FROM units u
       WHERE deleted_at IS NULL AND EXISTS (SELECT 1 FROM lessons l WHERE l.unit_id=u.id)`,
    ),
    totalLessons: count(`SELECT COUNT(*) AS n FROM lessons WHERE deleted_at IS NULL`),
    completeLessons: count(
      `SELECT COUNT(*) AS n FROM lessons l
       WHERE deleted_at IS NULL AND EXISTS (SELECT 1 FROM content_blocks b WHERE b.lesson_id=l.id)`,
    ),
    totalExercises: count(`SELECT COUNT(*) AS n FROM questions`),
    verifiedAnswers: count(`SELECT COUNT(*) AS n FROM answers`),
    engineBooks: count(`SELECT COUNT(*) AS n FROM books WHERE deleted_at IS NULL`),
    countries: count(`SELECT COUNT(*) AS n FROM countries WHERE deleted_at IS NULL`),
    activeStudentCountries: count(
      `SELECT COUNT(*) AS n FROM countries WHERE student_visible=1 AND status='active' AND deleted_at IS NULL`,
    ),
  };

  const blockers = {
    missingSources: count(
      `SELECT COUNT(*) AS n FROM inventory_matrix_cells
       WHERE country_id=? AND (source_url IS NULL OR source_url='') AND book_type != 'sos_companion'`,
      [JORDAN_COUNTRY_ID],
    ),
    rightsBlockers: count(
      `SELECT COUNT(*) AS n FROM inventory_matrix_cells
       WHERE country_id=? AND rights_status IN ('rights_review_required','restricted','unavailable')`,
      [JORDAN_COUNTRY_ID],
    ),
    academicReviewBlockers: count(
      `SELECT COUNT(*) AS n FROM inventory_matrix_cells
       WHERE country_id=? AND matrix_status IN ('SUBJECT_REVIEW','LANGUAGE_REVIEW')`,
      [JORDAN_COUNTRY_ID],
    ),
    technicalBlockers: count(
      `SELECT COUNT(*) AS n FROM production_jobs WHERE job_type='gate3_book_production' AND status='failed'`,
    ),
    failedValidation: count(`SELECT COUNT(*) AS n FROM validation_reports WHERE passed=0`),
    editionUnverifiedOfficial: count(
      `SELECT COUNT(*) AS n FROM inventory_matrix_cells
       WHERE country_id=? AND book_type != 'sos_companion'
         AND (edition_label='NEEDS VERIFICATION' OR curriculum_version_label='NEEDS VERIFICATION')`,
      [JORDAN_COUNTRY_ID],
    ),
  };

  const sampleBlockers = db
    .prepare(
      `SELECT grade_code, term_code, subject_title_ar, book_type, matrix_status, blocker, rights_status, source_url
       FROM inventory_matrix_cells
       WHERE country_id=? AND (blocker IS NOT NULL OR matrix_status='NOT_DISCOVERED' OR matrix_status='BLOCKED')
       LIMIT 25`,
    )
    .all(JORDAN_COUNTRY_ID) as Array<Record<string, unknown>>;

  const notes: string[] = [];
  if (blockers.editionUnverifiedOfficial > 0) {
    notes.push(
      `Official edition/year still NEEDS VERIFICATION for ${blockers.editionUnverifiedOfficial} official book rows (NCCD unreachable in this environment).`,
    );
  }
  if (totals.completeBooks === 0) {
    notes.push("No inventory cell has matrix_status=COMPLETE with completeness_claim=complete.");
  }
  notes.push("SOS companion STRUCTURED/CONTENT_COMPLETE matrix statuses are not official textbook completion.");

  const readiness = getReadinessChecks();
  const allReadinessPass = readiness.length > 0 && readiness.every((r) => Number(r.passed) === 1);

  let verdict: JordanAuditReport["verdict"] = "INCOMPLETE";
  let nextCountryReady = false;
  if (totals.completeBooks > 0 && blockers.editionUnverifiedOfficial === 0 && blockers.rightsBlockers === 0) {
    verdict = "CONTENT_COMPLETE";
    nextCountryReady = allReadinessPass;
  } else if (blockers.editionUnverifiedOfficial > 0 || blockers.rightsBlockers > 0) {
    verdict = "AUDITED_WITH_BLOCKERS";
    nextCountryReady = false;
  }

  setReadinessCheck(
    "jordan_final_audit",
    verdict === "CONTENT_COMPLETE" || verdict === "OPERATIONALLY_COMPLETE",
    JSON.stringify({ verdict, completeBooks: totals.completeBooks, blockers }),
  );
  setReadinessCheck(
    "next_country_ready",
    nextCountryReady,
    nextCountryReady
      ? "Jordan complete and global readiness passed"
      : "Blocked until Jordan official editions/rights and final audit pass",
  );

  const report: JordanAuditReport = {
    generatedAt: t,
    verdict,
    nextCountryReady,
    totals,
    blockers,
    sampleBlockers,
    studentRoutes: [
      "/interactive-books",
      "/interactive-books/reader/book-jo-g1-s1-math",
      "/jordan-books",
      "/student/books",
    ],
    adminRoutes: [
      "/interactive-books/cms",
      "/admin/country-wizard",
      "/admin/global-curriculum-matrix",
      "/admin/jordan-coverage",
      "/admin/country-readiness",
      "/admin/jordan-curriculum-matrix",
    ],
    notes,
  };

  db.prepare(
    `INSERT INTO jordan_audit_snapshots (id, snapshot_json, verdict, next_country_ready, created_at)
     VALUES (?,?,?,?,?)`,
  ).run(uuid(), JSON.stringify(report), verdict, nextCountryReady ? 1 : 0, t);

  return report;
}
