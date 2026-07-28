import type { BookTypeKey, InventoryCell, MatrixStatus } from "@/src/lib/jordan-books/matrix/types";

const VERIFY_DATE = "2026-07-28";
const NCCD_HUB = "https://nccd.gov.jo/Ar/Pages/textbooks";
const NCCD_KG = "https://nccd.gov.jo/ar/pages/PublicationsKG";

/** Official NCCD grade catalog URLs (from jordan-curriculum + G11/G12 academic notices). */
const NCCD_GRADE_URL: Record<string, string> = {
  kg: NCCD_KG,
  "1": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
  "2": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/69",
  "3": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/70",
  "4": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/71",
  "5": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/72",
  "6": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/73",
  "7": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/74",
  "8": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/75",
  "9": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/76",
  "10": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/77",
  "11": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/117",
  "11-academic-2026": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/118",
  "12": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/83",
  "12-academic-2026": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/143",
};

/**
 * Subject lists:
 * - G1 & G11 academic: subject-list-verified (jordan-curriculum.js)
 * - Other grades: Minhaji harvest titles (structure companion) — pending NCCD human review
 * - Do NOT invent subjects absent from these sources
 */
type GradeSeed = {
  gradeKey: string;
  gradeAr: string;
  stage: string;
  pathway: string;
  pathwayAr: string;
  subjectListStatus: InventoryCell["subjectListStatus"];
  subjects: string[];
  semesters: Array<"1" | "2" | "year">;
  nccdKey: string;
};

const G1_VERIFIED = [
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "التربية الإسلامية",
  "الدراسات الاجتماعية",
  "المهارات الرقمية",
  "التربية الرياضية",
  "التربية الفنية والموسيقية والمسرحية",
];

const G11_VERIFIED = [
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
];

/**
 * Grade 12 academic subjects harvested from NCCD textbook catalogue listings
 * (TextBooksGrade/83 and /143 HTML subject filters + book title clusters).
 * Live NCCD pages frequently return HTTP 500 — treat as indexed-pending-nccd until human re-verify.
 */
const G12_INDEXED = [
  "الرياضيات",
  "الرياضيات/الأعمال",
  "الفيزياء",
  "الكيمياء",
  "العلوم الحياتية",
  "علوم الأرض والبيئة",
  "اللغة العربية /الأدب",
  "اللغة العربية /النّحو والصّرف وموسيقا الشّعر",
  "اللغة الإنجليزية",
  "التربية الإسلامية",
  "تاريخ الأردن",
  "الفلسفة",
  "علوم النفس والاجتماع",
  "الثقافة المالية",
  "المهارات الرقمية",
];

