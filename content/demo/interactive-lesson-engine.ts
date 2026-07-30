/**
 * Demo Interactive Lesson Engine package (no curriculum import).
 */
import type { InteractiveLessonPackage } from "@/types/interactive-lesson-engine";
import { createBlock } from "@/lib/interactive-lesson-engine/block-library";
import { FUTURE_CAPABILITY_PLACEHOLDERS } from "@/lib/interactive-lesson-engine/future-placeholders";

const loc = (en: string, ar: string) => ({ en, ar });

export const DEMO_INTERACTIVE_LESSON: InteractiveLessonPackage = {
  schema: "success-os.interactive-lesson-engine.v1",
  id: "ile-demo-foundation-current",
  version: 1,
  status: "published",
  title: loc("Interactive Lesson Engine — Foundation Demo", "محرك الدرس التفاعلي — عرض تأسيسي"),
  summary: loc(
    "Reusable interactive lesson foundation for every country and curriculum. Books-first; AI video later.",
    "أساس درس تفاعلي قابل لإعادة الاستخدام لكل دولة ومنهج. الكتب أولًا؛ فيديو الذكاء الاصطناعي لاحقًا.",
  ),
  filters: {
    country: "international",
    curriculum: "demo",
    qualification: "foundation",
    grade: "demo",
    subject: "platform",
    unit: "ile-unit-1",
    lesson: "ile-demo-foundation-current",
    language: "bilingual",
    difficulty: "intro",
  },
  difficulty: "intro",
  estimatedMinutes: 25,
  language: "bilingual",
  source: { kind: "engine-demo" },
  objectives: [
    loc("Navigate interactive lesson sections", "التنقّل بين أقسام الدرس التفاعلي"),
    loc("Use modular slide blocks", "استخدام كتل الشرائح المعيارية"),
    loc("Save workspace progress", "حفظ تقدّم مساحة العمل"),
  ],
  concepts: [
    loc("Interactive blocks", "كتل تفاعلية"),
    loc("Learning modes", "أوضاع التعلّم"),
    loc("Future-ready placeholders", "مواضع جاهزة للمستقبل"),
  ],
  slides: [
    {
      id: "slide-1",
      order: 1,
      title: loc("Welcome", "مرحبًا"),
      kind: "intro",
      blocks: [
        createBlock("rich_text", {
          id: "s1-rt",
          text: loc(
            "Every Success OS lesson is composed of interactive blocks — not a static PDF or a single video.",
            "كل درس في Success OS مكوّن من كتل تفاعلية — وليس PDF ثابتًا أو فيديوًا واحدًا.",
          ),
        }),
        createBlock("formula", {
          id: "s1-f",
          title: loc("Example formula block", "كتلة معادلة مثال"),
          formula: "I = Q / t",
        }),
      ],
    },
    {
      id: "slide-2",
      order: 2,
      title: loc("Modular blocks", "كتل معيارية"),
      kind: "concept",
      blocks: [
        createBlock("svg_diagram", {
          id: "s2-svg",
          title: loc("Block map", "خريطة الكتل"),
          svgMarkup:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140"><rect width="360" height="140" rx="12" fill="#f0fdfa"/><rect x="16" y="40" width="70" height="60" rx="8" fill="#99f6e4"/><rect x="100" y="40" width="70" height="60" rx="8" fill="#5eead4"/><rect x="184" y="40" width="70" height="60" rx="8" fill="#2dd4bf"/><rect x="268" y="40" width="70" height="60" rx="8" fill="#14b8a6"/><text x="180" y="24" text-anchor="middle" fill="#115e59" font-size="12">Reusable blocks</text></svg>',
        }),
        createBlock("interactive_chart", {
          id: "s2-chart",
          title: loc("Engagement (demo)", "التفاعل (تجريبي)"),
          chart: {
            kind: "bar",
            labels: ["Read", "Slides", "Practice", "Chat"],
            values: [40, 70, 55, 30],
          },
        }),
        createBlock("quick_question", {
          id: "s2-q",
          question: {
            prompt: loc(
              "Lessons should be primarily…",
              "يجب أن تكون الدروس أساسًا…",
            ),
            options: [
              loc("A single PDF", "ملف PDF واحد"),
              loc("Interactive blocks", "كتل تفاعلية"),
              loc("One video only", "فيديو واحد فقط"),
            ],
            answerIndex: 1,
            explanation: loc(
              "Interactive blocks are the core learning experience.",
              "الكتل التفاعلية هي تجربة التعلّم الأساسية.",
            ),
          },
        }),
      ],
    },
    {
      id: "slide-3",
      order: 3,
      title: loc("Placeholders", "مواضع مستقبلية"),
      kind: "summary",
      blocks: [
        createBlock("video_placeholder", {
          id: "s3-v",
          placeholderStatus: "not-produced",
          text: loc(
            "AI teacher video & human recorded lesson — placeholders only in this phase.",
            "فيديو المعلّم الذكي والدرس المسجّل بشريًا — مواضع فقط في هذه المرحلة.",
          ),
        }),
        createBlock("simulation_placeholder", {
          id: "s3-s",
          placeholderStatus: "planned",
          text: loc(
            "Simulations and virtual labs will plug into this slot later.",
            "المحاكاة والمختبرات الافتراضية ستُوصَل بهذه الخانة لاحقًا.",
          ),
        }),
        createBlock("downloadable_resource", {
          id: "s3-d",
          title: loc("Foundation checklist", "قائمة التحقق التأسيسية"),
          protected: false,
          downloadUrl: null,
          placeholderStatus: "planned",
        }),
      ],
    },
  ],
  sections: {
    overview: [
      createBlock("rich_text", {
        id: "ov",
        text: loc(
          "Foundation viewer for every lesson before curriculum ingestion and AI video generation.",
          "عارض تأسيسي لكل درس قبل استيراد المناهج وتوليد فيديو الذكاء الاصطناعي.",
        ),
      }),
    ],
    learning_objectives: [
      createBlock("rich_text", {
        id: "obj",
        text: loc(
          "1. Navigate sections\n2. Use slides & blocks\n3. Save workspace progress",
          "1. التنقّل بين الأقسام\n2. استخدام الشرائح والكتل\n3. حفظ تقدّم مساحة العمل",
        ),
      }),
    ],
    interactive_slides: [],
    concepts: [
      createBlock("rich_text", {
        id: "con",
        text: loc(
          "Blocks · Modes · Filters · Placeholders",
          "كتل · أوضاع · مرشّحات · مواضع",
        ),
      }),
    ],
    images_diagrams: [
      createBlock("image", {
        id: "img",
        placeholderStatus: "planned",
        text: loc("Image slot", "خانة صورة"),
      }),
    ],
    animations: [
      createBlock("embedded_media", {
        id: "anim",
        placeholderStatus: "planned",
        text: loc("Animation placeholder", "موضع رسوم متحركة"),
      }),
    ],
    simulation_3d: [
      createBlock("simulation_placeholder", {
        id: "sim",
        placeholderStatus: "planned",
      }),
    ],
    teacher_video: [
      createBlock("video_placeholder", {
        id: "tv",
        placeholderStatus: "not-produced",
      }),
    ],
    ai_explanation: [
      createBlock("ai_explanation", {
        id: "ai",
        text: loc(
          "AI explanation panel is ready as UI; generation stays gated.",
          "لوحة الشرح الذكي جاهزة كواجهة؛ التوليد يبقى مقيّدًا.",
        ),
      }),
    ],
    student_notes: [
      createBlock("notes", {
        id: "sn",
        text: loc(
          "Use the workspace to capture personal notes.",
          "استخدم مساحة العمل لتدوين ملاحظاتك.",
        ),
      }),
    ],
    attachments: [
      createBlock("downloadable_resource", {
        id: "att",
        title: loc("Attachments", "مرفقات"),
        placeholderStatus: "planned",
      }),
    ],
    practice_questions: [
      createBlock("quick_question", {
        id: "pq",
        question: {
          prompt: loc("Is curriculum imported in this phase?", "هل يُستورد المنهج في هذه المرحلة؟"),
          options: [loc("Yes", "نعم"), loc("No", "لا")],
          answerIndex: 1,
          explanation: loc("Do not import curricula yet.", "لا تستورد المناهج بعد."),
        },
      }),
    ],
    ai_chat: [
      createBlock("rich_text", {
        id: "chat",
        text: loc("Lesson-scoped AI Ask lives in the workspace.", "اسأل الذكاء الاصطناعي ضمن مساحة العمل."),
      }),
    ],
    homework: [
      createBlock("rich_text", {
        id: "hw",
        text: loc(
          "Explore each section and mark progress complete.",
          "استكشف كل قسم وعلّم التقدّم كمكتمل.",
        ),
      }),
    ],
    lesson_summary: [
      createBlock("rich_text", {
        id: "sum",
        text: loc(
          "Interactive Lesson Engine foundation is ready for Jordan-first curriculum import next.",
          "أساس محرك الدرس التفاعلي جاهز لاستيراد منهج الأردن أولًا لاحقًا.",
        ),
      }),
    ],
    progress: [
      createBlock("rich_text", {
        id: "prog",
        text: loc("Progress is saved locally in this phase.", "يُحفظ التقدّم محليًا في هذه المرحلة."),
      }),
    ],
    next_lesson: [
      createBlock("internal_nav", {
        id: "next",
        text: loc("Open a book lesson to see books-first adaptation.", "افتح درس كتاب لرؤية التكيّف المعتمد على الكتب."),
        href: "/student/books",
      }),
    ],
  },
  nextLesson: {
    id: "books",
    title: loc("Browse books", "تصفّح الكتب"),
    href: "/student/books",
  },
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
  changelog: [
    {
      at: "2026-07-30T00:00:00.000Z",
      note: "Foundation demo package",
      by: "interactive-lesson-engine",
    },
  ],
  updatedAt: "2026-07-30T00:00:00.000Z",
  createdAt: "2026-07-30T00:00:00.000Z",
};
