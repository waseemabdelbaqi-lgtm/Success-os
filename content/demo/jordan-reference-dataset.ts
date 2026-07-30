/**
 * Jordan National Curriculum — official reference dataset (metadata standard).
 * Grade 1 skeleton with multiple subjects. Metadata only — no AI content.
 * Schema companion: success-os.curriculum-hierarchy.v1
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
  country: {
    id: "country_jordan",
    code: "JO",
    name: L("Jordan", "الأردن"),
  },
  curriculum: {
    id: "curr_jordan_national",
    name: L("Jordan National Curriculum", "المنهاج الوطني الأردني"),
    academicYear: "2025/2026",
    kind: "national" as const,
  },
  source: {
    id: "src_jo_nccd_reference",
    authority: "National Center for Curriculum Development (NCCD)",
    license: "structure-reference-only",
    connectorId: "jordan-reference-dataset",
  },
  grades: [
    {
      id: "grade_jo_1",
      code: "G1",
      name: L("Grade 1", "الصف الأول"),
      order: 1,
      semesterId: "sem_jo_g1_s1",
      semesterName: L("Semester 1", "الفصل الدراسي الأول"),
      subjects: [
        {
          id: "subj_jo_g1_math",
          code: "MATH",
          name: L("Mathematics", "الرياضيات"),
          books: [
            {
              id: "JO-G1-MATH-B1",
              part: "Book 1",
              title: L("Mathematics — Grade 1 — Book 1", "الرياضيات - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: "jo_g1_math_u1",
                  order: 1,
                  title: L("Unit 1 — Numbers around us", "الوحدة 1 — الأعداد من حولنا"),
                  lessons: [
                    lesson("jo_g1_math_u1_l1", 1, "Lesson 1 — Count to three", "الدرس 1 — العدّ حتى ثلاثة"),
                    lesson("jo_g1_math_u1_l2", 2, "Lesson 2 — Count to five", "الدرس 2 — العدّ حتى خمسة"),
                    lesson("jo_g1_math_u1_l3", 3, "Lesson 3 — Compare small sets", "الدرس 3 — مقارنة مجموعات صغيرة"),
                  ],
                },
                {
                  id: "jo_g1_math_u2",
                  order: 2,
                  title: L("Unit 2 — Shapes", "الوحدة 2 — الأشكال"),
                  lessons: [
                    lesson("jo_g1_math_u2_l1", 1, "Lesson 1 — Circles and squares", "الدرس 1 — الدائرة والمربع"),
                    lesson("jo_g1_math_u2_l2", 2, "Lesson 2 — Triangles", "الدرس 2 — المثلث", {
                      verificationStatus: "pending",
                      packageEligible: false,
                    }),
                  ],
                },
              ],
            },
            {
              id: "JO-G1-MATH-B2",
              part: "Book 2",
              title: L("Mathematics — Grade 1 — Book 2", "الرياضيات - الصف الأول - الكتاب 2"),
              units: [
                {
                  id: "jo_g1_math_b2_u1",
                  order: 1,
                  title: L("Unit 1 — Addition readiness", "الوحدة 1 — الاستعداد للجمع"),
                  lessons: [
                    lesson("jo_g1_math_b2_u1_l1", 1, "Lesson 1 — Putting together", "الدرس 1 — الجمع معًا", {
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
          id: "subj_jo_g1_ar",
          code: "AR",
          name: L("Arabic", "اللغة العربية"),
          books: [
            {
              id: "JO-G1-AR-B1",
              part: "Book 1",
              title: L("Arabic — Grade 1 — Book 1", "اللغة العربية - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: "jo_g1_ar_u1",
                  order: 1,
                  title: L("Unit 1 — Letters", "الوحدة 1 — الحروف"),
                  lessons: [
                    lesson("jo_g1_ar_u1_l1", 1, "Lesson 1 — Letter Alif", "الدرس 1 — حرف الألف"),
                    lesson("jo_g1_ar_u1_l2", 2, "Lesson 2 — Letter Ba", "الدرس 2 — حرف الباء"),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "subj_jo_g1_en",
          code: "EN",
          name: L("English", "اللغة الإنجليزية"),
          books: [
            {
              id: "JO-G1-EN-B1",
              part: "Book 1",
              title: L("English — Grade 1 — Book 1", "الإنجليزية - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: "jo_g1_en_u1",
                  order: 1,
                  title: L("Unit 1 — Hello", "الوحدة 1 — مرحبًا"),
                  lessons: [
                    lesson("jo_g1_en_u1_l1", 1, "Lesson 1 — Greetings", "الدرس 1 — التحيات"),
                    lesson("jo_g1_en_u1_l2", 2, "Lesson 2 — My name", "الدرس 2 — اسمي", {
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
          id: "subj_jo_g1_sci",
          code: "SCI",
          name: L("Science", "العلوم"),
          books: [
            {
              id: "JO-G1-SCI-B1",
              part: "Book 1",
              title: L("Science — Grade 1 — Book 1", "العلوم - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: "jo_g1_sci_u1",
                  order: 1,
                  title: L("Unit 1 — Living things", "الوحدة 1 — الكائنات الحية"),
                  lessons: [
                    lesson("jo_g1_sci_u1_l1", 1, "Lesson 1 — Plants and animals", "الدرس 1 — النباتات والحيوانات"),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "subj_jo_g1_isl",
          code: "ISL",
          name: L("Islamic Education", "التربية الإسلامية"),
          books: [
            {
              id: "JO-G1-ISL-B1",
              part: "Book 1",
              title: L("Islamic Education — Grade 1 — Book 1", "التربية الإسلامية - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: "jo_g1_isl_u1",
                  order: 1,
                  title: L("Unit 1 — Good manners", "الوحدة 1 — الآداب"),
                  lessons: [
                    lesson("jo_g1_isl_u1_l1", 1, "Lesson 1 — Saying salaam", "الدرس 1 — إلقاء السلام"),
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "subj_jo_g1_soc",
          code: "SOC",
          name: L("Social Studies", "التربية الاجتماعية"),
          books: [
            {
              id: "JO-G1-SOC-B1",
              part: "Book 1",
              title: L("Social Studies — Grade 1 — Book 1", "التربية الاجتماعية - الصف الأول - الكتاب 1"),
              units: [
                {
                  id: "jo_g1_soc_u1",
                  order: 1,
                  title: L("Unit 1 — My family", "الوحدة 1 — أسرتي"),
                  lessons: [
                    lesson("jo_g1_soc_u1_l1", 1, "Lesson 1 — Family members", "الدرس 1 — أفراد الأسرة"),
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
