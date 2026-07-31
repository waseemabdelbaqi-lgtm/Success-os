/**
 * Digital Teacher personality memory — extends ATE student memory.
 */
import type { DigitalTeacherPersonalityMemory } from "@/types/ai-digital-human-teacher";
import {
  getOrCreateStudentMemory,
  upsertStudentMemory,
} from "@/lib/ai-teacher-engine/memory";

function nowIso() {
  return new Date().toISOString();
}

export function getPersonalityMemory(
  studentId: string,
  opts?: {
    studentName?: string;
    assignedTeacherProfileId?: string | null;
  },
): DigitalTeacherPersonalityMemory {
  const memory = getOrCreateStudentMemory(studentId, {
    studentName: opts?.studentName,
  });
  const confidence =
    memory.affectLast === "confident"
      ? "high"
      : memory.affectLast === "frustrated" || memory.affectLast === "confused"
        ? "low"
        : memory.affectLast === "engaged"
          ? "medium"
          : "medium";

  return {
    schema: "success-os.adht-personality.v1",
    studentId,
    studentName: memory.studentName,
    preferredLanguage: memory.preferredLanguage,
    learningStyle: memory.learningStyle,
    weakSkillIds: [...memory.weakSkillIds],
    strongSkillIds: [...memory.strongSkillIds],
    learningGoals: [...memory.learningGoals],
    preferredTeachingSpeed: memory.learningPace,
    preferredExamples: [],
    favoriteSubjectIds: [...memory.subjectIds],
    confidenceLevel: confidence,
    previousConversationSessionIds: memory.conversationHistory
      .filter((t) => t.role === "student")
      .map((t) => t.id)
      .slice(-20),
    assignedTeacherProfileId: opts?.assignedTeacherProfileId ?? null,
    updatedAt: nowIso(),
  };
}

export function updatePersonalityMemory(input: {
  studentId: string;
  studentName?: string;
  preferredLanguage?: string;
  preferredTeachingSpeed?: "slow" | "normal" | "fast";
  learningStyle?: DigitalTeacherPersonalityMemory["learningStyle"];
  preferredExamples?: string[];
  favoriteSubjectIds?: string[];
  learningGoals?: string[];
  weakSkillIds?: string[];
  strongSkillIds?: string[];
}): DigitalTeacherPersonalityMemory {
  upsertStudentMemory({
    studentId: input.studentId,
    studentName: input.studentName,
    preferredLanguage: input.preferredLanguage,
    learningPace: input.preferredTeachingSpeed,
    learningStyle: input.learningStyle,
    learningGoals: input.learningGoals,
    weakSkillIds: input.weakSkillIds,
    strongSkillIds: input.strongSkillIds,
    subjectIds: input.favoriteSubjectIds,
  });
  const personality = getPersonalityMemory(input.studentId, {
    studentName: input.studentName,
  });
  if (input.preferredExamples) {
    personality.preferredExamples = [...input.preferredExamples];
  }
  return personality;
}
