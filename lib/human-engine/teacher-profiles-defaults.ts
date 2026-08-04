/**
 * Client-safe default Teacher Mind profiles (bundled JSON).
 * Identity / voice / personality ALWAYS overlay from Sara.ts / Ali.ts.
 * JSON keeps behaviour phrases only — never wins over Configuration Layer.
 */
import type { TeacherMindProfile, TeacherProfileId } from "@/types/teacher-mind";
import {
  getTeacherAppearance,
  getTeacherDisplayName,
  getTeacherPersonalityLock,
  getTeacherConfig,
  isWarmTeachingStyle,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";
import sara from "../../content/ai-teachers/profiles/sara.json";
import ali from "../../content/ai-teachers/profiles/ali.json";

const DEFAULTS: Record<string, TeacherMindProfile> = {
  sara: sara as TeacherMindProfile,
  ali: ali as TeacherMindProfile,
};

/** Merge Configuration Layer identity onto Teacher Mind behaviour profile. */
export function applyConfigLayer(mind: TeacherMindProfile): TeacherMindProfile {
  const cfg = getTeacherConfig(mind.id);
  if (!cfg) return mind;
  const voice = resolveTeacherVoice(cfg.id, cfg.defaultLocale);
  const names = getTeacherDisplayName(cfg.id);
  const lock = getTeacherPersonalityLock(cfg.id);
  const appearance = getTeacherAppearance(cfg.id);
  const warm = isWarmTeachingStyle(cfg);
  const out = structuredClone(mind);
  out.enabled = cfg.enabled;
  out.displayName = { en: names.en, ar: names.ar };
  out.identity = {
    ...out.identity,
    gender: cfg.gender,
    locale: cfg.defaultLocale,
    countryCode: appearance.countryCode,
    bioAr: `${lock.summary} · ${lock.traits.join("، ")}`,
  };
  out.voice = {
    ...out.voice,
    edgeTts: voice.voiceId,
    pitchBias: (voice.pitch - 1) * 0.8,
    energy: Math.min(1, Math.max(0.35, voice.speechRate * 0.55)),
  };
  out.teaching = {
    ...out.teaching,
    formality: warm ? "warm_casual" : "balanced",
    motivation: warm ? "encourage_often" : "challenge_forward",
    answerStyle: lock.answerStyle,
    boardWriting: lock.boardWriting,
    bodyLanguage: lock.bodyLanguage,
    defaultEmotion: lock.defaultEmotion,
    pace: lock.pace === "measured" ? "measured" : "brisk",
  };
  out.gestureBias = {
    ...out.gestureBias,
    preferOpenHands: cfg.naturalGestures && warm,
    pointSharpness: warm ? 0.55 : Math.max(out.gestureBias.pointSharpness, 1.1),
  };
  out.humanoidGlb = appearance.humanoidGlb;
  return out;
}

export function listDefaultTeacherProfiles(): TeacherMindProfile[] {
  return Object.values(DEFAULTS)
    .filter((p) => p.enabled !== false)
    .map((p) => applyConfigLayer(p));
}

export function getDefaultTeacherProfile(id: TeacherProfileId): TeacherMindProfile {
  const p = DEFAULTS[id] || DEFAULTS.sara;
  if (!p) throw new Error(`Default teacher profile missing: ${id}`);
  return applyConfigLayer(p);
}
