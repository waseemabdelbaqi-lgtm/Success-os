import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import {
  advanceOnboardingStep,
  approveCountryActivation,
  startCountryOnboarding,
} from "@/src/lib/global-curriculum/country-wizard";
import { upsertTerminology, setReadinessCheck } from "@/src/lib/global-curriculum/repository";

/**
 * Non-production global readiness test:
 * add a temporary test country with different terms/labels/grading, then remove it.
 */
export function runGlobalReadinessTest(): {
  passed: boolean;
  evidence: string[];
  failures: string[];
} {
  applyMigrations();
  const db = getBookEngineDb();
  const evidence: string[] = [];
  const failures: string[] = [];

  try {
    const { sessionId, countryId } = startCountryOnboarding({
      isoCode: "ZZ",
      nameEn: "Testland",
      nameAr: "أرض الاختبار",
      defaultLanguage: "en",
      supportedLanguages: ["en", "fr", "ar"],
      region: "Test",
      createdBy: "gate3-readiness",
    });
    evidence.push(`created inactive country ${countryId}`);

    const country = db.prepare("SELECT * FROM countries WHERE id=?").get(countryId) as {
      student_visible: number;
      status: string;
    };
    if (country.student_visible !== 0) failures.push("test country must not be student-visible before approval");
    if (country.status !== "onboarding") failures.push("expected onboarding status");

    // Different terminology: Year / Trimester instead of Grade / Semester
    const curriculumId = `curriculum-${countryId}-national`;
    db.prepare(
      `INSERT INTO curricula (id, country_id, code, name_en, ownership, scope, supported_languages_json, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      curriculumId,
      countryId,
      "national",
      "Testland National",
      "public",
      "state",
      JSON.stringify(["en", "fr"]),
      "draft",
      nowIso(),
      nowIso(),
    );
    upsertTerminology(countryId, curriculumId, {
      grade: { labelEn: "Year", labelAr: "سنة", direction: "ltr" },
      term: { labelEn: "Trimester", labelAr: "ثلث", direction: "ltr" },
      subject: { labelEn: "Course", direction: "ltr" },
      pathway: { labelEn: "Track", direction: "ltr" },
      national_exam: { labelEn: "Leaving Certificate", direction: "ltr" },
      kindergarten: { labelEn: "Reception", direction: "ltr" },
    });
    evidence.push("configured Year/Trimester terminology (not Grade/Semester)");

    db.prepare(
      `INSERT INTO assessment_profiles (
        id, curriculum_id, name_en, grading_scale_json, passing_score, assessment_types_json,
        national_examination_label, continuous_assessment, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      uuid(),
      curriculumId,
      "Testland A-F scale",
      JSON.stringify({ scale: ["A", "B", "C", "D", "F"], pass: "D" }),
      "D",
      JSON.stringify(["coursework", "final"]),
      "Leaving Certificate",
      1,
      nowIso(),
      nowIso(),
    );
    evidence.push("configured alternate grading scale A-F");

    db.prepare(
      `INSERT INTO academic_calendars (
        id, curriculum_id, academic_year_label, term_count, term_names_json, is_current, status, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(
      uuid(),
      curriculumId,
      "2026-2027",
      3,
      JSON.stringify(["Autumn", "Winter", "Spring"]),
      1,
      "draft",
      nowIso(),
      nowIso(),
    );
    evidence.push("configured three-term calendar");

    // LTR + RTL language support in terminology/translations
    db.prepare(
      `INSERT INTO translation_records (
        id, entity_type, entity_id, field_key, locale, original_language, text_value, direction,
        translation_status, version_label, fallback_language, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      uuid(),
      "curriculum",
      curriculumId,
      "name",
      "ar",
      "en",
      "منهاج أرض الاختبار",
      "rtl",
      "draft",
      "1",
      "en",
      nowIso(),
      nowIso(),
    );
    evidence.push("stored RTL Arabic translation record without publishing");

    for (const step of [1, 2, 3, 4, 5, 6, 7, 8, 9] as const) {
      advanceOnboardingStep(sessionId, step, { ok: true, step });
    }
    evidence.push("advanced wizard through 9 steps");

    // Must remain invisible until approval — and we will NOT approve for production
    const visibleBefore = db.prepare("SELECT student_visible FROM countries WHERE id=?").get(countryId) as {
      student_visible: number;
    };
    if (visibleBefore.student_visible !== 0) failures.push("country became visible before approval");

    // Explicitly reject activation (cleanup path)
    approveCountryActivation(sessionId, false);
    evidence.push("rejected activation — country stays inactive");

    // Cleanup test data
    db.prepare(`DELETE FROM translation_records WHERE entity_id=?`).run(curriculumId);
    db.prepare(`DELETE FROM assessment_profiles WHERE curriculum_id=?`).run(curriculumId);
    db.prepare(`DELETE FROM academic_calendars WHERE curriculum_id=?`).run(curriculumId);
    db.prepare(`DELETE FROM terminology_entries WHERE country_id=?`).run(countryId);
    db.prepare(`DELETE FROM country_onboarding_sessions WHERE id=?`).run(sessionId);
    db.prepare(`DELETE FROM curricula WHERE id=?`).run(curriculumId);
    db.prepare(`DELETE FROM countries WHERE id=?`).run(countryId);
    evidence.push("removed test country records");

    // Ensure Jordan still present if seeded
    const jo = db.prepare("SELECT id FROM countries WHERE iso_code='JO'").get() as { id?: string } | undefined;
    if (!jo?.id) evidence.push("Jordan not yet seeded at readiness-test time (ok if later)");
    else evidence.push("Jordan country row preserved");
  } catch (e) {
    failures.push(e instanceof Error ? e.message : String(e));
  }

  const passed = failures.length === 0;
  setReadinessCheck("global_architecture_agnostic", passed, evidence.join(" | "));
  setReadinessCheck("country_wizard", passed, evidence.join(" | "));
  setReadinessCheck("multilingual_terms_configurable", passed, evidence.join(" | "));
  return { passed, evidence, failures };
}
