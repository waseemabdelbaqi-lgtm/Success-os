import type {
  BehaviorBeat,
  BoardCue,
  DynamicGesture,
  FaceExpression,
  LessonAnalysis,
  PresencePose,
  PropKind,
  StudioProp,
  StudioScene,
} from "@/types/digital-human-studio";
import type { TeacherCast } from "@/types/digital-human-studio";

/** Deterministic but non-repetitive seed from content. */
export function contentSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(seed: number, arr: T[], salt: number): T {
  return arr[(seed + salt * 17) % arr.length]!;
}

function gesturesForPurpose(
  purpose: StudioScene["purpose"],
  visual: PropKind[],
  seed: number,
): DynamicGesture[] {
  const base: DynamicGesture[] = ["idle_breathe", "eye_contact", "nod"];
  if (purpose === "hook") {
    return [...base, "walk_step", "explain_open_hands", pick(seed, ["encourage_clap_soft", "nod"] as DynamicGesture[], 1)];
  }
  if (purpose === "demonstrate") {
    const g: DynamicGesture[] = [...base, "point_board", "write_chalk"];
    if (visual.includes("model_3d")) g.push("rotate_model", "zoom_in");
    if (visual.includes("diagram")) g.push("draw_curve");
    return g;
  }
  if (purpose === "practice" || purpose === "check") {
    return [...base, "pause_think", "point_board", "encourage_clap_soft"];
  }
  if (purpose === "close") return [...base, "encourage_clap_soft", "explain_open_hands"];
  return [...base, "explain_open_hands", "point_board", "write_chalk"];
}

function expressionFor(purpose: StudioScene["purpose"], seed: number): FaceExpression {
  if (purpose === "close" || purpose === "check") return pick(seed, ["celebrate", "encourage", "warm_smile"], 2);
  if (purpose === "demonstrate") return pick(seed, ["focus", "curious", "neutral_teach"], 3);
  if (purpose === "hook") return "warm_smile";
  return pick(seed, ["neutral_teach", "focus", "encourage"], 4);
}

function poseForGesture(g: DynamicGesture): PresencePose {
  if (g === "write_chalk" || g === "draw_curve") return "write";
  if (g === "point_board" || g === "zoom_in" || g === "zoom_out") return "point";
  if (g === "rotate_model" || g === "lift_prop") return "manipulate_model";
  if (g === "walk_step") return "walk_in";
  if (g === "eye_contact") return "turn_to_student";
  return "stand";
}

export function directBehaviors(opts: {
  purpose: StudioScene["purpose"];
  say: string;
  analysis: LessonAnalysis;
  sceneIndex: number;
}): BehaviorBeat[] {
  const seed = contentSeed(`${opts.say}|${opts.purpose}|${opts.sceneIndex}`);
  const gestures = gesturesForPurpose(opts.purpose, opts.analysis.visualNeeds, seed);
  // Shuffle lightly by seed — avoid identical loops across scenes
  const ordered = gestures
    .map((g, i) => ({ g, k: (seed >> (i % 8)) & 7 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.g);

  const chunks = opts.say.split(/(?<=[.!?؟…])\s+/).filter(Boolean);
  const beats: BehaviorBeat[] = [];
  const n = Math.max(ordered.length, chunks.length, 3);

  for (let i = 0; i < n; i++) {
    const g = ordered[i % ordered.length]!;
    const at = Number(((i + 0.5) / (n + 0.5)).toFixed(3));
    beats.push({
      at,
      pose: poseForGesture(g),
      gesture: g,
      expression: expressionFor(opts.purpose, seed + i),
      eyeContact: g === "eye_contact" || i % 3 === 0,
      sayChunk: chunks[i],
    });
  }
  return beats;
}

export function buildBoardCues(opts: {
  title: string;
  purpose: StudioScene["purpose"];
  analysis: LessonAnalysis;
  body: string;
}): BoardCue[] {
  const cues: BoardCue[] = [
    { at: 0.05, kind: "title", content: opts.title },
  ];
  if (opts.purpose === "hook") {
    cues.push({ at: 0.35, kind: "subtitle", content: opts.analysis.summaryAr });
    cues.push({ at: 0.7, kind: "highlight", content: "هيا نبدأ" });
  }
  if (opts.analysis.needsEquation || /[=]/.test(opts.body)) {
    cues.push({
      at: 0.4,
      kind: "equation",
      content: extractEquation(opts.body) || "a = b + c",
    });
  }
  if (opts.analysis.needsStepSolve || opts.purpose === "practice") {
    cues.push({ at: 0.35, kind: "steps", content: "١) افهم  ٢) طبّق  ٣) راجع" });
  }
  if (opts.analysis.needsModel3d) {
    cues.push({ at: 0.55, kind: "model_3d", content: "نموذج ثلاثي الأبعاد" });
  }
  if (opts.analysis.needsExperiment) {
    cues.push({ at: 0.6, kind: "experiment", content: "تجربة / محاكاة" });
  }
  if (opts.purpose === "demonstrate") {
    cues.push({ at: 0.5, kind: "diagram", content: "رسم توضيحي" });
  }
  if (opts.purpose === "close") {
    cues.push({ at: 0.45, kind: "highlight", content: "خلاصة الدرس" });
  }
  return cues.sort((a, b) => a.at - b.at);
}

function extractEquation(text: string): string | null {
  const m = text.match(/[A-Za-z\u0600-\u06FF0-9]+\s*=\s*[^=\n]{1,40}/);
  return m ? m[0]!.trim() : null;
}

export function buildProps(opts: {
  analysis: LessonAnalysis;
  purpose: StudioScene["purpose"];
  sceneId: string;
}): StudioProp[] {
  const props: StudioProp[] = [];
  const needs = opts.analysis.visualNeeds;
  let i = 0;
  for (const kind of needs) {
    if (opts.purpose === "hook" && kind !== "diagram") continue;
    if (opts.purpose === "close") continue;
    props.push({
      id: `${opts.sceneId}-prop-${i++}`,
      kind,
      label: labelFor(kind),
      payload: { procedural: true, kind },
      appearAt: 0.25 + (i % 4) * 0.15,
      interact:
        kind === "model_3d"
          ? ["rotate", "zoom", "point"]
          : kind === "equation"
            ? ["write", "highlight", "point"]
            : ["point", "highlight"],
    });
    if (props.length >= 3) break;
  }
  return props;
}

function labelFor(kind: PropKind): string {
  const map: Record<PropKind, string> = {
    equation: "معادلة",
    diagram: "رسم",
    model_3d: "مجسم 3D",
    chart: "رسم بياني",
    image: "صورة",
    video: "فيديو",
    experiment: "تجربة",
    simulation: "محاكاة",
    law: "قانون",
    tool: "أداة",
  };
  return map[kind];
}

export function openingLine(cast: TeacherCast, title: string): string {
  if (cast.style === "warm") {
    return `مرحبا يا أحلى صف. أنا ${cast.displayNameAr}. اليوم نشرح «${title}» خطوة بخطوة داخل الاستوديو.`;
  }
  return `أهلاً. أنا ${cast.displayNameAr}. هدفنا إتقان «${title}» بوضوح ودقة. نبدأ.`;
}
