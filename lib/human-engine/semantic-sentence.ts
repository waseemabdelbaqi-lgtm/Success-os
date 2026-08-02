/**
 * Semantic Sentence Director — every teaching line becomes a unique performance package.
 * Performance is derived from meaning (write law, draw, experiment, 3D model…), not clip packs.
 */
import type {
  BehaviourGoal,
  CameraShot,
  ContentAct,
  EmotionId,
  GazeTarget,
  GestureIntent,
  LessonBlockKind,
  LightPreset,
  LocomotionIntent,
  ScreenElement,
  SentencePerformance,
} from "@/types/human-engine";
import { contentSeed, pick } from "./seed";
import { goalForKind } from "./ai-behaviour-engine";
import { getTeacherPersona, type TeacherPersona } from "./teacher-persona";
import { pickUnused } from "./performance-variety";

export type SemanticContext = {
  lessonId: string;
  subject?: string;
  blockId: string;
  blockKind: LessonBlockKind;
  lineIndex: number;
  prevAct?: ContentAct;
  /** sara | ali — changes gesture/emotion/locomotion bias */
  teacherId?: string;
  /** Anti-repeat within the same lesson plan */
  usedGestures?: string[];
  usedCameras?: string[];
  lastGesture?: string | null;
  lastCamera?: string | null;
};

const LAW_RE = /قانون|صيغة|معادل|=|يساوي|F\s*=|E\s*=|قانون\s*نيوتن|كثافة|مساحة|محيط/;
const DRAW_RE = /ارسم|برسم|نرسم|رسم|مخطّط|مخطط|منحنى|شكل هندس|دائرة|مثلث|خط/;
const MODEL_RE = /نموذج|مجسم|ثلاثي|3d|3D|دور|أدِر|كبّر|صغّر|زوّم|أمسك|امسك/;
const EXP_RE = /تجرب|محاك|مختبر|اختبر|لاحظ التغير|سخّن|برّد|مزج|تفاعل كيمي/;
const WRITE_RE = /اكتب|بكتب|نكتب|على السبورة|أثبت|برهن/;
const COUNT_RE = /عدّ|نعد|واحد|اثنان|ثلاثة|رقم|عدد/;
const CHECK_RE = /سؤال|فكر|لماذا|كم\b|ما\s|هل\s|؟|\?/;
const WALK_RE = /تعال|هيا|نقترب|نمشي|ننتقل|خلينا نروح|إلى السبورة/;
const HOOK_RE = /مرحبا|أهلا|اليوم|جاهزين|نبدأ/;
const CLOSE_RE = /إلى اللقاء|أحسنت|ممتاز|بطل|فخور|نلخّص|خلاصة/;

export function detectContentAct(text: string, kind: LessonBlockKind): ContentAct {
  if (MODEL_RE.test(text)) {
    if (/كبّر|كبير|zoom\s*in/i.test(text)) return "zoom_in_model";
    if (/صغّر|صغير|zoom\s*out/i.test(text)) return "zoom_out_model";
    if (/دور|أدِر|لف|rotate/i.test(text)) return "rotate_model";
    if (/أمسك|امسك|شيل|hold/i.test(text)) return "hold_model";
    return "show_model";
  }
  if (EXP_RE.test(text)) return "run_experiment";
  if (LAW_RE.test(text) || (WRITE_RE.test(text) && /قانون|معادل|=/.test(text))) {
    return "write_law";
  }
  if (DRAW_RE.test(text)) return "draw_diagram";
  if (WRITE_RE.test(text)) return "write_board";
  if (COUNT_RE.test(text) && kind !== "hook") return "count_sequence";
  if (CHECK_RE.test(text) || kind === "check" || kind === "practice") return "ask_check";
  if (CLOSE_RE.test(text) || kind === "encourage" || kind === "close") return "celebrate";
  if (HOOK_RE.test(text) || kind === "hook") return "greet_hook";
  if (/شوف|انظر|لاحظ|سبور/.test(text)) return "point_content";
  return "explain_concept";
}

