/**
 * AI Teachers catalog — Sara & Ali only (official platform faces).
 * Doctrine: docs/cursor/platform-teachers-doctrine.md
 */
import type { AiTeacherProfile, AiTeachersCatalog } from "@/types/ai-teachers";
import {
  PLATFORM_TEACHER_IDS,
  PLATFORM_TEACHERS_DOCTRINE,
} from "@/types/platform-teachers";

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

const UPDATED = "2026-08-03T20:00:00.000Z";

/** Illustrative tags only — any future subject still casts Sara/Ali. */
const ANY_PLATFORM_SUBJECTS: AiTeacherProfile["subjects"] = [
  "math",
  "science",
  "physics",
  "chemistry",
  "biology",
  "arabic",
  "english",
  "islamic",
  "social",
  "general",
];

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
      role: "platform_official_primary",
      displayName: L("Teacher Sara", "المعلمة سارة"),
      gender: "female",
      countryCode: "JO",
      localeCodes: ["ar-JO", "en"],
      educationalStages: [
        "early_childhood",
        "elementary",
        "middle_school",
        "high_school",
      ],
      subjects: [...ANY_PLATFORM_SUBJECTS],
      personalityTone: L(
        "World-class platform teacher — calm, encouraging, organized, gradual; Sara stays Sara across every subject and language",
        "معلمة المنصة العالمية — هادئة مشجعة منظمة بالتدرج؛ سارة تبقى سارة في كل مادة وكل لغة",
      ),
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
      role: "platform_official_primary",
      displayName: L("Teacher Ali", "المعلم علي"),
      gender: "male",
      countryCode: "JO",
      localeCodes: ["ar-JO", "en"],
      educationalStages: [
        "early_childhood",
        "elementary",
        "middle_school",
        "high_school",
      ],
      subjects: [...ANY_PLATFORM_SUBJECTS],
      personalityTone: L(
        "World-class platform teacher — direct, practical, analytical problem-solving; Ali stays Ali across every subject and language",
        "معلم المنصة العالمي — مباشر عملي تحليلي لحل المشكلات؛ علي يبقى علياً في كل مادة وكل لغة",
      ),
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
  const ids = teachers.map((t) => t.id).slice().sort();
  if (
    teachers.length !== PLATFORM_TEACHER_IDS.length ||
    ids.join(",") !== [...PLATFORM_TEACHER_IDS].sort().join(",")
  ) {
    throw new Error(
      `Catalog must be exactly ${PLATFORM_TEACHER_IDS.join("+")} (${PLATFORM_TEACHERS_DOCTRINE.doctrineDoc})`,
    );
  }
  for (const t of teachers) {
    if (t.role !== "platform_official_primary") {
      throw new Error(`Teacher ${t.id} must be platform_official_primary`);
    }
  }
  return {
    schema: "success-os.ai-teachers.v1",
    version: "3.0.0",
    teachers,
    counts: {
      total: teachers.length,
      female: teachers.filter((t) => t.gender === "female").length,
      male: teachers.filter((t) => t.gender === "male").length,
    },
  };
}
