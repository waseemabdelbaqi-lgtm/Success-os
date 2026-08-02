/**
 * Lesson Director — orchestrates all 13 subsystems into one performance plan.
 * Independent of Three.js studio. Adapters render the plan.
 */
import type {
  AdapterId,
  AdapterStatus,
  HumanLessonInput,
  HumanPerformancePlan,
  PhonemeKeyframe,
  SkeletonKeyframe,
} from "@/types/human-engine";
import { generateCharacter } from "./character-generator";
import { contentSeed, splitTeachingLines } from "./seed";
import { composeSkeletonKeys } from "./skeleton-animation";
import { buildBlendShapeTrack } from "./blend-shapes";
import { textToPhonemeTrack } from "./lip-sync";
import { buildEyeTrack } from "./eye-tracking";
import { buildHeadTrack } from "./head-tracking";
import { buildEmotionTrack, emotionForBlock } from "./emotion-system";
import { buildGestureTrack, gestureFromLine } from "./gesture-engine";
import { buildBehaviourTrack, goalForKind } from "./ai-behaviour-engine";
import { buildCameraTrack } from "./camera-director";
import { buildLightTrack } from "./lighting-director";
import { assembleTimeline, assertTimelineIntegrity } from "./animation-timeline";
import { resolveAdapterMeta } from "./adapters";

const AUDIO_BY_KIND: Record<string, string> = {
  hook: "welcome",
  explain: "intro",
  example: "example",
  practice: "practice",
  check: "challenge",
  encourage: "correct",
  close: "bye",
};

function estimateLineMs(text: string): number {
  // ~12 Arabic chars/sec teaching pace + breath
  return Math.min(3200, Math.max(900, Math.round(text.length * 75 + 350)));
}

export type DirectLessonOptions = {
  input: HumanLessonInput;
  adapterId?: AdapterId;
  heygenConfigured?: boolean;
  metahumanConfigured?: boolean;
  /** Hard cap — preview uses 10000. */
  maxDurationMs?: number;
};

export function directLesson(opts: DirectLessonOptions): HumanPerformancePlan {
  const character = generateCharacter(opts.input);
  const maxDuration = opts.maxDurationMs ?? opts.input.durationMs ?? 60000;
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

  type Seg = {
    blockId: string;
    kind: (typeof blocks)[0]["kind"];
    text: string;
    startMs: number;
    endMs: number;
    seed: number;
    index: number;
  };

  const segments: Seg[] = [];
  let cursor = 0;
  let index = 0;
  for (const block of blocks) {
    const lines = splitTeachingLines(block.textAr || block.text);
    for (const line of lines) {
      if (cursor >= maxDuration - 200) break;
      const dur = estimateLineMs(line);
      const end = Math.min(maxDuration, cursor + dur);
      segments.push({
        blockId: block.id,
        kind: block.kind,
        text: line,
        startMs: cursor,
        endMs: end,
        seed: contentSeed(`${opts.input.lessonId}|${block.id}|${line}`),
        index,
      });
      cursor = end + 120;
      index += 1;
    }
    if (cursor >= maxDuration - 200) break;
  }

  if (!segments.length) {
    segments.push({
      blockId: "empty",
      kind: "explain",
      text: opts.input.title,
      startMs: 0,
      endMs: Math.min(2000, maxDuration),
      seed: 1,
      index: 0,
    });
  }

  const durationMs = Math.min(maxDuration, segments[segments.length - 1]!.endMs + 200);

  const lipSync: PhonemeKeyframe[] = [];
  const skeleton: SkeletonKeyframe[] = [];
  for (const seg of segments) {
    lipSync.push(...textToPhonemeTrack(seg.text, seg.startMs, seg.endMs));
    const intent = gestureFromLine(seg.text, seg.kind, seg.seed, seg.index);
    skeleton.push(
      ...composeSkeletonKeys({
        startMs: seg.startMs,
        durationMs: seg.endMs - seg.startMs,
        intent,
        seed: seg.seed,
      }),
    );
  }

  const gesture = buildGestureTrack(segments);
  const emotion = buildEmotionTrack(segments);
  const eyes = buildEyeTrack({
    segments: segments.map((s) => ({
      startMs: s.startMs,
      endMs: s.endMs,
      kind: s.kind,
      seed: s.seed,
    })),
  });
  const head = buildHeadTrack(eyes, contentSeed(opts.input.lessonId));
  const behaviour = buildBehaviourTrack(segments);

  const facial = buildBlendShapeTrack(
    lipSync.map((p, i) => {
      const seg =
        segments.find((s) => p.tMs >= s.startMs && p.tMs <= s.endMs) || segments[0]!;
      const em = emotionForBlock(seg.kind, seg.text, seg.seed);
      return {
        tMs: p.tMs,
        phoneme: p.phoneme,
        emotion: em.emotion,
        intensity: em.intensity,
        i,
      };
    }),
  );

  const camera = buildCameraTrack(
    segments.map((s) => ({
      tMs: s.startMs,
      goal: goalForKind(s.kind),
      gesture: gestureFromLine(s.text, s.kind, s.seed, s.index),
      seed: s.seed,
      index: s.index,
    })),
  );

  const lighting = buildLightTrack(
    segments.map((s, i) => {
      const em = emotionForBlock(s.kind, s.text, s.seed);
      return {
        tMs: s.startMs,
        emotion: em.emotion,
        shot: camera[i]?.shot || "medium_teacher",
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
    camera,
    lighting,
    behaviour,
  });

  const issues = assertTimelineIntegrity(timeline);
  if (issues.length) {
    throw new Error(`Human Engine timeline invalid: ${issues.join("; ")}`);
  }

  const root = character.appearance.photorealAssetRoot;
  const speech = {
    lines: segments.map((s) => ({
      blockId: s.blockId,
      text: s.text,
      startMs: s.startMs,
      endMs: s.endMs,
      audioSrc: `${root}/audio/${AUDIO_BY_KIND[s.kind] || "intro"}.mp3`,
    })),
  };

  return {
    schema: "success-os.human-engine.v1",
    version: "1.0.0",
    planId: `he_${opts.input.lessonId}_${character.id}_${Date.now().toString(36)}`,
    lessonId: opts.input.lessonId,
    character,
    adapter: {
      id: adapterMeta.id,
      status: adapterMeta.status as AdapterStatus,
      notes: adapterMeta.notes,
    },
    timeline,
    speech,
    createdAt: new Date().toISOString(),
  };
}