function gestureForAct(
  act: ContentAct,
  seed: number,
  index: number,
  persona: TeacherPersona,
  ctx: SemanticContext,
): GestureIntent {
  const used = ctx.usedGestures || [];
  const last = ctx.lastGesture;
  const choose = <T extends GestureIntent>(opts: readonly T[]) =>
    pickUnused(opts, used, seed, index, last);

  switch (act) {
    case "write_law":
    case "write_board":
      return choose(["write_board", "point_board", "emphasize"] as const);
    case "draw_diagram":
      return choose(["draw_curve", "point_board", "write_board"] as const);
    case "run_experiment":
      return choose(["manipulate_experiment", "point_board", "hold_prop"] as const);
    case "show_model":
    case "hold_model":
      return choose(["hold_model", "point_board", "emphasize"] as const);
    case "rotate_model":
      return choose(["rotate_model", "hold_model", "manipulate_experiment"] as const);
    case "zoom_in_model":
      return choose(["zoom_in_model", "hold_model", "point_board"] as const);
    case "zoom_out_model":
      return choose(["zoom_out_model", "hold_model", "open_explain"] as const);
    case "count_sequence":
      return choose(["count_on_fingers", "emphasize", "point_board"] as const);
    case "ask_check":
      return persona.style === "warm"
        ? choose(["invite_answer", "turn_to_student", "open_explain"] as const)
        : choose(["think_pause", "invite_answer", "point_board"] as const);
    case "celebrate":
      return persona.interaction.usesEncouragementOften
        ? choose(["encourage", "affirm_nod", "open_explain"] as const)
        : choose(["affirm_nod", "emphasize", "open_explain"] as const);
    case "greet_hook":
      return persona.gestureBias.preferOpenHands
        ? choose(["open_explain", "walk_step", "turn_to_student"] as const)
        : choose(["walk_step", "emphasize", "turn_to_student"] as const);
    case "point_content":
      return choose(["point_board", "emphasize", "turn_to_board"] as const);
    case "explain_concept":
    default:
      return choose(persona.explainGesturePool);
  }
}

function emotionForAct(
  act: ContentAct,
  text: string,
  seed: number,
  persona: TeacherPersona,
): {
  emotion: EmotionId;
  intensity: number;
} {
  const boost = persona.emotionBias.intensityBoost;
  if (act === "celebrate") {
    return {
      emotion: persona.emotionBias.onCelebrate,
      intensity: Math.min(1, 0.88 + boost),
    };
  }
  if (act === "ask_check") {
    return {
      emotion: persona.emotionBias.onCheck,
      intensity: Math.min(1, 0.72 + boost),
    };
  }
  if (act === "write_law" || act === "draw_diagram") {
    return {
      emotion: persona.style === "precise" ? "focused" : "patient",
      intensity: 0.78 + boost * 0.5,
    };
  }
  if (act === "run_experiment" || act === "show_model" || act === "rotate_model") {
    return { emotion: "curious", intensity: 0.7 + boost };
  }
  if (act === "greet_hook") {
    return {
      emotion: persona.emotionBias.default,
      intensity: 0.8 + boost,
    };
  }
  if (/دقة|مهم|ركّز|ركز/.test(text)) {
    return { emotion: "serious", intensity: 0.68 + boost };
  }
  if (act === "count_sequence") return { emotion: "patient", intensity: 0.62 + boost };
  return {
    emotion: persona.emotionBias.default,
    intensity: 0.58 + (seed % 5) * 0.03 + boost,
  };
}

function gazeForAct(act: ContentAct, seed: number, index: number): GazeTarget {
  if (
    act === "write_law" ||
    act === "write_board" ||
    act === "draw_diagram" ||
    act === "point_content"
  ) {
    return "board";
  }
  if (
    act === "show_model" ||
    act === "hold_model" ||
    act === "rotate_model" ||
    act === "zoom_in_model" ||
    act === "zoom_out_model" ||
    act === "run_experiment"
  ) {
    return "prop";
  }
  if (act === "ask_check" || act === "celebrate" || act === "greet_hook") return "student";
  return pick(["student", "board", "student", "notes"] as const, seed, index);
}

function locomotionForAct(
  act: ContentAct,
  text: string,
  prev: ContentAct | undefined,
  persona: TeacherPersona,
): LocomotionIntent {
  if (WALK_RE.test(text) || act === "greet_hook") return "walk_in";
  if (prev && prev !== act && (act === "write_law" || act === "draw_diagram" || act === "point_content")) {
    return "step_to_board";
  }
  if (act === "show_model" || act === "hold_model") return "step_to_prop";
  if (act === "ask_check" || act === "celebrate") return "step_to_student";
  if (act === "run_experiment") return "step_to_prop";
  // Precise teachers step to board more often between explains
  if (persona.style === "precise" && act === "explain_concept" && prev === "greet_hook") {
    return "step_to_board";
  }
  return "stand";
}

