/**
 * Grade 1 Mathematics — official companion TOC (Minhaji titles only).
 * Authority for existence of Sem1 student/exercise/teacher books: NCCD Grade 1 catalog.
 * Exact edition year + which units fall in Sem1 PDF: NEEDS VERIFICATION.
 */

export type StructureLesson = { order: number; id: string; titleAr: string; titleEn: string };
export type StructureUnit = {
  id: string;
  order: number;
  titleAr: string;
  titleEn: string;
  semesterAssignment: "1" | "2" | "needs_verification";
  semesterNote: string;
  lessons: StructureLesson[];
};

export const G1_MATH_OFFICIAL_SOURCES = {
  nccdGrade1: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
  nccdHub: "https://nccd.gov.jo/Ar/Pages/textbooks",
  minhajiStructure: "https://minhaji.net/lesson/44/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA",
  minhajiStudentSem1: "https://minhaji.net/lesson/22458",
  minhajiExercisesSem1: "https://minhaji.net/lesson/22459",
  minhajiTeacherSem1: "https://minhaji.net/lesson/22332",
  verificationDate: "2026-07-28",
} as const;

/** Full year TOC from Minhaji companion index (titles only). */
export const G1_MATH_YEAR_STRUCTURE: StructureUnit[] = [
  {
    id: "unit-0",
    order: 0,
    titleAr: "الوحدة التمهيدية: الأعداد حتى 20",
    titleEn: "Introductory Unit: Numbers to 20",
    semesterAssignment: "1",
    semesterNote: "Included in Sem1 pilot core. Confirm page range on NCCD Sem1 PDF.",
    lessons: [
      { order: 1, id: "u0-l1-numbers-123", titleAr: "الأعداد 1 ، 2 ، 3", titleEn: "Numbers 1, 2, 3" },
      { order: 2, id: "u0-l2-numbers-45", titleAr: "العددان 4 ، 5", titleEn: "Numbers 4, 5" },
      { order: 3, id: "u0-l3-zero", titleAr: "العدد صفر", titleEn: "Zero" },
      { order: 4, id: "u0-l4-numbers-678", titleAr: "الأعداد 6 ، 7 ، 8", titleEn: "Numbers 6, 7, 8" },
      { order: 5, id: "u0-l5-numbers-910", titleAr: "العددان 9 ، 10", titleEn: "Numbers 9, 10" },
      { order: 6, id: "u0-l6-numbers-11-20", titleAr: "الأعداد من 11 إلى 20", titleEn: "Numbers 11 to 20" },
      { order: 7, id: "u0-l7-position", titleAr: "الموقع والاتجاه", titleEn: "Position and Direction" },
    ],
  },
  {
    id: "unit-1",
    order: 1,
    titleAr: "الوحدة الأولى: الجمع",
    titleEn: "Unit 1: Addition",
    semesterAssignment: "1",
    semesterNote: "Explicitly covered in Sem1 teacher-guide companion files.",
    lessons: [
      { order: 1, id: "u1-l1-number-line", titleAr: "خط الأعداد", titleEn: "Number Line" },
      { order: 2, id: "u1-l2-add-number-line", titleAr: "الجمع باستعمال خط الأعداد", titleEn: "Addition on the Number Line" },
      { order: 3, id: "u1-l3-doubles", titleAr: "الجمع باستعمال الضعف", titleEn: "Addition Using Doubles" },
      { order: 4, id: "u1-l4-make-ten", titleAr: "الجمع بالإكمال إلى العشرة", titleEn: "Making Ten" },
      { order: 5, id: "u1-l5-properties", titleAr: "خصائص عملية الجمع", titleEn: "Properties of Addition" },
    ],
  },
  {
    id: "unit-2",
    order: 2,
    titleAr: "الوحدة الثانية: الطرح",
    titleEn: "Unit 2: Subtraction",
    semesterAssignment: "1",
    semesterNote: "Explicitly covered in Sem1 teacher-guide companion files.",
    lessons: [
      { order: 1, id: "u2-l1-sub-number-line", titleAr: "الطرح باستعمال خط الأعداد", titleEn: "Subtraction on the Number Line" },
      { order: 2, id: "u2-l2-sub-doubles", titleAr: "الطرح باستعمال الضعف", titleEn: "Subtraction Using Doubles" },
      { order: 3, id: "u2-l3-sub-make-ten", titleAr: "الطرح بإيجاد عشرة", titleEn: "Subtraction by Making Ten" },
      { order: 4, id: "u2-l4-add-sub-relation", titleAr: "العلاقة بين الجمع والطرح", titleEn: "Relation Between Addition and Subtraction" },
      { order: 5, id: "u2-l5-fact-families", titleAr: "الحقائق المترابطة", titleEn: "Related Facts" },
      { order: 6, id: "u2-l6-missing-number", titleAr: "العدد المفقود", titleEn: "Missing Number" },
    ],
  },
  {
    id: "unit-3",
    order: 3,
    titleAr: "الوحدة الثالثة: الأعداد ضمن منزلتين",
    titleEn: "Unit 3: Two-Digit Numbers",
    semesterAssignment: "1",
    semesterNote: "Treated as Sem1 core pending NCCD PDF confirmation of page range.",
    lessons: [
      { order: 1, id: "u3-l1-tens", titleAr: "العشرات", titleEn: "Tens" },
      { order: 2, id: "u3-l2-ones-tens", titleAr: "الآحاد والعشرات", titleEn: "Ones and Tens" },
      { order: 3, id: "u3-l3-represent", titleAr: "تمثيل الأعداد ضمن منزلتين", titleEn: "Representing Two-Digit Numbers" },
      { order: 4, id: "u3-l4-place-value", titleAr: "القيمة المنزلية", titleEn: "Place Value" },
    ],
  },
  {
    id: "unit-4",
    order: 4,
    titleAr: "الوحدة الرابعة: ترتيب الأعداد ومقارنتها",
    titleEn: "Unit 4: Ordering and Comparing Numbers",
    semesterAssignment: "needs_verification",
    semesterNote: "NEEDS VERIFICATION: Sem1 vs Sem2 boundary vs current NCCD PDF.",
    lessons: [
      { order: 1, id: "u4-l1-asc-desc", titleAr: "العد تصاعدياً وتنازلياً", titleEn: "Counting Up and Down" },
      { order: 2, id: "u4-l2-skip", titleAr: "العد قفزياً", titleEn: "Skip Counting" },
    ],
  },
  {
    id: "unit-5",
    order: 5,
    titleAr: "الوحدة الخامسة: معالجة البيانات",
    titleEn: "Unit 5: Data Handling",
    semesterAssignment: "needs_verification",
    semesterNote: "NEEDS VERIFICATION: Sem1 vs Sem2 boundary vs current NCCD PDF.",
    lessons: [
      { order: 1, id: "u5-l1-sort-one", titleAr: "التصنيف وفق خاصية واحدة", titleEn: "Sorting by One Attribute" },
      { order: 2, id: "u5-l2-sort-many", titleAr: "التصنيف وفق أكثر من خاصية", titleEn: "Sorting by Multiple Attributes" },
    ],
  },
  {
    id: "unit-6",
    order: 6,
    titleAr: "الوحدة السادسة: الجمع ضمن منزلتين",
    titleEn: "Unit 6: Two-Digit Addition",
    semesterAssignment: "needs_verification",
    semesterNote: "Likely Sem2 — NEEDS VERIFICATION. Outline only.",
    lessons: [
      { order: 1, id: "u6-l1-add-tens", titleAr: "جمع العشرات", titleEn: "Adding Tens" },
      { order: 2, id: "u6-l2-mental-add", titleAr: "الجمع الذهني", titleEn: "Mental Addition" },
      { order: 3, id: "u6-l3-add-two-digit", titleAr: "جمع عددين من منزلتين", titleEn: "Adding Two Two-Digit Numbers" },
      { order: 4, id: "u6-l4-estimate", titleAr: "التخمين والتحقق", titleEn: "Estimate and Check" },
    ],
  },
  {
    id: "unit-7",
    order: 7,
    titleAr: "الوحدة السابعة: الطرح ضمن منزلتين",
    titleEn: "Unit 7: Two-Digit Subtraction",
    semesterAssignment: "needs_verification",
    semesterNote: "Likely Sem2 — NEEDS VERIFICATION. Outline only.",
    lessons: [
      { order: 1, id: "u7-l1-sub-tens", titleAr: "طرح العشرات", titleEn: "Subtracting Tens" },
      { order: 2, id: "u7-l2-mental-sub", titleAr: "الطرح الذهني", titleEn: "Mental Subtraction" },
      { order: 3, id: "u7-l3-sub-two-digit", titleAr: "طرح عددين من منزلتين", titleEn: "Subtracting Two-Digit Numbers" },
      { order: 4, id: "u7-l4-choose-op", titleAr: "اختيار العملية", titleEn: "Choosing the Operation" },
    ],
  },
];

export const G1_MATH_S1_UNITS = G1_MATH_YEAR_STRUCTURE.filter((u) => u.semesterAssignment === "1");

export function expectedSem1LessonCount(): number {
  return G1_MATH_S1_UNITS.reduce((n, u) => n + u.lessons.length, 0);
}
