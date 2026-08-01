import type { LessonAnalysisInput, TeacherCast, TeacherCastId } from "@/types/digital-human-studio";
import { getAiTeacher, listAiTeachers } from "@/lib/ai-teachers/catalog";

const CASTS: Record<"sara" | "ali", TeacherCast> = {
  sara: {
    id: "sara",
    displayNameAr: "المعلمة سارة",
    displayNameEn: "Teacher Sara",
    gender: "female",
    voiceId: "ar-JO-SanaNeural",
    digitalHumanPresetKey: "dh.jo.sara",
    assetRoot: "/media/ai-teachers/sara",
    style: "warm",
  },
  ali: {
    id: "ali",
    displayNameAr: "المعلم علي",
    displayNameEn: "Teacher Ali",
    gender: "male",
    voiceId: "ar-JO-TaimNeural",
    digitalHumanPresetKey: "dh.jo.ali",
    assetRoot: "/media/ai-teachers/ali",
    style: "crisp",
  },
};

/**
 * Auto-cast Sara or Ali from lesson signals.
 * Extensible: new teachers register in catalog + CASTS map.
 */
export function castTeacher(input: LessonAnalysisInput): TeacherCast {
  if (input.preferredTeacherId) {
    const pref = String(input.preferredTeacherId).toLowerCase();
    if (pref === "sara" || pref === "ali") return CASTS[pref];
    const fromCatalog = getAiTeacher(pref);
    if (fromCatalog) {
      return {
        id: fromCatalog.id as TeacherCastId,
        displayNameAr: fromCatalog.displayName.ar,
        displayNameEn: fromCatalog.displayName.en,
        gender: fromCatalog.gender,
        voiceId: fromCatalog.voice.edgeTts,
        digitalHumanPresetKey: fromCatalog.digitalHumanPresetKey,
        assetRoot: fromCatalog.assets.publicRoot,
        style: fromCatalog.gender === "female" ? "warm" : "crisp",
      };
    }
  }

  const grade = `${input.grade || ""} ${input.title}`.toLowerCase();
  const early = /kg|روضة|صف.?[١٢1-4]|grade\s*[1-4]|elementary|early/i.test(grade);
  const stemHeavy = /فيز|phys|كيم|chem|رياض|math|هندس|engine/i.test(
    `${input.subject || ""} ${input.title}`,
  );

  // Warm Sara for early grades; crisp Ali for STEM / older — still overridable.
  if (early && !stemHeavy) return CASTS.sara;
  if (stemHeavy) return CASTS.ali;

  // Stable hash fallback so same lesson keeps same teacher.
  const seed = [...input.lessonId].reduce((n, c) => n + c.charCodeAt(0), 0);
  return seed % 2 === 0 ? CASTS.sara : CASTS.ali;
}

export function listCastableTeachers(): TeacherCast[] {
  return listAiTeachers()
    .filter((t) => t.id === "sara" || t.id === "ali")
    .map((t) => CASTS[t.id as "sara" | "ali"]);
}
