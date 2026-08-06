/**
 * Localized Digital Teacher profiles — admin-configurable registry.
 * Seed examples are not hardcoded as the only platform teachers.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DigitalTeacherProfile } from "@/types/ai-digital-human-teacher";

function L(en: string, ar: string) {
  return { en, ar };
}

function rootDir() {
  return path.join(process.cwd(), "library", "ai-digital-human-teacher");
}

function profilesPath() {
  return path.join(rootDir(), "profiles.json");
}

function ensureDir() {
  fs.mkdirSync(rootDir(), { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

/** Example seeds for four regions — admins may edit/disable/add freely. */
export function exampleTeacherProfiles(): DigitalTeacherProfile[] {
  const at = nowIso();
  return [
    {
      id: "dtp_jo_elementary",
      schema: "success-os.digital-teacher-profile.v1",
      displayName: L("Jordan Elementary Teacher", "معلم أردني — ابتدائي"),
      countryCode: "JO",
      localeCodes: ["ar-JO", "en"],
      accentLabel: L("Jordanian Arabic accent", "لهجة عربية أردنية"),
      culturalStyleNotes: L(
        "Familiar Jordanian classroom warmth and formality balance",
        "دفء الصف الأردني المألوف وتوازن الرسمية",
      ),
      educationalStages: ["early_childhood", "elementary"],
      defaultTeachingStyle: "example_first",
      personalityTone: L("Warm and encouraging", "دافئ ومشجّع"),
      appearanceNotes: L(
        "Jordanian appearance preset (admin-selected asset keys)",
        "مظهر أردني عبر مفاتيح أصول يختارها المشرف",
      ),
      enabled: true,
      adminAssignable: true,
      providerHints: {
        ttsVoiceKey: "voice.jo.ar.warm",
        digitalHumanPresetKey: "dh.jo.elementary",
      },
      updatedAt: at,
    },
    {
      id: "dtp_eg_middle",
      schema: "success-os.digital-teacher-profile.v1",
      displayName: L("Egypt Middle School Teacher", "معلم مصري — إعدادي"),
      countryCode: "EG",
      localeCodes: ["ar-EG", "en"],
      accentLabel: L("Egyptian Arabic accent", "لهجة عربية مصرية"),
      culturalStyleNotes: L(
        "Egyptian conversational energy in explanations",
        "حيوية مصرية في أسلوب الشرح",
      ),
      educationalStages: ["middle_school"],
      defaultTeachingStyle: "socratic",
      personalityTone: L("Energetic and interactive", "نشيط وتفاعلي"),
      appearanceNotes: L(
        "Egyptian appearance preset (admin-selected)",
        "مظهر مصري عبر إعدادات المشرف",
      ),
      enabled: true,
      adminAssignable: true,
      providerHints: {
        ttsVoiceKey: "voice.eg.ar.energetic",
        digitalHumanPresetKey: "dh.eg.middle",
      },
      updatedAt: at,
    },
    {
      id: "dtp_us_high",
      schema: "success-os.digital-teacher-profile.v1",
      displayName: L("USA High School Teacher", "معلم أمريكي — ثانوي"),
      countryCode: "US",
      localeCodes: ["en-US"],
      accentLabel: L("American English accent", "لهجة إنجليزية أمريكية"),
      culturalStyleNotes: L(
        "US classroom rigor with clear stepwise scaffolding",
        "صرامة الصف الأمريكي مع سقالات واضحة",
      ),
      educationalStages: ["high_school"],
      defaultTeachingStyle: "step_by_step",
      personalityTone: L("Academically rigorous", "صارم أكاديميًا"),
      appearanceNotes: L(
        "American appearance preset (admin-selected)",
        "مظهر أمريكي عبر إعدادات المشرف",
      ),
      enabled: true,
      adminAssignable: true,
      providerHints: {
        ttsVoiceKey: "voice.us.en.rigorous",
        digitalHumanPresetKey: "dh.us.high",
      },
      updatedAt: at,
    },
    {
      id: "dtp_jp_university",
      schema: "success-os.digital-teacher-profile.v1",
      displayName: L("Japan University Lecturer", "محاضر ياباني — جامعي"),
      countryCode: "JP",
      localeCodes: ["ja-JP", "en"],
      accentLabel: L("Japanese accent", "لهجة يابانية"),
      culturalStyleNotes: L(
        "Respectful professional lecturer style",
        "أسلوب محاضر مهني محترم",
      ),
      educationalStages: ["university"],
      defaultTeachingStyle: "direct",
      personalityTone: L("Professional lecturer", "محاضر مهني"),
      appearanceNotes: L(
        "Japanese appearance preset (admin-selected)",
        "مظهر ياباني عبر إعدادات المشرف",
      ),
      enabled: true,
      adminAssignable: true,
      providerHints: {
        ttsVoiceKey: "voice.jp.ja.professional",
        digitalHumanPresetKey: "dh.jp.university",
      },
      updatedAt: at,
    },
  ];
}

