import type {
  LessonAnalysis,
  LessonAnalysisInput,
  PropKind,
} from "@/types/digital-human-studio";
import type { TeachingStyle, LearningPace } from "@/types/ai-teacher-engine";

const EQ_RE = /[=∫∑√πθ]|معادل|قانون|صيغة|equation|formula|law/i;
const MODEL_RE = /مجسم|ثلاثي|3d|model|shape|دائرة|مثلث|مكعب|كرة|geometry/i;
const EXP_RE = /تجرب|مختبر|experiment|lab|محاك|simulation|تفاعل كيمي/i;
const STEP_RE = /حل|خطوة|step|practice|تمرين|سؤال|احسب|أثبت/i;
const VISUAL_RE = /رسم|شكل|صورة|بيان|chart|diagram|graph|صورة|فيديو|video/i;

function pickStyle(input: LessonAnalysisInput, needs: PropKind[]): TeachingStyle {
  if (input.studentLevel === "below") return "simplified";
  if (needs.includes("experiment") || needs.includes("model_3d")) return "visual";
  if (needs.includes("equation") || STEP_RE.test(input.title)) return "step_by_step";
  if (input.blocks.some((b) => b.kind === "example")) return "example_first";
  if ((input.grade || "").match(/1|2|3|kg|صف.?[١٢٣]/i)) return "story";
  return "direct";
}

function pickPace(input: LessonAnalysisInput): LearningPace {
  if (input.studentLevel === "below") return "slow";
  if (input.studentLevel === "above") return "fast";
  return "normal";
}

export function analyzeLesson(input: LessonAnalysisInput): LessonAnalysis {
  const blob = [
    input.title,
    input.titleAr || "",
    ...(input.objectives || []),
    ...input.blocks.map((b) => b.text),
  ].join("\n");

  const visualNeeds: PropKind[] = [];
  const needsEquation = EQ_RE.test(blob);
  const needsModel3d = MODEL_RE.test(blob);
  const needsExperiment = EXP_RE.test(blob);
  const needsStepSolve = STEP_RE.test(blob);

  if (needsEquation) visualNeeds.push("equation", "law");
  if (needsModel3d) visualNeeds.push("model_3d");
  if (needsExperiment) visualNeeds.push("experiment", "simulation");
  if (VISUAL_RE.test(blob)) visualNeeds.push("diagram", "chart", "image");
  if (needsStepSolve) visualNeeds.push("diagram");
  if (visualNeeds.length === 0) visualNeeds.push("diagram");

  const topics = Array.from(
    new Set(
      [
        input.subject || "",
        ...input.blocks
          .filter((b) => b.kind === "heading" || b.kind === "definition")
          .map((b) => b.text.slice(0, 48)),
      ].filter(Boolean),
    ),
  ).slice(0, 8);

  let difficulty: LessonAnalysis["difficulty"] = "core";
  if (input.blocks.length <= 2 || /مقدمة|intro|أساسي/i.test(blob)) difficulty = "intro";
  if (needsStepSolve && needsEquation) difficulty = "challenge";

  const teachingStyle = pickStyle(input, visualNeeds);
  const learningPace = pickPace(input);

  return {
    schema: "success-os.dhs-lesson-analysis.v1",
    lessonId: input.lessonId,
    topics,
    difficulty,
    visualNeeds: Array.from(new Set(visualNeeds)),
    needsExperiment,
    needsEquation,
    needsModel3d,
    needsStepSolve,
    teachingStyle,
    learningPace,
    affectTarget: input.studentLevel === "below" ? "engaged" : "confident",
    summaryAr: `تحليل الدرس «${input.titleAr || input.title}»: أسلوب ${teachingStyle}، إيقاع ${learningPace}.`,
    summaryEn: `Analyzed «${input.title}»: style ${teachingStyle}, pace ${learningPace}.`,
  };
}
