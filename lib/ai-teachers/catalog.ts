/**
 * AI Teachers catalog — Sara & Ali only.
 */
import type { AiTeacherProfile, AiTeachersCatalog } from "@/types/ai-teachers";

function L(en: string, ar: string) {
  return { en, ar };
}

function assets(id: string, poses: AiTeacherProfile["assets"]["poses"]) {
  const root = `content/media/ai-teachers/${id}`;
  const publicRoot = `/media/ai-teachers/${id}`;
  return {
    root,
    publicRoot,
    portrait: `${publicRoot}/portrait.png`,
    poses: Object.fromEntries(
      Object.entries(poses).map(([k, v]) => [k, `${publicRoot}/poses/${v}`]),
    ) as AiTeacherProfile["assets"]["poses"],
  };
}

const UPDATED = "2026-08-01T11:30:00.000Z";

const POSE_PACK = {
  talk: "talk.png",
  point: "point.png",
  write: "write.png",
  idle: "idle.png",
} as const;

export function listAiTeachers(): AiTeacherProfile[] {
  return [
    {
      id: "sara",
      schema: "success-os.ai-teacher.v1",
      displayName: L("Teacher Sara", "المعلمة سارة"),
      gender: "female",
      countryCode: "JO",
      localeCodes: ["ar-JO", "en"],
      educationalStages: ["early_childhood", "elementary", "middle_school"],
      subjects: ["math", "science", "general"],
      personalityTone: L("Warm and encouraging", "دافئة ومشجّعة"),
      appearanceNotes: L(
        "Jordanian woman, olive blazer — photoreal AI teacher",
        "أردنية، بليزر زيتوني — معلمة مولَّدة بالذكاء الاصطناعي",
      ),
      voice: {
        edgeTts: "ar-JO-SanaNeural",
        heygenVoiceIdEnv: "HEYGEN_VOICE_ID_SARA",
        heygenAvatarIdEnv: "HEYGEN_AVATAR_ID_SARA",
      },
      assets: assets("sara", { ...POSE_PACK }),
      digitalHumanPresetKey: "dh.jo.sara",
      enabled: true,
      generatedBy: "cursor-image-gen",
      updatedAt: UPDATED,
    },
    {
      id: "ali",
      schema: "success-os.ai-teacher.v1",
      displayName: L("Teacher Ali", "المعلم علي"),
      gender: "male",
      countryCode: "JO",
      localeCodes: ["ar-JO", "en"],
      educationalStages: ["early_childhood", "elementary", "middle_school", "high_school"],
      subjects: ["math", "science", "physics", "general"],
      personalityTone: L("Clear and confident", "واضح وواثق"),
      appearanceNotes: L(
        "Jordanian man, navy blazer — photoreal AI teacher",
        "أردني، بليزر كحلي — معلم مولَّد بالذكاء الاصطناعي",
      ),
      voice: {
        edgeTts: "ar-JO-TaimNeural",
        heygenVoiceIdEnv: "HEYGEN_VOICE_ID_ALI",
        heygenAvatarIdEnv: "HEYGEN_AVATAR_ID_ALI",
      },
      assets: assets("ali", { ...POSE_PACK }),
      digitalHumanPresetKey: "dh.jo.ali",
      enabled: true,
      generatedBy: "cursor-image-gen",
      updatedAt: UPDATED,
    },
  ];
}

export function getAiTeacher(id: string): AiTeacherProfile | undefined {
  return listAiTeachers().find((t) => t.id === id && t.enabled);
}

export function teachersByGender(gender: "female" | "male"): AiTeacherProfile[] {
  return listAiTeachers().filter((t) => t.gender === gender && t.enabled);
}

export function buildAiTeachersCatalog(): AiTeachersCatalog {
  const teachers = listAiTeachers();
  return {
    schema: "success-os.ai-teachers.v1",
    version: "2.0.0",
    teachers,
    counts: {
      total: teachers.length,
      female: teachers.filter((t) => t.gender === "female").length,
      male: teachers.filter((t) => t.gender === "male").length,
    },
  };
}
