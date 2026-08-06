/**
 * Official AI Teacher Engine stack path and layer contracts.
 */
import type { AteLayerContract } from "@/types/ai-teacher-engine";

function L(en: string, ar: string) {
  return { en, ar };
}

export const AI_TEACHER_ENGINE_PATH = [
  "student",
  "ai_teacher",
  "conversation_engine",
  "reasoning_engine",
  "student_memory",
  "knowledge_graph",
  "curriculum_registry",
  "interactive_lesson_engine",
  "digital_books",
  "videos",
  "assessments",
] as const;

export const AI_TEACHER_ENGINE_DISPLAY_PATH = [
  "Student",
  "AI Teacher",
  "Conversation Engine",
  "Reasoning Engine",
  "Student Memory",
  "Knowledge Graph",
  "Curriculum Registry",
  "Interactive Lesson Engine",
  "Digital Books",
  "Videos",
  "Assessments",
] as const;

export const ATE_LAYER_CONTRACTS: AteLayerContract[] = [
  {
    id: "student",
    order: 1,
    name: L("Student", "الطالب"),
    role: L(
      "Learner identity and intent enter the AI Teacher",
      "هوية المتعلم ونيّته تدخل المعلم الذكي",
    ),
    status: "operational",
    bindsTo: ["success-os.student-foundation.v1"],
    activatesInPr: "#50.3 / #55",
    generatesContent: false,
    rendersLessons: false,
    notes: ["Student foundation data model already exists."],
  },
  {
    id: "ai_teacher",
    order: 2,
    name: L("AI Teacher", "المعلم الذكي"),
    role: L(
      "Virtual teacher persona — teaches, guides, motivates, adapts (not a chatbot)",
      "شخصية معلم افتراضي — يعلّم ويوجّه ويحفّز ويتكيّف (ليس روبوت محادثة)",
    ),
    status: "operational",
    bindsTo: [
      "success-os.ai-teacher-engine.v1",
      "success-os.student-skill-progress.v1",
      "success-os.s4s-re-explain.v1",
    ],
    activatesInPr: "#55",
    generatesContent: false,
    rendersLessons: false,
    notes: [
      "Product persona includes S4S Intelligence Teacher.",
      "No avatars, animations, AI videos, or live classrooms in this PR.",
    ],
  },
  {
    id: "conversation_engine",
    order: 3,
    name: L("Conversation Engine", "محرك المحادثة"),
    role: L(
      "Turns utterances and multimodal inputs into tutoring intents and controls",
      "يحوّل الكلام والمدخلات متعددة الوسائط إلى نوايا وضوابط تعليمية",
    ),
    status: "operational",
    bindsTo: ["success-os.ai-teacher-engine.v1"],
    activatesInPr: "#55",
    generatesContent: false,
    rendersLessons: false,
    notes: [
      "Recognizes student control phrases and affect signals.",
      "Voice/interrupt contracts ready; LLM free-form chat may deepen later.",
    ],
  },
  {
    id: "reasoning_engine",
    order: 4,
    name: L("Reasoning Engine", "محرك الاستدلال"),
    role: L(
      "Curriculum-aware pedagogical moves from memory, skills, and mappings",
      "خطوات تربوية واعية بالمنهج من الذاكرة والمهارات والمواءمات",
    ),
    status: "operational",
    bindsTo: [
      "success-os.universal-curriculum-mapping.v1",
      "success-os.student-memory.v1",
      "success-os.s4s-re-explain.v1",
    ],
    activatesInPr: "#55",
    generatesContent: false,
    rendersLessons: false,
    notes: [
      "Selects teaching style, difficulty, recommendations.",
      "Never invents curriculum facts.",
    ],
  },
  {
    id: "student_memory",
    order: 5,
    name: L("Student Memory", "ذاكرة الطالب"),
    role: L(
      "Remembers name, language, curriculum, skills, goals, pace, style, history",
      "تتذكر الاسم واللغة والمنهج والمهارات والأهداف والوتيرة والأسلوب والتاريخ",
    ),
    status: "operational",
    bindsTo: ["success-os.student-memory.v1"],
    activatesInPr: "#55",
    generatesContent: false,
    rendersLessons: false,
    notes: ["Persists across conversations within the ATE memory store."],
  },
  {
    id: "knowledge_graph",
    order: 6,
    name: L("Knowledge Graph", "شبكة المعرفة"),
    role: L(
      "Resolves lesson/skill relationships for grounded teaching",
      "يحل علاقات الدروس والمهارات للتدريس الموثّق",
    ),
    status: "foundation",
    bindsTo: ["success-os.knowledge-graph.v1"],
    activatesInPr: "#50.3",
    generatesContent: false,
    rendersLessons: false,
    notes: ["Wired to CIE knowledge graph foundation."],
  },
  {
    id: "curriculum_registry",
    order: 7,
    name: L("Curriculum Registry", "سجل المناهج"),
    role: L(
      "Grounds answers in Global Curriculum Registry + UCE mappings",
      "يرسّخ الإجابات في السجل العالمي للمناهج ومواءمات UCE",
    ),
    status: "foundation",
    bindsTo: [
      "success-os.global-curriculum-registry.v1",
      "success-os.universal-curriculum-mapping.v1",
    ],
    activatesInPr: "#50.3 / #54",
    generatesContent: false,
    rendersLessons: false,
    notes: ["Never invents curriculum entities."],
  },
  {
    id: "interactive_lesson_engine",
    order: 8,
    name: L("Interactive Lesson Engine", "محرك الدروس التفاعلية"),
    role: L(
      "Sole lesson runtime — consumes ILE packages only",
      "وقت تشغيل الدرس الوحيد — يستهلك حزم ILE فقط",
    ),
    status: "operational",
    bindsTo: ["success-os.interactive-lesson-engine.v1"],
    activatesInPr: "#49",
    generatesContent: false,
    rendersLessons: true,
    notes: ["ADR-0049 — never fork a second lesson runtime."],
  },
  {
    id: "digital_books",
    order: 9,
    name: L("Digital Books", "الكتب الرقمية"),
    role: L(
      "Recommend verified digital book sections",
      "يوصي بأقسام كتب رقمية موثّقة",
    ),
    status: "reserved",
    bindsTo: ["success-os.digital-book-engine.v1"],
    activatesInPr: "#56",
    generatesContent: false,
    rendersLessons: false,
    notes: ["Integration point only until Digital Book Engine."],
  },
  {
    id: "videos",
    order: 10,
    name: L("Videos", "الفيديوهات"),
    role: L(
      "Recommend verified video assets",
      "يوصي بأصول فيديو موثّقة",
    ),
    status: "reserved",
    bindsTo: ["success-os.ai-media-engine.v1"],
    activatesInPr: "#57",
    generatesContent: false,
    rendersLessons: false,
    notes: ["No AI video generation in this PR."],
  },
  {
    id: "assessments",
    order: 11,
    name: L("Assessments", "التقييمات"),
    role: L(
      "Practice, mini-quiz, and assessment hooks",
      "خطافات تدريب واختبارات قصيرة وتقييمات",
    ),
    status: "reserved",
    bindsTo: ["success-os.assessment-engine.v1"],
    activatesInPr: "#58",
    generatesContent: false,
    rendersLessons: false,
    notes: ["Mini-quiz contracts exist; generation deferred to Assessment Engine."],
  },
];
