import { G1_MATH_S1_STUDENT_BOOK } from "@/src/lib/jordan-books/content/g1-math-s1/student-book";
import { G1_SEM1_SUBJECT_BOOKS } from "@/src/lib/jordan-books/content/g1-sem1-subjects";
import { PRIORITY_AUTHORED_PACKS } from "@/src/lib/jordan-books/content/subject-packs";
import { G1_SEM1_INVENTORY, OFFICIAL_SOURCES } from "@/src/lib/jordan-books/inventory/g1-semester1";
import type {
  BookRecord,
  EditorialStatus,
  InventoryItem,
  RightsStatus,
} from "@/src/lib/jordan-books/schema/types";
import { jordanAuthority, jordanGradeRegistry } from "@/app/data/jordan-curriculum";
import { g1MathS1Stats } from "@/src/lib/jordan-books/content/g1-math-s1/student-book";
import { summarizeValidation, validateBook } from "@/src/lib/jordan-books/validation/validate-book";

/** Structured interactive books registered in the CMS content layer. */
export const STRUCTURED_BOOKS: BookRecord[] = [
  G1_MATH_S1_STUDENT_BOOK,
  ...G1_SEM1_SUBJECT_BOOKS,
  ...PRIORITY_AUTHORED_PACKS,
];

export type EditorialOverride = {
  bookId: string;
  lessonId?: string;
  editorialStatus: EditorialStatus;
  updatedAt: string;
  updatedBy?: string;
  note?: string;
};

export type CoverageReport = {
  generatedAt: string;
  expectedGrades: number;
  verifiedGrades: number;
  expectedSubjects: number;
  verifiedSubjects: number;
  expectedOfficialBooks: number;
  discoveredOfficialBooks: number;
  legallyUsableBooks: number;
  linkedOnlyBooks: number;
  structuredDigitalBooks: number;
  completedUnits: number;
  completedLessons: number;
  reviewedLessons: number;
  publishedLessons: number;
  missingBooks: InventoryItem[];
  missingSemesters: string[];
  missingSourceLinks: InventoryItem[];
  outdatedEditions: InventoryItem[];
  rightsReviewRequired: InventoryItem[];
  needsVerification: InventoryItem[];
  errorsAndDuplicates: string[];
  completionByGrade: Array<{ grade: string; gradeAr: string; percent: number; structuredLessons: number }>;
  completionBySubject: Array<{ subjectAr: string; percent: number; structuredLessons: number }>;
  lastVerificationDate: string | null;
  officialSources: typeof OFFICIAL_SOURCES;
  authority: typeof jordanAuthority;
  videoDevelopmentStopped: true;
  pilotBookStats?: ReturnType<typeof g1MathS1Stats>;
  validation?: ReturnType<typeof summarizeValidation>;
  completenessClaim?: BookRecord["completenessClaim"];
};

const REVIEWED: EditorialStatus[] = [
  "academic_review",
  "language_review",
  "technical_review",
  "approved",
  "published",
];

function applyOverrides(book: BookRecord, overrides: EditorialOverride[]): BookRecord {
  const bookOverride = overrides.find((o) => o.bookId === book.id && !o.lessonId);
  const units = book.units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson) => {
      const lessonOverride = overrides.find((o) => o.bookId === book.id && o.lessonId === lesson.id);
      return lessonOverride
        ? { ...lesson, editorialStatus: lessonOverride.editorialStatus }
        : lesson;
    }),
  }));
  return {
    ...book,
    editorialStatus: bookOverride?.editorialStatus ?? book.editorialStatus,
    units,
  };
}

export function listInventory(): InventoryItem[] {
  return G1_SEM1_INVENTORY;
}

export function listStructuredBooks(overrides: EditorialOverride[] = []): BookRecord[] {
  return STRUCTURED_BOOKS.map((b) => applyOverrides(b, overrides));
}

export function getBookById(bookId: string, overrides: EditorialOverride[] = []): BookRecord | null {
  const book = STRUCTURED_BOOKS.find((b) => b.id === bookId);
  return book ? applyOverrides(book, overrides) : null;
}

