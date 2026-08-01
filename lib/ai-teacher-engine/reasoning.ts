/**
 * Reasoning Engine — curriculum-aware pedagogical moves.
 */
import type {
  AteRecommendation,
  LearningPace,
  StudentControlIntent,
  TeachingStyle,
} from "@/types/ai-teacher-engine";
import {
  buildReExplainSequence,
  type ReExplainSequence,
} from "@/lib/student-ai-learning-stack/re-explain";
import { groundTeacherReply, type GroundingContext } from "./grounding";

function L(en: string, ar: string) {
  return { en, ar };
}

export type ReasoningInput = {
  intent: StudentControlIntent;
  teachingStyle: TeachingStyle;
  learningPace: LearningPace;
  topicEn?: string;
  topicAr?: string;
  grounding: GroundingContext;
  weakSkillIds?: string[];
  focusLessonId?: string;
  equivalents?: { globalId: string; relation: string; confidence: number }[];
};

export type ReasoningResult = {
  nextMove: string;
  teachingStyle: TeachingStyle;
  learningPace: LearningPace;
  teacherReply: ReturnType<typeof groundTeacherReply>;
  followUpQuestion: { en: string; ar: string } | null;
  reExplain: ReExplainSequence | null;
  recommendations: AteRecommendation[];
  generatesContent: false;
};

function styleForIntent(
  intent: StudentControlIntent,
  current: TeachingStyle,
): TeachingStyle {
  if (intent === "explain_differently" || intent === "dont_understand") {
    return current === "simplified" ? "example_first" : "simplified";
  }
  if (intent === "teach_slowly") return "step_by_step";
  if (intent === "teach_faster") return "direct";
  if (intent === "easier_example") return "example_first";
  if (intent === "summarize") return "direct";
  return current;
}

function paceForIntent(
  intent: StudentControlIntent,
  current: LearningPace,
): LearningPace {
  if (intent === "teach_slowly") return "slow";
  if (intent === "teach_faster") return "fast";
  return current;
}

export function reasonTeachingMove(input: ReasoningInput): ReasoningResult {
  const teachingStyle = styleForIntent(input.intent, input.teachingStyle);
  const learningPace = paceForIntent(input.intent, input.learningPace);
  const topicEn = input.topicEn || "this lesson";
  const topicAr = input.topicAr || "هذا الدرس";
  const g = input.grounding;

  let nextMove = "route_to_ile_package";
  let textEn = `Let's continue with ${topicEn} using the verified lesson package.`;
  let textAr = `لنكمل ${topicAr} باستخدام حزمة الدرس الموثّقة.`;
  let followUp: { en: string; ar: string } | null = L(
    `Shall we open the lesson for ${topicEn}?`,
    `هل نفتح درس ${topicAr}؟`,
  );
  let reExplain: ReExplainSequence | null = null;

  switch (input.intent) {
    case "dont_understand":
    case "explain_differently":
      nextMove = "re_explain_differently";
      reExplain = buildReExplainSequence({
        studentUtterance: "I don't understand this.",
        topicEn,
        topicAr,
      });
      textEn = "No problem.\nLet's explain it differently.";
      textAr = "لا بأس.\nدعنا نشرحها بطريقة مختلفة.";
      followUp = L(
        "Does this new explanation make more sense?",
        "هل أصبح هذا الشرح أوضح؟",
      );
      break;
    case "explain_again":
      nextMove = "repeat_explanation";
      textEn = `Let me explain ${topicEn} again, step by step.`;
      textAr = `دعني أشرح ${topicAr} مرة أخرى خطوة بخطوة.`;
      break;
    case "easier_example":
      nextMove = "easier_example";
      textEn = `Here is an easier example for ${topicEn}, grounded in your curriculum lesson.`;
      textAr = `إليك مثالاً أسهل عن ${topicAr} من درس منهجك.`;
      break;
    case "harder_question":
      nextMove = "harder_question";
      textEn = `Here is a harder practice prompt for ${topicEn}. Assessment generation stays deferred.`;
      textAr = `إليك تمرينًا أصعب عن ${topicAr}. توليد التقييم مؤجّل لمحرك التقييم.`;
      break;
    case "translate":
      nextMove = "translate";
      textEn = `I can present ${topicEn} in your preferred language using the bilingual lesson materials.`;
      textAr = `يمكنني عرض ${topicAr} بلغتك المفضّلة عبر مواد الدرس ثنائية اللغة.`;
      break;
    case "summarize":
      nextMove = "summarize";
      textEn = `Summary of ${topicEn}: we stay inside the approved curriculum lesson objectives — open the ILE package for the verified outline.`;
      textAr = `ملخص ${topicAr}: نبقى ضمن أهداف الدرس المعتمدة — افتح حزمة ILE للمخطط الموثّق.`;
      break;
    case "test_me":
      nextMove = "defer_mini_quiz";
      textEn =
        "I can test you once the Assessment Engine is active. For now, continue with the lesson checks in ILE.";
      textAr =
        "يمكنني اختبارك عند تفعيل محرك التقييم. الآن تابع فحوصات الدرس داخل ILE.";
      followUp = null;
      break;
    case "skip":
      nextMove = "skip";
      textEn = "Understood — we can skip this part and continue to the next verified section.";
      textAr = "مفهوم — يمكننا تخطي هذا الجزء والمتابعة إلى القسم الموثّق التالي.";
      break;
    case "continue":
      nextMove = "continue";
      textEn = `Continuing with ${topicEn} at your current pace.`;
      textAr = `نواصل ${topicAr} بوتيرتك الحالية.`;
      break;
    case "go_back":
      nextMove = "go_back";
      textEn = "Going back to the previous verified explanation step.";
      textAr = "نعود إلى خطوة الشرح الموثّقة السابقة.";
      break;
    case "teach_slowly":
      nextMove = "adapt_pace_slow";
      textEn = `I will teach ${topicEn} more slowly, one step at a time.`;
      textAr = `سأعلّم ${topicAr} ببطء أكثر، خطوة بخطوة.`;
      break;
    case "teach_faster":
      nextMove = "adapt_pace_fast";
      textEn = `I will move faster through ${topicEn}, still staying inside the approved lesson.`;
      textAr = `سأسرّع في ${topicAr} مع البقاء داخل الدرس المعتمد.`;
      break;
    case "request_video":
      nextMove = "recommend_video_reserved";
      textEn =
        "Video recommendations are ready as an integration point — verified videos activate with the Media Engine.";
      textAr =
        "توصيات الفيديو جاهزة كنقطة تكامل — الفيديوهات الموثّقة تُفعَّل مع محرك الوسائط.";
      break;
    case "request_book":
      nextMove = "recommend_book_reserved";
      textEn =
        "Digital book section recommendations are reserved until the Digital Book Engine.";
      textAr =
        "توصيات أقسام الكتب الرقمية محجوزة حتى محرك الكتب الرقمية.";
      break;
    case "ask_question":
    case "request_help":
    case "request_lesson":
    case "unknown":
    default:
      nextMove = "answer_and_route_ile";
      textEn = `I'll help with ${topicEn} using your curriculum, memory, and the Interactive Lesson Engine — without inventing facts.`;
      textAr = `سأساعدك في ${topicAr} باستخدام منهجك وذاكرتك ومحرك الدروس التفاعلية — دون اختراع حقائق.`;
      break;
  }

  const teacherReply = groundTeacherReply({
    ...g,
    textEn,
    textAr,
    topicEn,
    topicAr,
  });

  const recommendations = buildRecommendations(input);

  return {
    nextMove,
    teachingStyle,
    learningPace,
    teacherReply,
    followUpQuestion: followUp,
    reExplain,
    recommendations,
    generatesContent: false,
  };
}