function cameraForAct(
  act: ContentAct,
  seed: number,
  index: number,
  ctx: SemanticContext,
): CameraShot {
  const used = ctx.usedCameras || [];
  const last = ctx.lastCamera;
  const choose = <T extends CameraShot>(opts: readonly T[]) =>
    pickUnused(opts, used, seed, index, last);

  if (act === "write_law" || act === "write_board" || act === "draw_diagram") {
    return choose(["over_shoulder_board", "board_insert", "medium_teacher"] as const);
  }
  if (act === "run_experiment") {
    return choose(["prop_orbit", "over_shoulder_board", "medium_teacher"] as const);
  }
  if (
    act === "show_model" ||
    act === "rotate_model" ||
    act === "zoom_in_model" ||
    act === "zoom_out_model" ||
    act === "hold_model"
  ) {
    return choose(["prop_orbit", "medium_teacher", "over_shoulder_board"] as const);
  }
  if (act === "ask_check") {
    return choose(["close_face", "medium_teacher", "wide_establishing"] as const);
  }
  if (act === "greet_hook") {
    return choose(["wide_establishing", "medium_teacher", "close_face"] as const);
  }
  if (act === "celebrate") {
    return choose(["close_face", "medium_teacher", "wide_establishing"] as const);
  }
  return choose(["medium_teacher", "close_face", "wide_establishing"] as const);
}

function lightForAct(act: ContentAct, emotion: EmotionId): { preset: LightPreset; intensity: number } {
  if (emotion === "celebratory" || emotion === "encouraging") {
    return { preset: "warm_encourage", intensity: 1.08 };
  }
  if (act === "write_law" || act === "draw_diagram") {
    return { preset: "board_accent", intensity: 1.02 };
  }
  if (act === "run_experiment") return { preset: "experiment_practical", intensity: 1.05 };
  if (
    act === "show_model" ||
    act === "rotate_model" ||
    act === "zoom_in_model" ||
    act === "zoom_out_model"
  ) {
    return { preset: "model_spotlight", intensity: 1.1 };
  }
  if (act === "ask_check") return { preset: "closeup_beauty", intensity: 1.06 };
  if (emotion === "focused" || emotion === "serious") {
    return { preset: "cool_focus", intensity: 0.96 };
  }
  return { preset: "key_fill_rim", intensity: 1 };
}

function extractDisplayText(text: string, act: ContentAct): string {
  const eq = text.match(/([A-Za-z\u0600-\u06FF0-9\s]+[=≈]\s*[A-Za-z\u0600-\u06FF0-9\s\+\-\×\÷\/]+)/);
  if (eq) return eq[1]!.trim().slice(0, 48);
  if (act === "write_law") {
    const law = text.match(/قانون[^。.!?؟]{0,40}/);
    if (law) return law[0]!.slice(0, 42);
    return "قانون الدرس";
  }
  if (act === "count_sequence") {
    if (/ثلاثة|٣|3/.test(text)) return "٣";
    if (/اثنان|٢|2/.test(text)) return "٢";
    if (/واحد|١|1/.test(text)) return "١";
  }
  const short = text.replace(/[?.!؟،]/g, "").trim();
  return short.slice(0, 36);
}

export function buildScreenElement(
  act: ContentAct,
  text: string,
  seed: number,
  index: number,
): ScreenElement {
  const label = extractDisplayText(text, act);
  const id = `el_${act}_${seed.toString(36)}_${index}`;

  switch (act) {
    case "write_law":
      return {
        id,
        kind: "law",
        label,
        detail: text.slice(0, 80),
        transform: { x: 0.62, y: 0.38, scale: 1, rotateY: 0 },
        emphasis: 0.9,
      };
    case "write_board":
      return {
        id,
        kind: "equation",
        label,
        detail: text.slice(0, 72),
        transform: { x: 0.6, y: 0.42, scale: 1, rotateY: 0 },
        emphasis: 0.75,
      };
    case "draw_diagram":
      return {
        id,
        kind: "diagram",
        label: label || "رسم",
        detail: "diagram_stroke",
        transform: { x: 0.58, y: 0.45, scale: 1, rotateY: 0 },
        emphasis: 0.85,
        strokeProgress: 0,
      };
    case "run_experiment":
      return {
        id,
        kind: "experiment",
        label: label || "تجربة",
        detail: "lab_beaker",
        transform: { x: 0.55, y: 0.5, scale: 1.05, rotateY: 12 },
        emphasis: 1,
        experimentPhase: "setup",
      };
    case "show_model":
    case "hold_model":
      return {
        id,
        kind: "model_3d",
        label: label || "نموذج 3D",
        detail: "mesh_demo",
        transform: { x: 0.52, y: 0.48, scale: 1, rotateY: 20 },
        emphasis: 0.95,
      };
    case "rotate_model":
      return {
        id,
        kind: "model_3d",
        label: label || "تدوير النموذج",
        detail: "mesh_demo",
        transform: {
          x: 0.52,
          y: 0.48,
          scale: 1,
          rotateY: 20 + (seed % 160),
        },
        emphasis: 1,
      };
    case "zoom_in_model":
      return {
        id,
        kind: "model_3d",
        label: "تكبير",
        detail: "mesh_demo",
        transform: { x: 0.5, y: 0.46, scale: 1.45, rotateY: 35 },
        emphasis: 1,
      };
    case "zoom_out_model":
      return {
        id,
        kind: "model_3d",
        label: "تصغير",
        detail: "mesh_demo",
        transform: { x: 0.52, y: 0.5, scale: 0.75, rotateY: 10 },
        emphasis: 0.85,
      };
    case "count_sequence":
      return {
        id,
        kind: "number",
        label,
        detail: "count",
        transform: { x: 0.6, y: 0.4, scale: 1.2, rotateY: 0 },
        emphasis: 0.9,
      };
    case "ask_check":
      return {
        id,
        kind: "question",
        label: "؟",
        detail: text.slice(0, 64),
        transform: { x: 0.6, y: 0.36, scale: 1, rotateY: 0 },
        emphasis: 0.8,
      };
    case "point_content":
      return {
        id,
        kind: "highlight",
        label: "لاحظ",
        detail: text.slice(0, 48),
        transform: { x: 0.58, y: 0.4, scale: 1, rotateY: 0 },
        emphasis: 0.7,
      };
    case "celebrate":
      return {
        id,
        kind: "banner",
        label: "أحسنت",
        detail: text.slice(0, 48),
        transform: { x: 0.55, y: 0.32, scale: 1.1, rotateY: 0 },
        emphasis: 1,
      };
    case "greet_hook":
      return {
        id,
        kind: "title",
        label: extractDisplayText(text, act) || "درس اليوم",
        detail: text.slice(0, 64),
        transform: { x: 0.55, y: 0.34, scale: 1, rotateY: 0 },
        emphasis: 0.75,
      };
    default:
      return {
        id,
        kind: "note",
        label: label || "شرح",
        detail: text.slice(0, 64),
        transform: { x: 0.58, y: 0.4, scale: 1, rotateY: 0 },
        emphasis: 0.55,
      };
  }
}

