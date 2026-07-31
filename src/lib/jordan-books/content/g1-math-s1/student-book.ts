import type { BookRecord } from "@/src/lib/jordan-books/schema/types";
import { buildAnswerBank, buildPageMap } from "@/src/lib/jordan-books/content/g1-math-s1/lesson-factory";
import { G1_MATH_OFFICIAL_SOURCES, G1_MATH_YEAR_STRUCTURE } from "@/src/lib/jordan-books/content/g1-math-s1/structure";
import { UNIT_0 } from "@/src/lib/jordan-books/content/g1-math-s1/unit-0";
import { UNIT_1 } from "@/src/lib/jordan-books/content/g1-math-s1/unit-1";
import { UNIT_2 } from "@/src/lib/jordan-books/content/g1-math-s1/unit-2";
import { UNIT_3 } from "@/src/lib/jordan-books/content/g1-math-s1/unit-3";

const UNITS = [UNIT_0, UNIT_1, UNIT_2, UNIT_3];

const glossary = Array.from(
  new Map(
    UNITS.flatMap((u) => u.lessons.flatMap((l) => l.vocabulary.map((v) => [v.term, v] as const))),
  ).values(),
);

export const G1_MATH_S1_STUDENT_BOOK: BookRecord = {
  id: "jo-g1-s1-math-student-book",
  country: "Jordan",
  curriculum: "national",
  curriculumVersion: "NEEDS VERIFICATION",
  academicYear: "NEEDS VERIFICATION",
  stage: "التعليم الأساسي",
  grade: "1",
  gradeAr: "الصف الأول",
  semester: "1",
  semesterAr: "الفصل الدراسي الأول",
  subject: "Mathematics",
  subjectAr: "الرياضيات",
  officialTitleAr: "الرياضيات — كتاب الطالب — الفصل الدراسي الأول (نسخة تفاعلية Success OS)",
  officialTitleEn: "Mathematics — Student Book — Semester 1 (Success OS interactive companion)",
  bookType: "sos_companion",
  edition: "NEEDS VERIFICATION",
  publicationYear: "NEEDS VERIFICATION",
  publisher: "Success OS companion — official textbook linked via NCCD (not republished)",
  officialSourceUrl: G1_MATH_OFFICIAL_SOURCES.nccdGrade1,
  directResourceUrl: G1_MATH_OFFICIAL_SOURCES.minhajiStudentSem1,
  curriculumAuthority: "المركز الوطني لتطوير المناهج / وزارة التربية والتعليم الأردنية",
  availabilityStatus: "sos_interactive_sem1_core_draft",
  rightsStatus: "sos_original_aligned",
  verificationDate: "2026-07-28",
  verificationNote:
    "Sem1 core units 0–3 authored as original SOS companion aligned to Minhaji title order. Official edition year and whether units 4–7 belong in Sem1 PDF: NEEDS VERIFICATION on NCCD. Official PDF linked only — not republished. completenessClaim is NOT complete.",
  editorialStatus: "draft",
  completenessClaim: "sem1_core_draft",
  units: UNITS,
  pageMap: buildPageMap(UNITS),
  answerBank: UNITS.flatMap((u) => buildAnswerBank(u.id, u.lessons)),
  glossary,
};

/** Year outline rows reserved until Sem1/Sem2 boundary verified. */
export const G1_MATH_RESERVED_UNITS = G1_MATH_YEAR_STRUCTURE.filter(
  (u) => u.semesterAssignment !== "1",
);

export function g1MathS1Stats() {
  const lessons = UNITS.reduce((n, u) => n + u.lessons.length, 0);
  const questions = UNITS.reduce(
    (n, u) => n + u.lessons.reduce((ln, l) => ln + l.blocks.filter((b) => b.type === "question").length, 0),
    0,
  );
  return {
    units: UNITS.length,
    lessons,
    questions,
    answerBankEntries: G1_MATH_S1_STUDENT_BOOK.answerBank?.length || 0,
    pageMapEntries: G1_MATH_S1_STUDENT_BOOK.pageMap?.length || 0,
    glossaryTerms: glossary.length,
    reservedUnitsPendingVerification: G1_MATH_RESERVED_UNITS.length,
  };
}
