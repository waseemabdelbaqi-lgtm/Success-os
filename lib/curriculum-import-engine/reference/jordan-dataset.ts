/**
 * Jordan reference dataset seeder + verification + sample ILE package.
 * Metadata standard only — no AI generation (PR #50.2).
 */
import { createHash } from "node:crypto";
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
  getLesson,
  getPackage,
  importBook,
  registerIlePackage,
  resetHierarchyRegistry,
  updateLesson,
} from "../hierarchy/registry";
import {
  JO_CANONICAL_LESSON_ID,
  JORDAN_REFERENCE_DATASET,
} from "@/content/demo/jordan-reference-dataset";
import { evaluateRights } from "../rights/engine";
import { buildIlePackagesFromBook } from "../ile-package-builder";
import { runVerificationGates, allGatesPassed } from "../verification/engine";
import type {
  DetectedBook,
  CurriculumSourceRef,
  CompiledIlePackage,
} from "@/types/curriculum-import-engine";
import type {
  LessonMetadataRecord,
  LessonVerificationReport,
} from "@/types/curriculum-hierarchy";

const SOURCE: CurriculumSourceRef = {
  id: JORDAN_REFERENCE_DATASET.source.id,
  type: "curriculum_authority",
  connectorId: JORDAN_REFERENCE_DATASET.source.connectorId,
  label: {
    en: "Jordan NCCD — National Curriculum reference dataset",
    ar: "المركز الوطني — مجموعة بيانات المنهاج الوطني المرجعية",
  },
  country: "Jordan",
  curriculum: "Jordan National Curriculum",
  url: "https://nccd.gov.jo",
  authority: JORDAN_REFERENCE_DATASET.source.authority,
  license: JORDAN_REFERENCE_DATASET.source.license,
};

const PLATFORM_VERSION = "success-os.curriculum-hierarchy.v1";
const OFFICIAL_VERSION = "JO-NCCD-2025/2026";
const CONTENT_VERSION = "1.0.0";

function checksumOf(parts: string[]) {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

/** Deterministic UUID v5-shaped id from global lesson id (stable across seeds). */
function lessonUuidFromGlobalId(globalLessonId: string): string {
  const h = createHash("sha256").update(`success-os.lesson.uuid:${globalLessonId}`).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    `5${h.slice(13, 16)}`,
    `${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${h.slice(18, 20)}`,
    h.slice(20, 32),
  ].join("-");
}

function buildVerification(args: {
  rightsOk: boolean;
  metaOk: boolean;
  structureOk: boolean;
  packageOk: boolean;
  published: boolean;
  rejected: boolean;
}): LessonVerificationReport {
  if (args.rejected) {
    return {
      sourceStatus: "pass",
      rightsStatus: "fail",
      structureStatus: args.structureOk ? "pass" : "fail",
      metadataStatus: args.metaOk ? "pass" : "fail",
      packageStatus: "fail",
      publishingStatus: "rejected",
    };
  }
  return {
    sourceStatus: "pass",
    rightsStatus: args.rightsOk ? "pass" : "fail",
    structureStatus: args.structureOk ? "pass" : "fail",
    metadataStatus: args.metaOk ? "pass" : "fail",
    packageStatus: args.packageOk ? "pass" : "pending",
    publishingStatus: args.published
      ? "published"
      : args.rightsOk && args.metaOk && args.structureOk
        ? "pending"
        : "blocked",
  };
}

export type JordanDatasetRunResult = {
  ok: boolean;
  tree: ReturnType<typeof buildSampleTree>;
  counts: ReturnType<typeof getHierarchySnapshot>["counts"];
  validationErrors: string[];
  rightsWarnings: string[];
  sampleMetadata: LessonMetadataRecord | null;
  samplePackage: CompiledIlePackage | null;
  samplePath: string[];
  validationReport: {
    totalLessons: number;
    verified: number;
    pending: number;
    rejected: number;
    published: number;
    packages: number;
    gateSummary: Record<string, number>;
  };
};

