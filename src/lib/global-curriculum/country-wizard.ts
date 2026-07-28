import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { upsertCountry } from "@/src/lib/global-curriculum/repository";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export function startCountryOnboarding(input: {
  isoCode: string;
  nameEn: string;
  nameAr: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  region?: string;
  createdBy?: string;
}): { sessionId: string; countryId: string } {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  const countryId = `country-${input.isoCode.toLowerCase()}`;
  upsertCountry({
    id: countryId,
    isoCode: input.isoCode.toUpperCase(),
    nameAr: input.nameAr,
    nameEn: input.nameEn,
    defaultLanguage: input.defaultLanguage,
    supportedLanguages: input.supportedLanguages,
    region: input.region,
    status: "onboarding",
    studentVisible: false,
  });
  const sessionId = uuid();
  db.prepare(
    `INSERT INTO country_onboarding_sessions (
      id, country_id, current_step, step_payload_json, status, activated_for_students, created_by, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(sessionId, countryId, 1, JSON.stringify({ step1: input }), "in_progress", 0, input.createdBy || null, t, t);
  return { sessionId, countryId };
}

export function advanceOnboardingStep(
  sessionId: string,
  step: WizardStep,
  payload: Record<string, unknown>,
): { ok: boolean; currentStep: number; status: string } {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  const row = db.prepare("SELECT * FROM country_onboarding_sessions WHERE id=?").get(sessionId) as
    | { step_payload_json: string; current_step: number; country_id: string; status: string }
    | undefined;
  if (!row) return { ok: false, currentStep: 0, status: "missing" };
  const data = JSON.parse(row.step_payload_json || "{}") as Record<string, unknown>;
  data[`step${step}`] = payload;
  const next = Math.min(9, Math.max(row.current_step, step + 1));
  let status = row.status;
  if (step === 9) status = "validation";
  db.prepare(
    `UPDATE country_onboarding_sessions SET current_step=?, step_payload_json=?, status=?, updated_at=? WHERE id=?`,
  ).run(next, JSON.stringify(data), status, t, sessionId);
  return { ok: true, currentStep: next, status };
}

/**
 * Approve country activation for students — only after validation step.
 * Future countries stay inactive until this is called.
 */
export function approveCountryActivation(sessionId: string, approve: boolean): {
  ok: boolean;
  studentVisible: boolean;
  message: string;
} {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  const row = db.prepare("SELECT * FROM country_onboarding_sessions WHERE id=?").get(sessionId) as
    | { country_id: string; current_step: number; status: string }
    | undefined;
  if (!row) return { ok: false, studentVisible: false, message: "Session not found" };
  if (row.current_step < 9 && row.status !== "validation") {
    return { ok: false, studentVisible: false, message: "Complete all 9 wizard steps before activation" };
  }
  if (!approve) {
    db.prepare(`UPDATE country_onboarding_sessions SET status=?, updated_at=? WHERE id=?`).run("rejected", t, sessionId);
    db.prepare(`UPDATE countries SET status=?, student_visible=0, updated_at=? WHERE id=?`).run(
      "inactive",
      t,
      row.country_id,
    );
    return { ok: true, studentVisible: false, message: "Country rejected / kept inactive" };
  }
  db.prepare(
    `UPDATE country_onboarding_sessions SET status=?, activated_for_students=1, updated_at=? WHERE id=?`,
  ).run("approved", t, sessionId);
  db.prepare(`UPDATE countries SET status=?, student_visible=1, updated_at=? WHERE id=?`).run(
    "active",
    t,
    row.country_id,
  );
  return { ok: true, studentVisible: true, message: "Country activated for students" };
}

export function listOnboardingSessions(): Array<Record<string, unknown>> {
  applyMigrations();
  return getBookEngineDb()
    .prepare(
      `SELECT s.*, c.name_en, c.iso_code, c.student_visible, c.status AS country_status
       FROM country_onboarding_sessions s
       JOIN countries c ON c.id = s.country_id
       ORDER BY s.updated_at DESC`,
    )
    .all() as Array<Record<string, unknown>>;
}