function buildRecommendations(input: ReasoningInput): AteRecommendation[] {
  const focus = input.focusLessonId || null;
  const recs: AteRecommendation[] = [];
  if (focus) {
    recs.push({
      kind: "lesson",
      targetId: focus,
      label: L("Focus lesson", "الدرس الحالي"),
      reason: L(
        "Curriculum-aware lesson for this session",
        "درس واعٍ بالمنهج لهذه الجلسة",
      ),
      ready: true,
    });
  }

  const weak = input.weakSkillIds?.[0];
  if (weak) {
    recs.push({
      kind: "prerequisite_lesson",
      targetId: weak,
      label: L("Prerequisite / weak skill review", "مراجعة متطلب / مهارة ضعيفة"),
      reason: L(
        "Student memory marks this skill as weak",
        "ذاكرة الطالب تعتبر هذه المهارة ضعيفة",
      ),
      ready: true,
    });
  }

  for (const eq of (input.equivalents || []).slice(0, 2)) {
    recs.push({
      kind: "lesson",
      targetId: eq.globalId,
      label: L(
        `Mapped lesson (${eq.relation})`,
        `درس مواءَم (${eq.relation})`,
      ),
      reason: L(
        `UCE mapping confidence ${eq.confidence}`,
        `ثقة مواءمة UCE ${eq.confidence}`,
      ),
      ready: true,
    });
  }

  recs.push(
    {
      kind: "digital_book_section",
      targetId: null,
      label: L("Digital book section", "قسم كتاب رقمي"),
      reason: L("Reserved for Digital Book Engine", "محجوز لمحرك الكتب الرقمية"),
      ready: false,
      activatesInPr: "#56",
    },
    {
      kind: "video",
      targetId: null,
      label: L("Verified video", "فيديو موثّق"),
      reason: L("Reserved for AI Lesson & Media Engine", "محجوز لمحرك الدروس والوسائط"),
      ready: false,
      activatesInPr: "#57",
    },
    {
      kind: "mini_quiz",
      targetId: null,
      label: L("Mini quiz", "اختبار قصير"),
      reason: L("Reserved for Assessment Engine", "محجوز لمحرك التقييم"),
      ready: false,
      activatesInPr: "#58",
    },
  );

  return recs;
}