function readStore(): DigitalTeacherProfile[] {
  ensureDir();
  try {
    const raw = JSON.parse(fs.readFileSync(profilesPath(), "utf8")) as {
      profiles?: DigitalTeacherProfile[];
    };
    if (Array.isArray(raw.profiles) && raw.profiles.length > 0) {
      return raw.profiles;
    }
  } catch {
    // seed below
  }
  const seeded = exampleTeacherProfiles();
  writeStore(seeded);
  return seeded;
}

function writeStore(profiles: DigitalTeacherProfile[]) {
  ensureDir();
  fs.writeFileSync(
    profilesPath(),
    `${JSON.stringify({ schema: "success-os.digital-teacher-profiles.v1", profiles, updatedAt: nowIso() }, null, 2)}\n`,
    "utf8",
  );
}

export function listTeacherProfiles(): DigitalTeacherProfile[] {
  return readStore().map((p) => ({
    ...p,
    localeCodes: [...p.localeCodes],
    educationalStages: [...p.educationalStages],
    displayName: { ...p.displayName },
    accentLabel: { ...p.accentLabel },
    culturalStyleNotes: { ...p.culturalStyleNotes },
    personalityTone: { ...p.personalityTone },
    appearanceNotes: { ...p.appearanceNotes },
    providerHints: { ...p.providerHints },
  }));
}

export function getTeacherProfile(id: string): DigitalTeacherProfile | null {
  return listTeacherProfiles().find((p) => p.id === id) || null;
}

export function upsertTeacherProfile(
  input: Partial<DigitalTeacherProfile> & {
    displayName: DigitalTeacherProfile["displayName"];
    countryCode: string;
  },
): DigitalTeacherProfile {
  const all = readStore();
  const id = input.id || `dtp_${randomUUID().slice(0, 8)}`;
  const existing = all.find((p) => p.id === id);
  const next: DigitalTeacherProfile = {
    id,
    schema: "success-os.digital-teacher-profile.v1",
    displayName: input.displayName,
    countryCode: input.countryCode,
    localeCodes: input.localeCodes || existing?.localeCodes || ["en"],
    accentLabel:
      input.accentLabel ||
      existing?.accentLabel ||
      L("Configurable accent", "لهجة قابلة للضبط"),
    culturalStyleNotes:
      input.culturalStyleNotes ||
      existing?.culturalStyleNotes ||
      L("Admin-defined cultural style", "أسلوب ثقافي يحدده المشرف"),
    educationalStages:
      input.educationalStages || existing?.educationalStages || ["elementary"],
    defaultTeachingStyle:
      input.defaultTeachingStyle ||
      existing?.defaultTeachingStyle ||
      "step_by_step",
    personalityTone:
      input.personalityTone ||
      existing?.personalityTone ||
      L("Configurable", "قابل للضبط"),
    appearanceNotes:
      input.appearanceNotes ||
      existing?.appearanceNotes ||
      L("Admin-selected appearance preset", "مظهر يختاره المشرف"),
    enabled: input.enabled ?? existing?.enabled ?? true,
    adminAssignable: true,
    providerHints: {
      ...(existing?.providerHints || {}),
      ...(input.providerHints || {}),
    },
    updatedAt: nowIso(),
  };
  const others = all.filter((p) => p.id !== id);
  writeStore([...others, next]);
  return next;
}

export function assignTeacherForContext(opts: {
  countryCode?: string;
  educationalStage?: string;
  profileId?: string;
}): DigitalTeacherProfile | null {
  const all = listTeacherProfiles().filter((p) => p.enabled);
  if (opts.profileId) {
    return all.find((p) => p.id === opts.profileId) || null;
  }
  if (opts.countryCode && opts.educationalStage) {
    const hit = all.find(
      (p) =>
        p.countryCode === opts.countryCode &&
        p.educationalStages.includes(
          opts.educationalStage as DigitalTeacherProfile["educationalStages"][number],
        ),
    );
    if (hit) return hit;
  }
  if (opts.countryCode) {
    return all.find((p) => p.countryCode === opts.countryCode) || null;
  }
  return null;
}

export function resetTeacherProfilesForTests() {
  const dir = rootDir();
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  ensureDir();
  writeStore(exampleTeacherProfiles());
}
