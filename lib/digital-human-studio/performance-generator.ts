/**
 * Sentence-synced AI performance generator.
 * Each sentence gets a unique gesture/expression/focus — not a looping pack.
 */
import type {
  BehaviorBeat,
  DynamicGesture,
  FaceExpression,
  LessonAnalysis,
  PresencePose,
  StudioProp,
  StudioScene,
} from "@/types/digital-human-studio";
import { contentSeed } from "./behavior-director";

function splitSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?؟…،])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
  return parts.length ? parts : [text.trim()].filter(Boolean);
}

function gestureFromSentence(
  sentence: string,
  purpose: StudioScene["purpose"],
  analysis: LessonAnalysis,
  seed: number,
  index: number,
): DynamicGesture {
  const s = sentence.toLowerCase();
  if (/اكتب|بكتب|معادل|=|قانون|صيغة/.test(s) || analysis.needsEquation) {
    return index % 2 === 0 ? "write_chalk" : "point_board";
  }
  if (/شوف|انظر|لاحظ|رسم|شكل|نموذج|مجسم|دور|كبّر|صغّر/.test(s) || analysis.needsModel3d) {
    const opts: DynamicGesture[] = ["point_board", "rotate_model", "zoom_in", "lift_prop"];
    return opts[(seed + index) % opts.length]!;
  }
  if (/عدّ| downstream|تمرين|سؤال|فكر/.test(s) || purpose === "check" || purpose === "practice") {
    return index % 2 === 0 ? "pause_think" : "eye_contact";
  }
  if (/مرحبا|أهلا|أحسن|إلى اللقاء|فخور/.test(s) || purpose === "hook" || purpose === "close") {
    const opts: DynamicGesture[] = ["walk_step", "explain_open_hands", "encourage_clap_soft", "nod"];
    return opts[(seed + index * 3) % opts.length]!;
  }
  const pool: DynamicGesture[] = [
    "explain_open_hands",
    "point_board",
    "eye_contact",
    "nod",
    "idle_breathe",
    "pause_think",
  ];
  return pool[(seed + index * 11) % pool.length]!;
}

function expressionFromSentence(
  sentence: string,
  purpose: StudioScene["purpose"],
  seed: number,
  index: number,
): FaceExpression {
  if (/أحسن|ممتاز|بطل|لقاء/.test(sentence) || purpose === "close") return "celebrate";
  if (/سؤال|فكر|لماذا/.test(sentence) || purpose === "check") return "curious";
  if (/ركز|معادل|قانون|دقة/.test(sentence)) return "focus";
  if (/مرحبا|أهلا|حلو|ولا يهمك/.test(sentence) || purpose === "hook") return "warm_smile";
  const pool: FaceExpression[] = ["neutral_teach", "focus", "encourage", "curious"];
  return pool[(seed + index * 5) % pool.length]!;
}

function poseFromGesture(g: DynamicGesture): PresencePose {
  if (g === "write_chalk" || g === "draw_curve") return "write";
  if (g === "point_board" || g === "zoom_in" || g === "zoom_out") return "point";
  if (g === "rotate_model" || g === "lift_prop") return "manipulate_model";
  if (g === "walk_step") return "walk_in";
  if (g === "eye_contact") return "turn_to_student";
  return "stand";
}

function focusForSentence(
  sentence: string,
  props: StudioProp[],
  purpose: StudioScene["purpose"],
  index: number,
): string | null {
  if (!props.length) {
    if (/سبور|معادل|رسم|قانون/.test(sentence) || purpose === "demonstrate") return "board";
    return index % 2 === 0 ? "student" : "board";
  }
  if (/نموذج|مجسم|3d|دور/.test(sentence)) {
    return props.find((p) => p.kind === "model_3d")?.id || props[0]!.id;
  }
  if (/معادل|قانون|=|صيغة/.test(sentence)) {
    return props.find((p) => p.kind === "equation" || p.kind === "law")?.id || "board";
  }
  if (/تجرب|محاك/.test(sentence)) {
    return props.find((p) => p.kind === "experiment" || p.kind === "simulation")?.id || props[0]!.id;
  }
  if (/رسم|بيان|شكل|صورة/.test(sentence)) {
    return props.find((p) => p.kind === "diagram" || p.kind === "chart" || p.kind === "image")?.id ||
      "board";
  }
  return props[index % props.length]?.id || "board";
}

/**
 * Generate per-sentence performance beats unique to this say text.
 */
export function generateSentencePerformance(opts: {
  say: string;
  purpose: StudioScene["purpose"];
  analysis: LessonAnalysis;
  sceneIndex: number;
  props: StudioProp[];
}): BehaviorBeat[] {
  const sentences = splitSentences(opts.say);
  const seed = contentSeed(`${opts.say}|${opts.purpose}|${opts.sceneIndex}|v2`);
  const n = sentences.length;

  return sentences.map((sentence, index) => {
    const gesture = gestureFromSentence(sentence, opts.purpose, opts.analysis, seed, index);
    const at = Number(((index + 0.35) / (n + 0.35)).toFixed(3));
    return {
      at,
      pose: poseFromGesture(gesture),
      gesture,
      expression: expressionFromSentence(sentence, opts.purpose, seed, index),
      eyeContact: gesture === "eye_contact" || index % 3 === 0,
      sayChunk: sentence,
      focusTarget: focusForSentence(sentence, opts.props, opts.purpose, index),
      breath: 0.35 + ((seed >> (index % 8)) & 7) / 20,
      blink: index > 0 && index % 2 === 1,
    };
  });
}
