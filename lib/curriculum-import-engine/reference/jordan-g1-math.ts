/**
 * Jordan Grade 1 Math reference — full admin flow + ILE package.
 * Demonstrates generic hierarchy; ILE is the only renderer.
 */
import {
  attachCurriculum,
  approveAndPublishLesson,
  createCountry,
  createGrade,
  createSemester,
  createSubject,
  detectLesson,
  detectUnit,
  getHierarchySnapshot,
  getPackage,
  importBook,
  registerIlePackage,
  resetHierarchyRegistry,
} from "../hierarchy/registry";
import {
  buildJordanGrade1MathPart1Book,
  JORDAN_G1_MATH_HIERARCHY_IDS as IDS,
  JORDAN_G1_MATH_SOURCE,
} from "@/content/demo/jordan-grade1-math-reference";
import { evaluateRights } from "../rights/engine";
import { normalizeBook } from "../normalize";
import { extractAssets } from "../assets";
import { checksumBook } from "../checksum";
import { extractMetadata, validateMetadata } from "../metadata/engine";
import { buildIlePackagesFromBook } from "../ile-package-builder";
import { allGatesPassed, runVerificationGates } from "../verification/engine";
import type { CompiledIlePackage } from "@/types/curriculum-import-engine";

export type JordanReferenceResult = {
  ok: boolean;
  published: boolean;
  hierarchyPath: string[];
  lessonId: string;
  packageId: string | null;
  package: CompiledIlePackage | null;
  gates: { gate: string; passed: boolean }[];
  snapshot: ReturnType<typeof getHierarchySnapshot>;
  errors: string[];
};

export function seedJordanCountryCurriculum() {
  createCountry({
    id: IDS.countryId,
    code: "JO",
    name: { en: "Jordan", ar: "الأردن" },
  });
  attachCurriculum({
    id: IDS.curriculumId,
    countryId: IDS.countryId,
    name: { en: "Jordan National Curriculum", ar: "المنهاج الوطني الأردني" },
    academicYear: "2025/2026",
    kind: "national",
  });
  createGrade({
    id: IDS.gradeId,
    curriculumId: IDS.curriculumId,
    code: "G1",
    name: { en: "Grade 1", ar: "الصف الأول" },
    order: 1,
  });
  createSemester({
    id: IDS.semesterId,
    gradeId: IDS.gradeId,
    code: "S1",
    name: { en: "Semester 1 / Part 1", ar: "الفصل الأول / الجزء الأول" },
    order: 1,
  });
  createSubject({
    id: IDS.subjectId,
    gradeId: IDS.gradeId,
    semesterId: IDS.semesterId,
    code: "MATH",
    name: { en: "Mathematics", ar: "الرياضيات" },
  });
}

/**
 * Complete reference pipeline:
 * Create Country → Curriculum → Grades → Subjects → Import Book →
 * Detect Units/Lessons → Verify → ILE Package → Approve → Publish
 */
