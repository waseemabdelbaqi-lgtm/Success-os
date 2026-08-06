/**
 * Official Jordan National Curriculum — Grade 1 source document.
 * Consumed by dynamic discovery. Subjects listed here are the ONLY subjects
 * that may appear for Jordan Grade 1. Physics/Chemistry/Biology are absent
 * because they do not officially exist at this grade.
 *
 * Schema: success-os.official-curriculum-source.v1
 */
import type { OfficialCurriculumSource } from "@/types/curriculum-discovery";
import type { LocaleText } from "@/types/interactive-lesson-engine";

function L(en: string, ar: string): LocaleText {
  return { en, ar };
}

function simpleLesson(
  order: number,
  titleEn: string,
  titleAr: string,
  opts?: {
    rightsStatus?: "cleared" | "restricted" | "rejected" | "unknown";
    verificationStatus?: "verified" | "pending" | "rejected" | "failed";
    packageEligible?: boolean;
  },
) {
  return {
    order,
    title: L(titleEn, titleAr),
    learningObjectives: [
      L(`Identify core idea of ${titleEn}`, `تحديد الفكرة الأساسية لـ ${titleAr}`),
      L(`Apply ${titleEn} in a simple classroom task`, `تطبيق ${titleAr} في مهمة صفية بسيطة`),
    ],
    keywords: titleEn
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6),
    references: [
      {
        label: L("Jordan National Curriculum — Grade 1", "المنهاج الوطني الأردني — الصف الأول"),
      },
    ],
    assets: [] as { kind: string; href?: string; label?: string }[],
    rightsStatus: opts?.rightsStatus || ("cleared" as const),
    verificationStatus: opts?.verificationStatus || ("verified" as const),
    packageEligible: opts?.packageEligible ?? true,
  };
}

/**
 * Official Grade 1 subject set (example from product standard):
 * Arabic, English, Mathematics, Science, Islamic Education,
 * Social Studies, Art, Physical Education.
 */
