import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { JORDAN_COUNTRY_ID } from "@/src/lib/global-curriculum/profiles/jordan";

/**
 * Builds Gate 3 production_jobs from inventory_matrix_cells.
 * Official edition/rights blockers are recorded as blocked jobs (never silently dropped).
 */
export function rebuildJordanProductionQueue(): {
  created: number;
  blocked: number;
  eligible: number;
} {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  const cells = db
    .prepare("SELECT * FROM inventory_matrix_cells WHERE country_id=? AND deleted_at IS NULL")
    .all(JORDAN_COUNTRY_ID) as Array<Record<string, unknown>>;

  db.prepare(
    `DELETE FROM production_checkpoints WHERE job_id IN (SELECT id FROM production_jobs WHERE job_type = 'gate3_book_production')`,
  ).run();
  db.prepare(`DELETE FROM production_jobs WHERE job_type = 'gate3_book_production'`).run();

  let created = 0;
  let blocked = 0;
  let eligible = 0;

  const insert = db.prepare(
    `INSERT INTO production_jobs (
      id, book_id, stage, status, checkpoint, created_at, updated_at,
      job_type, priority, attempts, max_attempts, checkpoint_json, error_log, notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );

  const tx = db.transaction(() => {
    for (const c of cells) {
      const bookType = String(c.book_type);
      const blocker = c.blocker ? String(c.blocker) : "";
      const isCompanion = bookType === "sos_companion";
      const editionBad =
        String(c.edition_label || "") === "NEEDS VERIFICATION" ||
        String(c.curriculum_version_label || "") === "NEEDS VERIFICATION";
      const isOfficialBlocked =
        !isCompanion &&
        (editionBad ||
          blocker.includes("edition") ||
          blocker.includes("source") ||
          String(c.rights_status) === "rights_review_required" ||
          String(c.matrix_status) === "NOT_DISCOVERED");

      let status = "queued";
      if (isOfficialBlocked) {
        status = "blocked";
        blocked += 1;
      } else {
        status = "queued";
        eligible += 1;
      }

      const grade = String(c.grade_code);
      const priority =
        grade === "1" && /math|رياض/i.test(String(c.subject_title_ar) + String(c.subject_code))
          ? 10
          : grade === "1"
            ? 20
            : grade.startsWith("kg")
              ? 30
              : 100;

      const checkpoint = {
        inventoryCellId: c.id,
        grade: c.grade_code,
        term: c.term_code,
        pathway: c.pathway_code,
        subject: c.subject_title_ar,
        bookType,
        sourceUrl: c.source_url,
        rightsStatus: c.rights_status,
        gate: 3,
      };

      insert.run(
        uuid(),
        null,
        String(c.stage_code || "basic"),
        status,
        JSON.stringify(checkpoint),
        t,
        t,
        "gate3_book_production",
        priority,
        0,
        5,
        JSON.stringify(checkpoint),
        blocker || null,
        `gate3-jordan:${c.id}`,
      );
      created += 1;
    }
  });
  tx();

  return { created, blocked, eligible };
}

export function getJordanQueueStats(): Record<string, number> {
  applyMigrations();
  const rows = getBookEngineDb()
    .prepare(
      `SELECT status, COUNT(*) AS n FROM production_jobs
       WHERE job_type='gate3_book_production' GROUP BY status`,
    )
    .all() as Array<{ status: string; n: number }>;
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.n;
  return out;
}
