/**
 * Client-safe default Teacher Mind profiles (bundled JSON).
 * Server overrides live in teacher-profile-store (.data/ + content/).
 */
import type { TeacherMindProfile, TeacherProfileId } from "@/types/teacher-mind";
import sara from "../../content/ai-teachers/profiles/sara.json";
import ali from "../../content/ai-teachers/profiles/ali.json";

const DEFAULTS: Record<string, TeacherMindProfile> = {
  sara: sara as TeacherMindProfile,
  ali: ali as TeacherMindProfile,
};

export function listDefaultTeacherProfiles(): TeacherMindProfile[] {
  return Object.values(DEFAULTS).filter((p) => p.enabled !== false);
}

export function getDefaultTeacherProfile(id: TeacherProfileId): TeacherMindProfile {
  const p = DEFAULTS[id] || DEFAULTS.sara;
  if (!p) throw new Error(`Default teacher profile missing: ${id}`);
  return structuredClone(p);
}