/** Minhaji-indexed (pending NCCD review) — from wave1 harvest 2026-07-26 */
const INDEXED: Record<string, string[]> = {
  kg1: ["المنهاج التطوري", "الرياضيات", "اللغة العربية", "العلوم"],
  kg2: ["المنهاج التطوري", "الرياضيات", "اللغة العربية", "العلوم"],
  "2": [
    "الرياضيات",
    "اللغة الإنجليزية",
    "اللغة العربية",
    "العلوم",
    "التربية الإسلامية",
    "الدراسات الاجتماعية",
    "المهارات الرقمية",
    "التربية الفنية والموسيقية والمسرحية",
    "التربية الرياضية",
  ],
  "3": [
    "الرياضيات",
    "اللغة الإنجليزية",
    "اللغة العربية",
    "العلوم",
    "التربية الإسلامية",
    "الدراسات الاجتماعية",
    "المهارات الرقمية",
    "التربية الفنية والموسيقية والمسرحية",
    "التربية الرياضية",
  ],
  "4": [
    "الرياضيات",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "العلوم",
    "التربية الإسلامية",
    "الدراسات الاجتماعية",
    "المهارات الرقمية",
    "التربية المهنية",
    "التربية الفنية والموسيقية والمسرحية",
    "التربية الرياضية",
  ],
  "5": [
    "الرياضيات",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "العلوم",
    "التربية الإسلامية",
    "الدراسات الاجتماعية",
    "المهارات الرقمية",
    "التربية المهنية",
    "التربية الفنية والموسيقية والمسرحية",
    "التربية الرياضية",
  ],
  "6": [
    "الرياضيات",
    "اللغة الإنجليزية",
    "اللغة العربية",
    "العلوم",
    "التربية الإسلامية",
    "الدراسات الاجتماعية",
    "المهارات الرقمية",
    "التربية المهنية",
    "التربية الفنية والموسيقية والمسرحية",
    "التربية الرياضية",
  ],
  "7": [
    "الرياضيات",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "العلوم",
    "التربية الإسلامية",
    "الدراسات الاجتماعية",
    "الثقافة المالية",
    "المهارات الرقمية",
    "التربية المهنية",
    "التربية الفنية والموسيقية والمسرحية",
    "التربية الرياضية",
  ],
  "8": [
    "الرياضيات",
    "العلوم",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "التربية الإسلامية",
    "الدراسات الاجتماعية",
    "المهارات الرقمية",
    "الثقافة المالية",
    "التربية المهنية",
    "التربية الفنية والموسيقية والمسرحية",
  ],
  "9": [
    "الرياضيات",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "التربية الإسلامية",
    "الكيمياء",
    "الفيزياء",
    "العلوم الحياتية",
    "علوم الأرض والبيئة",
    "التربية الوطنية والمدنية",
    "التاريخ",
    "الجغرافيا",
    "المهارات الرقمية",
    "الثقافة المالية",
    "التربية المهنية",
    "التربية الفنية والموسيقية والمسرحية",
    "التربية الرياضية",
  ],
  "10": [
    "الرياضيات",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "التربية الإسلامية",
    "الفيزياء",
    "الكيمياء",
    "العلوم الحياتية",
    "علوم الأرض والبيئة",
    "التاريخ",
    "الجغرافيا",
    "التربية الوطنية والمدنية",
    "المهارات الرقمية",
    "الثقافة المالية",
    "التربية المهنية",
    "التربية الفنية والموسيقية والمسرحية",
    "التربية الرياضية",
  ],
};

function slug(ar: string): string {
  const map: Record<string, string> = {
    الرياضيات: "math",
    العلوم: "science",
    "اللغة العربية": "arabic",
    "العربية لغتي": "arabic",
    "اللغة الإنجليزية": "english",
    "التربية الإسلامية": "islamic",
    "الدراسات الاجتماعية": "social",
    "المهارات الرقمية": "digital",
    "التربية الرياضية": "pe",
    "التربية الفنية والموسيقية والمسرحية": "arts",
    "التربية الفنية": "arts",
    "التربية المهنية": "vocational",
    "الثقافة المالية": "finance",
    الفيزياء: "physics",
    الكيمياء: "chemistry",
    "العلوم الحياتية": "biology",
    "علوم الأرض والبيئة": "earth",
    التاريخ: "history",
    الجغرافيا: "geography",
    "التربية الوطنية والمدنية": "civic",
    "تاريخ الأردن": "jordan-history",
    "المنهاج التطوري": "kg-developmental",
    "الرياضيات/الأعمال": "math-business",
    "اللغة العربية /الأدب": "arabic-literature",
    "اللغة العربية /النّحو والصّرف وموسيقا الشّعر": "arabic-grammar",
    الفلسفة: "philosophy",
    "علوم النفس والاجتماع": "psychology",
  };
  return map[ar] || ar.replace(/\s+/g, "-").slice(0, 40);
}

