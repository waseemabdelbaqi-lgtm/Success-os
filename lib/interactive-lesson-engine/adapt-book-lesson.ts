/**
 * Adapt Book portal lessons → Interactive Lesson Engine packages (books-first).
 */
import type {
  BookDefinition,
  LessonDefinition,
  UnitDefinition,
} from "@/types/student-portal";
import type {
  ContentBlock,
  InteractiveLessonPackage,
  InteractiveSlide,
  LessonSectionId,
} from "@/types/interactive-lesson-engine";
import { createBlock } from "./block-library";
import { FUTURE_CAPABILITY_PLACEHOLDERS } from "./future-placeholders";

function loc(en: string, ar?: string) {
  return { en, ar: ar || en };
}

function textFromLocalized(
  value: Record<"en" | "ar", string> | Record<"en" | "ar", string[]> | undefined,
  fallback = "",
): { en: string; ar: string } {
  if (!value) return loc(fallback);
  if (Array.isArray((value as { en?: unknown }).en)) {
    const en = ((value as { en: string[] }).en || []).join("\n");
    const ar = ((value as { ar: string[] }).ar || []).join("\n");
    return { en, ar: ar || en };
  }
  const v = value as { en: string; ar: string };
  return { en: v.en || fallback, ar: v.ar || v.en || fallback };
}