export function buildSampleTree() {
  const grade = JORDAN_REFERENCE_DATASET.grades[0]!;
  return {
    idConvention: JORDAN_REFERENCE_DATASET.idConvention.example,
    country: {
      id: JORDAN_REFERENCE_DATASET.country.id,
      name: JORDAN_REFERENCE_DATASET.country.name.en,
    },
    curriculum: {
      id: JORDAN_REFERENCE_DATASET.curriculum.id,
      name: JORDAN_REFERENCE_DATASET.curriculum.name.en,
    },
    grade: {
      id: grade.id,
      name: grade.name.en,
    },
    semester: {
      id: grade.semesterId,
      name: grade.semesterName.en,
    },
    subjects: grade.subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name.en,
      books: s.books.map((b) => ({
        id: b.id,
        part: b.part,
        units: b.units.map((u) => ({
          id: u.id,
          title: u.title.en,
          lessons: u.lessons.map((l) => ({
            id: l.id,
            order: l.order,
            title: l.title.en,
            verificationStatus: l.verificationStatus,
            rightsStatus: l.rightsStatus,
          })),
        })),
      })),
    })),
  };
}

/**
 * Load full Jordan Grade 1 reference dataset into hierarchy registry.
 * Compiles + publishes the first fully verified Math lesson as the ILE example.
 */
