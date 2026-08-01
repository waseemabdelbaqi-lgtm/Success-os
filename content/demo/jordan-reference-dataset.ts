/**
 * Jordan National Curriculum — official reference dataset (metadata standard).
 * Hierarchical ID convention (every future country must follow the same shape):
 *
 *   Country    JO
 *   Curriculum JO-NATIONAL
 *   Grade      JO-NATIONAL-G01
 *   Subject    JO-NATIONAL-G01-MATH
 *   Book       JO-NATIONAL-G01-MATH-B01
 *   Unit       JO-NATIONAL-G01-MATH-B01-U01
 *   Lesson     JO-NATIONAL-G01-MATH-B01-U01-L01
 *
 * Metadata only — no AI content. Schema companion: success-os.curriculum-hierarchy.v1
 */
import type { LocaleText } from "@/types/interactive-lesson-engine";
import type { RightsStatus, VerificationStatus } from "@/types/curriculum-import-engine";

export type JordanLessonSeed = {
  id: string;
  order: number;
  title: LocaleText;
  objectives: LocaleText[];
  keywords: string[];
  references: { label: LocaleText; href?: string }[];
  /** Intentional fixture status for verification demos */
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
  /** If true, lesson is eligible to compile an ILE package when verified */
  packageEligible: boolean;
};

export type JordanUnitSeed = {
  id: string;
  order: number;
  title: LocaleText;
  lessons: JordanLessonSeed[];
};

export type JordanBookSeed = {
  id: string;
  part: string;
  title: LocaleText;
  units: JordanUnitSeed[];
};

export type JordanSubjectSeed = {
  id: string;
  code: string;
  name: LocaleText;
  books: JordanBookSeed[];
};

export type JordanGradeSeed = {
  id: string;
  code: string;
  name: LocaleText;
  order: number;
  semesterId: string;
  semesterName: LocaleText;
  subjects: JordanSubjectSeed[];
};

/** Official hierarchical ID helpers — Country → … → Lesson */
export const JO_IDS = {
  country: "JO",
  curriculum: "JO-NATIONAL",
  grade: "JO-NATIONAL-G01",
  semester: "JO-NATIONAL-G01-S01",
  subject: (code: string) => `JO-NATIONAL-G01-${code}`,
  book: (subjectCode: string, book: number) =>
    `JO-NATIONAL-G01-${subjectCode}-B${String(book).padStart(2, "0")}`,
  unit: (subjectCode: string, book: number, unit: number) =>
    `JO-NATIONAL-G01-${subjectCode}-B${String(book).padStart(2, "0")}-U${String(unit).padStart(2, "0")}`,
  lesson: (subjectCode: string, book: number, unit: number, lesson: number) =>
    `JO-NATIONAL-G01-${subjectCode}-B${String(book).padStart(2, "0")}-U${String(unit).padStart(2, "0")}-L${String(lesson).padStart(2, "0")}`,
} as const;

/** Canonical published reference lesson */
export const JO_CANONICAL_LESSON_ID = JO_IDS.lesson("MATH", 1, 1, 1);

function L(en: string, ar: string): LocaleText {
  return { en, ar };
}

function lesson(
  id: string,
  order: number,
  titleEn: string,
  titleAr: string,
  opts?: Partial<JordanLessonSeed>,
): JordanLessonSeed {
  return {
    id,
    order,
    title: L(titleEn, titleAr),
    objectives: [
      L(`Identify core idea of ${titleEn}`, `تحديد الفكرة الأساسية لـ ${titleAr}`),
      L(`Apply ${titleEn} in a simple classroom task`, `تطبيق ${titleAr} في مهمة صفية بسيطة`),
    ],
    keywords: titleEn
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .slice(0, 5),
    references: [
      {
        label: L("NCCD structure baseline", "خط أساس بنية المركز الوطني"),
        href: "https://nccd.gov.jo",
      },
    ],
    rightsStatus: "verified",
    verificationStatus: "verified",
    packageEligible: true,
    ...opts,
  };
}

