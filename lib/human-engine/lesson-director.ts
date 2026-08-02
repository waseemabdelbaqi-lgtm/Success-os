/**
 * Lesson Director — orchestrates Human Engine from semantic sentence performance.
 * Every line → face/eyes/head/hands/locomotion/gaze/camera/light/screen from meaning.
 */
import type {
  AdapterId,
  AdapterStatus,
  ContentAct,
  HumanLessonInput,
  HumanPerformancePlan,
  LocomotionKeyframe,
  PhonemeKeyframe,
  ScreenElement,
  ScreenKeyframe,
  SkeletonKeyframe,
} from "@/types/human-engine";
import { generateCharacter } from "./character-generator";
import { splitTeachingLines } from "./seed";
import { composeSkeletonKeys } from "./skeleton-animation";
import { buildBlendShapeTrack } from "./blend-shapes";
import { textToPhonemeTrack } from "./lip-sync";
import { assembleTimeline, assertTimelineIntegrity } from "./animation-timeline";
import { resolveAdapterMeta } from "./adapters";
import { directSentence, type SemanticContext } from "./semantic-sentence";

const AUDIO_BY_ACT: Partial<Record<ContentAct, string>> = {
  greet_hook: "welcome",
  explain_concept: "intro",
  point_content: "intro",
  write_board: "example",
  write_law: "example",
  draw_diagram: "example",
  run_experiment: "challenge",
  show_model: "example",
  hold_model: "example",
  rotate_model: "example",
  zoom_in_model: "example",
  zoom_out_model: "example",
  count_sequence: "one",
  ask_check: "challenge",
  celebrate: "correct",
};

const AUDIO_BY_KIND: Record<string, string> = {
  hook: "welcome",
  explain: "intro",
  example: "example",
  practice: "practice",
  check: "challenge",
  encourage: "correct",
  close: "bye",
};

function estimateLineMs(text: string, act: ContentAct): number {
  const base = Math.min(3800, Math.max(1000, Math.round(text.length * 72 + 400)));
  if (act === "run_experiment" || act === "rotate_model" || act === "draw_diagram") {
    return Math.min(4200, base + 350);
  }
  if (act === "ask_check") return Math.min(3600, base + 200);
  return base;
}

function animateScreenDuringLine(
  el: ScreenElement,
  act: ContentAct,
  startMs: number,
  endMs: number,
): ScreenKeyframe[] {
  const mid = startMs + Math.floor((endMs - startMs) * 0.45);
  const keys: ScreenKeyframe[] = [];

  if (act === "draw_diagram") {
    keys.push({
      tMs: startMs,
      endMs: mid,
      contentAct: act,
      element: { ...el, strokeProgress: 0.15, transform: { ...el.transform } },
    });
    keys.push({
      tMs: mid,
      endMs: endMs,
      contentAct: act,
      element: {
        ...el,
        strokeProgress: 1,
        transform: { ...el.transform, scale: el.transform.scale * 1.05 },
      },
    });
    return keys;
  }

  if (act === "rotate_model") {
    keys.push({
      tMs: startMs,
      endMs: mid,
      contentAct: act,
      element: {
        ...el,
        transform: { ...el.transform, rotateY: el.transform.rotateY },
      },
    });
    keys.push({
      tMs: mid,
      endMs: endMs,
      contentAct: act,
      element: {
        ...el,
        transform: {
          ...el.transform,
          rotateY: el.transform.rotateY + 110,
          scale: el.transform.scale * 1.08,
        },
      },
    });
    return keys;
  }

  if (act === "zoom_in_model" || act === "zoom_out_model") {
    const startScale = act === "zoom_in_model" ? 0.85 : 1.35;
    const endScale = el.transform.scale;
    keys.push({
      tMs: startMs,
      endMs: mid,
      contentAct: act,
      element: {
        ...el,
        transform: { ...el.transform, scale: startScale },
      },
    });
    keys.push({
      tMs: mid,
      endMs: endMs,
      contentAct: act,
      element: {
        ...el,
        transform: { ...el.transform, scale: endScale },
      },
    });
    return keys;
  }

  if (act === "run_experiment") {
    keys.push({
      tMs: startMs,
      endMs: mid,
      contentAct: act,
      element: { ...el, experimentPhase: "setup" },
    });
    keys.push({
      tMs: mid,
      endMs: endMs,
      contentAct: act,
      element: {
        ...el,
        experimentPhase: "active",
        transform: { ...el.transform, scale: el.transform.scale * 1.1 },
        emphasis: 1,
      },
    });
    return keys;
  }

  if (act === "write_law" || act === "write_board") {
    keys.push({
      tMs: startMs,
      endMs: mid,
      contentAct: act,
      element: { ...el, emphasis: 0.4 },
    });
    keys.push({
      tMs: mid,
      endMs: endMs,
      contentAct: act,
      element: { ...el, emphasis: 1 },
    });
    return keys;
  }

  return [{ tMs: startMs, endMs, contentAct: act, element: el }];
}