function bookTypesFor(subjectAr: string, gradeKey: string): BookTypeKey[] {
  // Always track official link targets + SOS companion production target
  const core: BookTypeKey[] = ["student", "sos_companion"];
  if (["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "العربية لغتي"].includes(subjectAr)) {
    return [...core, "activity", "teacher_guide"];
  }
  if (gradeKey === "kg1" || gradeKey === "kg2") {
    return ["support", "sos_companion", "teacher_guide"];
  }
  return [...core, "teacher_guide"];
}

function initialStatus(seed: GradeSeed, bookType: BookTypeKey): MatrixStatus {
  if (seed.subjectListStatus === "not_discovered") return "NOT_DISCOVERED";
  if (bookType === "sos_companion") return "QUEUED";
  if (seed.subjectListStatus === "verified") return "SOURCE_VERIFIED";
  return "DISCOVERED";
}

function rightsFor(bookType: BookTypeKey): string {
  if (bookType === "sos_companion") return "sos_original_aligned";
  return "official_link_only";
}

function buildGradeSeeds(): GradeSeed[] {
  const seeds: GradeSeed[] = [
    {
      gradeKey: "kg1",
      gradeAr: "رياض الأطفال — المستوى الأول",
      stage: "الطفولة المبكرة",
      pathway: "general",
      pathwayAr: "عام",
      subjectListStatus: "indexed-pending-nccd",
      subjects: INDEXED.kg1 || [],
      semesters: ["year"],
      nccdKey: "kg",
    },
    {
      gradeKey: "kg2",
      gradeAr: "رياض الأطفال — المستوى الثاني",
      stage: "الطفولة المبكرة",
      pathway: "general",
      pathwayAr: "عام",
      subjectListStatus: "indexed-pending-nccd",
      subjects: INDEXED.kg2 || [],
      semesters: ["year"],
      nccdKey: "kg",
    },
    {
      gradeKey: "1",
      gradeAr: "الصف الأول",
      stage: "التعليم الأساسي",
      pathway: "general",
      pathwayAr: "عام",
      subjectListStatus: "verified",
      subjects: G1_VERIFIED,
      semesters: ["1", "2"],
      nccdKey: "1",
    },
  ];

  for (const g of ["2", "3", "4", "5", "6", "7", "8", "9", "10"] as const) {
    seeds.push({
      gradeKey: g,
      gradeAr: `الصف ${["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"][Number(g)]}`,
      stage: "التعليم الأساسي",
      pathway: "general",
      pathwayAr: "عام",
      subjectListStatus: "indexed-pending-nccd",
      subjects: INDEXED[g] || [],
      semesters: ["1", "2"],
      nccdKey: g,
    });
  }

  seeds.push({
    gradeKey: "11",
    gradeAr: "الصف الحادي عشر",
    stage: "التعليم الثانوي",
    pathway: "academic",
    pathwayAr: "المسار الأكاديمي",
    subjectListStatus: "verified",
    subjects: G11_VERIFIED,
    semesters: ["1", "2"],
    nccdKey: "11",
  });

  // Vocational / other G11 pathways — discovered as pathway shells only (no invented subjects)
  seeds.push({
    gradeKey: "11-vocational",
    gradeAr: "الصف الحادي عشر",
    stage: "التعليم الثانوي",
    pathway: "vocational",
    pathwayAr: "المسار المهني",
    subjectListStatus: "not_discovered",
    subjects: [],
    semesters: ["1", "2"],
    nccdKey: "11",
  });

  seeds.push({
    gradeKey: "12",
    gradeAr: "الصف الثاني عشر / التوجيهي",
    stage: "التعليم الثانوي",
    pathway: "academic",
    pathwayAr: "المسار الأكاديمي",
    subjectListStatus: "indexed-pending-nccd",
    subjects: G12_INDEXED,
    semesters: ["1", "2"],
    nccdKey: "12-academic-2026",
  });

  seeds.push({
    gradeKey: "12-vocational",
    gradeAr: "الصف الثاني عشر / التوجيهي",
    stage: "التعليم الثانوي",
    pathway: "vocational",
    pathwayAr: "المسار المهني",
    subjectListStatus: "not_discovered",
    subjects: [],
    semesters: ["1", "2"],
    nccdKey: "12",
  });

  return seeds;
}

function titleFor(subjectAr: string, bookType: BookTypeKey, semesterAr: string): string {
  const typeAr: Record<BookTypeKey, string> = {
    student: "كتاب الطالب",
    activity: "كتاب التمارين / النشاط",
    workbook: "كتاب التمارين",
    teacher_guide: "دليل المعلم",
    sos_companion: "كتاب تفاعلي Success OS (مرافق أصلي)",
    support: "مواد داعمة رسمية",
  };
  return `${subjectAr} — ${typeAr[bookType]} — ${semesterAr}`;
}

export function buildMasterInventory(): InventoryCell[] {
  const cells: InventoryCell[] = [];
  const seeds = buildGradeSeeds();

  for (const seed of seeds) {
    const nccdUrl = NCCD_GRADE_URL[seed.nccdKey] || NCCD_HUB;

    if (seed.subjects.length === 0) {
      // Pathway/grade placeholder so matrix shows NOT_DISCOVERED rather than hiding the row
      for (const sem of seed.semesters) {
        const semesterAr =
          sem === "year" ? "عام دراسي" : sem === "1" ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني";
        cells.push({
          id: `jo-${seed.gradeKey}-${seed.pathway}-s${sem}-pending-subjects-student`,
          country: "Jordan",
          curriculum: "national",
          curriculumVersion: "NEEDS VERIFICATION",
          academicYear: "NEEDS VERIFICATION",
          stage: seed.stage,
          gradeKey: seed.gradeKey,
          gradeAr: seed.gradeAr,
          semester: sem,
          semesterAr,
          pathway: seed.pathway,
          pathwayAr: seed.pathwayAr,
          subjectAr: "(Subjects pending official discovery)",
          subjectSlug: "pending",
          bookType: "student",
          officialTitleAr: `${seed.gradeAr} · ${seed.pathwayAr} · ${semesterAr} — قائمة المباحث غير مكتشفة بعد`,
          officialSourceUrl: nccdUrl,
          discoverySource: "pending",
          subjectListStatus: "not_discovered",
          rightsStatus: "needs_verification",
          matrixStatus: "NOT_DISCOVERED",
          blocker: "OFFICIAL SUBJECT LIST NOT FOUND / PENDING NCCD REVIEW — do not invent subjects",
          verificationDate: VERIFY_DATE,
        });
      }
      continue;
    }

    for (const subjectAr of seed.subjects) {
      for (const sem of seed.semesters) {
        const semesterAr =
          sem === "year" ? "عام دراسي" : sem === "1" ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني";
        for (const bookType of bookTypesFor(subjectAr, seed.gradeKey)) {
          const subjectSlug = slug(subjectAr);
          const id = `jo-${seed.gradeKey}-${seed.pathway}-s${sem}-${subjectSlug}-${bookType}`;
          let matrixStatus = initialStatus(seed, bookType);
          let blocker: string | undefined;

          // Math G1 Sem1 companion already has substantial content
          if (id === "jo-1-general-s1-math-sos_companion") {
            matrixStatus = "CONTENT_COMPLETE";
          }

          if (seed.subjectListStatus === "indexed-pending-nccd" && bookType !== "sos_companion") {
            blocker = "Subject list indexed from Minhaji companion — pending NCCD human verification";
          }

          cells.push({
            id,
            country: "Jordan",
            curriculum: "national",
            curriculumVersion: "NEEDS VERIFICATION",
            academicYear: "NEEDS VERIFICATION",
            stage: seed.stage,
            gradeKey: seed.gradeKey,
            gradeAr: seed.gradeAr,
            semester: sem,
            semesterAr,
            pathway: seed.pathway,
            pathwayAr: seed.pathwayAr,
            subjectAr,
            subjectSlug,
            bookType,
            officialTitleAr: titleFor(subjectAr, bookType, semesterAr),
            officialSourceUrl: nccdUrl,
            companionSourceUrl: bookType === "sos_companion" ? undefined : undefined,
            discoverySource:
              seed.subjectListStatus === "verified"
                ? "nccd-verified"
                : seed.subjectListStatus === "indexed-pending-nccd"
                  ? "minhaji-indexed"
                  : "pending",
            subjectListStatus: seed.subjectListStatus,
            rightsStatus: rightsFor(bookType),
            matrixStatus,
            blocker,
            structuredBookId:
              id === "jo-1-general-s1-math-sos_companion" ? "jo-g1-s1-math-student-book" : undefined,
            verificationDate: VERIFY_DATE,
          });
        }
      }
    }
  }

  return cells;
}

export const MASTER_INVENTORY: InventoryCell[] = buildMasterInventory();

export function inventoryStats(cells: InventoryCell[] = MASTER_INVENTORY) {
  const byStatus: Record<string, number> = {};
  for (const c of cells) byStatus[c.matrixStatus] = (byStatus[c.matrixStatus] || 0) + 1;
  return {
    totalCells: cells.length,
    gradesRepresented: new Set(cells.map((c) => c.gradeAr)).size,
    subjectsRepresented: new Set(cells.map((c) => c.subjectAr).filter((s) => !s.startsWith("("))).size,
    byStatus,
  };
}
