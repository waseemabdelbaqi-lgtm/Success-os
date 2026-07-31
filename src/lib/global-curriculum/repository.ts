import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import type { CountryProfile, TerminologyMap } from "@/src/lib/global-curriculum/types";

export function ensureGlobalSchema(): void {
  applyMigrations();
}

export function upsertCountry(profile: CountryProfile): void {
  ensureGlobalSchema();
  const db = getBookEngineDb();
  const t = nowIso();
  const existing = db.prepare("SELECT id FROM countries WHERE id = ? OR iso_code = ?").get(profile.id, profile.isoCode) as
    | { id: string }
    | undefined;
  if (existing) {
    db.prepare(
      `UPDATE countries SET name_ar=?, name_en=?, name_native=?, region=?, subregion=?, flag_emoji=?,
       default_language=?, supported_languages_json=?, currency_code=?, timezone=?, status=?, student_visible=?, updated_at=?
       WHERE id=?`,
    ).run(
      profile.nameAr,
      profile.nameEn,
      profile.nameNative || null,
      profile.region || null,
      profile.subregion || null,
      profile.flagEmoji || null,
      profile.defaultLanguage,
      JSON.stringify(profile.supportedLanguages),
      profile.currencyCode || null,
      profile.timezone || null,
      profile.status,
      profile.studentVisible ? 1 : 0,
      t,
      existing.id,
    );
    return;
  }
  db.prepare(
    `INSERT INTO countries (
      id, iso_code, name_ar, name_en, name_native, region, subregion, flag_emoji,
      default_language, supported_languages_json, currency_code, timezone, status, student_visible, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    profile.id,
    profile.isoCode,
    profile.nameAr,
    profile.nameEn,
    profile.nameNative || null,
    profile.region || null,
    profile.subregion || null,
    profile.flagEmoji || null,
    profile.defaultLanguage,
    JSON.stringify(profile.supportedLanguages),
    profile.currencyCode || null,
    profile.timezone || null,
    profile.status,
    profile.studentVisible ? 1 : 0,
    t,
    t,
  );
}

export function upsertTerminology(
  countryId: string,
  curriculumId: string | null,
  map: TerminologyMap,
): void {
  ensureGlobalSchema();
  const db = getBookEngineDb();
  const t = nowIso();
  const stmt = db.prepare(
    `INSERT INTO terminology_entries (
      id, country_id, curriculum_id, canonical_key, label_ar, label_en, label_native,
      singular, plural, direction, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(country_id, curriculum_id, canonical_key) DO UPDATE SET
      label_ar=excluded.label_ar,
      label_en=excluded.label_en,
      label_native=excluded.label_native,
      singular=excluded.singular,
      plural=excluded.plural,
      direction=excluded.direction,
      updated_at=excluded.updated_at`,
  );
  const tx = db.transaction(() => {
    for (const [key, val] of Object.entries(map)) {
      stmt.run(
        uuid(),
        countryId,
        curriculumId,
        key,
        val.labelAr || null,
        val.labelEn,
        val.labelNative || null,
        val.singular || null,
        val.plural || null,
        val.direction,
        t,
        t,
      );
    }
  });
  tx();
}

export function listActiveCountries(): Array<Record<string, unknown>> {
  ensureGlobalSchema();
  return getBookEngineDb()
    .prepare("SELECT * FROM countries WHERE deleted_at IS NULL ORDER BY name_en")
    .all() as Array<Record<string, unknown>>;
}

export function setReadinessCheck(checkKey: string, passed: boolean, evidence: string): void {
  ensureGlobalSchema();
  const db = getBookEngineDb();
  const t = nowIso();
  db.prepare(
    `INSERT INTO global_readiness_checks (id, check_key, passed, evidence, checked_at)
     VALUES (?,?,?,?,?)
     ON CONFLICT(check_key) DO UPDATE SET passed=excluded.passed, evidence=excluded.evidence, checked_at=excluded.checked_at`,
  ).run(uuid(), checkKey, passed ? 1 : 0, evidence, t);
}

export function getReadinessChecks(): Array<Record<string, unknown>> {
  ensureGlobalSchema();
  return getBookEngineDb().prepare("SELECT * FROM global_readiness_checks ORDER BY check_key").all() as Array<
    Record<string, unknown>
  >;
}
