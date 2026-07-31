/**
 * Digital Human Teacher session planner — grounded by ATE.
 */
import { createHash } from "node:crypto";
import type {
  AiDigitalHumanTeacherSnapshot,
  DigitalTeacherSessionPlan,
  EducationalStage,
} from "@/types/ai-digital-human-teacher";
import { getDigitalHumanPresenceContract } from "./presence";
import { listProviderBindings } from "./providers";
import { STAGE_TEACHING_DEFAULTS } from "./stages";
import { assignTeacherForContext, listTeacherProfiles } from "./profiles";
import { getPersonalityMemory } from "./personality";
import { logger } from "@/lib/logger";

export type PlanDigitalTeacherSessionInput = {
  studentId: string;
  studentName?: string;
  countryCode?: string;
  educationalStage?: EducationalStage;
  teacherProfileId?: string;
  language?: string;
};

function sessionIdFor(studentId: string, profileId: string | null) {
  return `adht_${createHash("sha256")
    .update(`${studentId}|${profileId || ""}|${Date.now().toString().slice(0, 8)}`)
    .digest("hex")
    .slice(0, 16)}`;
}

export function planDigitalTeacherSession(
  input: PlanDigitalTeacherSessionInput,
): DigitalTeacherSessionPlan {
  const profile = assignTeacherForContext({
    countryCode: input.countryCode,
    educationalStage: input.educationalStage,
    profileId: input.teacherProfileId,
  });

  const personality = getPersonalityMemory(input.studentId, {
    studentName: input.studentName,
    assignedTeacherProfileId: profile?.id || null,
  });
  if (input.language) {
    personality.preferredLanguage = input.language;
  }

  const plan: DigitalTeacherSessionPlan = {
    schema: "success-os.adht-session-plan.v1",
    sessionId: sessionIdFor(input.studentId, profile?.id || null),
    studentId: input.studentId,
    teacherProfileId: profile?.id || null,
    educationalStage: input.educationalStage || null,
    presence: getDigitalHumanPresenceContract(),
    providers: listProviderBindings(),
    personality,
    groundedByAte: true,
    inventsCurriculumFacts: false,
    liveProvidersEnabled: false,
    notes: [
      "Digital Human Teacher session plan — architecture only.",
      "Pedagogy and grounding remain in AI Teacher Engine (ATE).",
      "No live avatar video, TTS, or STT SDK calls executed.",
      profile
        ? `Assigned profile ${profile.id} (${profile.countryCode}).`
        : "No teacher profile assigned — admin must configure assignment.",
    ],
  };

  logger.info("ADHT session planned", {
    sessionId: plan.sessionId,
    studentId: plan.studentId,
    teacherProfileId: plan.teacherProfileId,
    liveProvidersEnabled: false,
  });

  return plan;
}

export function getAiDigitalHumanTeacherSnapshot(): AiDigitalHumanTeacherSnapshot {
  const profiles = listTeacherProfiles();
  const providers = listProviderBindings();
  const presence = getDigitalHumanPresenceContract();
  return {
    schema: "success-os.ai-digital-human-teacher.v1",
    role: "digital_human_teacher_architecture",
    notAChatbot: true,
    presence,
    stages: STAGE_TEACHING_DEFAULTS.map((s) => ({
      ...s,
      notes: [...s.notes],
      name: { ...s.name },
      tone: { ...s.tone },
    })),
    profiles,
    providers,
    counts: {
      profiles: profiles.length,
      enabledProfiles: profiles.filter((p) => p.enabled).length,
      stages: STAGE_TEACHING_DEFAULTS.length,
      providerPorts: providers.length,
      configuredProviders: providers.filter((p) => p.configured).length,
    },
    safety: {
      neverInventCurriculumFacts: true,
      groundInVerifiedCurriculum: true,
      groundInKnowledgeGraph: true,
      groundInDigitalBooks: true,
      groundInPlatformResources: true,
      stateUncertaintyWhenUnsure: true,
    },
    outOfScopeNow: [
      "Live Tavus/HeyGen avatar video streaming",
      "Live ElevenLabs / Azure / Google speech SDKs",
      "Live OpenAI / Gemini API tutoring without grounding",
      "AR/VR and virtual laboratories",
    ],
    rules: [
      "Student must feel a real teacher — never a free-form chatbot.",
      "ATE remains the pedagogical and grounding engine.",
      "Teacher profiles are admin-configurable per country and stage.",
      "Provider ports are replaceable without redesigning Success OS.",
      "If uncertain, state uncertainty — never invent curriculum facts.",
      "ILE remains the sole lesson runtime (ADR-0049).",
    ],
    notes: [
      "World-class Digital Human Teacher architecture under PR #55 ATE.",
      "Live provider activation reserved for Media / Learning Intelligence waves.",
    ],
  };
}

export function runAiDigitalHumanTeacherDemo(opts?: {
  studentId?: string;
  studentName?: string;
  countryCode?: string;
  educationalStage?: EducationalStage;
}) {
  const snapshot = getAiDigitalHumanTeacherSnapshot();
  const plan = planDigitalTeacherSession({
    studentId: opts?.studentId || "student_demo_001",
    studentName: opts?.studentName || "Ahmad",
    countryCode: opts?.countryCode || "JO",
    educationalStage: opts?.educationalStage || "elementary",
    language: "ar",
  });

  const ok =
    snapshot.presence.shipsLiveAvatarVideo === false &&
    snapshot.presence.shipsLiveTtsStt === false &&
    plan.liveProvidersEnabled === false &&
    plan.inventsCurriculumFacts === false &&
    plan.groundedByAte === true &&
    snapshot.profiles.length >= 4 &&
    snapshot.providers.length >= 8 &&
    snapshot.stages.length === 5 &&
    plan.teacherProfileId != null;

  return { ok, snapshot, plan, liveProviders: false as const };
}
