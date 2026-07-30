/**
 * Continuous teacher understanding — what / why / prerequisites.
 */
import { randomUUID } from "node:crypto";
import type {
  ConfusionEvent,
  EicInteractionInput,
  LearningDna,
  TeacherUnderstanding,
} from "@/types/education-intelligence-core";
import { level } from "./dna-store";

function L(en: string, ar: string) {
  return { en, ar };
}

const GUESSING_PATTERNS =
  /\b(guess|maybe|idk|i don't know|not sure|ربما|ممكن|ما بعرف|لا أعرف)\b/i;
const UNDERSTAND_PATTERNS =
  /\b(i (got it|understand)|makes sense|clear now|فهمت|واضح|تمام)\b/i;
const HARDER_PATTERNS =
  /\b(harder|too easy|challenge|أصعب|سهل جد)/i;

export function analyzeTeacherUnderstanding(
  dna: LearningDna,
  input: EicInteractionInput,
): TeacherUnderstanding {
  const utterance = (input.utterance || "").trim();
  const intent = input.intent || "unknown";
  const affect = input.affect || "neutral";
  const confused =
    intent === "dont_understand" ||
    intent === "explain_again" ||
    intent === "explain_differently" ||
    affect === "confused" ||
    affect === "frustrated";

  const isGuessing = GUESSING_PATTERNS.test(utterance);
  const trulyUnderstands =
    UNDERSTAND_PATTERNS.test(utterance) ||
    (affect === "confident" && !confused);

  const concept =
    input.focusConceptLabel ||
    (input.focusLessonId
      ? L(`Lesson ${input.focusLessonId}`, `الدرس ${input.focusLessonId}`)
      : null);

  const whyConfused = confused
    ? L(
        input.prerequisiteSkillId
          ? "A missing prerequisite skill is blocking this concept."
          : "The current explanation style or pace did not land; a different strategy is needed.",
        input.prerequisiteSkillId
          ? "مهارة متطلب سابقة مفقودة تعيق هذا المفهوم."
          : "أسلوب الشرح أو الوتيرة الحالية لم ينجح؛ نحتاج استراتيجية مختلفة.",
      )
    : null;

  const alreadyKnows = [...dna.strongSkillIds];
  const doesNotKnow = [
    ...new Set([...(input.weakSkillIds || dna.weakSkillIds), ...dna.weakSkillIds]),
  ];

  return {
    schema: "success-os.eic-teacher-understanding.v1",
    alreadyKnows,
    doesNotKnow,
    whyConfused,
    conceptCausingConfusion: confused ? concept : null,
    missingPrerequisiteSkillId: input.prerequisiteSkillId || dna.weakSkillIds[0] || null,
    howMuchRemembers: dna.memoryStrength,
    howFastLearns: dna.learningVelocity,
    bestExplanationStyle: dna.preferredTeacherStyle,
    repeatedMistakes: [...dna.repeatedMistakeCodes],
    isGuessing,
    trulyUnderstands,
  };
}

export function appendConfusionIfNeeded(
  dna: LearningDna,
  input: EicInteractionInput,
  understanding: TeacherUnderstanding,
): LearningDna {
  if (!understanding.whyConfused) return dna;
  const event: ConfusionEvent = {
    id: randomUUID(),
    at: new Date().toISOString(),
    conceptId: input.focusLessonId || null,
    conceptLabel:
      understanding.conceptCausingConfusion ||
      L("Current concept", "المفهوم الحالي"),
    prerequisiteSkillId: understanding.missingPrerequisiteSkillId,
    utterance: input.utterance || "",
    intent: input.intent || "unknown",
    affect: input.affect || "neutral",
    whyConfused: understanding.whyConfused,
  };
  const confusionLog = [...dna.confusionLog, event].slice(-100);
  const code = `${event.conceptId || "concept"}::${event.prerequisiteSkillId || "none"}`;
  const repeated = [...dna.repeatedMistakeCodes];
  if (repeated.includes(code)) {
    // already tracked
  } else if (
    confusionLog.filter(
      (c) =>
        (c.conceptId || "") === (event.conceptId || "") &&
        (c.prerequisiteSkillId || "") === (event.prerequisiteSkillId || ""),
    ).length >= 2
  ) {
    repeated.push(code);
  }
  return {
    ...dna,
    confusionLog,
    repeatedMistakeCodes: repeated.slice(-50),
  };
}

export function detectAdvancedPush(utterance: string): boolean {
  return HARDER_PATTERNS.test(utterance);
}

export function bumpScoresAfterInteraction(
  dna: LearningDna,
  understanding: TeacherUnderstanding,
  input: EicInteractionInput,
): LearningDna {
  let knowledge = dna.knowledgeLevel.score;
  let understandingScore = dna.understandingLevel.score;
  let confidence = dna.confidenceLevel.score;
  let attention = dna.attentionLevel.score;
  let memory = dna.memoryStrength.score;
  let critical = dna.criticalThinking.score;
  let problem = dna.problemSolving.score;
  let listening = dna.listeningAbility.score;
  let speaking = dna.speakingAbility.score;
  let writing = dna.writingAbility.score;
  let reading = dna.readingSpeed.score;

  if (understanding.trulyUnderstands) {
    understandingScore += 4;
    confidence += 3;
    memory += 2;
    knowledge += 2;
  }
  if (understanding.whyConfused) {
    understandingScore -= 3;
    confidence -= 2;
    attention += 1; // engaged struggle
  }
  if (understanding.isGuessing) {
    confidence -= 4;
    critical -= 1;
  }
  if (input.intent === "harder_question" || detectAdvancedPush(input.utterance || "")) {
    problem += 2;
    critical += 2;
    confidence += 1;
  }
  if (input.intent === "summarize") {
    reading += 1;
    writing += 1;
  }
  if (input.intent === "test_me") {
    problem += 2;
  }
  if (input.affect === "engaged") attention += 3;
  if (input.affect === "disengaged") attention -= 4;
  if (input.affect === "frustrated") {
    confidence -= 3;
    attention -= 1;
  }

  const guessingSignals =
    dna.guessingSignals + (understanding.isGuessing ? 1 : 0);
  const trueUnderstandingSignals =
    dna.trueUnderstandingSignals + (understanding.trulyUnderstands ? 1 : 0);

  let velocity = dna.learningVelocity;
  if (input.intent === "teach_faster") velocity = "fast";
  if (input.intent === "teach_slowly") velocity = "slow";

  return {
    ...dna,
    knowledgeLevel: level(knowledge),
    understandingLevel: level(understandingScore),
    confidenceLevel: level(confidence),
    attentionLevel: level(attention),
    memoryStrength: level(memory),
    criticalThinking: level(critical),
    problemSolving: level(problem),
    readingSpeed: level(reading),
    listeningAbility: level(listening),
    speakingAbility: level(speaking),
    writingAbility: level(writing),
    guessingSignals,
    trueUnderstandingSignals,
    learningVelocity: velocity,
    weakSkillIds: [
      ...new Set([...(input.weakSkillIds || []), ...dna.weakSkillIds]),
    ].slice(0, 50),
    strongSkillIds: [
      ...new Set([...(input.strongSkillIds || []), ...dna.strongSkillIds]),
    ].slice(0, 50),
    preferredLanguage: input.language || dna.preferredLanguage,
    preferredLearningStyle:
      input.preferredLearningStyle || dna.preferredLearningStyle,
    preferredTeacherStyle:
      input.preferredTeacherStyle || dna.preferredTeacherStyle,
    currentGoals: input.currentGoals || dna.currentGoals,
    studentName: input.studentName || dna.studentName,
    interactionCount: dna.interactionCount + 1,
  };
}