export function adaptBookLessonToInteractivePackage(
  book: BookDefinition,
  unit: UnitDefinition,
  lesson: LessonDefinition,
  opts?: { next?: { id: string; title: { en: string; ar: string }; href?: string } | null },
): InteractiveLessonPackage {
  const now = new Date().toISOString();
  const slides: InteractiveSlide[] = [
    {
      id: `${lesson.id}-slide-overview`,
      order: 1,
      title: textFromLocalized(lesson.title),
      kind: "intro",
      blocks: [
        createBlock("rich_text", {
          id: `${lesson.id}-rt-summary`,
          text: textFromLocalized(lesson.summary),
        }),
        createBlock("notes", {
          id: `${lesson.id}-notes-obj`,
          title: loc("Objectives", "الأهداف"),
          text: {
            en: (lesson.objectives?.en || []).join(" • "),
            ar: (lesson.objectives?.ar || []).join(" • "),
          },
        }),
      ],
    },
    {
      id: `${lesson.id}-slide-content`,
      order: 2,
      title: loc("Core content", "المحتوى الأساسي"),
      kind: "concept",
      blocks: [
        createBlock("rich_text", {
          id: `${lesson.id}-rt-content`,
          text: textFromLocalized(lesson.content),
        }),
        ...(lesson.keyConcepts?.en?.length
          ? [
              createBlock("rich_text", {
                id: `${lesson.id}-rt-concepts`,
                title: loc("Key concepts", "المفاهيم الأساسية"),
                text: {
                  en: lesson.keyConcepts.en.join("\n"),
                  ar: (lesson.keyConcepts.ar || []).join("\n"),
                },
              }),
            ]
          : []),
      ],
    },
  ];

  if (lesson.definitions?.en?.length) {
    slides.push({
      id: `${lesson.id}-slide-defs`,
      order: 3,
      title: loc("Definitions", "التعريفات"),
      kind: "concept",
      blocks: lesson.definitions.en.map((d, i) =>
        createBlock("rich_text", {
          id: `${lesson.id}-def-${i}`,
          title: loc(d.term, lesson.definitions?.ar?.[i]?.term || d.term),
          text: loc(d.meaning, lesson.definitions?.ar?.[i]?.meaning || d.meaning),
        }),
      ),
    });
  }

  slides.push({
    id: `${lesson.id}-slide-media`,
    order: slides.length + 1,
    title: loc("Media & practice", "وسائط وتدريب"),
    kind: "practice",
    blocks: [
      createBlock("video_placeholder", {
        id: `${lesson.id}-vid`,
        title: loc("Teacher video", "فيديو المعلم"),
        placeholderStatus: "not-produced",
        text: loc(
          "Video not produced yet. Script/storyboard is never labeled as finished video.",
          "الفيديو غير مُنتَج بعد. لا يُعتبر السيناريو فيديوًا نهائيًا.",
        ),
      }),
      createBlock("simulation_placeholder", {
        id: `${lesson.id}-sim`,
        title: loc("3D / Simulation", "محاكاة / ثلاثي الأبعاد"),
        placeholderStatus: "planned",
        text: loc(
          "Simulation runtime reserved for a later phase.",
          "محرك المحاكاة محجوز لمرحلة لاحقة.",
        ),
      }),
      createBlock("ai_explanation", {
        id: `${lesson.id}-ai`,
        title: loc("AI explanation", "شرح ذكي"),
        text: textFromLocalized(lesson.summary),
      }),
      createBlock("quick_question", {
        id: `${lesson.id}-qq`,
        question: {
          prompt: loc(
            "Which statement best matches this lesson’s goal?",
            "أي عبارة تطابق هدف هذا الدرس؟",
          ),
          options: [
            textFromLocalized(lesson.summary),
            loc("Unrelated topic", "موضوع غير مرتبط"),
          ],
          answerIndex: 0,
          explanation: loc("Stay focused on this lesson’s outcomes.", "ركّز على نواتج هذا الدرس."),
        },
      }),
    ],
  });

  const diagramBlocks: ContentBlock[] = (lesson.diagrams || []).map((d) =>
    createBlock("svg_diagram", {
      id: d.id,
      title: textFromLocalized(d.title),
      text: textFromLocalized(d.description),
      svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" role="img"><rect width="320" height="120" fill="#ecfdf5"/><text x="16" y="64" fill="#0f766e" font-size="14">${d.type}</text></svg>`,
      alt: textFromLocalized(d.title),
    }),
  );

  const sections: InteractiveLessonPackage["sections"] = {
    overview: [
      createBlock("rich_text", {
        id: `${lesson.id}-ov`,
        text: textFromLocalized(lesson.summary),
      }),
    ],
    learning_objectives: [
      createBlock("rich_text", {
        id: `${lesson.id}-obj`,
        text: {
          en: (lesson.objectives?.en || []).map((x, i) => `${i + 1}. ${x}`).join("\n"),
          ar: (lesson.objectives?.ar || []).map((x, i) => `${i + 1}. ${x}`).join("\n"),
        },
      }),
    ],
    interactive_slides: slides.flatMap((s) => s.blocks),
    concepts: [
      createBlock("rich_text", {
        id: `${lesson.id}-concepts`,
        text: {
          en: (lesson.keyConcepts?.en || []).join("\n"),
          ar: (lesson.keyConcepts?.ar || []).join("\n"),
        },
      }),
    ],
    images_diagrams: diagramBlocks.length
      ? diagramBlocks
      : [
          createBlock("image", {
            id: `${lesson.id}-img-ph`,
            title: loc("Diagram placeholder", "موضع مخطط"),
            placeholderStatus: "planned",
            text: loc("No diagrams attached yet.", "لا مخططات مرفقة بعد."),
          }),
        ],
    animations: [
      createBlock("embedded_media", {
        id: `${lesson.id}-anim`,
        placeholderStatus: "planned",
        text: loc("Animation placeholder", "موضع رسوم متحركة"),
      }),
    ],
    simulation_3d: [
      createBlock("simulation_placeholder", {
        id: `${lesson.id}-sim-sec`,
        placeholderStatus: "planned",
      }),
    ],
    teacher_video: [
      createBlock("video_placeholder", {
        id: `${lesson.id}-tv`,
        placeholderStatus: "not-produced",
      }),
    ],
    ai_explanation: [
      createBlock("ai_explanation", {
        id: `${lesson.id}-ai-sec`,
        text: textFromLocalized(lesson.summary),
      }),
    ],
    student_notes: [
      createBlock("notes", {
        id: `${lesson.id}-sn`,
        text: {
          en: (lesson.importantNotes?.en || []).join("\n"),
          ar: (lesson.importantNotes?.ar || []).join("\n"),
        },
      }),
    ],
    attachments: [
      createBlock("downloadable_resource", {
        id: `${lesson.id}-att`,
        title: loc("Lesson worksheet (draft)", "ورقة عمل الدرس (مسودة)"),
        protected: true,
        downloadUrl: null,
        placeholderStatus: "planned",
      }),
    ],
    practice_questions: [
      createBlock("quick_question", {
        id: `${lesson.id}-pq`,
        question: {
          prompt: loc("Recall one key idea from this lesson.", "اذكر فكرة أساسية من هذا الدرس."),
          options: (lesson.keyConcepts?.en || ["Key idea"]).slice(0, 3).map((c, i) =>
            loc(c, lesson.keyConcepts?.ar?.[i] || c),
          ),
          answerIndex: 0,
        },
      }),
    ],
    ai_chat: [
      createBlock("rich_text", {
        id: `${lesson.id}-chat`,
        text: loc(
          "Use the AI Ask button in the student workspace. Lesson-scoped chat only.",
          "استخدم زر اسأل الذكاء الاصطناعي في مساحة الطالب. المحادثة ضمن الدرس فقط.",
        ),
      }),
    ],
    homework: [
      createBlock("rich_text", {
        id: `${lesson.id}-hw`,
        text: loc(
          "Review notes and complete the practice question before the next lesson.",
          "راجع الملاحظات وأكمل سؤال التدريب قبل الدرس التالي.",
        ),
      }),
    ],
    lesson_summary: [
      createBlock("rich_text", {
        id: `${lesson.id}-sum`,
        text: textFromLocalized(lesson.summary),
      }),
    ],
    progress: [
      createBlock("rich_text", {
        id: `${lesson.id}-prog`,
        text: loc("Track section completion in the workspace panel.", "تتبع إكمال الأقسام في لوحة مساحة العمل."),
      }),
    ],
    next_lesson: opts?.next
      ? [
          createBlock("internal_nav", {
            id: `${lesson.id}-next`,
            title: opts.next.title,
            href: opts.next.href,
            text: loc("Continue to next lesson", "انتقل إلى الدرس التالي"),
          }),
        ]
      : [
          createBlock("rich_text", {
            id: `${lesson.id}-next-none`,
            text: loc("End of unit path in this demo.", "نهاية مسار الوحدة في هذا العرض."),
          }),
        ],
  };

  return {
    schema: "success-os.interactive-lesson-engine.v1",
    id: `ile_${book.id}_${unit.id}_${lesson.id}`,
    version: 1,
    status: "published",
    title: textFromLocalized(lesson.title),
    summary: textFromLocalized(lesson.summary),
    filters: {
      country: book.countryId,
      curriculum: book.curriculumId,
      grade: book.gradeId,
      subject: book.subjectId,
      unit: unit.id,
      lesson: lesson.id,
      language: book.language,
      difficulty: "core",
    },
    difficulty: "core",
    estimatedMinutes: lesson.estimatedMinutes || 20,
    language: book.language === "ar" ? "ar" : book.language === "en" ? "en" : "bilingual",
    source: {
      kind: "book",
      bookId: book.id,
      unitId: unit.id,
      lessonId: lesson.id,
    },
    sections,
    slides,
    objectives: (lesson.objectives?.en || []).map((en, i) =>
      loc(en, lesson.objectives?.ar?.[i] || en),
    ),
    concepts: (lesson.keyConcepts?.en || []).map((en, i) =>
      loc(en, lesson.keyConcepts?.ar?.[i] || en),
    ),
    nextLesson: opts?.next || null,
    futureCapabilities: FUTURE_CAPABILITY_PLACEHOLDERS,
    accessibility: {
      captions: true,
      keyboardNav: true,
      readingMode: true,
      highContrast: false,
    },
    performance: {
      lazyLoad: true,
      virtualizeSlides: true,
      offlineReady: true,
    },
    changelog: [{ at: now, note: "Adapted from book lesson (books-first)", by: "ile-adapter" }],
    updatedAt: now,
    createdAt: now,
  };
}

export function listVisibleSections(
  pkg: InteractiveLessonPackage,
): LessonSectionId[] {
  return (Object.keys(pkg.sections) as LessonSectionId[]).filter(
    (k) => (pkg.sections[k] || []).length > 0,
  );
}
