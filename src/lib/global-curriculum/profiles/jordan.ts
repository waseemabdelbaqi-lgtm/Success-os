import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { upsertCountry, upsertTerminology } from "@/src/lib/global-curriculum/repository";
import { buildMasterInventory } from "@/src/lib/jordan-books/matrix/master-inventory";
import type { TerminologyMap } from "@/src/lib/global-curriculum/types";

export const JORDAN_COUNTRY_ID = "country-jo";
export const JORDAN_CURRICULUM_ID = "curriculum-jo-national";
export const JORDAN_ISO = "JO";

export const JORDAN_TERMINOLOGY: TerminologyMap = {
  grade: {
    labelAr: "صف",
    labelEn: "Grade",
    singular: "صف",
    plural: "صفوف",
    direction: "rtl",
  },
  term: {
    labelAr: "فصل دراسي",
    labelEn: "Semester",
    singular: "فصل",
    plural: "فصول",
    direction: "rtl",
  },
  subject: {
    labelAr: "مبحث",
    labelEn: "Subject",
    direction: "rtl",
  },
  pathway: {
    labelAr: "مسار",
    labelEn: "Pathway",
    direction: "rtl",
  },
  textbook: {
    labelAr: "كتاب مدرسي",
    labelEn: "Textbook",
    direction: "rtl",
  },
  national_exam: {
    labelAr: "التوجيهي",
    labelEn: "Tawjihi",
    direction: "rtl",
  },
  kindergarten: {
    labelAr: "رياض الأطفال",
    labelEn: "Kindergarten",
    direction: "rtl",
  },
  stage: {
    labelAr: "مرحلة",
    labelEn: "Stage",
    direction: "rtl",
  },
  student_book: {
    labelAr: "كتاب الطالب",
    labelEn: "Student Book",
    direction: "rtl",
  },
  teacher_guide: {
    labelAr: "دليل المعلم",
    labelEn: "Teacher Guide",
    direction: "rtl",
  },
  activity_book: {
    labelAr: "كتاب الأنشطة",
    labelEn: "Activity Book",
    direction: "rtl",
  },
};

function slugSubject(ar: string): string {
  return ar
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\-]/g, "")
    .slice(0, 80);
}

/**
 * Seeds Jordan as the first active country profile and syncs inventory matrix cells into DB.
 * Does NOT invent editions or mark official books complete.
 */
