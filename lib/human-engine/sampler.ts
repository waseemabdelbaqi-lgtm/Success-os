/**
 * Frame sampler — evaluates the full timeline at tMs for any adapter.
 */
import type {
  ContentAct,
  HumanFrameSample,
  HumanPerformancePlan,
  LocomotionIntent,
  PhonemeId,
  ScreenElement,
} from "@/types/human-engine";
import { sampleBones } from "./skeleton-animation";
import { sampleBlendShapes } from "./blend-shapes";
import { jawFromPhoneme, samplePhoneme } from "./lip-sync";
import { sampleEyes } from "./eye-tracking";
import { sampleHead } from "./head-tracking";
import { sampleEmotion } from "./emotion-system";
import { sampleGesture } from "./gesture-engine";
import { sampleCamera } from "./camera-director";
import { sampleLight } from "./lighting-director";
import { sampleBehaviour } from "./ai-behaviour-engine";

function sampleLocomotion(
  keys: HumanPerformancePlan["timeline"]["locomotion"]["keys"],
  tMs: number,
): LocomotionIntent {
  let cur: LocomotionIntent = "stand";
  for (const k of keys) {
    if (k.tMs <= tMs) cur = k.intent;
    else break;
  }
  return cur;
}

function sampleScreen(
  keys: HumanPerformancePlan["timeline"]["screen"]["keys"],
  tMs: number,
): { element: ScreenElement | null; contentAct: ContentAct | null } {
  let cur = keys[0] || null;
  for (const k of keys) {
    if (k.tMs <= tMs) cur = k;
    else break;
  }
  if (!cur || tMs > cur.endMs + 80) {
    // keep last visible element briefly
    const last = keys.filter((k) => k.tMs <= tMs).pop() || null;
    return {
      element: last?.element ?? null,
      contentAct: last?.contentAct ?? null,
    };
  }
  return { element: cur.element, contentAct: cur.contentAct };
}

export function sampleFrame(plan: HumanPerformancePlan, tMs: number): HumanFrameSample {
  const tl = plan.timeline;
  const t = Math.max(0, Math.min(tl.durationMs, tMs));
  const phoneme: PhonemeId = samplePhoneme(tl.lipSync.keys, t);
  const mouthShapes = sampleBlendShapes(tl.facial.keys, t);
  const emotion = sampleEmotion(tl.emotion.keys, t);
  const eyes = sampleEyes(tl.eyes.keys, t);
  const head = sampleHead(tl.head.keys, t);
  const light = sampleLight(tl.lighting.keys, t);
  const screen = sampleScreen(tl.screen.keys, t);
  const line = plan.speech.lines.find((l) => t >= l.startMs && t < l.endMs) || null;
  const sentence =
    plan.sentences?.find((s) => t >= s.startMs && t < s.endMs) || null;

  return {
    tMs: t,
    characterId: plan.character.id,
    phoneme,
    jawOpen: mouthShapes.jawOpen ?? jawFromPhoneme(phoneme),
    mouthShapes,
    emotion: emotion.emotion,
    emotionIntensity: emotion.intensity,
    gesture: sampleGesture(tl.gesture.keys, t),
    locomotion: sampleLocomotion(tl.locomotion.keys, t),
    gaze: eyes.target,
    head,
    bones: sampleBones(tl.skeleton.keys, t),
    camera: sampleCamera(tl.camera.keys, t),
    lighting: light.preset,
    lightIntensity: light.intensity,
    behaviourGoal: sampleBehaviour(tl.behaviour.keys, t),
    contentAct: screen.contentAct || sentence?.contentAct || null,
    screen: screen.element,
    speaking: Boolean(line) && phoneme !== "sil",
    lineText: line?.text ?? null,
    sentenceId: sentence?.sentenceId ?? line?.sentenceId ?? null,
  };
}