export type DirectLessonOptions = {
  input: HumanLessonInput;
  adapterId?: AdapterId;
  heygenConfigured?: boolean;
  metahumanConfigured?: boolean;
  maxDurationMs?: number;
};

export function directLesson(opts: DirectLessonOptions): HumanPerformancePlan {
  const character = generateCharacter(opts.input);
  const maxDuration = opts.maxDurationMs ?? opts.input.durationMs ?? 90000;
  const adapterMeta = resolveAdapterMeta({
    id: opts.adapterId || "local_photoreal_preview",
    heygenConfigured: opts.heygenConfigured,
    metahumanConfigured: opts.metahumanConfigured,
  });

  const blocks =
    opts.input.blocks.length > 0
      ? opts.input.blocks
      : [
          {
            id: "fallback",
            kind: "explain" as const,
            text: opts.input.titleAr || opts.input.title,
          },
        ];

  type TimedSentence = ReturnType<typeof directSentence> & {
    blockId: string;
    startMs: number;
    endMs: number;
    audioSrc?: string;
  };

  const sentences: TimedSentence[] = [];
  let cursor = 0;
  let lineIndex = 0;
  let prevAct: ContentAct | undefined;
  const usedGestures: string[] = [];
  const usedCameras: string[] = [];
  let lastGesture: string | null = null;
  let lastCamera: string | null = null;

  for (const block of blocks) {
    const lines = splitTeachingLines(block.textAr || block.text);
    for (const line of lines) {
      if (cursor >= maxDuration - 200) break;
      const ctx: SemanticContext = {
        lessonId: opts.input.lessonId,
        subject: opts.input.subject,
        blockId: block.id,
        blockKind: block.kind,
        lineIndex,
        prevAct,
        teacherId: character.id,
        usedGestures,
        usedCameras,
        lastGesture,
        lastCamera,
      };
      const perf = directSentence(line, ctx);
      const dur = estimateLineMs(line, perf.contentAct);
      const end = Math.min(maxDuration, cursor + dur);
      const root = character.appearance.photorealAssetRoot;
      const audioKey =
        AUDIO_BY_ACT[perf.contentAct] || AUDIO_BY_KIND[block.kind] || "intro";
      sentences.push({
        ...perf,
        blockId: block.id,
        startMs: cursor,
        endMs: end,
        audioSrc: `${root}/audio/${audioKey}.mp3`,
      });
      usedGestures.push(perf.gesture);
      usedCameras.push(perf.camera);
      lastGesture = perf.gesture;
      lastCamera = perf.camera;
      prevAct = perf.contentAct;
      cursor = end + 140;
      lineIndex += 1;
    }
    if (cursor >= maxDuration - 200) break;
  }

  if (!sentences.length) {
    const perf = directSentence(opts.input.title, {
      lessonId: opts.input.lessonId,
      blockId: "empty",
      blockKind: "explain",
      lineIndex: 0,
      teacherId: character.id,
    });
    sentences.push({
      ...perf,
      blockId: "empty",
      startMs: 0,
      endMs: Math.min(2000, maxDuration),
    });
  }

  // Stretch to honor requested duration (proof lessons need ≥60s wall-clock).
  const rawEnd = sentences[sentences.length - 1]!.endMs;
  const targetDuration = Math.min(
    maxDuration,
    Math.max(rawEnd + 220, opts.input.durationMs || 0),
  );
  if (rawEnd > 0 && targetDuration > rawEnd + 400) {
    const scale = (targetDuration - 220) / rawEnd;
    for (const s of sentences) {
      s.startMs = Math.round(s.startMs * scale);
      s.endMs = Math.round(s.endMs * scale);
    }
  }

  const durationMs = Math.min(
    maxDuration,
    Math.max(sentences[sentences.length - 1]!.endMs + 220, opts.input.durationMs || 0),
  );

  const lipSync: PhonemeKeyframe[] = [];
  const skeleton: SkeletonKeyframe[] = [];
  const screen: ScreenKeyframe[] = [];
  const locomotion: LocomotionKeyframe[] = [];

  for (const s of sentences) {
    lipSync.push(...textToPhonemeTrack(s.text, s.startMs, s.endMs));
    skeleton.push(
      ...composeSkeletonKeys({
        startMs: s.startMs,
        durationMs: s.endMs - s.startMs,
        intent: s.gesture,
        seed: s.seed,
      }),
    );
    screen.push(
      ...animateScreenDuringLine(s.screen, s.contentAct, s.startMs, s.endMs),
    );
    locomotion.push({
      tMs: s.startMs,
      durationMs: s.endMs - s.startMs,
      intent: s.locomotion,
      seed: s.seed,
    });
  }

  const gesture = sentences.map((s) => ({
    tMs: s.startMs,
    durationMs: Math.max(400, s.endMs - s.startMs),
    intent: s.gesture,
    seed: s.seed,
  }));

  const emotion = sentences.flatMap((s) => [
    { tMs: s.startMs, emotion: s.emotion, intensity: s.emotionIntensity },
    {
      tMs: s.startMs + Math.floor((s.endMs - s.startMs) * 0.55),
      emotion: s.emotion,
      intensity: Math.min(1, s.emotionIntensity + 0.06),
    },
    { tMs: s.endMs, emotion: s.emotion, intensity: s.emotionIntensity * 0.88 },
  ]);

  const eyes = sentences.flatMap((s) => {
    const span = s.endMs - s.startMs;
    const steps = Math.max(2, Math.floor(span / 850));
    return Array.from({ length: steps + 1 }, (_, i) => ({
      tMs: Math.round(s.startMs + (span * i) / steps),
      target: s.gaze,
      blink: (s.seed + i * 13) % 5 === 0 ? 1 : 0,
      saccadeAmp: 0.12 + ((s.seed + i) % 5) * 0.03,
    }));
  });

  const head = sentences.flatMap((s) => [
    { tMs: s.startMs, ...s.head },
    {
      tMs: s.startMs + Math.floor((s.endMs - s.startMs) * 0.5),
      yaw: s.head.yaw * 0.85,
      pitch: s.head.pitch,
      roll: s.head.roll * -0.5,
    },
    { tMs: s.endMs, yaw: s.head.yaw * 0.4, pitch: 0, roll: 0 },
  ]);

  const behaviour = sentences.map((s) => ({
    tMs: s.startMs,
    goal: s.behaviourGoal,
    blockId: s.blockId,
    reason: s.reason,
  }));

  const camera = sentences.map((s) => ({
    tMs: s.startMs,
    shot: s.camera,
    easeMs: 420 + (s.seed % 5) * 40,
  }));

  const lighting = sentences.map((s) => ({
    tMs: s.startMs,
    preset: s.lighting,
    intensity: s.lightIntensity,
  }));

  const facial = buildBlendShapeTrack(
    lipSync.map((p) => {
      const s =
        sentences.find((x) => p.tMs >= x.startMs && p.tMs <= x.endMs) || sentences[0]!;
      return {
        tMs: p.tMs,
        phoneme: p.phoneme,
        emotion: s.emotion,
        intensity: s.emotionIntensity,
      };
    }),
  );

  const timeline = assembleTimeline({
    durationMs,
    skeleton,
    facial,
    lipSync,
    eyes,
    head,
    emotion,
    gesture,
    locomotion,
    camera,
    lighting,
    behaviour,
    screen,
  });

  const issues = assertTimelineIntegrity(timeline);
  if (issues.length) {
    throw new Error(`Human Engine timeline invalid: ${issues.join("; ")}`);
  }

  return {
    schema: "success-os.human-engine.v1",
    version: "1.1.0",
    planId: `he_${opts.input.lessonId}_${character.id}_${Date.now().toString(36)}`,
    lessonId: opts.input.lessonId,
    character,
    adapter: {
      id: adapterMeta.id,
      status: adapterMeta.status as AdapterStatus,
      notes: [
        ...adapterMeta.notes,
        "Sentence performances generated from lesson meaning (semantic director v3)",
      ],
    },
    timeline,
    sentences,
    speech: {
      lines: sentences.map((s) => ({
        blockId: s.blockId,
        text: s.text,
        startMs: s.startMs,
        endMs: s.endMs,
        audioSrc: s.audioSrc,
        sentenceId: s.sentenceId,
        contentAct: s.contentAct,
      })),
    },
    createdAt: new Date().toISOString(),
  };
}
