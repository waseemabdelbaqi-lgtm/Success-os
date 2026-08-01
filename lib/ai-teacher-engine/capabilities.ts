/**
 * AI Teacher capability contracts — what the virtual teacher can do.
 */
import type { AteCapabilityContract } from "@/types/ai-teacher-engine";

function L(en: string, ar: string) {
  return { en, ar };
}

export const ATE_CAPABILITIES: AteCapabilityContract[] = [
  {
    id: "answer_questions",
    name: L("Answer questions naturally", "الإجابة على الأسئلة بشكل طبيعي"),
    status: "foundation",
    generatesContent: false,
    notes: ["Grounded replies only; uncertainty stated when ungrounded."],
  },
  {
    id: "explain_multi_style",
    name: L("Explain with multiple teaching styles", "الشرح بأساليب تعليم متعددة"),
    status: "foundation",
    generatesContent: false,
    notes: ["direct | socratic | example_first | visual | step_by_step | story | simplified"],
  },
  {
    id: "simplify_concepts",
    name: L("Simplify difficult concepts", "تبسيط المفاهيم الصعبة"),
    status: "foundation",
    generatesContent: false,
    notes: ["Triggered by teach_slowly / dont_understand / simplify controls."],
  },
  {
    id: "detect_misconceptions",
    name: L("Detect misconceptions", "اكتشاف المفاهيم الخاطئة"),
    status: "stub",
    generatesContent: false,
    notes: ["Signal from wrong-answer / confusion patterns; full NLP later."],
  },
  {
    id: "correct_wrong_answers",
    name: L("Correct wrong answers", "تصحيح الإجابات الخاطئة"),
    status: "stub",
    generatesContent: false,
    notes: ["Correction templates grounded in curriculum citations."],
  },
  {
    id: "ask_follow_ups",
    name: L("Ask follow-up questions", "طرح أسئلة متابعة"),
    status: "foundation",
    generatesContent: false,
    notes: ["Scripted follow-ups after explanations and re-explain checks."],
  },
  {
    id: "generate_examples",
    name: L("Generate examples", "توليد أمثلة"),
    status: "stub",
    generatesContent: false,
    notes: ["Example slots reserved; no free-form AI content generation."],
  },
  {
    id: "generate_harder_easier_examples",
    name: L("Harder / easier examples", "أمثلة أصعب / أسهل"),
    status: "foundation",
    generatesContent: false,
    notes: ["Intent routing for easier_example / harder_question."],
  },
  {
    id: "create_practice_questions",
    name: L("Create practice questions", "إنشاء أسئلة تدريب"),
    status: "reserved",
    generatesContent: false,
    notes: ["Activates with Assessment Engine (#58)."],
  },
  {
    id: "create_mini_quizzes",
    name: L("Create mini quizzes", "إنشاء اختبارات قصيرة"),
    status: "reserved",
    generatesContent: false,
    notes: ["test_me intent defers to Assessment Engine."],
  },
  {
    id: "recommend_lessons",
    name: L("Recommend lessons", "توصية بالدروس"),
    status: "foundation",
    generatesContent: false,
    notes: ["Uses focus lesson + UCE equivalents."],
  },
  {
    id: "recommend_videos",
    name: L("Recommend videos", "توصية بالفيديوهات"),
    status: "reserved",
    generatesContent: false,
    notes: ["Integration point until #57."],
  },
  {
    id: "recommend_digital_book_sections",
    name: L("Recommend digital book sections", "توصية بأقسام الكتب الرقمية"),
    status: "reserved",
    generatesContent: false,
    notes: ["Integration point until #56."],
  },
  {
    id: "recommend_prerequisites",
    name: L("Recommend prerequisite lessons", "توصية بدروس المتطلبات السابقة"),
    status: "foundation",
    generatesContent: false,
    notes: ["From lesson dependencies + weak skills."],
  },
  {
    id: "encourage_learner",
    name: L("Encourage the learner", "تشجيع المتعلم"),
    status: "foundation",
    generatesContent: false,
    notes: ["Affect-aware encouragement lines."],
  },
  {
    id: "detect_frustration",
    name: L("Detect frustration", "اكتشاف الإحباط"),
    status: "foundation",
    generatesContent: false,
    notes: ["Heuristic from utterance patterns."],
  },
  {
    id: "detect_confidence",
    name: L("Detect confidence", "اكتشاف الثقة"),
    status: "foundation",
    generatesContent: false,
    notes: ["Heuristic from utterance patterns."],
  },
  {
    id: "adapt_explanations",
    name: L("Adapt explanations", "تكييف الشرح"),
    status: "foundation",
    generatesContent: false,
    notes: ["Uses memory pace/style + teaching style + re-explain path."],
  },
];
