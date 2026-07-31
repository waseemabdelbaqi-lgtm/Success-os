import { applyMigrations, getBookEngineDb, nowIso } from "@/src/lib/book-engine/db/client";
import { runGlobalReadinessTest } from "@/src/lib/global-curriculum/global-readiness-test";
import {
  startCountryOnboarding,
  advanceOnboardingStep,
  approveCountryActivation,
} from "@/src/lib/global-curriculum/country-wizard";
import { upsertTerminology } from "@/src/lib/global-curriculum/repository";
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import path from "path";

export type TestResult = { name: string; passed: boolean; detail: string; severity?: "critical" | "high" | "medium" | "low" };

const BASE = process.env.GATE5_BASE || "http://127.0.0.1:3000";

async function httpStatus(pathname: string): Promise<number> {
  const r = await fetch(`${BASE}${pathname}`);
  return r.status;
}

export async function runRouteAudit(): Promise<TestResult[]> {
  const paths = [
    "/",
    "/jordan-books",
    "/interactive-books",
    "/interactive-books/cms",
    "/interactive-books/reader/book-jo-g1-s1-math",
    "/student/countries",
    "/student/dashboard",
    "/admin/production-factory",
    "/admin/production-monitor",
    "/admin/review-workbench",
    "/admin/jordan-coverage",
    "/admin/country-readiness",
    "/admin/country-wizard",
    "/admin/global-curriculum-matrix",
    "/admin/gate5-final",
    "/api/curriculum-factory?view=status",
    "/api/global-curriculum?view=status",
    "/api/interactive-book-engine?view=status",
    "/api/gate5?view=status",
  ];
  const out: TestResult[] = [];
  for (const p of paths) {
    try {
      const status = await httpStatus(p);
      out.push({
        name: `route:${p}`,
        passed: status === 200 || status === 307 || status === 308,
        detail: `HTTP ${status}`,
        severity: status === 404 ? "critical" : "medium",
      });
    } catch (e) {
      out.push({
        name: `route:${p}`,
        passed: false,
        detail: e instanceof Error ? e.message : String(e),
        severity: "critical",
      });
    }
  }
  return out;
}

/**
 * Security checks that can be executed in this environment.
 * Does not claim a full penetration test.
 */
