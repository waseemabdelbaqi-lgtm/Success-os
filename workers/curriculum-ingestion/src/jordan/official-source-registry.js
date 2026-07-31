/**
 * Jordan Official Source Registry — government / authorized sources only.
 * Never includes pirated mirrors, Wayback textbook captures, or OpenStax as Jordan curriculum.
 */

export const JORDAN_OFFICIAL_SOURCE_REGISTRY = Object.freeze([
  {
    id: "nccd-portal",
    authority: "المركز الوطني لتطوير المناهج",
    name: "NCCD Official Portal",
    url: "https://www.nccd.gov.jo/",
    type: "curriculum-authority",
    usage: "discovery-indexing-only",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
  },
  {
    id: "nccd-textbooks",
    authority: "المركز الوطني لتطوير المناهج",
    name: "NCCD Textbook Catalogue",
    url: "https://www.nccd.gov.jo/Ar/Pages/textbooks",
    type: "official-catalog",
    usage: "grade-book-indexing",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
  },
  {
    id: "nccd-frameworks",
    authority: "المركز الوطني لتطوير المناهج",
    name: "NCCD Curriculum Frameworks List",
    url: "https://www.nccd.gov.jo/AR/List/__%D8%A7%D9%84%D8%A3%D8%B7%D8%B1____",
    type: "official-framework-index",
    usage: "framework-titles-indexing",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
    notes: "Lists الإطار العام والأطر الخاصة including الرياضيات",
  },
  {
    id: "nccd-math-framework-title",
    authority: "المركز الوطني لتطوير المناهج",
    name: "الإطار الخاص ومعايير ومؤشرات أداء مبحث الرياضيات",
    url: "https://www.nccd.gov.jo/AR/List/__%D8%A7%D9%84%D8%A3%D8%B7%D8%B1____",
    type: "subject-framework",
    usage: "learning-outcomes-authority-reference",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
  },
  {
    id: "nccd-g1-catalog",
    authority: "المركز الوطني لتطوير المناهج",
    name: "Grade 1 Textbook Catalogue",
    url: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
    type: "grade-catalog",
    usage: "subject-list-and-book-links",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
  },
  {
    id: "nccd-g1-math-s1-student-pdf",
    authority: "المركز الوطني لتطوير المناهج",
    name: "الرياضيات — الصف الأول — الفصل الدراسي الأول — كتاب الطالب",
    url: "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf",
    type: "official-textbook-pdf",
    usage: "internal-reference-only-when-lawfully-accessible-never-republish",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
  },
  {
    id: "moe-portal",
    authority: "وزارة التربية والتعليم الأردنية",
    name: "MoE Official Portal",
    url: "https://moe.gov.jo/",
    type: "ministry",
    usage: "policy-editions",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
  },
  {
    id: "moe-editions-2025-2026",
    authority: "وزارة التربية والتعليم الأردنية",
    name: "MoE Approved Textbook Editions 2025–2026",
    url: "https://moe.gov.jo/ar/node/79818",
    type: "ministry-edition-list",
    usage: "edition-year-verification",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
  },
  {
    id: "moe-curricula-admin",
    authority: "وزارة التربية والتعليم الأردنية",
    name: "إدارة المناهج والكتب المدرسية",
    url: "https://moe.gov.jo/ar/%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D9%85%D9%86%D8%A7%D9%87%D8%AC-%D9%88%D8%A7%D9%84%D9%83%D8%AA%D8%A8-%D8%A7%D9%84%D9%85%D8%AF%D8%B1%D8%B3%D9%8A%D8%A9",
    type: "ministry",
    usage: "structure-and-outcomes-reference",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
  },
  {
    id: "darsak",
    authority: "وزارة التربية والتعليم الأردنية / منصة درسك",
    name: "Darsak Digital Learning Platform",
    url: "https://darsak.gov.jo/",
    type: "official-digital-platform",
    usage: "public-structure-reference-never-copy-lesson-media",
    licenseHint: "OFFICIAL_REFERENCE_ONLY",
  },
]);

export const VERIFIED_SUBJECT_LISTS = Object.freeze({
  "1": {
    grade: "الصف 1",
    gradeCode: "1",
    stage: "التعليم الأساسي",
    catalogUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
    subjects: [
      "اللغة العربية",
      "اللغة الإنجليزية",
      "الرياضيات",
      "العلوم",
      "التربية الإسلامية",
      "الدراسات الاجتماعية",
      "المهارات الرقمية",
      "التربية الرياضية",
      "التربية الفنية والموسيقية والمسرحية",
    ],
    subjectListConfidence: "PARTIAL",
    subjectListNote:
      "Subject list previously aligned to NCCD TextBooksGrade/68 catalogue context; live re-verification blocked by TLS_RESET from worker network.",
  },
  "11": {
    grade: "الصف 11",
    gradeCode: "11",
    stage: "التعليم الثانوي — المسار الأكاديمي",
    catalogUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/117",
    subjects: [
      "اللغة العربية",
      "اللغة الإنجليزية",
      "الرياضيات",
      "الفيزياء",
      "الكيمياء",
      "العلوم الحياتية",
      "علوم الأرض والبيئة",
      "المهارات الرقمية",
      "التربية الإسلامية",
      "تاريخ الأردن",
    ],
    subjectListConfidence: "PARTIAL",
    subjectListNote: "Subject list from prior NCCD grade-11 catalogue alignment; live re-verification pending.",
  },
});

export const GRADE_CATALOG_PAGES = Object.freeze([
  [1, "الصف 1", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68"],
  [2, "الصف 2", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/69"],
  [3, "الصف 3", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/70"],
  [4, "الصف 4", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/71"],
  [5, "الصف 5", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/72"],
  [6, "الصف 6", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/73"],
  [7, "الصف 7", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/74"],
  [8, "الصف 8", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/75"],
  [9, "الصف 9", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/76"],
  [10, "الصف 10", "التعليم الأساسي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/77"],
  [11, "الصف 11", "التعليم الثانوي — المسار الأكاديمي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/117"],
  [12, "الصف 12", "التعليم الثانوي — المسار الأكاديمي", "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/83"],
]);

export const BOOK_TYPES = Object.freeze(["كتاب الطالب", "كتاب التمارين", "دليل المعلم"]);
export const SEMESTERS = Object.freeze(["الفصل الدراسي الأول", "الفصل الدراسي الثاني"]);

/** Known official PDF URL patterns (identity only — not verified downloads). */
export const KNOWN_OFFICIAL_PDFS = Object.freeze({
  "1|الرياضيات|الفصل الدراسي الأول|كتاب الطالب": {
    url: "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf",
    editionHint: "2025 NCCD web edition MA.01.ST.BOOK_WEB",
    academicYearHint: "2025/2026",
    confidence: "PARTIAL",
  },
  "1|الرياضيات|الفصل الدراسي الثاني|كتاب الطالب": {
    url: "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/2/MT01/SE/MA.01.ST2.pdf",
    editionHint: "2025 NCCD MA.01.ST2",
    academicYearHint: "2025/2026",
    confidence: "PARTIAL",
  },
});

export function isNccdHost(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "nccd.gov.jo" || host === "www.nccd.gov.jo" || host.endsWith(".nccd.gov.jo");
  } catch {
    return false;
  }
}
