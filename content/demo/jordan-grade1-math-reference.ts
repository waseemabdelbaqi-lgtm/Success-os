/**
 * Jordan Grade 1 Mathematics — reference implementation fixture.
 * Completely generic hierarchy; only connector + content differ per country.
 * No AI generation.
 */
import type { CurriculumSourceRef, DetectedBook } from "@/types/curriculum-import-engine";

export const JORDAN_G1_MATH_SOURCE: CurriculumSourceRef = {
  id: "src_jo_nccd_g1_math_p1",
  type: "curriculum_authority",
  connectorId: "jordan-g1-math",
  label: {
    en: "Jordan NCCD — Grade 1 Mathematics Part 1 (reference)",
    ar: "المركز الوطني لتطوير المناهج — رياضيات صف أول جزء 1 (مرجع)",
  },
  country: "Jordan",
  curriculum: "Jordan National Curriculum",
  url: "https://nccd.gov.jo",
  authority: "National Center for Curriculum Development (NCCD)",
  license: "structure-reference-only",
  rightsNotes: {
    en: "Reference structure for Grade 1 Math Part 1. Original Success OS lesson body — not a copy of protected textbooks.",
    ar: "بنية مرجعية لرياضيات الصف الأول الجزء 1. نص أصلي لـ SUCCESS OS وليس نسخًا من كتب محمية.",
  },
};

/** Real example path: Jordan → Grade 1 → Math → Part 1 → Unit 1 → Lesson 1 */
export function buildJordanGrade1MathPart1Book(): DetectedBook {
  return {
    id: "JO-G1-MATH-P1",
    title: {
      en: "Mathematics — Grade 1 — Part 1",
      ar: "الرياضيات - الصف الأول - الجزء الأول",
    },
    checksum: "",
    metadata: {
      country: "Jordan",
      curriculum: "Jordan National Curriculum",
      grade: "Grade 1",
      semester: "Semester 1",
      subject: "Mathematics",
      language: "bilingual",
      edition: "SOS-REF-2026.1",
      keywords: ["counting", "numbers", "one", "two", "three"],
      objectives: [
        {
          en: "Count objects from 1 to 3",
          ar: "عدّ الأشياء من 1 إلى 3",
        },
      ],
      sourceId: JORDAN_G1_MATH_SOURCE.id,
      rightsStatus: "verified",
      verificationStatus: "verified",
    },
    units: [
      {
        id: "jo_g1_math_u1",
        title: { en: "Unit 1 — Numbers around us", ar: "الوحدة 1 — الأعداد من حولنا" },
        order: 1,
        overview: {
          en: "Recognize and count small quantities.",
          ar: "التعرّف إلى الكميات الصغيرة وعدّها.",
        },
        lessons: [
          {
            id: "jo_g1_math_u1_l1",
            title: {
              en: "Lesson 1 — Count to three",
              ar: "الدرس 1 — العدّ حتى ثلاثة",
            },
            order: 1,
            objectives: [
              {
                en: "Say the number names one, two, and three in order",
                ar: "نطق أسماء الأعداد واحد واثنان وثلاثة بالترتيب",
              },
              {
                en: "Match a set of up to three objects with the correct numeral",
                ar: "مطابقة مجموعة حتى ثلاثة أشياء مع الرمز العددي الصحيح",
              },
            ],
            keywords: ["one", "two", "three", "count", "numeral"],
            body: {
              en: "We count objects one by one: one, two, three. The numeral 1 means one object, 2 means two objects, and 3 means three objects. Practice by pointing to each object as you say its number.",
              ar: "نعدّ الأشياء واحدًا واحدًا: واحد، اثنان، ثلاثة. الرمز 1 يعني شيئًا واحدًا، و2 شيئين، و3 ثلاثة أشياء. تدرّب بالإشارة إلى كل شيء وأنت تقول عدده.",
            },
            assets: [
              {
                id: "jo_g1_math_u1_l1_img",
                kind: "image",
                label: {
                  en: "Counting dots 1–3 (placeholder asset)",
                  ar: "نقاط العد 1–3 (أصل موضع)",
                },
                src: null,
                placeholder: true,
              },
            ],
            references: [
              {
                label: {
                  en: "NCCD Grade 1 Mathematics structure baseline",
                  ar: "خط أساس بنية رياضيات الصف الأول — المركز الوطني",
                },
                href: "https://nccd.gov.jo",
              },
            ],
          },
        ],
      },
    ],
  };
}

export const JORDAN_G1_MATH_HIERARCHY_IDS = {
  countryId: "country_jordan",
  curriculumId: "curr_jordan_national",
  gradeId: "grade_jo_1",
  semesterId: "sem_jo_g1_s1",
  subjectId: "subj_jo_g1_math",
  bookId: "JO-G1-MATH-P1",
  unitId: "jo_g1_math_u1",
  lessonId: "jo_g1_math_u1_l1",
} as const;
