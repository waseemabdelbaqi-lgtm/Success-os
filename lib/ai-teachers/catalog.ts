/**
 * Professional AI Teachers catalog — generated identities for lessons & HeyGen.
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

const UPDATED = "2026-08-01T09:00:00.000Z";

export function listAiTeachers(): AiTeacherProfile[] {
  return [
    {
      id: "sara",
      schema: "success-os.ai-teacher.v1",
      displayName: L("Teacher Sara", "المعلمة سارة"),
      gender: "female",
      countryCode: "JO",
      localeCodes: ["ar-JO", "en"],
      educationalStages: ["early_childhood", "elementary"],
      subjects: ["math", "general"],
      personalityTone: L("Warm and encouraging", "دافئة ومشجّعة"),
      appearanceNotes: L(
        "Jordanian woman, olive blazer, neat bun — photoreal AI portrait",
        "أردنية، بليزر زيتوني، شعر مربوط — صورة مولّدة بالذكاء الاصطناعي",
      ),
      voice: {
        edgeTts: "ar-JO-SanaNeural",
        heygenVoiceIdEnv: "HEYGEN_VOICE_ID_SARA",
        heygenAvatarIdEnv: "HEYGEN_AVATAR_ID_SARA",
      },
      assets: assets("sara", { talk: "talk.png" }),
      digitalHumanPresetKey: "dh.jo.elementary.sara",
      enabled: true,
      generatedBy: "cursor-image-gen",
      updatedAt: UPDATED,
    },
    {
      id: "omar",
      schema: "success-os.ai-teacher.v1",
      displayName: L("Teacher Omar", "المعلم عمر"),
      gender: "male",
      countryCode: "JO",
      localeCodes: ["ar-JO", "en"],
      educationalStages: ["early_childhood", "elementary"],
      subjects: ["math", "general"],
      personalityTone: L("Friendly and clear", "ودود وواضح"),
      appearanceNotes: L(
        "Jordanian man, navy blazer, neat beard — photoreal AI portrait",
        "أردني، بليزر كحلي، لحية مرتبة — صورة مولّدة بالذكاء الاصطناعي",
      ),
      voice: {
        edgeTts: "ar-JO-TaimNeural",
        heygenVoiceIdEnv: "HEYGEN_VOICE_ID_OMAR",
        heygenAvatarIdEnv: "HEYGEN_AVATAR_ID_OMAR",
      },
      assets: assets("omar", { talk: "talk.png" }),
      digitalHumanPresetKey: "dh.jo.elementary.omar",
      enabled: true,
      generatedBy: "cursor-image-gen",
      updatedAt: UPDATED,
    },
    {
      id: "layla",
      schema: "success-os.ai-teacher.v1",
      displayName: L("Teacher Layla", "المعلمة ليلى"),
      gender: "female",
      countryCode: "JO",
      localeCodes: ["ar-JO", "en"],
      educationalStages: ["middle_school", "high_school"],
      subjects: ["science", "general"],
      personalityTone: L("Curious and confident", "فضولية وواثقة"),
      appearanceNotes: L(
        "Science educator, teal cardigan — photoreal AI portrait",
        "معلمة علوم، كارديغان فيروزي — صورة مولّدة بالذكاء الاصطناعي",
      ),
      voice: {
        edgeTts: "ar-JO-SanaNeural",
        heygenVoiceIdEnv: "HEYGEN_VOICE_ID_LAYLA",
        heygenAvatarIdEnv: "HEYGEN_AVATAR_ID_LAYLA",
      },
      assets: assets("layla", { point: "point.png" }),
      digitalHumanPresetKey: "dh.jo.science.layla",
      enabled: true,
      generatedBy: "cursor-image-gen",
      updatedAt: UPDATED,
    },
    {
      id: "waseem",
      schema: "success-os.ai-teacher.v1",
      displayName: L("Teacher Waseem", "الأستاذ وسيم"),
      gender: "male",
      countryCode: "JO",
      localeCodes: ["ar-JO", "en"],
      educationalStages: ["high_school", "university"],
      subjects: ["physics", "science"],
      personalityTone: L("Calm and precise", "هادئ ودقيق"),
      appearanceNotes: L(
        "Physics academy presenter, charcoal blazer — photoreal AI portrait",
        "مقدّم فيزياء أكاديمي، بليزر فحمي — صورة مولّدة بالذكاء الاصطناعي",
      ),
      voice: {
        edgeTts: "ar-JO-TaimNeural",
        heygenVoiceIdEnv: "HEYGEN_VOICE_ID",
        heygenAvatarIdEnv: "HEYGEN_AVATAR_ID",
      },
      assets: assets("waseem", { write: "write.png" }),
      digitalHumanPresetKey: "dh.jo.physics.waseem",
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
    version: "1.0.0",
    teachers,
    counts: {
      total: teachers.length,
      female: teachers.filter((t) => t.gender === "female").length,
      male: teachers.filter((t) => t.gender === "male").length,
    },
  };
}