export const JORDAN_NATIONAL_G1_OFFICIAL_SOURCE: OfficialCurriculumSource = {
  schema: "success-os.official-curriculum-source.v1",
  sourceId: "JO-NCCD-G01-2025-2026",
  authority: "National Center for Curriculum Development (NCCD)",
  connectorId: "jordan-nccd",
  countryCode: "JO",
  countryName: L("Jordan", "الأردن"),
  curriculumCode: "NATIONAL",
  curriculumName: L("Jordan National Curriculum", "المنهاج الوطني الأردني"),
  curriculumKind: "national",
  academicYear: "2025/2026",
  license: "structure-reference-only",
  grades: [
    {
      code: "G01",
      name: L("Grade 1", "الصف الأول"),
      order: 1,
      semesters: [
        {
          code: "S01",
          name: L("Semester 1", "الفصل الدراسي الأول"),
          order: 1,
        },
      ],
      subjects: [
        {
          localCode: "AR",
          localLabel: L("Arabic", "اللغة العربية"),
          aliasLabel: "لغة عربية",
          semesterCode: "S01",
          books: [
            {
              part: "Book 1",
              title: L("Arabic — Grade 1 — Book 1", "اللغة العربية - الصف الأول - الكتاب 1"),
              language: "ar",
              version: "2025.1",
              units: [
                {
                  order: 1,
                  title: L("Unit 1 — Letters", "الوحدة 1 — الحروف"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Letter Alif", "الدرس 1 — حرف الألف"),
                    simpleLesson(2, "Lesson 2 — Letter Ba", "الدرس 2 — حرف الباء"),
                  ],
                },
              ],
            },
          ],
        },
        {
          localCode: "EN",
          localLabel: L("English", "اللغة الإنجليزية"),
          aliasLabel: "English",
          semesterCode: "S01",
          books: [
            {
              part: "Book 1",
              title: L("English — Grade 1 — Book 1", "الإنجليزية - الصف الأول - الكتاب 1"),
              language: "en",
              version: "2025.1",
              units: [
                {
                  order: 1,
                  title: L("Unit 1 — Hello", "الوحدة 1 — مرحبًا"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Greetings", "الدرس 1 — التحيات"),
                    simpleLesson(2, "Lesson 2 — My name", "الدرس 2 — اسمي", {
                      verificationStatus: "rejected",
                      rightsStatus: "rejected",
                      packageEligible: false,
                    }),
                  ],
                },
              ],
            },
          ],
        },
        {
          localCode: "MATH",
          localLabel: L("Mathematics", "الرياضيات"),
          aliasLabel: "رياضيات",
          semesterCode: "S01",
          books: [
            {
              part: "Book 1",
              title: L("Mathematics — Grade 1 — Book 1", "الرياضيات - الصف الأول - الكتاب 1"),
              language: "bilingual",
              version: "2025.1",
              units: [
                {
                  order: 1,
                  title: L("Unit 1 — Numbers around us", "الوحدة 1 — الأعداد من حولنا"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Count to three", "الدرس 1 — العدّ حتى ثلاثة"),
                    simpleLesson(2, "Lesson 2 — Count to five", "الدرس 2 — العدّ حتى خمسة"),
                    simpleLesson(3, "Lesson 3 — Compare small sets", "الدرس 3 — مقارنة مجموعات صغيرة"),
                  ],
                },
                {
                  order: 2,
                  title: L("Unit 2 — Shapes", "الوحدة 2 — الأشكال"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Circles and squares", "الدرس 1 — الدائرة والمربع"),
                    simpleLesson(2, "Lesson 2 — Triangles", "الدرس 2 — المثلث", {
                      verificationStatus: "pending",
                      packageEligible: false,
                    }),
                  ],
                },
              ],
            },
            {
              part: "Book 2",
              title: L("Mathematics — Grade 1 — Book 2", "الرياضيات - الصف الأول - الكتاب 2"),
              language: "bilingual",
              version: "2025.1",
              units: [
                {
                  order: 1,
                  title: L("Unit 1 — Addition readiness", "الوحدة 1 — الاستعداد للجمع"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Putting together", "الدرس 1 — الجمع معًا", {
                      rightsStatus: "restricted",
                      verificationStatus: "pending",
                      packageEligible: false,
                    }),
                  ],
                },
              ],
            },
          ],
        },
        {
          localCode: "SCI",
          localLabel: L("Science", "العلوم"),
          aliasLabel: "علوم",
          semesterCode: "S01",
          books: [
            {
              part: "Book 1",
              title: L("Science — Grade 1 — Book 1", "العلوم - الصف الأول - الكتاب 1"),
              language: "ar",
              version: "2025.1",
              units: [
                {
                  order: 1,
                  title: L("Unit 1 — Living things", "الوحدة 1 — الكائنات الحية"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Plants and animals", "الدرس 1 — النباتات والحيوانات"),
                  ],
                },
              ],
            },
          ],
        },
        {
          localCode: "ISL",
          localLabel: L("Islamic Education", "التربية الإسلامية"),
          aliasLabel: "تربية إسلامية",
          semesterCode: "S01",
          books: [
            {
              part: "Book 1",
              title: L(
                "Islamic Education — Grade 1 — Book 1",
                "التربية الإسلامية - الصف الأول - الكتاب 1",
              ),
              language: "ar",
              version: "2025.1",
              units: [
                {
                  order: 1,
                  title: L("Unit 1 — Good manners", "الوحدة 1 — الآداب"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Saying salaam", "الدرس 1 — إلقاء السلام"),
                  ],
                },
              ],
            },
          ],
        },
        {
          localCode: "SOC",
          localLabel: L("Social Studies", "التربية الاجتماعية"),
          aliasLabel: "تربية اجتماعية",
          semesterCode: "S01",
          books: [
            {
              part: "Book 1",
              title: L(
                "Social Studies — Grade 1 — Book 1",
                "التربية الاجتماعية - الصف الأول - الكتاب 1",
              ),
              language: "ar",
              version: "2025.1",
              units: [
                {
                  order: 1,
                  title: L("Unit 1 — My family", "الوحدة 1 — أسرتي"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Family members", "الدرس 1 — أفراد الأسرة"),
                  ],
                },
              ],
            },
          ],
        },
        {
          localCode: "ART",
          localLabel: L("Art", "التربية الفنية"),
          aliasLabel: "تربية فنية",
          semesterCode: "S01",
          books: [
            {
              part: "Book 1",
              title: L("Art — Grade 1 — Book 1", "التربية الفنية - الصف الأول - الكتاب 1"),
              language: "ar",
              version: "2025.1",
              units: [
                {
                  order: 1,
                  title: L("Unit 1 — Colors", "الوحدة 1 — الألوان"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Primary colors", "الدرس 1 — الألوان الأساسية"),
                  ],
                },
              ],
            },
          ],
        },
        {
          localCode: "PE",
          localLabel: L("Physical Education", "التربية الرياضية"),
          aliasLabel: "تربية رياضية",
          semesterCode: "S01",
          books: [
            {
              part: "Book 1",
              title: L(
                "Physical Education — Grade 1 — Book 1",
                "التربية الرياضية - الصف الأول - الكتاب 1",
              ),
              language: "ar",
              version: "2025.1",
              units: [
                {
                  order: 1,
                  title: L("Unit 1 — Movement", "الوحدة 1 — الحركة"),
                  lessons: [
                    simpleLesson(1, "Lesson 1 — Warm-up games", "الدرس 1 — ألعاب الإحماء"),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** Subjects that must NOT appear in Jordan Grade 1 discovery. */
export const JORDAN_G01_EXCLUDED_SUBJECT_CODES = [
  "PHYSICS",
  "CHEMISTRY",
  "BIOLOGY",
] as const;