/** Official Jordan reference tree — Grade 1 National Curriculum (Semester 1 focus) */
export const JORDAN_REFERENCE_DATASET = {
  schema: "success-os.jordan-reference-dataset.v1" as const,
  idConvention: {
    pattern:
      "{COUNTRY} / {COUNTRY}-{CURRICULUM} / …-G{nn} / …-{SUBJECT} / …-B{nn} / …-U{nn} / …-L{nn}",
    example: {
      country: JO_IDS.country,
      curriculum: JO_IDS.curriculum,
      grade: JO_IDS.grade,
      subject: JO_IDS.subject("MATH"),
      book: JO_IDS.book("MATH", 1),
      unit: JO_IDS.unit("MATH", 1, 1),
      lesson: JO_CANONICAL_LESSON_ID,
    },
  },
  country: {
    id: JO_IDS.country,
    code: "JO",
    name: L("Jordan", "الأردن"),
  },
  curriculum: {
    id: JO_IDS.curriculum,
    name: L("Jordan National Curriculum", "المنهاج الوطني الأردني"),
    academicYear: "2025/2026",
    kind: "national" as const,
  },
  source: {
    id: "JO-NCCD-REFERENCE",
    authority: "National Center for Curriculum Development (NCCD)",
    license: "structure-reference-only",
    connectorId: "jordan-reference-dataset",
  },
  grades: [
    {
      id: JO_IDS.grade,
      code: "G01",
      name: L("Grade 1", "الصف الأول"),
      order: 1,
      semesterId: JO_IDS.semester,
      semesterName: L("Semester 1", "الفصل الدراسي الأول"),
      subjects: [
        {
          id: JO_IDS.subject("MATH"),
          code: "MATH",
          name: L("Mathematics", "الرياضيات"),
          books: [
            {
              id: JO_IDS.book("MATH", 1),
              part: "Book 1",
              title: L("Mathematics — Grade 1 — Book 1", "الرياضيات - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: JO_IDS.unit("MATH", 1, 1),
                  order: 1,
                  title: L("Unit 1 — Numbers around us", "الوحدة 1 — الأعداد من حولنا"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("MATH", 1, 1, 1),
                      1,
                      "Lesson 1 — Count to three",
                      "الدرس 1 — العدّ حتى ثلاثة",
                    ),
                    lesson(
                      JO_IDS.lesson("MATH", 1, 1, 2),
                      2,
                      "Lesson 2 — Count to five",
                      "الدرس 2 — العدّ حتى خمسة",
                    ),
                    lesson(
                      JO_IDS.lesson("MATH", 1, 1, 3),
                      3,
                      "Lesson 3 — Compare small sets",
                      "الدرس 3 — مقارنة مجموعات صغيرة",
                    ),
                  ],
                },
                {
                  id: JO_IDS.unit("MATH", 1, 2),
                  order: 2,
                  title: L("Unit 2 — Shapes", "الوحدة 2 — الأشكال"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("MATH", 1, 2, 1),
                      1,
                      "Lesson 1 — Circles and squares",
                      "الدرس 1 — الدائرة والمربع",
                    ),
                    lesson(
                      JO_IDS.lesson("MATH", 1, 2, 2),
                      2,
                      "Lesson 2 — Triangles",
                      "الدرس 2 — المثلث",
                      {
                        verificationStatus: "pending",
                        packageEligible: false,
                      },
                    ),
                  ],
                },
              ],
            },
            {
              id: JO_IDS.book("MATH", 2),
              part: "Book 2",
              title: L("Mathematics — Grade 1 — Book 2", "الرياضيات - الصف الأول - الكتاب 2"),
              units: [
                {
                  id: JO_IDS.unit("MATH", 2, 1),
                  order: 1,
                  title: L("Unit 1 — Addition readiness", "الوحدة 1 — الاستعداد للجمع"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("MATH", 2, 1, 1),
                      1,
                      "Lesson 1 — Putting together",
                      "الدرس 1 — الجمع معًا",
                      {
                        rightsStatus: "restricted",
                        verificationStatus: "pending",
                        packageEligible: false,
                      },
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: JO_IDS.subject("AR"),
          code: "AR",
          name: L("Arabic", "اللغة العربية"),
          books: [
            {
              id: JO_IDS.book("AR", 1),
              part: "Book 1",
              title: L("Arabic — Grade 1 — Book 1", "اللغة العربية - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: JO_IDS.unit("AR", 1, 1),
                  order: 1,
                  title: L("Unit 1 — Letters", "الوحدة 1 — الحروف"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("AR", 1, 1, 1),
                      1,
                      "Lesson 1 — Letter Alif",
                      "الدرس 1 — حرف الألف",
                    ),
                    lesson(
                      JO_IDS.lesson("AR", 1, 1, 2),
                      2,
                      "Lesson 2 — Letter Ba",
                      "الدرس 2 — حرف الباء",
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: JO_IDS.subject("EN"),
          code: "EN",
          name: L("English", "اللغة الإنجليزية"),
          books: [
            {
              id: JO_IDS.book("EN", 1),
              part: "Book 1",
              title: L("English — Grade 1 — Book 1", "الإنجليزية - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: JO_IDS.unit("EN", 1, 1),
                  order: 1,
                  title: L("Unit 1 — Hello", "الوحدة 1 — مرحبًا"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("EN", 1, 1, 1),
                      1,
                      "Lesson 1 — Greetings",
                      "الدرس 1 — التحيات",
                    ),
                    lesson(
                      JO_IDS.lesson("EN", 1, 1, 2),
                      2,
                      "Lesson 2 — My name",
                      "الدرس 2 — اسمي",
                      {
                        verificationStatus: "rejected",
                        rightsStatus: "rejected",
                        packageEligible: false,
                      },
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: JO_IDS.subject("SCI"),
          code: "SCI",
          name: L("Science", "العلوم"),
          books: [
            {
              id: JO_IDS.book("SCI", 1),
              part: "Book 1",
              title: L("Science — Grade 1 — Book 1", "العلوم - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: JO_IDS.unit("SCI", 1, 1),
                  order: 1,
                  title: L("Unit 1 — Living things", "الوحدة 1 — الكائنات الحية"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("SCI", 1, 1, 1),
                      1,
                      "Lesson 1 — Plants and animals",
                      "الدرس 1 — النباتات والحيوانات",
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: JO_IDS.subject("ISL"),
          code: "ISL",
          name: L("Islamic Education", "التربية الإسلامية"),
          books: [
            {
              id: JO_IDS.book("ISL", 1),
              part: "Book 1",
              title: L(
                "Islamic Education — Grade 1 — Book 1",
                "التربية الإسلامية - الصف الأول - الكتاب 1",
              ),
              units: [
                {
                  id: JO_IDS.unit("ISL", 1, 1),
                  order: 1,
                  title: L("Unit 1 — Good manners", "الوحدة 1 — الآداب"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("ISL", 1, 1, 1),
                      1,
                      "Lesson 1 — Saying salaam",
                      "الدرس 1 — إلقاء السلام",
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: JO_IDS.subject("SOC"),
          code: "SOC",
          name: L("Social Studies", "التربية الاجتماعية"),
          books: [
            {
              id: JO_IDS.book("SOC", 1),
              part: "Book 1",
              title: L(
                "Social Studies — Grade 1 — Book 1",
                "التربية الاجتماعية - الصف الأول - الكتاب 1",
              ),
              units: [
                {
                  id: JO_IDS.unit("SOC", 1, 1),
                  order: 1,
                  title: L("Unit 1 — My family", "الوحدة 1 — أسرتي"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("SOC", 1, 1, 1),
                      1,
                      "Lesson 1 — Family members",
                      "الدرس 1 — أفراد الأسرة",
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: JO_IDS.subject("ART"),
          code: "ART",
          name: L("Art", "التربية الفنية"),
          books: [
            {
              id: JO_IDS.book("ART", 1),
              part: "Book 1",
              title: L("Art — Grade 1 — Book 1", "التربية الفنية - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: JO_IDS.unit("ART", 1, 1),
                  order: 1,
                  title: L("Unit 1 — Colors", "الوحدة 1 — الألوان"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("ART", 1, 1, 1),
                      1,
                      "Lesson 1 — Primary colors",
                      "الدرس 1 — الألوان الأساسية",
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: JO_IDS.subject("PE"),
          code: "PE",
          name: L("Physical Education", "التربية الرياضية"),
          books: [
            {
              id: JO_IDS.book("PE", 1),
              part: "Book 1",
              title: L(
                "Physical Education — Grade 1 — Book 1",
                "التربية الرياضية - الصف الأول - الكتاب 1",
              ),
              units: [
                {
                  id: JO_IDS.unit("PE", 1, 1),
                  order: 1,
                  title: L("Unit 1 — Movement", "الوحدة 1 — الحركة"),
                  lessons: [
                    lesson(
                      JO_IDS.lesson("PE", 1, 1, 1),
                      1,
                      "Lesson 1 — Warm-up games",
                      "الدرس 1 — ألعاب الإحماء",
                    ),
                  ],
                },
              ],
            },
          ],
        },
      ],
    } satisfies JordanGradeSeed,
  ],
};

export function flattenJordanReferenceTree() {
  const grade = JORDAN_REFERENCE_DATASET.grades[0]!;
  const rows: {
    grade: string;
    semester: string;
    subject: string;
    book: string;
    unit: string;
    lessonId: string;
    lessonOrder: number;
    title: LocaleText;
  }[] = [];
  for (const subject of grade.subjects) {
    for (const book of subject.books) {
      for (const unit of book.units) {
        for (const les of unit.lessons) {
          rows.push({
            grade: grade.name.en,
            semester: grade.semesterName.en,
            subject: subject.name.en,
            book: book.title.en,
            unit: unit.title.en,
            lessonId: les.id,
            lessonOrder: les.order,
            title: les.title,
          });
        }
      }
    }
  }
  return rows;
}