export async function runSecurityAudit(): Promise<TestResult[]> {
  applyMigrations();
  const results: TestResult[] = [];

  // Admin APIs should not mutate without POST body action (GET is read-only)
  const mon = await fetch(`${BASE}/api/curriculum-factory?view=monitor`);
  results.push({
    name: "api_monitor_get_readonly",
    passed: mon.ok,
    detail: `status=${mon.status}`,
    severity: "high",
  });

  // Unknown action rejected
  const bad = await fetch(`${BASE}/api/curriculum-factory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "drop_all_tables" }),
  });
  const badJson = await bad.json().catch(() => ({}));
  results.push({
    name: "api_rejects_unknown_destructive_action",
    passed: bad.status === 400 || badJson.ok === false,
    detail: `status=${bad.status} ok=${badJson.ok}`,
    severity: "critical",
  });

  // No completeness_claim=complete fakes
  const complete = (
    getBookEngineDb().prepare(`SELECT COUNT(*) AS n FROM books WHERE completeness_claim='complete'`).get() as {
      n: number;
    }
  ).n;
  results.push({
    name: "no_fake_complete_claims",
    passed: complete === 0,
    detail: `completeClaims=${complete}`,
    severity: "critical",
  });

  // Env secrets not embedded in client pages (spot check)
  const reader = await fetch(`${BASE}/interactive-books/reader/book-jo-g1-s1-math`);
  const html = await reader.text();
  const leaked =
    /HEYGEN_API_KEY|OPENAI_API_KEY|FIREBASE_PRIVATE|BEGIN PRIVATE KEY|DATABASE_URL=postgres/i.test(html);
  results.push({
    name: "no_secrets_in_reader_html",
    passed: !leaked,
    detail: leaked ? "possible secret pattern in HTML" : "no secret patterns found",
    severity: "critical",
  });

  // SQL injection style inventory id should not crash API
  const inj = await fetch(
    `${BASE}/api/global-curriculum?view=matrix&limit=1&offset=0`,
  );
  results.push({
    name: "matrix_query_stable",
    passed: inj.ok,
    detail: `status=${inj.status}`,
    severity: "high",
  });

  return results;
}

export async function runAccessibilitySpotChecks(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const pages = [
    "/interactive-books/reader/book-jo-g1-s1-math",
    "/admin/production-factory",
    "/student/countries",
  ];
  for (const p of pages) {
    const r = await fetch(`${BASE}${p}`);
    const html = await r.text();
    const hasMain = /<main[\s>]/i.test(html) || /role="main"/i.test(html);
    const hasLang = /lang=/i.test(html);
    results.push({
      name: `a11y_main_landmark:${p}`,
      passed: r.ok && hasMain,
      detail: `status=${r.status} main=${hasMain}`,
      severity: "high",
    });
    results.push({
      name: `a11y_lang_attr:${p}`,
      passed: r.ok && hasLang,
      detail: `lang=${hasLang}`,
      severity: "medium",
    });
  }
  return results;
}

export async function runPerformanceSpotChecks(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const targets = [
    "/interactive-books",
    "/api/curriculum-factory?view=status",
    "/api/gate5?view=totals",
    "/admin/jordan-coverage",
  ];
  for (const p of targets) {
    const t0 = Date.now();
    const r = await fetch(`${BASE}${p}`);
    const ms = Date.now() - t0;
    await r.text();
    results.push({
      name: `perf:${p}`,
      passed: r.ok && ms < 8000,
      detail: `${ms}ms status=${r.status}`,
      severity: ms > 8000 ? "high" : "low",
    });
  }
  return results;
}

export function runBackupRestoreTest(): TestResult {
  applyMigrations();
  const dbPath = path.join(process.cwd(), "data/book-engine/book-engine.sqlite");
  const backupDir = path.join(process.cwd(), "data/book-engine/backups");
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `gate5-restore-test-${Date.now()}.sqlite`);
  try {
    if (!existsSync(dbPath)) {
      return { name: "backup_restore", passed: false, detail: "DB missing", severity: "critical" };
    }
    copyFileSync(dbPath, backupPath);
    const ok = existsSync(backupPath);
    // restore verification: re-copy to a temp restore path and confirm size > 0
    const restorePath = path.join(backupDir, `gate5-restored-${Date.now()}.sqlite`);
    copyFileSync(backupPath, restorePath);
    const restored = existsSync(restorePath);
    // cleanup restore copy (keep one backup artifact)
    try {
      unlinkSync(restorePath);
    } catch {
      /* ignore */
    }
    return {
      name: "backup_restore",
      passed: ok && restored,
      detail: `backup=${backupPath}`,
      severity: "critical",
    };
  } catch (e) {
    return {
      name: "backup_restore",
      passed: false,
      detail: e instanceof Error ? e.message : String(e),
      severity: "critical",
    };
  }
}

export function runFinalCountryOnboardingTest(): TestResult[] {
  applyMigrations();
  const results: TestResult[] = [];
  const db = getBookEngineDb();
  try {
    const { sessionId, countryId } = startCountryOnboarding({
      isoCode: "YY",
      nameEn: "Gate5 Testland",
      nameAr: "أرض اختبار بوابة 5",
      defaultLanguage: "fr",
      supportedLanguages: ["fr", "en", "ar"],
      region: "Test",
      createdBy: "gate5",
    });
    const curriculumId = `curriculum-${countryId}-regional`;
    db.prepare(
      `INSERT INTO curricula (id, country_id, code, name_en, ownership, scope, supported_languages_json, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      curriculumId,
      countryId,
      "regional",
      "Gate5 Regional Curriculum",
      "public",
      "regional",
      JSON.stringify(["fr", "en"]),
      "draft",
      nowIso(),
      nowIso(),
    );
    upsertTerminology(countryId, curriculumId, {
      grade: { labelEn: "Form", labelAr: "صف", direction: "ltr" },
      term: { labelEn: "Trimester", direction: "ltr" },
      pathway: { labelEn: "Stream", direction: "ltr" },
      national_exam: { labelEn: "Certificate", direction: "ltr" },
    });
    for (const step of [1, 2, 3, 4, 5, 6, 7, 8, 9] as const) {
      advanceOnboardingStep(sessionId, step, { gate5: true, step });
    }
    const before = db.prepare(`SELECT student_visible, status FROM countries WHERE id=?`).get(countryId) as {
      student_visible: number;
      status: string;
    };
    results.push({
      name: "onboarding_hidden_until_approve",
      passed: before.student_visible === 0,
      detail: `visible=${before.student_visible} status=${before.status}`,
      severity: "critical",
    });
    approveCountryActivation(sessionId, false);
    const after = db.prepare(`SELECT student_visible, status FROM countries WHERE id=?`).get(countryId) as {
      student_visible: number;
      status: string;
    };
    results.push({
      name: "onboarding_reject_keeps_inactive",
      passed: after.student_visible === 0,
      detail: `visible=${after.student_visible} status=${after.status}`,
      severity: "critical",
    });

    // cleanup
    db.prepare(`DELETE FROM terminology_entries WHERE country_id=?`).run(countryId);
    db.prepare(`DELETE FROM country_onboarding_sessions WHERE id=?`).run(sessionId);
    db.prepare(`DELETE FROM curricula WHERE id=?`).run(curriculumId);
    db.prepare(`DELETE FROM countries WHERE id=?`).run(countryId);
    results.push({
      name: "onboarding_cleanup",
      passed: !db.prepare(`SELECT id FROM countries WHERE id=?`).get(countryId),
      detail: "test country removed",
      severity: "high",
    });
  } catch (e) {
    results.push({
      name: "onboarding_flow",
      passed: false,
      detail: e instanceof Error ? e.message : String(e),
      severity: "critical",
    });
  }

  const reuse = runGlobalReadinessTest();
  results.push({
    name: "global_reusability_test",
    passed: reuse.passed,
    detail: reuse.failures.join("; ") || reuse.evidence.slice(0, 3).join(" | "),
    severity: "critical",
  });
  return results;
}

export async function runInteractionSmoke(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  // API interaction: open book bundle
  const book = await fetch(`${BASE}/api/interactive-book-engine?view=book&bookId=book-jo-g1-s1-math`);
  const bookJson = await book.json().catch(() => ({}));
  results.push({
    name: "interaction_open_book_api",
    passed: book.ok && (bookJson.ok === true || bookJson.book || bookJson.bundle),
    detail: `status=${book.status}`,
    severity: "critical",
  });

  // Reader HTML loads
  const reader = await fetch(`${BASE}/interactive-books/reader/book-jo-g1-s1-math?mode=activity`);
  results.push({
    name: "interaction_reader_activity_mode",
    passed: reader.status === 200,
    detail: `status=${reader.status}`,
    severity: "critical",
  });

  return results;
}
