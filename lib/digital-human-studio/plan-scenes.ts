import type {
  CameraAngle,
  LessonAnalysis,
  LessonAnalysisInput,
  StudioLighting,
  StudioScene,
  TeacherCast,
} from "@/types/digital-human-studio";
import {
  buildBoardCues,
  buildProps,
  contentSeed,
  directBehaviors,
  openingLine,
} from "./behavior-director";

const CAMERAS: CameraAngle[] = [
  "wide_establishing",
  "medium_teacher",
  "over_shoulder_board",
  "close_face",
  "board_insert",
  "model_orbit",
];

const LIGHTS: StudioLighting[] = [
  "cinematic_key",
  "soft_daylight",
  "focus_spot",
  "warm_encourage",
  "cool_precision",
];

function cameraFor(purpose: StudioScene["purpose"], index: number, seed: number): CameraAngle {
  if (purpose === "hook") return "wide_establishing";
  if (purpose === "close") return "medium_teacher";
  if (purpose === "demonstrate") {
    return seed % 2 === 0 ? "over_shoulder_board" : "model_orbit";
  }
  if (purpose === "check") return "close_face";
  return CAMERAS[(index + (seed % 3)) % CAMERAS.length]!;
}

function lightFor(purpose: StudioScene["purpose"], style: LessonAnalysis["teachingStyle"]): StudioLighting {
  if (purpose === "close") return "warm_encourage";
  if (purpose === "demonstrate") return style === "visual" ? "focus_spot" : "cool_precision";
  if (purpose === "hook") return "cinematic_key";
  return "soft_daylight";
}

function chunkBlocks(input: LessonAnalysisInput): { title: string; body: string; purpose: StudioScene["purpose"] }[] {
  const blocks = input.blocks.length
    ? input.blocks
    : [{ id: "t", kind: "text" as const, text: input.title }];

  const scenes: { title: string; body: string; purpose: StudioScene["purpose"] }[] = [
    {
      title: input.titleAr || input.title,
      body: (input.objectives || []).join(" · ") || input.title,
      purpose: "hook",
    },
  ];

  let explainCount = 0;
  for (const b of blocks) {
    const purpose: StudioScene["purpose"] =
      b.kind === "practice"
        ? "practice"
        : b.kind === "example" || b.kind === "equation"
          ? "demonstrate"
          : explainCount === 0
            ? "explain"
            : explainCount % 2 === 1
              ? "demonstrate"
              : "explain";
    if (b.kind !== "practice") explainCount++;
    scenes.push({
      title: b.kind === "heading" ? b.text.slice(0, 60) : `${input.titleAr || input.title}`,
      body: b.text,
      purpose,
    });
  }

  // Ensure we always have a check + close
  scenes.push({
    title: "تأكد من فهمك",
    body: "سؤال سريع للتثبيت",
    purpose: "check",
  });
  scenes.push({
    title: "خلاصة الحصة",
    body: input.titleAr || input.title,
    purpose: "close",
  });

  // Cap for performance
  return scenes.slice(0, 10);
}

function sayFor(
  cast: TeacherCast,
  purpose: StudioScene["purpose"],
  title: string,
  body: string,
  analysis: LessonAnalysis,
): string {
  const short = body.replace(/\s+/g, " ").trim().slice(0, 180);
  if (purpose === "hook") return openingLine(cast, title);
  if (purpose === "close") {
    return cast.style === "warm"
      ? `أحسنتم. ثبتنا أفكار «${title}». أنا فخورة فيكم. إلى اللقاء.`
      : `أحسنتم. أتقنّا «${title}». كرّروا المراجعة لاحقاً. إلى اللقاء.`;
  }
  if (purpose === "check") {
    return cast.style === "warm"
      ? `سؤال صفّي سريع: ما أهم فكرة أخذناها من «${title}»؟ فكر ثم جاوب.`
      : `تحقق سريع: لخّص الفكرة الأساسية في «${title}» بجملة واحدة.`;
  }
  if (purpose === "practice") {
    return `هيا نتمرّن. ${short}. نحلها خطوة بخطوة على السبورة.`;
  }
  if (purpose === "demonstrate") {
    if (analysis.needsModel3d) {
      return `شوفوا النموذج معي. ${short}. برَوّر المجسم وأشير للنقاط المهمة.`;
    }
    if (analysis.needsEquation) {
      return `ركزوا على المعادلة. ${short}. بكتبها على السبورة وأشرح كل رمز.`;
    }
    return `لاحظوا الرسم. ${short}. بشير للعناصر واحد واحد.`;
  }
  // explain
  if (analysis.teachingStyle === "simplified") {
    return `ببساطة: ${short}. خذوا وقتكم، ونكمل بهدوء.`;
  }
  if (analysis.teachingStyle === "socratic") {
    return `${short}. لماذا هذا مهم؟ فكروا معي قبل ما نكمل.`;
  }
  return `${short}. خلينا نربطها بهدف الدرس.`;
}

export function planScenes(opts: {
  input: LessonAnalysisInput;
  analysis: LessonAnalysis;
  cast: TeacherCast;
}): StudioScene[] {
  const parts = chunkBlocks(opts.input);
  const seed = contentSeed(opts.input.lessonId + opts.cast.id + opts.analysis.teachingStyle);

  return parts.map((part, index) => {
    const id = `scene-${index + 1}-${part.purpose}`;
    const teacherSay = sayFor(opts.cast, part.purpose, part.title, part.body, opts.analysis);
    const behaviors = directBehaviors({
      purpose: part.purpose,
      say: teacherSay,
      analysis: opts.analysis,
      sceneIndex: index,
    });
    const board = buildBoardCues({
      title: part.title,
      purpose: part.purpose,
      analysis: opts.analysis,
      body: part.body,
    });
    const props = buildProps({
      analysis: opts.analysis,
      purpose: part.purpose,
      sceneId: id,
    });

    return {
      id,
      index,
      title: part.title,
      purpose: part.purpose,
      camera: cameraFor(part.purpose, index, seed),
      lighting: lightFor(part.purpose, opts.analysis.teachingStyle),
      durationHintSec: Math.min(45, Math.max(12, Math.round(teacherSay.length / 9))),
      teacherSay,
      audioKey: index === 0 ? "welcome" : part.purpose === "close" ? "bye" : null,
      behaviors,
      board,
      props,
      transition: index === 0 ? "dissolve" : pickTransition(seed, index),
    };
  });
}

function pickTransition(seed: number, index: number): StudioScene["transition"] {
  const all: StudioScene["transition"][] = ["cut", "dissolve", "push", "orbit"];
  return all[(seed + index) % all.length]!;
}