export function runJordanGrade1MathReference(opts?: {
  reset?: boolean;
  publish?: boolean;
}): JordanReferenceResult {
  const errors: string[] = [];
  if (opts?.reset !== false) resetHierarchyRegistry();

  try {
    seedJordanCountryCurriculum();

    let book = buildJordanGrade1MathPart1Book();
    book = normalizeBook(book);
    book = extractAssets(book);
    const meta = extractMetadata(book);
    const metaOk = validateMetadata(meta);
    if (!metaOk.ok) errors.push(`Metadata incomplete: ${metaOk.missing.join(", ")}`);

    const checksum = checksumBook({ ...book, metadata: meta });
    book = { ...book, metadata: meta, checksum };

    const rights = evaluateRights(JORDAN_G1_MATH_SOURCE);
    if (!rights.allowedToCompile) {
      errors.push(rights.notes.en);
      return fail(errors);
    }

    importBook({
      id: IDS.bookId,
      subjectId: IDS.subjectId,
      semesterId: IDS.semesterId,
      part: "Part 1",
      title: book.title,
      language: book.metadata.language,
      version: book.metadata.edition || "1",
      rightsStatus: rights.status,
      verificationStatus: "pending",
      sourceId: JORDAN_G1_MATH_SOURCE.id,
      checksum,
    });

    const unit = book.units[0]!;
    const lesson = unit.lessons[0]!;
    detectUnit({
      id: unit.id,
      bookId: IDS.bookId,
      order: unit.order,
      title: unit.title,
      overview: unit.overview,
    });
    detectLesson({
      id: lesson.id,
      unitId: unit.id,
      bookId: IDS.bookId,
      order: lesson.order,
      title: lesson.title,
      objectives: lesson.objectives,
      standards: ["JO-MATH-G1-N1"],
      keywords: lesson.keywords,
      references: lesson.references,
      assets: lesson.assets,
      activities: [
        {
          en: "Point to each object and say one, two, three.",
          ar: "أشر إلى كل شيء وقل واحد، اثنان، ثلاثة.",
        },
      ],
      body: lesson.body,
      language: book.metadata.language,
      version: "1",
      rightsStatus: rights.status,
      verificationStatus: "pending",
      published: false,
      ilePackageId: null,
    });

    const packages = buildIlePackagesFromBook({
      book,
      jobId: "ref_jo_g1_math",
      sourceId: JORDAN_G1_MATH_SOURCE.id,
      connectorId: "jordan-g1-math",
      checksum,
      rightsStatus: rights.status,
      verificationStatus: "pending",
      gates: [],
    });

    const gates = runVerificationGates({
      source: JORDAN_G1_MATH_SOURCE,
      book,
      packages,
      rightsPassed: rights.allowedToCompile && rights.status !== "rejected",
    });

    if (!allGatesPassed(gates)) {
      errors.push(
        ...gates.filter((g) => !g.passed).map((g) => g.message.en),
      );
      return {
        ok: false,
        published: false,
        hierarchyPath: hierarchyPath(),
        lessonId: lesson.id,
        packageId: null,
        package: null,
        gates: gates.map((g) => ({ gate: g.gate, passed: g.passed })),
        snapshot: getHierarchySnapshot(),
        errors,
      };
    }

    const compiled = packages.map((p) => ({
      ...p,
      status: "preview" as const,
      importMeta: {
        ...p.importMeta,
        gates,
        verificationStatus: "verified" as const,
        rightsStatus: rights.status,
      },
      engineMeta: {
        ...(p.engineMeta || {}),
        referenceImplementation: "jordan-g1-math",
        hierarchyPath: hierarchyPath(),
        noAiGeneration: true,
        noQuizGeneration: true,
        noVideoGeneration: true,
      },
    }));

    const ile = compiled[0]!;
    registerIlePackage(ile, lesson.id);

    // Mark lesson verified after gates
    detectLesson({
      id: lesson.id,
      unitId: unit.id,
      bookId: IDS.bookId,
      order: lesson.order,
      title: lesson.title,
      objectives: lesson.objectives,
      standards: ["JO-MATH-G1-N1"],
      keywords: lesson.keywords,
      references: lesson.references,
      assets: lesson.assets,
      activities: [
        {
          en: "Point to each object and say one, two, three.",
          ar: "أشر إلى كل شيء وقل واحد، اثنان، ثلاثة.",
        },
      ],
      body: lesson.body,
      language: book.metadata.language,
      version: "1",
      rightsStatus: rights.status,
      verificationStatus: "verified",
      published: false,
      ilePackageId: ile.id,
    });

    let published = false;
    if (opts?.publish !== false) {
      if (!rights.allowedToPublish) {
        errors.push("Rights allow compile but not publish");
      } else {
        approveAndPublishLesson(lesson.id);
        published = true;
      }
    }

    const finalPkg = getPackage(ile.id);

    return {
      ok: errors.length === 0 && Boolean(finalPkg),
      published,
      hierarchyPath: hierarchyPath(),
      lessonId: lesson.id,
      packageId: ile.id,
      package: finalPkg,
      gates: gates.map((g) => ({ gate: g.gate, passed: g.passed })),
      snapshot: getHierarchySnapshot(),
      errors,
    };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    return fail(errors);
  }
}

function hierarchyPath() {
  return [
    "Jordan",
    "National Curriculum",
    "Grade 1",
    "Mathematics",
    "Part 1",
    "Unit 1",
    "Lesson 1",
    "ILE Package",
  ];
}

function fail(errors: string[]): JordanReferenceResult {
  return {
    ok: false,
    published: false,
    hierarchyPath: hierarchyPath(),
    lessonId: IDS.lessonId,
    packageId: null,
    package: null,
    gates: [],
    snapshot: getHierarchySnapshot(),
    errors,
  };
}
