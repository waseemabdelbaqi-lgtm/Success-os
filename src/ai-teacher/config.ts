/**
 * Configuration Layer — single registry for Sara & Ali.
 * Human Engine and all sub-engines read teacher identity from here.
 * Behavioural detail (phrases, BT, remediation) stays in Teacher Mind JSON.
 */
import type { TeacherID, TeacherProfile } from "./core/TeacherProfile";
import { Sara } from "./teachers/sara";
import { Ali } from "./teachers/ali";

const REGISTRY: Record<TeacherID, TeacherProfile> = {
  sara: Sara,
  ali: Ali,
};

/** Platform voice defaults when config says AUTO. */
const AUTO_VOICE: Record<
  TeacherID,
  { provider: string; voiceId: string }
> = {
  sara: { provider: "edge-tts", voiceId: "ar-JO-SanaNeural" },
  ali: { provider: "edge-tts", voiceId: "ar-JO-TaimNeural" },
};

export type ResolvedTeacherVoice = {
  provider: string;
  voiceId: string;
  speechRate: number;
  pitch: number;
};

export function getTeacherConfig(id: string): TeacherProfile | undefined {
  if (id === "sara" || id === "ali") {
    return { ...REGISTRY[id] };
  }
  return undefined;
}

export function requireTeacherConfig(id: string): TeacherProfile {
  const cfg = getTeacherConfig(id);
  if (!cfg) {
    throw new Error(`Unknown platform teacher "${id}" — only sara|ali`);
  }
  return cfg;
}

export function listTeacherConfigs(): TeacherProfile[] {
  return (Object.keys(REGISTRY) as TeacherID[])
    .map((id) => ({ ...REGISTRY[id] }))
    .filter((t) => t.enabled);
}

export function resolveTeacherVoice(id: string): ResolvedTeacherVoice {
  const cfg = requireTeacherConfig(id === "ali" ? "ali" : "sara");
  const auto = AUTO_VOICE[cfg.id];
  return {
    provider:
      !cfg.voiceProvider || cfg.voiceProvider === "AUTO"
        ? auto.provider
        : cfg.voiceProvider,
    voiceId:
      !cfg.voiceID || cfg.voiceID === "AUTO" ? auto.voiceId : cfg.voiceID,
    speechRate: cfg.speechRate,
    pitch: cfg.pitch,
  };
}

export function isWarmTeachingStyle(cfg: TeacherProfile): boolean {
  const s = `${cfg.teachingStyle} ${cfg.personality}`.toLowerCase();
  return /interactive|visual|calm|patient|encourag|friendly|organized/.test(s);
}
