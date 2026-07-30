/**
 * Official layer contracts for the Student AI Learning Stack.
 */
import type { StackLayerContract } from "@/types/student-ai-learning-stack";

function L(en: string, ar: string) {
  return { en, ar };
}

export const STUDENT_AI_LEARNING_STACK_PATH = [
  "student",
  "ai_teacher",
  "conversation_engine",
  "reasoning_engine",
  "knowledge_graph",
  "digital_books",
  "videos",
  "interactive_lesson_engine",
  "quizzes",
  "assessments",
] as const;

export const STACK_LAYER_CONTRACTS: StackLayerContract[] = [
  {
    id: "student",
    order: 1,
    name: L("Student", "الطالب"),
    role: L(
      "Learner identity and intent enter the stack",
      "هوية المتعلم ونيّته تدخل المكدس",
    ),
    status: "operational",
    bindsTo: ["success-os.student-foundation.v1"],
    activatesInPr: "#50.3 / #59",
    generatesContent: false,
    rendersLessons: false,
    notes: ["Student foundation data model already exists; no AI required."],
  },
  {
    id: "ai_teacher",
    order: 2,
    name: L("AI Teacher", "المعلم الذكي"),
    role: L(
      "S4S Intelligence Teacher — open-lesson greeting and re-explain tutoring persona",
      "معلم Success 4 Sure الذكي — تحية فتح الدرس وشخصية إعادة الشرح",
    ),
    status: "foundation",
    bindsTo: [
      "success-os.student-ai-learning-stack.v1",
      "success-os.student-skill-progress.v1",
      "success-os.s4s-re-explain.v1",
    ],
    activatesInPr: "#59",
    generatesContent: false,
    rendersLessons: false,
    notes: [
      "Product persona: S4S Intelligence Teacher.",
      "Open Lesson greeting: Hello Ahmad — struggled with Fractions — review first?",
      "Re-explain: Animation → Drawing → Example → Question → Checks understanding.",
      "No AI lesson generation — scripted prompts only.",
    ],
  },
  {
    id: "conversation_engine",
    order: 3,
    name: L("Conversation Engine", "محرك المحادثة"),
    role: L(
      "Turns student utterances into structured tutoring intents",
      "يحوّل كلام الطالب إلى نوايا تعليمية منظمة",
    ),
    status: "foundation",
    bindsTo: ["success-os.student-ai-learning-stack.v1"],
    activatesInPr: "#59",
    generatesContent: false,
    rendersLessons: false,
    notes: [
      'Recognizes “I don\'t understand this.” → dont_understand intent.',
      "LLM free-form chat reserved for later AI PRs.",
    ],
  },
  {
    id: "reasoning_engine",
    order: 4,
    name: L("Reasoning Engine", "محرك الاستدلال"),
    role: L(
      "Selects next pedagogical move from skills, gaps, and mappings",
      "يختار الخطوة التربوية التالية من المهارات والفجوات والمواءمات",
    ),
    status: "foundation",
    bindsTo: [
      "success-os.universal-curriculum-mapping.v1",
      "success-os.student-skill-progress.v1",
      "success-os.s4s-re-explain.v1",
    ],
    activatesInPr: "#59",
    generatesContent: false,
    rendersLessons: false,
    notes: [
      "Re-explain path: Animation → Drawing → Example → Question → Checks understanding.",
      "No AI lesson generation — scripted pedagogy only.",
    ],
  },
  {
    id: "knowledge_graph",
    order: 5,
    name: L("Knowledge Graph", "شبكة المعرفة"),
    role: L(
      "Resolves lesson/skill relationships for the session",
      "يحل علاقات الدروس والمهارات للجلسة",
    ),
    status: "foundation",
    bindsTo: ["success-os.knowledge-graph.v1"],
    activatesInPr: "#50.3",
    generatesContent: false,
    rendersLessons: false,
    notes: ["Wired to existing CIE knowledge graph foundation."],
  },
  {
    id: "digital_books",
    order: 6,
    name: L("Digital Books", "الكتب الرقمية"),
    role: L(
      "Provides book context for the lesson — ILE package output only later",
      "يوفر سياق الكتاب للدرس — مخرجات حزم ILE لاحقًا فقط",
    ),
    status: "reserved",
    bindsTo: ["success-os.digital-book-engine.v1"],
    activatesInPr: "#55",
    generatesContent: false,
    rendersLessons: false,
    notes: ["Reserved for Digital Book Engine. No book generation here."],
  },
  {
    id: "videos",
    order: 7,
    name: L("Videos", "الفيديوهات"),
    role: L(
      "Attaches verified video assets to the session plan",
      "يربط أصول الفيديو الموثّقة بخطة الجلسة",
    ),
    status: "reserved",
    bindsTo: ["success-os.ai-media-engine.v1"],
    activatesInPr: "#56–57",
    generatesContent: false,
    rendersLessons: false,
    notes: ["No AI video generation in this PR."],
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
    id: "quizzes",
    order: 9,
    name: L("Quizzes", "الاختبارات القصيرة"),
    role: L(
      "Formative checks after the lesson runtime",
      "فحوصات تكوينية بعد تشغيل الدرس",
    ),
    status: "reserved",
    bindsTo: ["success-os.assessment-engine.v1"],
    activatesInPr: "#58",
    generatesContent: false,
    rendersLessons: false,
    notes: ["No quiz generation in this PR."],
  },
  {
    id: "assessments",
    order: 10,
    name: L("Assessments", "التقييمات"),
    role: L(
      "Summative / unit / exam assessments on the same stack",
      "تقييمات ختامية / وحدة / امتحان على نفس المكدس",
    ),
    status: "reserved",
    bindsTo: ["success-os.assessment-engine.v1"],
    activatesInPr: "#58",
    generatesContent: false,
    rendersLessons: false,
    notes: ["No assessment generation in this PR."],
  },
];