function behaviourForAct(act: ContentAct, fallback: BehaviourGoal): BehaviourGoal {
  if (act === "run_experiment" || act === "draw_diagram" || act === "write_law") {
    return "demonstrate";
  }
  if (
    act === "show_model" ||
    act === "rotate_model" ||
    act === "zoom_in_model" ||
    act === "zoom_out_model" ||
    act === "hold_model"
  ) {
    return "demonstrate";
  }
  if (act === "ask_check") return "check";
  if (act === "celebrate") return "encourage";
  if (act === "greet_hook") return "hook";
  return fallback;
}

/**
 * Build one unique sentence performance from meaning + context.
 */
export function directSentence(
  text: string,
  ctx: SemanticContext,
): SentencePerformance {
  const persona = getTeacherPersona(ctx.teacherId || "sara");
  const seed = contentSeed(
    `${ctx.lessonId}|${persona.id}|${ctx.blockId}|${ctx.lineIndex}|${text}|v4`,
  );
  const act = detectContentAct(text, ctx.blockKind);
  const { emotion, intensity } = emotionForAct(act, text, seed, persona);
  const gesture = gestureForAct(act, seed, ctx.lineIndex, persona, ctx);
  const gaze = gazeForAct(act, seed, ctx.lineIndex);
  const locomotion = locomotionForAct(act, text, ctx.prevAct, persona);
  const camera = cameraForAct(act, seed, ctx.lineIndex, ctx);
  const light = lightForAct(act, emotion);
  const screen = buildScreenElement(act, text, seed, ctx.lineIndex);
  const goal = behaviourForAct(act, goalForKind(ctx.blockKind));

  const sharp = persona.gestureBias.pointSharpness;
  const head = {
    yaw:
      gaze === "board"
        ? (-18 - (seed % 6)) * (0.9 + sharp * 0.1)
        : gaze === "prop"
          ? -8 - (seed % 5)
          : gaze === "student"
            ? (6 + (seed % 5)) * (persona.style === "warm" ? 1.15 : 0.9)
            : 2,
    pitch: act === "write_law" || act === "draw_diagram" ? 6 + (seed % 4) : -1 + (seed % 3),
    roll: ((seed % 5) - 2) * 0.4 * (persona.style === "warm" ? 1.2 : 0.8),
  };

  return {
    sentenceId: `s_${persona.id}_${ctx.blockId}_${ctx.lineIndex}_${(seed % 997).toString(36)}`,
    text,
    contentAct: act,
    emotion,
    emotionIntensity: intensity,
    gesture,
    gaze,
    locomotion,
    head,
    camera,
    lighting: light.preset,
    lightIntensity: light.intensity,
    screen,
    behaviourGoal: goal,
    seed,
    reason: `teacher=${persona.id} · act=${act} · ${text.slice(0, 36)}`,
  };
}