export function getPilotBook(overrides: EditorialOverride[] = []): BookRecord {
  return applyOverrides(G1_MATH_S1_STUDENT_BOOK, overrides);
}

export function findBookByRoute(params: {
  grade: string;
  semester: string;
  subject: string;
  bookType?: string;
}, overrides: EditorialOverride[] = []): BookRecord | null {
  const subjectKey = params.subject.toLowerCase();
  const book = STRUCTURED_BOOKS.find((b) => {
    const subjectMatch =
      b.subject.toLowerCase() === subjectKey ||
      b.subjectAr.includes(params.subject) ||
      subjectKey === "math" ||
      subjectKey === "mathematics";
    const typeMatch = !params.bookType || params.bookType === "student-book" || b.bookType === "student";
    return (
      b.grade === params.grade.replace("grade-", "") &&
      b.semester === params.semester.replace("semester-", "") &&
      subjectMatch &&
      typeMatch
    );
  });
  return book ? applyOverrides(book, overrides) : null;
}

export function buildCoverageReport(overrides: EditorialOverride[] = []): CoverageReport {
  const inventory = listInventory();
  const books = listStructuredBooks(overrides);
  const allLessons = books.flatMap((b) => b.units.flatMap((u) => u.lessons));
  const allUnits = books.flatMap((b) => b.units);

  const verifiedGrades = jordanGradeRegistry.filter(
    (g) => g.catalogueStatus === "subject-list-verified",
  ).length;

  const expectedSubjects = jordanGradeRegistry.reduce((n, g) => n + g.subjects.length, 0);
  const verifiedSubjects = jordanGradeRegistry
    .filter((g) => g.catalogueStatus === "subject-list-verified")
    .reduce((n, g) => n + g.subjects.length, 0);

  const legallyUsable = inventory.filter(
    (i) => i.rightsStatus === "sos_original_aligned" || i.rightsStatus === "official_link_only",
  );
  const linkedOnly = inventory.filter((i) => i.rightsStatus === "official_link_only");
  const rightsReview = inventory.filter((i) => i.rightsStatus === "rights_review_required");
  const needsVerification = inventory.filter(
    (i) =>
      i.rightsStatus === "needs_verification" ||
      i.availabilityStatus === "needs_verification" ||
      (i.notes || "").includes("NEEDS VERIFICATION"),
  );
  const missingSourceLinks = inventory.filter((i) => !i.officialSourceUrl);
  const missingBooks = inventory.filter((i) => {
    const hasStructured = books.some(
      (b) =>
        b.grade === i.grade &&
        b.semester === i.semester &&
        b.subjectAr === i.subjectAr &&
        (i.bookType === "student" ? b.bookType === "student" : false),
    );
    return i.bookType === "student" && !hasStructured;
  });

  const ids = inventory.map((i) => i.id);
  const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
  const errorsAndDuplicates = [
    ...duplicates.map((id) => `duplicate inventory id: ${id}`),
    ...books
      .filter((b) => b.edition === "NEEDS VERIFICATION" || b.publicationYear === "NEEDS VERIFICATION")
      .map((b) => `edition/year NEEDS VERIFICATION: ${b.id}`),
  ];

  const lastVerificationDate =
    [...inventory.map((i) => i.verificationDate), ...books.map((b) => b.verificationDate)]
      .filter(Boolean)
      .sort()
      .at(-1) || null;

  const completionByGrade = jordanGradeRegistry.map((g) => {
    const gradeKey = String(g.grade ?? "");
    const gradeNum = gradeKey.replace(/[^\d]/g, "") || gradeKey;
    const structuredLessons = books
      .filter((b) => b.grade === gradeNum || b.gradeAr === String((g as { gradeAr?: string }).gradeAr ?? ""))
      .reduce((n, b) => n + b.units.reduce((u, unit) => u + unit.lessons.length, 0), 0);
    // Honest percent: only count structured content vs inventory student books for that grade when known
    const expectedForGrade = inventory.filter((i) => i.grade === gradeNum && i.bookType === "student").length;
    const structuredBooksForGrade = books.filter((b) => b.grade === gradeNum).length;
    const percent =
      expectedForGrade > 0 ? Math.round((structuredBooksForGrade / expectedForGrade) * 100) : 0;
    return {
      grade: gradeKey,
      gradeAr: String((g as { gradeAr?: string }).gradeAr ?? gradeKey),
      percent,
      structuredLessons,
    };
  });

  const subjectMap = new Map<string, { structured: number; expected: number }>();
  for (const item of inventory) {
    const cur = subjectMap.get(item.subjectAr) || { structured: 0, expected: 0 };
    if (item.bookType === "student") cur.expected += 1;
    subjectMap.set(item.subjectAr, cur);
  }
  for (const book of books) {
    const cur = subjectMap.get(book.subjectAr) || { structured: 0, expected: 0 };
    cur.structured += book.units.reduce((n, u) => n + u.lessons.length, 0);
    subjectMap.set(book.subjectAr, cur);
  }
  const completionBySubject = [...subjectMap.entries()].map(([subjectAr, v]) => ({
    subjectAr,
    structuredLessons: v.structured,
    percent: v.expected > 0 ? Math.round((books.filter((b) => b.subjectAr === subjectAr).length / v.expected) * 100) : 0,
  }));

  const missingSemesters: string[] = [];
  for (const g of jordanGradeRegistry) {
    if (g.grade === "رياض الأطفال") continue;
    // Only flag when inventory started for that grade — currently G1 Sem1 inventory exists
    if (g.grade === "الصف 1") {
      const hasS2 = inventory.some((i) => i.grade === "1" && i.semester === "2");
      if (!hasS2) missingSemesters.push("الصف الأول · الفصل الدراسي الثاني — inventory not started");
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    expectedGrades: jordanGradeRegistry.length,
    verifiedGrades,
    expectedSubjects,
    verifiedSubjects,
    expectedOfficialBooks: inventory.length,
    discoveredOfficialBooks: inventory.filter((i) => i.availabilityStatus !== "unavailable").length,
    legallyUsableBooks: legallyUsable.length,
    linkedOnlyBooks: linkedOnly.length,
    structuredDigitalBooks: books.length,
    completedUnits: allUnits.length,
    completedLessons: allLessons.length,
    reviewedLessons: allLessons.filter((l) => REVIEWED.includes(l.editorialStatus)).length,
    publishedLessons: allLessons.filter((l) => l.editorialStatus === "published").length,
    missingBooks,
    missingSemesters,
    missingSourceLinks,
    outdatedEditions: inventory.filter((i) => (i.notes || "").toLowerCase().includes("outdated")),
    rightsReviewRequired: rightsReview,
    needsVerification,
    errorsAndDuplicates,
    completionByGrade,
    completionBySubject,
    lastVerificationDate,
    officialSources: OFFICIAL_SOURCES,
    authority: jordanAuthority,
    videoDevelopmentStopped: true,
    pilotBookStats: g1MathS1Stats(),
    validation: summarizeValidation(books.flatMap((b) => validateBook(b))),
    completenessClaim: books[0]?.completenessClaim,
  };
}

export function rightsLabel(status: RightsStatus): string {
  switch (status) {
    case "publicly_reusable":
      return "PUBLICLY REUSABLE";
    case "officially_authorized":
      return "OFFICIALLY AUTHORIZED";
    case "official_link_only":
      return "رابط رسمي فقط — لا إعادة نشر";
    case "transform_permitted":
      return "TRANSFORM PERMITTED";
    case "sos_original_aligned":
      return "محتوى Success OS أصلي بمحاذاة النواتج";
    case "rights_review_required":
      return "RIGHTS REVIEW REQUIRED";
    case "restricted":
      return "RESTRICTED";
    case "unavailable":
      return "OFFICIAL SOURCE NOT FOUND";
    case "needs_verification":
      return "NEEDS VERIFICATION";
    default:
      return status;
  }
}
