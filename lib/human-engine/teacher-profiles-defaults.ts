/**
 * Client-safe default Teacher Mind profiles (bundled JSON).
 * Identity / voice / enablement overlay from Configuration Layer
 * (src/ai-teacher/teachers/{sara,ali}.ts) — behaviour phrases stay in JSON.
 * Server overrides live in teacher-profile-store (.data/ + content/).
 */
import type { TeacherMindProfile, TeacherProfileId } from "@/types/teacher-mind";
import {
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
function applyConfigLayer(mind: TeacherMindProfile): TeacherMindProfile {
  const cfg = getTeacherConfig(mind.id);
  if (!cfg) return mind;
  const voice = resolveTeacherVoice(cfg.id);
  const warm = isWarmTeachingStyle(cfg);
  const out = structuredClone(mind);
  out.enabled = cfg.enabled;
  out.displayName = {
    en: cfg.fullName,
    ar: mind.id === "ali" ? "المعلم علي" : "المعلمة سارة",
  };
  out.identity = {
    ...out.identity,
    gender: cfg.gender,
    // Keep rich Arabic bio; append locked personality string from config
    bioAr: out.identity.bioAr.includes(cfg.personality)
      ? out.identity.bioAr
      : `${out.identity.bioAr} · ${cfg.personality}`,
  };
  out.voice = {
    ...out.voice,
    edgeTts: voice.voiceId,
    pitchBias: (voice.pitch - 1) * 0.8,
    energy: Math.min(1, Math.max(0.35, voice.speechRate * 0.55)),
  };
  // Teaching style hint from config without wiping mind teaching knobs
  if (warm) {
    out.teaching = {
      ...out.teaching,
      formality: "warm_casual",
      motivation: "encourage_often",
      bodyLanguage: "open_warm",
    };
    out.gestureBias = {
      ...out.gestureBias,
      preferOpenHands: cfg.naturalGestures,
    };
  } else {
    out.teaching = {
      ...out.teaching,
      formality: "balanced",
      motivation: "challenge_forward",
      answerStyle: "definition_then_example",
      bodyLanguage: "precise_point",
    };
    out.gestureBias = {
      ...out.gestureBias,
      preferOpenHands: false,
      pointSharpness: Math.max(out.gestureBias.pointSharpness, 1.1),
    };
  }
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
