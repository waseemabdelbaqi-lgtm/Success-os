/**
 * Core teacher profiles API — reads Configuration Layer (src/ai-teacher).
 * Does not duplicate Sara/Ali identity; engines call getCoreTeacherProfile().
 */
import type {
  AiTeacherProfileCatalog,
  TeacherProfile,
} from "@/types/ai-teacher-profile";
import {
  getTeacherConfig,
  listTeacherConfigs,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";

export function getCoreTeacherProfile(id: string): TeacherProfile | undefined {
  const cfg = getTeacherConfig(id);
  if (!cfg) return undefined;
  const voice = resolveTeacherVoice(cfg.id);
  // Return config with AUTO voice fields resolved for engine consumers
  return {
    ...cfg,
    voiceProvider: voice.provider,
    voiceID: voice.voiceId,
    speechRate: voice.speechRate,
    pitch: voice.pitch,
  };
}

export function listCoreTeacherProfiles(): TeacherProfile[] {
  return listTeacherConfigs().map((cfg) => getCoreTeacherProfile(cfg.id)!);
}

export function buildCoreTeacherCatalog(): AiTeacherProfileCatalog {
  const teachers = listCoreTeacherProfiles();
  if (teachers.length !== 2) {
    throw new Error("Core catalog must contain exactly Sara and Ali");
  }
  return {
    schema: "success-os.ai-teacher-profile.v1",
    version: "1.1.0",
    doctrine: "docs/cursor/platform-teachers-doctrine.md",
    teachers,
  };
}