export function seedJordanGlobalProfile(): {
  countryId: string;
  curriculumId: string;
  inventoryCells: number;
  blockers: number;
} {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();

  upsertCountry({
    id: JORDAN_COUNTRY_ID,
    isoCode: JORDAN_ISO,
    nameAr: "الأردن",
    nameEn: "Jordan",
    nameNative: "الأردن",
    region: "Asia",
    subregion: "Western Asia",
    flagEmoji: "🇯🇴",
    defaultLanguage: "ar",
    supportedLanguages: ["ar", "en"],
    currencyCode: "JOD",
    timezone: "Asia/Amman",
    status: "active",
    studentVisible: true,
  });

  const authId = "auth-jo-nccd";
  const existingAuth = db.prepare("SELECT id FROM education_authorities WHERE id=?").get(authId);
  if (!existingAuth) {
    db.prepare(
      `INSERT INTO education_authorities (
        id, country_id, authority_type, name_ar, name_en, official_website, verification_status, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(
      authId,
      JORDAN_COUNTRY_ID,
      "curriculum",
      "المركز الوطني لتطوير المناهج",
      "National Center for Curriculum Development (NCCD)",
      "https://nccd.gov.jo",
      "reachable_unverified",
      t,
      t,
    );
  }

  const moeId = "auth-jo-moe";
  if (!db.prepare("SELECT id FROM education_authorities WHERE id=?").get(moeId)) {
    db.prepare(
      `INSERT INTO education_authorities (
        id, country_id, authority_type, name_ar, name_en, official_website, verification_status, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(
      moeId,
      JORDAN_COUNTRY_ID,
      "ministry",
      "وزارة التربية والتعليم",
      "Ministry of Education",
      "https://moe.gov.jo",
      "reachable_unverified",
      t,
      t,
    );
  }

  if (!db.prepare("SELECT id FROM curricula WHERE id=?").get(JORDAN_CURRICULUM_ID)) {
    db.prepare(
      `INSERT INTO curricula (
        id, country_id, authority_id, code, name_ar, name_en, ownership, scope,
        supported_languages_json, status, official_source_url, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      JORDAN_CURRICULUM_ID,
      JORDAN_COUNTRY_ID,
      authId,
      "national",
      "المنهاج الوطني الأردني",
      "Jordan National Curriculum",
      "public",
      "national",
      JSON.stringify(["ar", "en"]),
      "active",
      "https://nccd.gov.jo/Ar/Pages/textbooks",
      t,
      t,
    );
  }

  upsertTerminology(JORDAN_COUNTRY_ID, JORDAN_CURRICULUM_ID, JORDAN_TERMINOLOGY);

  // Structure nodes from Jordan grades
  const stages = [
    { code: "early_childhood", labelAr: "رياض الأطفال", labelEn: "Early Childhood", order: 1 },
    { code: "basic", labelAr: "التعليم الأساسي", labelEn: "Basic Education", order: 2 },
    { code: "secondary", labelAr: "التعليم الثانوي", labelEn: "Secondary Education", order: 3 },
  ];
  for (const s of stages) {
    const id = `node-jo-stage-${s.code}`;
    if (!db.prepare("SELECT id FROM educational_structure_nodes WHERE id=?").get(id)) {
      db.prepare(
        `INSERT INTO educational_structure_nodes (
          id, curriculum_id, node_type, code, label_ar, label_en, sort_order, created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?)`,
      ).run(id, JORDAN_CURRICULUM_ID, "stage", s.code, s.labelAr, s.labelEn, s.order, t, t);
    }
  }

  const sourceProfileId = "source-jo-national";
  if (!db.prepare("SELECT id FROM source_profiles WHERE id=?").get(sourceProfileId)) {
    db.prepare(
      `INSERT INTO source_profiles (
        id, country_id, curriculum_id, authority_id, profile_name,
        ministry_urls_json, curriculum_authority_urls_json, textbook_repository_urls_json,
        examination_urls_json, licensing_info, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      sourceProfileId,
      JORDAN_COUNTRY_ID,
      JORDAN_CURRICULUM_ID,
      authId,
      "Jordan NCCD/MoE textbook sources",
      JSON.stringify(["https://moe.gov.jo"]),
      JSON.stringify(["https://nccd.gov.jo"]),
      JSON.stringify(["https://nccd.gov.jo/Ar/Pages/textbooks"]),
      JSON.stringify(["https://moe.gov.jo"]),
      "Official textbooks: rights classification required per book. Default: original companion required until rights decision.",
      t,
      t,
    );
  }

  if (!db.prepare("SELECT id FROM assessment_profiles WHERE curriculum_id=?").get(JORDAN_CURRICULUM_ID)) {
    db.prepare(
      `INSERT INTO assessment_profiles (
        id, curriculum_id, name_en, name_ar, grading_scale_json, passing_score,
        assessment_types_json, national_examination_label, continuous_assessment, qualification_requirements, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      uuid(),
      JORDAN_CURRICULUM_ID,
      "Jordan national assessment profile",
      "ملف التقييم الوطني الأردني",
      JSON.stringify({ scale: "0-100", note: "configurable" }),
      "50",
      JSON.stringify(["continuous", "unit_test", "national_exam"]),
      "Tawjihi",
      1,
      "Secondary academic/vocational pathways lead to Tawjihi / ministry qualifications.",
      t,
      t,
    );
  }

  // Sync inventory matrix from master inventory (truthful statuses)
  const cells = buildMasterInventory();
  db.prepare("DELETE FROM inventory_matrix_cells WHERE country_id=?").run(JORDAN_COUNTRY_ID);

  const insert = db.prepare(
    `INSERT INTO inventory_matrix_cells (
      id, country_id, curriculum_id, curriculum_version_label, academic_year_label,
      stage_code, grade_code, term_code, pathway_code, subject_code,
      subject_title_ar, book_type, official_title_ar, edition_label, source_url,
      discovery_source, subject_list_status, rights_status, matrix_status, blocker,
      structured_book_id, completeness_claim, verification_date, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );

  let blockers = 0;
  const tx = db.transaction(() => {
    for (const c of cells) {
      const editionUnverified =
        !c.curriculumVersion ||
        c.curriculumVersion === "NEEDS VERIFICATION" ||
        !c.academicYear ||
        c.academicYear === "NEEDS VERIFICATION";
      const isOfficial = c.bookType !== "sos_companion";
      let matrixStatus = c.matrixStatus;
      let blocker = c.blocker || null;
      let rightsStatus = c.rightsStatus || "rights_review_required";
      let completeness = "not_complete";

      if (isOfficial && editionUnverified) {
        matrixStatus = matrixStatus === "NOT_DISCOVERED" ? "NOT_DISCOVERED" : "DISCOVERED";
        blocker = blocker || "edition_uncertain|source_verification_blocked_nccd_unreachable";
        rightsStatus = "rights_review_required";
        blockers += 1;
      }
      if (c.bookType === "sos_companion") {
        rightsStatus = "original_companion_required";
        // Companion matrix statuses from queue are production states, not official completion
        if (matrixStatus === "CONTENT_COMPLETE") {
          completeness = "sos_companion_structured_not_official_complete";
        }
      }

      insert.run(
        c.id,
        JORDAN_COUNTRY_ID,
        JORDAN_CURRICULUM_ID,
        c.curriculumVersion || "NEEDS VERIFICATION",
        c.academicYear || "NEEDS VERIFICATION",
        c.stage,
        c.gradeKey,
        c.semester,
        c.pathway,
        c.subjectSlug || slugSubject(c.subjectAr),
        c.subjectAr,
        c.bookType,
        c.officialTitleAr || null,
        c.curriculumVersion || "NEEDS VERIFICATION",
        c.officialSourceUrl || null,
        c.discoverySource || null,
        c.subjectListStatus,
        rightsStatus,
        matrixStatus,
        blocker,
        c.structuredBookId || null,
        completeness,
        c.verificationDate || null,
        t,
        t,
      );
    }
  });
  tx();

  // Default Jordan rights classification
  if (!db.prepare("SELECT id FROM rights_classifications WHERE id=?").get("rights-jo-default")) {
    db.prepare(
      `INSERT INTO rights_classifications (
        id, country_id, resource_type, authority_name, curriculum_id, edition_label,
        academic_year_label, source_url, rights_owner, license, permitted_actions_json,
        commercial_use_status, modification_status, attribution_requirements, outcome,
        verification_date, reviewer, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      "rights-jo-default",
      JORDAN_COUNTRY_ID,
      "curriculum_default",
      "NCCD / MoE",
      JORDAN_CURRICULUM_ID,
      "NEEDS VERIFICATION",
      "NEEDS VERIFICATION",
      "https://nccd.gov.jo/Ar/Pages/textbooks",
      "Hashemite Kingdom of Jordan / NCCD",
      "unclassified",
      JSON.stringify(["link_only_until_review"]),
      "unknown",
      "original_companion_required",
      "Attribute NCCD/MoE; do not republish official PDF pages without rights clearance.",
      "original_companion_required",
      t.slice(0, 10),
      "system-gate3",
      t,
      t,
    );
  }

  return {
    countryId: JORDAN_COUNTRY_ID,
    curriculumId: JORDAN_CURRICULUM_ID,
    inventoryCells: cells.length,
    blockers,
  };
}
