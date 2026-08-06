/**
 * Configuration Layer — single registry for Sara & Ali.
 * Sara.ts / Ali.ts are the ONLY personality & identity source.
 * Human Teacher Engine and all sub-engines read from here.
 */
import type {
  TeacherAppearance,
  TeacherDisplayName,
  TeacherID,
  TeacherLocaleVoice,
  TeacherPerformanceContract,
  TeacherPersonalityLock,
  TeacherProfile,
} from "./core/TeacherProfile";
import { Sara } from "./teachers/sara";
import { Ali } from "./teachers/ali";

const REGISTRY: Record<TeacherID, TeacherProfile> = {
  sara: Sara,
  ali: Ali,
};

export type ResolvedTeacherVoice = {
  provider: string;
  voiceId: string;
  speechRate: number;
  pitch: number;
  locale: string;
};

export function getTeacherConfig(id: string): TeacherProfile | undefined {
  if (id === "sara" || id === "ali") {
    return structuredClone(REGISTRY[id]);
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
    .map((id) => structuredClone(REGISTRY[id]))
    .filter((t) => t.enabled);
}

export function getTeacherDisplayName(id: string): TeacherDisplayName {
  const cfg = requireTeacherConfig(id === "ali" ? "ali" : "sara");
  return { ...cfg.displayName };
}

export function getTeacherPersonalityLock(id: string): TeacherPersonalityLock {
  return structuredClone(requireTeacherConfig(id === "ali" ? "ali" : "sara").personalityLock);
}

export function getTeacherAppearance(id: string): TeacherAppearance {
  return structuredClone(requireTeacherConfig(id === "ali" ? "ali" : "sara").appearance);
}

export function getTeacherPerformanceContract(id: string): TeacherPerformanceContract {
  return structuredClone(requireTeacherConfig(id === "ali" ? "ali" : "sara").performance);
}

/** Resolve neural voice for a teacher + locale/dialect (multilingual parity). */
export function resolveTeacherVoice(
  id: string,
  locale?: string | null,
): ResolvedTeacherVoice {
  const cfg = requireTeacherConfig(id === "ali" ? "ali" : "sara");
  const loc = (locale || cfg.defaultLocale || "ar-JO").trim();
  const fromMap: TeacherLocaleVoice | undefined =
    cfg.localeVoices[loc] ||
    cfg.localeVoices[loc.split("-")[0] || ""] ||
    cfg.localeVoices[cfg.defaultLocale];

  let provider = cfg.voiceProvider;
  let voiceId = cfg.voiceID;
  let resolvedLocale = cfg.defaultLocale;

  if (fromMap) {
    provider = fromMap.provider;
    voiceId = fromMap.voiceId;
    resolvedLocale = fromMap.locale;
  }

  // AUTO → default locale voice
  if (!provider || provider === "AUTO" || !voiceId || voiceId === "AUTO") {
    const fallback =
      cfg.localeVoices[cfg.defaultLocale] ||
      Object.values(cfg.localeVoices)[0];
    if (!fallback) {
      throw new Error(`Teacher ${cfg.id} missing localeVoices`);
    }
    provider = fallback.provider;
    voiceId = fallback.voiceId;
    resolvedLocale = fallback.locale;
  }

  return {
    provider,
    voiceId,
    speechRate: cfg.speechRate,
    pitch: cfg.pitch,
    locale: resolvedLocale,
  };
}

export function isWarmTeachingStyle(cfg: TeacherProfile): boolean {
  return cfg.personalityLock.tone === "warm";
}

/** Assert callers only ever use Sara/Ali — throws on any other id. */
export function assertPlatformTeacherId(id: string): TeacherID {
  if (id !== "sara" && id !== "ali") {
    throw new Error(`Only Sara and Ali are platform teachers — got "${id}"`);
  }
  return id;
}
