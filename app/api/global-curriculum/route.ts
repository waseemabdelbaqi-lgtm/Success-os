import { NextRequest, NextResponse } from "next/server";
import { applyMigrations, listTables } from "@/src/lib/book-engine/db/client";
import { seedJordanGlobalProfile } from "@/src/lib/global-curriculum/profiles/jordan";
import { rebuildJordanProductionQueue, getJordanQueueStats } from "@/src/lib/global-curriculum/jordan-production-queue";
import {
  importAuthoredJordanBooksIntoEngine,
  processJordanCompanionJobs,
} from "@/src/lib/global-curriculum/jordan-engine-import";
import { runJordanFinalAudit } from "@/src/lib/global-curriculum/jordan-audit";
import { runGlobalReadinessTest } from "@/src/lib/global-curriculum/global-readiness-test";
import {
  advanceOnboardingStep,
  approveCountryActivation,
  listOnboardingSessions,
  startCountryOnboarding,
} from "@/src/lib/global-curriculum/country-wizard";
import { getReadinessChecks, listActiveCountries } from "@/src/lib/global-curriculum/repository";
import { getBookEngineDb } from "@/src/lib/book-engine/db/client";
import { JORDAN_COUNTRY_ID } from "@/src/lib/global-curriculum/profiles/jordan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
  applyMigrations();
  const view = req.nextUrl.searchParams.get("view") || "status";

  if (view === "status") {
    return json({
      ok: true,
      gate: 3,
      engine: "Success OS Global Curriculum + Jordan Production",
      tables: listTables(),
      countries: listActiveCountries(),
      readiness: getReadinessChecks(),
    });
  }

  if (view === "jordan-inventory") {
    const rows = getBookEngineDb()
      .prepare(
        `SELECT matrix_status, book_type, subject_list_status, COUNT(*) AS n
         FROM inventory_matrix_cells WHERE country_id=? GROUP BY 1,2,3`,
      )
      .all(JORDAN_COUNTRY_ID);
    const total = getBookEngineDb()
      .prepare(`SELECT COUNT(*) AS n FROM inventory_matrix_cells WHERE country_id=?`)
      .get(JORDAN_COUNTRY_ID);
    return json({ ok: true, total, breakdown: rows });
  }

  if (view === "jordan-coverage") {
    const byGrade = getBookEngineDb()
      .prepare(
        `SELECT grade_code,
           COUNT(*) AS expected_books,
           SUM(CASE WHEN matrix_status != 'NOT_DISCOVERED' THEN 1 ELSE 0 END) AS discovered,
           SUM(CASE WHEN book_type='sos_companion' AND matrix_status IN ('STRUCTURED','CONTENT_COMPLETE') THEN 1 ELSE 0 END) AS structured_companions,
           SUM(CASE WHEN edition_label='NEEDS VERIFICATION' AND book_type != 'sos_companion' THEN 1 ELSE 0 END) AS edition_unverified_official,
           SUM(CASE WHEN matrix_status='COMPLETE' THEN 1 ELSE 0 END) AS complete_books
         FROM inventory_matrix_cells WHERE country_id=?
         GROUP BY grade_code ORDER BY grade_code`,
      )
      .all(JORDAN_COUNTRY_ID);
    return json({ ok: true, byGrade, queue: getJordanQueueStats() });
  }

  if (view === "queue") {
    return json({ ok: true, stats: getJordanQueueStats() });
  }

  if (view === "audit") {
    return json({ ok: true, report: runJordanFinalAudit() });
  }

  if (view === "readiness") {
    return json({ ok: true, checks: getReadinessChecks(), countries: listActiveCountries() });
  }

  if (view === "wizard-sessions") {
    return json({ ok: true, sessions: listOnboardingSessions() });
  }

  if (view === "matrix") {
    const limit = Math.min(200, Number(req.nextUrl.searchParams.get("limit") || 50));
    const offset = Number(req.nextUrl.searchParams.get("offset") || 0);
    const rows = getBookEngineDb()
      .prepare(
        `SELECT id, grade_code, term_code, pathway_code, subject_title_ar, book_type, matrix_status,
                rights_status, edition_label, blocker, structured_book_id, completeness_claim
         FROM inventory_matrix_cells WHERE country_id=?
         ORDER BY grade_code, term_code, subject_title_ar, book_type
         LIMIT ? OFFSET ?`,
      )
      .all(JORDAN_COUNTRY_ID, limit, offset);
    return json({ ok: true, rows, limit, offset });
  }

  return json({ ok: false, error: "unknown view" }, 400);
}

export async function POST(req: NextRequest) {
  try {
  applyMigrations();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "");

  if (action === "seed_jordan") {
    return json({ ok: true, result: seedJordanGlobalProfile() });
  }
  if (action === "rebuild_queue") {
    seedJordanGlobalProfile();
    return json({ ok: true, result: rebuildJordanProductionQueue(), stats: getJordanQueueStats() });
  }
  if (action === "import_authored") {
    return json({ ok: true, result: importAuthoredJordanBooksIntoEngine() });
  }
  if (action === "process_queue") {
    const limit = Number(body.limit || 50);
    return json({ ok: true, result: processJordanCompanionJobs(limit), stats: getJordanQueueStats() });
  }
  if (action === "run_pipeline") {
    const seed = seedJordanGlobalProfile();
    const authored = importAuthoredJordanBooksIntoEngine();
    const queue = rebuildJordanProductionQueue();
    // Process companions in batches until queued empty or cap
    let processed = 0;
    const errors: string[] = [];
    for (let i = 0; i < 20; i++) {
      const batch = processJordanCompanionJobs(50);
      processed += batch.processed;
      errors.push(...batch.errors);
      if (batch.processed === 0) break;
    }
    const readiness = runGlobalReadinessTest();
    const audit = runJordanFinalAudit();
    return json({
      ok: true,
      seed,
      authored,
      queue,
      processedCompanions: processed,
      processErrors: errors.slice(0, 20),
      readiness,
      audit,
    });
  }
  if (action === "global_readiness_test") {
    return json({ ok: true, result: runGlobalReadinessTest() });
  }
  if (action === "final_audit") {
    return json({ ok: true, report: runJordanFinalAudit() });
  }
  if (action === "wizard_start") {
    const result = startCountryOnboarding({
      isoCode: String(body.isoCode || ""),
      nameEn: String(body.nameEn || ""),
      nameAr: String(body.nameAr || body.nameEn || ""),
      defaultLanguage: String(body.defaultLanguage || "en"),
      supportedLanguages: Array.isArray(body.supportedLanguages)
        ? (body.supportedLanguages as string[])
        : ["en"],
      region: body.region ? String(body.region) : undefined,
      createdBy: String(body.createdBy || "admin"),
    });
    return json({ ok: true, result });
  }
  if (action === "wizard_step") {
    return json({
      ok: true,
      result: advanceOnboardingStep(
        String(body.sessionId),
        Number(body.step) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
        (body.payload as Record<string, unknown>) || {},
      ),
    });
  }
  if (action === "wizard_approve") {
    return json({
      ok: true,
      result: approveCountryActivation(String(body.sessionId), Boolean(body.approve)),
    });
  }

  return json({ ok: false, error: "unknown action" }, 400);
  } catch (e) {
    return json(
      { ok: false, error: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined },
      500,
    );
  }
}
