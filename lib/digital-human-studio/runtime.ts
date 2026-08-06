import type {
  LessonAnalysisInput,
  StudioLessonPlan,
  LessonContentBlock,
} from "@/types/digital-human-studio";
import { analyzeLesson } from "./analyze-lesson";
import { castTeacher } from "./cast-teacher";
import { planScenes } from "./plan-scenes";

export type BuildStudioPlanOptions = {
  input: LessonAnalysisInput;
  provider?: StudioLessonPlan["provider"]["id"];
  heygenConfigured?: boolean;
};

export function buildStudioLessonPlan(opts: BuildStudioPlanOptions): StudioLessonPlan {
  const analysis = analyzeLesson(opts.input);
  const cast = castTeacher(opts.input);
  const scenes = planScenes({ input: opts.input, analysis, cast });

  const wantsHeygen = opts.provider === "heygen";
  const provider: StudioLessonPlan["provider"] = wantsHeygen
    ? {
        id: "heygen",
        status: opts.heygenConfigured ? "live" : "needs_credentials",
        notes: opts.heygenConfigured
          ? ["HeyGen digital twin enabled"]
          : [
              "HEYGEN_* credentials missing — using local photoreal studio fallback",
              "Set HEYGEN_API_KEY + per-teacher avatar/voice IDs for true twin lip-sync video",
            ],
      }
    : {
        id: "local_photoreal_studio",
        status: "live",
        notes: [
          "Local photoreal studio: dynamic scene direction, pose/gesture timeline, neural Arabic audio",
          "Provider port ready for HeyGen/Tavus without redesign",
        ],
      };

  return {
    schema: "success-os.digital-human-studio.v1",
    version: "1.0.0",
    planId: `dhs_${opts.input.lessonId}_${cast.id}_${Date.now().toString(36)}`,
    lessonId: opts.input.lessonId,
    studioId: opts.input.studioId || "global_led_classroom",
    cast,
    analysis,
    scenes,
    provider,
    performance: {
      lazyAssets: true,
      maxConcurrentProps: 3,
      prefetchSceneCount: 2,
    },
    createdAt: new Date().toISOString(),
  };
}

/** Build input from a loose lesson package / book text. */
export function lessonInputFromTexts(opts: {
  lessonId: string;
  title: string;
  titleAr?: string;
  subject?: string;
  grade?: string;
  texts: string[];
  preferredTeacherId?: string;
}): LessonAnalysisInput {
  const blocks: LessonContentBlock[] = opts.texts.filter(Boolean).map((text, i) => ({
    id: `b${i}`,
    kind: i === 0 ? "heading" : /تمرين|سؤال|practice|احسب/i.test(text) ? "practice" : "text",
    text,
  }));
  return {
    lessonId: opts.lessonId,
    title: opts.title,
    titleAr: opts.titleAr,
    subject: opts.subject,
    grade: opts.grade,
    language: "ar",
    blocks,
    preferredTeacherId: opts.preferredTeacherId,
  };
}

export function demoStudioPlan(teacherId: "sara" | "ali" = "sara"): StudioLessonPlan {
  return buildStudioLessonPlan({
    input: lessonInputFromTexts({
      lessonId: "demo-g1-count",
      title: "Count to three",
      titleAr: "العد حتى ثلاثة",
      subject: "math",
      grade: "grade-1",
      preferredTeacherId: teacherId,
      texts: [
        "العد حتى ثلاثة",
        "العدد واحد يعني شيئاً واحداً",
        "العدد اثنان يعني شيئين معاً",
        "العدد ثلاثة يعني ثلاث كميات",
        "تمرين: طابق الكمية مع الرقم",
      ],
    }),
  });
}