export function runJordanReferenceDataset(opts?: { reset?: boolean }): JordanDatasetRunResult {
  if (opts?.reset !== false) resetHierarchyRegistry();

  const ds = JORDAN_REFERENCE_DATASET;
  const grade = ds.grades[0]!;

  createCountry({
    id: ds.country.id,
    code: ds.country.code,
    name: ds.country.name,
  });
  attachCurriculum({
    id: ds.curriculum.id,
    countryId: ds.country.id,
    name: ds.curriculum.name,
    academicYear: ds.curriculum.academicYear,
    kind: ds.curriculum.kind,
  });
  createGrade({
    id: grade.id,
    curriculumId: ds.curriculum.id,
    code: grade.code,
    name: grade.name,
    order: grade.order,
  });
  createSemester({
    id: grade.semesterId,
    gradeId: grade.id,
    code: "S01",
    name: grade.semesterName,
    order: 1,
  });

  let samplePackage: CompiledIlePackage | null = null;
  let sampleMetadata: LessonMetadataRecord | null = null;
  const samplePath = [
    "JO",
    "JO-NATIONAL",
    "JO-NATIONAL-G01",
    "JO-NATIONAL-G01-MATH",
    "JO-NATIONAL-G01-S01",
    "JO-NATIONAL-G01-MATH-B01",
    "JO-NATIONAL-G01-MATH-B01-U01",
    "JO-NATIONAL-G01-MATH-B01-U01-L01",
    "Verified ILE Package",
    "Interactive Lesson Engine",
  ];

  const rights = evaluateRights(SOURCE);

  for (const subject of grade.subjects) {
    createSubject({
      id: subject.id,
      gradeId: grade.id,
      semesterId: grade.semesterId,
      code: subject.code,
      name: subject.name,
    });

    for (const book of subject.books) {
      importBook({
        id: book.id,
        subjectId: subject.id,
        semesterId: grade.semesterId,
        part: book.part,
        title: book.title,
        language: "bilingual",
        version: "1",
        rightsStatus: "verified",
        verificationStatus: "verified",
        sourceId: SOURCE.id,
      });

      for (const unit of book.units) {
        detectUnit({
          id: unit.id,
          bookId: book.id,
          order: unit.order,
          title: unit.title,
        });

        for (let lessonIdx = 0; lessonIdx < unit.lessons.length; lessonIdx++) {
          const les = unit.lessons[lessonIdx]!;
          const rejected = les.verificationStatus === "rejected" || les.rightsStatus === "rejected";
          const metaOk = Boolean(les.title.en || les.title.ar) && les.objectives.length > 0;
          const structureOk = Boolean(unit.id && book.id && les.id);
          const rightsOk = les.rightsStatus === "verified";
          const checksum = checksumOf([
            ds.country.code,
            grade.code,
            subject.code,
            book.id,
            unit.id,
            les.id,
            String(les.order),
            les.title.en,
          ]);

          const verification = buildVerification({
            rightsOk,
            metaOk,
            structureOk,
            packageOk: false,
            published: false,
            rejected,
          });

          const prev = unit.lessons[lessonIdx - 1];
          const next = unit.lessons[lessonIdx + 1];
          const relatedLessons = unit.lessons
            .filter((l) => l.id !== les.id)
            .map((l) => l.id);
          const verificationStatus = rejected
            ? "rejected"
            : rightsOk && metaOk
              ? les.verificationStatus
              : "pending";
          const verified = verificationStatus === "verified";

          const metadata: LessonMetadataRecord = {
            lessonUuid: lessonUuidFromGlobalId(les.id),
            globalLessonId: les.id,
            curriculumId: ds.curriculum.id,
            countryId: ds.country.id,
            language: "bilingual",
            version: CONTENT_VERSION,
            officialVersion: OFFICIAL_VERSION,
            platformVersion: PLATFORM_VERSION,
            parentLesson: prev?.id ?? null,
            childLessons: [],
            relatedLessons,
            prerequisites: prev ? [prev.id] : [],
            nextLessons: next ? [next.id] : [],
            estimatedDuration: 25,
            difficulty: "core",
            bloomLevel: "understand",
            skills: [
              subject.code.toLowerCase(),
              ...les.keywords.slice(0, 3),
            ],
            tags: [
              ds.country.id,
              ds.curriculum.id,
              grade.id,
              subject.id,
              book.id,
              unit.id,
            ],
            aiReady: false,
            published: false,
            verified,
            archived: false,
            country: ds.country.name.en,
            curriculum: ds.curriculum.name.en,
            grade: grade.name.en,
            semester: grade.semesterName.en,
            subject: subject.name.en,
            book: book.title.en,
            unit: unit.title.en,
            lesson: les.title.en,
            lessonOrder: les.order,
            officialLessonTitle: les.title,
            learningObjectives: les.objectives,
            keywords: les.keywords,
            references: les.references,
            rightsStatus: les.rightsStatus,
            verificationStatus,
            packageVersion: CONTENT_VERSION,
            checksum,
            verification,
          };

          detectLesson({
            id: les.id,
            unitId: unit.id,
            bookId: book.id,
            order: les.order,
            title: les.title,
            objectives: les.objectives,
            standards: [`JO-${subject.code}-G1`],
            keywords: les.keywords,
            references: les.references,
            assets: [
              {
                id: `${les.id}_asset`,
                kind: "other",
                label: { en: "Asset slot", ar: "موضع أصل" },
                src: null,
                placeholder: true,
              },
            ],
            activities: [],
            body: {
              en: `Metadata synopsis for ${les.title.en}. Official content packaging only — not AI-generated.`,
              ar: `ملخص بيانات وصفية لـ ${les.title.ar}. تعبئة رسمية فقط — دون توليد ذكاء اصطناعي.`,
            },
            language: "bilingual",
            version: "1",
            rightsStatus: les.rightsStatus,
            verificationStatus: metadata.verificationStatus,
            published: false,
            ilePackageId: null,
            checksum,
            verification,
            metadata,
          });

          // Compile + publish only the canonical Math Book1 Unit1 Lesson1 when verified
          // Canonical ID: JO-NATIONAL-G01-MATH-B01-U01-L01
          if (
            les.id === JO_CANONICAL_LESSON_ID &&
            les.packageEligible &&
            !rejected &&
            rightsOk &&
            metaOk
          ) {
            const detectedBook: DetectedBook = {
              id: book.id,
              title: book.title,
              checksum,
              metadata: {
                country: "Jordan",
                curriculum: "Jordan National Curriculum",
                grade: "Grade 1",
                semester: "Semester 1",
                subject: "Mathematics",
                language: "bilingual",
                edition: "REF-DATASET-2026.1",
                keywords: les.keywords,
                objectives: les.objectives,
                sourceId: SOURCE.id,
                rightsStatus: "verified",
                verificationStatus: "verified",
              },
              units: [
                {
                  id: unit.id,
                  title: unit.title,
                  order: unit.order,
                  lessons: [
                    {
                      id: les.id,
                      title: les.title,
                      order: les.order,
                      objectives: les.objectives,
                      keywords: les.keywords,
                      body: {
                        en: "We count objects one by one: one, two, three.",
                        ar: "نعدّ الأشياء واحدًا واحدًا: واحد، اثنان، ثلاثة.",
                      },
                      assets: [
                        {
                          id: `${les.id}_asset`,
                          kind: "image",
                          label: { en: "Counting dots", ar: "نقاط العد" },
                          src: null,
                          placeholder: true,
                        },
                      ],
                      references: les.references,
                    },
                  ],
                },
              ],
            };

            const packages = buildIlePackagesFromBook({
              book: detectedBook,
              jobId: "jordan_reference_dataset",
              sourceId: SOURCE.id,
              connectorId: SOURCE.connectorId,
              checksum,
              rightsStatus: "verified",
              verificationStatus: "verified",
              gates: [],
            });
            const gates = runVerificationGates({
              source: SOURCE,
              book: detectedBook,
              packages,
              rightsPassed: rights.allowedToCompile,
            });
            if (allGatesPassed(gates) && packages[0]) {
              const pkg = {
                ...packages[0],
                status: "preview" as const,
                importMeta: {
                  ...packages[0].importMeta,
                  gates,
                  verificationStatus: "verified" as const,
                },
                engineMeta: {
                  ...(packages[0].engineMeta || {}),
                  referenceDataset: "jordan-reference-dataset.v1",
                  hierarchyPath: samplePath,
                  noAiGeneration: true,
                },
              };
              registerIlePackage(pkg, les.id);
              updateLesson(les.id, {
                verificationStatus: "verified",
                ilePackageId: pkg.id,
                verification: {
                  ...verification,
                  packageStatus: "pass",
                  publishingStatus: "pending",
                },
                metadata: {
                  ...metadata,
                  verificationStatus: "verified",
                  verified: true,
                  verification: {
                    ...verification,
                    packageStatus: "pass",
                    publishingStatus: "pending",
                  },
                },
              });
              if (rights.allowedToPublish) {
                approveAndPublishLesson(les.id);
                const published = getLesson(les.id)!;
                updateLesson(les.id, {
                  verification: {
                    ...published.verification!,
                    publishingStatus: "published",
                  },
                  metadata: published.metadata
                    ? {
                        ...published.metadata,
                        published: true,
                        verified: true,
                        aiReady: false,
                        archived: false,
                        verification: {
                          ...published.metadata.verification,
                          publishingStatus: "published",
                        },
                      }
                    : published.metadata,
                });
              }
              samplePackage = getPackage(pkg.id);
              sampleMetadata = getLesson(les.id)?.metadata || metadata;
            }
          }
        }
      }
    }
  }

  const snap = getHierarchySnapshot();
  const gateSummary: Record<string, number> = {
    source_pass: 0,
    rights_pass: 0,
    structure_pass: 0,
    metadata_pass: 0,
    package_pass: 0,
    published: 0,
    rejected: 0,
  };
  for (const l of snap.lessons) {
    const v = l.verification;
    if (!v) continue;
    if (v.sourceStatus === "pass") gateSummary.source_pass++;
    if (v.rightsStatus === "pass") gateSummary.rights_pass++;
    if (v.structureStatus === "pass") gateSummary.structure_pass++;
    if (v.metadataStatus === "pass") gateSummary.metadata_pass++;
    if (v.packageStatus === "pass") gateSummary.package_pass++;
    if (v.publishingStatus === "published") gateSummary.published++;
    if (v.publishingStatus === "rejected") gateSummary.rejected++;
  }

  return {
    ok: Boolean(samplePackage) && snap.counts.published >= 1,
    tree: buildSampleTree(),
    counts: snap.counts,
    validationErrors: snap.validationErrors,
    rightsWarnings: snap.rightsWarnings,
    sampleMetadata,
    samplePackage,
    samplePath,
    validationReport: {
      totalLessons: snap.counts.lessons,
      verified: snap.counts.verified,
      pending: snap.counts.pending,
      rejected: snap.counts.rejected,
      published: snap.counts.published,
      packages: snap.counts.packages,
      gateSummary,
    },
  };
}
