import type { LessonAnalysisInput, TeacherCast, TeacherCastId } from "@/types/digital-human-studio";
import {
  getTeacherAppearance,
  getTeacherDisplayName,
  getTeacherPersonalityLock,
  requireTeacherConfig,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";

function castFromConfig(id: "sara" | "ali"): TeacherCast {
  const cfg = requireTeacherConfig(id);
  const appearance = getTeacherAppearance(id);
  const names = getTeacherDisplayName(id);
  const lock = getTeacherPersonalityLock(id);
  const voice = resolveTeacherVoice(id, cfg.defaultLocale);
  return {
    id,
    displayNameAr: names.ar,
    displayNameEn: names.en,
    gender: cfg.gender,
    voiceId: voice.voiceId,
    digitalHumanPresetKey: appearance.digitalHumanPresetKey,
    assetRoot: appearance.assetRoot,
    style: lock.tone === "warm" ? "warm" : "crisp",
  };
}

/**
 * Auto-cast Sara or Ali from lesson signals.
 * Identity always from Configuration Layer — never hardcoded.
 */
export function castTeacher(input: LessonAnalysisInput): TeacherCast {
  if (input.preferredTeacherId) {
    const pref = String(input.preferredTeacherId).toLowerCase();
    if (pref === "sara" || pref === "ali") return castFromConfig(pref);
  }

  const grade = `${input.grade || ""} ${input.title}`.toLowerCase();
  const early = /kg|روضة|صف.?[١٢1-4]|grade\s*[1-4]|elementary|early/i.test(grade);
  const stemHeavy = /فيز|phys|كيم|chem|رياض|math|هندس|engine/i.test(
    `${input.subject || ""} ${input.title}`,
  );

  if (early && !stemHeavy) return castFromConfig("sara");
  if (stemHeavy) return castFromConfig("ali");

  const seed = [...input.lessonId].reduce((n, c) => n + c.charCodeAt(0), 0);
  return seed % 2 === 0 ? castFromConfig("sara") : castFromConfig("ali");
}

export function listCastableTeachers(): TeacherCast[] {
  return [castFromConfig("sara"), castFromConfig("ali")];
}

export type { TeacherCastId };
