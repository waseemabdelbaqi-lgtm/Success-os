/**
 * ILE_PACKAGE_BUILDER — compile DetectedBook lessons into InteractiveLessonPackage.
 * Never renders. Never generates AI explanations, videos, or quizzes.
 */
import type {
  CompiledIlePackage,
  DetectedBook,
  DetectedLesson,
  DetectedUnit,
  GateResult,
  RightsStatus,
  VerificationStatus,
} from "@/types/curriculum-import-engine";
import type { ContentBlock, InteractiveSlide } from "@/types/interactive-lesson-engine";
import { FUTURE_CAPABILITY_PLACEHOLDERS } from "@/lib/interactive-lesson-engine/future-placeholders";
import { createBlock } from "@/lib/interactive-lesson-engine/block-library";

export function buildIlePackagesFromBook(args: {
  book: DetectedBook;
  jobId: string;
  sourceId: string;
  connectorId: string;
  checksum: string;
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
  gates: GateResult[];
}): CompiledIlePackage[] {
  const {
    book,
    jobId,
    sourceId,
    connectorId,
    checksum,
    rightsStatus,
    verificationStatus,
    gates,
  } = args;
  const at = new Date().toISOString();
  const packages: CompiledIlePackage[] = [];

  for (const unit of book.units) {
    for (let i = 0; i < unit.lessons.length; i++) {
      const lesson = unit.lessons[i]!;
      const nextLesson = unit.lessons[i + 1];
      packages.push(
        compileLesson({
          book,
          unit,
          lesson,
          nextLesson,
          jobId,
          sourceId,
          connectorId,
          checksum,
          rightsStatus,
          verificationStatus,
          gates,
          at,
        }),
      );
    }
  }

  return packages;
}

function compileLesson(args: {
  book: DetectedBook;
  unit: DetectedUnit;
  lesson: DetectedLesson;
  nextLesson?: DetectedLesson;
  jobId: string;
  sourceId: string;
  connectorId: string;
  checksum: string;
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
  gates: GateResult[];
  at: string;
}): CompiledIlePackage {
  const { book, unit, lesson, nextLesson, at } = args;
  const status =
    args.verificationStatus === "verified" && args.rightsStatus === "verified"
      ? "preview"
      : "draft";

  const overview = createBlock("rich_text", {
    id: `${lesson.id}_overview`,
    title: { en: "Overview", ar: "نظرة عامة" },
    text: lesson.body,
  });

  const objectiveBlocks: ContentBlock[] = lesson.objectives.map((obj, idx) =>
    createBlock("rich_text", {
      id: `${lesson.id}_obj_${idx}`,
      title: { en: `Objective ${idx + 1}`, ar: `هدف ${idx + 1}` },
      text: obj,
    }),
  );

  const conceptBlocks: ContentBlock[] = [
    createBlock("definition", {
      id: `${lesson.id}_def`,
      title: lesson.title,
      text: lesson.body,
    }),
  ];

  const refBlocks: ContentBlock[] = lesson.references.map((ref, idx) =>
    createBlock("external_reference", {
      id: `${lesson.id}_ref_${idx}`,
      title: ref.label,
      text: ref.label,
      href: ref.href,
      legalNote: {
        en: "Imported reference — structure/rights verified; no protected copy.",
        ar: "مرجع مستورد — بنية/حقوق موثّقة؛ بلا نسخ محمي.",
      },
    }),
  );

  const attachmentBlocks: ContentBlock[] = lesson.assets.map((asset) =>
    createBlock("downloadable_resource", {
      id: asset.id,
      title: asset.label,
      text: asset.label,
      downloadUrl: asset.src || null,
      placeholderStatus: asset.placeholder ? "planned" : "ready",
    }),
  );

  const slides: InteractiveSlide[] = [
    {
      id: `${lesson.id}_slide_1`,
      order: 1,
      title: lesson.title,
      kind: "concept",
      blocks: [overview, ...conceptBlocks],
    },
    {
      id: `${lesson.id}_slide_2`,
      order: 2,
      title: { en: "Objectives", ar: "الأهداف" },
      kind: "intro",
      blocks: objectiveBlocks.length
        ? objectiveBlocks
        : [
            createBlock("rich_text", {
              id: `${lesson.id}_obj_empty`,
              text: {
                en: "Objectives will be supplied by verified curriculum metadata.",
                ar: "تُزوَّد الأهداف من بيانات المنهاج الموثّقة.",
              },
            }),
          ],
    },
  ];

  // Explicitly no quiz / AI explanation / video generation blocks in import output.
  const pkg: CompiledIlePackage = {
    schema: "success-os.interactive-lesson-engine.v1",
    id: `ile_${lesson.id}`,
    version: 1,
    status,
    title: lesson.title,
    summary: lesson.body,
    filters: {
      country: book.metadata.country,
      curriculum: book.metadata.curriculum,
      grade: book.metadata.grade,
      subject: book.metadata.subject,
      unit: unit.title.en || unit.title.ar,
      lesson: lesson.title.en || lesson.title.ar,
      language: book.metadata.language === "bilingual" ? "ar" : book.metadata.language,
      difficulty: "core",
    },
    difficulty: "core",
    estimatedMinutes: 25,
    language: book.metadata.language,
    source: {
      kind: "book",
      bookId: book.id,
      unitId: unit.id,
      lessonId: lesson.id,
    },
    sections: {
      overview: [overview],
      learning_objectives: objectiveBlocks,
      interactive_slides: [],
      concepts: conceptBlocks,
      attachments: attachmentBlocks,
      lesson_summary: [
        createBlock("rich_text", {
          id: `${lesson.id}_summary`,
          title: { en: "Summary", ar: "ملخص" },
          text: lesson.body,
        }),
      ],
      next_lesson: nextLesson
        ? [
            createBlock("internal_nav", {
              id: `${lesson.id}_next`,
              title: nextLesson.title,
              text: nextLesson.title,
              href: `#ile_${nextLesson.id}`,
            }),
          ]
        : [],
    },
    slides,
    objectives: lesson.objectives,
    concepts: lesson.keywords.map((k) => ({ en: k, ar: k })),
    nextLesson: nextLesson
      ? { id: `ile_${nextLesson.id}`, title: nextLesson.title, href: `#ile_${nextLesson.id}` }
      : null,
    futureCapabilities: FUTURE_CAPABILITY_PLACEHOLDERS,
    accessibility: {
      captions: true,
      keyboardNav: true,
      readingMode: true,
      highContrast: true,
    },
    performance: {
      lazyLoad: true,
      virtualizeSlides: true,
      offlineReady: true,
    },
    changelog: [{ at, note: "Compiled by Curriculum Import Engine", by: "curriculum-import" }],
    engineMeta: {
      compiledBy: "success-os.curriculum-import-engine.v1",
      noAiGeneration: true,
      noQuizGeneration: true,
      noVideoGeneration: true,
      keywords: lesson.keywords,
      references: lesson.references,
    },
    createdAt: at,
    updatedAt: at,
    importMeta: {
      jobId: args.jobId,
      sourceId: args.sourceId,
      connectorId: args.connectorId,
      checksum: args.checksum,
      rightsStatus: args.rightsStatus,
      verificationStatus: args.verificationStatus,
      gates: args.gates,
      compiledAt: at,
      country: book.metadata.country,
      curriculum: book.metadata.curriculum,
    },
  };

  return pkg;
}
