/**
 * teaching-orchestrator.ts
 *
 * Deterministic lesson-stage logic. This is intentionally NOT an AI call —
 * it decides *structure* (what stage comes next, which tool to call, what
 * gets recorded to memory) so that behavior is testable and reproducible.
 * An AI Teacher runtime layer may use OpenAI to phrase `spokenText` more
 * richly, but the orchestrator always produces a complete, valid
 * TeacherTurn on its own using template text grounded in real tool
 * evidence — it never depends on a network call to function correctly.
 */

import type { TeacherId } from "./teacher-identity.ts";
import { type TeachingStage, transition, isTerminalStage } from "./teaching-state-machine.ts";
import { callSubjectTool, isSubjectRegistered } from "./subject-tool-router.ts";
import {
  getOrCreateMemory,
  recordMisconception,
  recordMistake,
  recordMastery,
  recordQuestionResult,
  setLessonProgress,
  type SessionMemory,
} from "./session-memory.ts";
import type { TeacherTurn, ToolEvidence, BoardAction, Remediation } from "./teacher-turn.ts";
import { getMisconception } from "../physics/index.ts";

export interface SessionState {
  sessionId: string;
  teacherId: TeacherId;
  subject: string;
  lesson: string;
  stage: TeachingStage;
}

export interface StudentInput {
  questionId?: string;
  isCorrect?: boolean | "partial";
  /** Passed through verbatim to the subject tool's misconception-detection action when the answer was incorrect. */
  misconceptionParams?: Record<string, unknown>;
  hasMoreObjectives?: boolean;
  /** Free-text student intents that aren't an answer attempt at all. */
  intent?: "confused" | "explain-again" | "easier-example";
}

/** Default demonstration parameters for the one verified physics lesson (Reference Case A, already covered by the Physics Engine test suite). */
const DEMO_PROJECTILE_PARAMS = { speed: 20, angleDegrees: 30, gravity: 10 };

function physicsEvidence(action: "solveProjectile" | "checkMisconception", params: Record<string, unknown>): ToolEvidence {
  const result = callSubjectTool("physics", action, params);
  return { subject: "physics", tool: "PhysicsEngine", action, result: result.data };
}

function baseTurn(session: SessionState, nextStage: TeachingStage, overrides: Partial<TeacherTurn> = {}): TeacherTurn {
  return {
    teacherId: session.teacherId,
    sessionId: session.sessionId,
    subject: session.subject,
    lesson: session.lesson,
    stage: session.stage,
    spokenText: "",
    boardActions: [],
    visualActions: [],
    gesture: "neutral",
    expression: "neutral",
    question: null,
    expectedResponseType: "none",
    waitForStudent: false,
    misconceptionDetected: null,
    remediation: null,
    nextStage,
    toolEvidence: [],
    ...overrides,
  };
}

const TEACHER_NAME: Record<TeacherId, string> = { sara: "Sara", ali: "Ali" };

/**
 * Shared evaluation logic used by both the WAIT_FOR_STUDENT fast path (one
 * round-trip: student answers, immediately gets feedback) and the explicit
 * EVALUATE stage (for callers that step through stages one at a time).
 * Always transitions to FEEDBACK — evaluation itself never needs a second
 * network round-trip to complete.
 */
function evaluateAnswer(session: SessionState, memory: SessionMemory, studentInput: StudentInput | undefined): { turn: TeacherTurn; memory: SessionMemory; nextSession: SessionState } {
  const name = TEACHER_NAME[session.teacherId];
  const next = transition(session.stage === "EVALUATE" ? "EVALUATE" : "WAIT_FOR_STUDENT", "FEEDBACK");
  const isCorrect = studentInput?.isCorrect ?? false;
  let misconceptionDetected: string | null = null;
  let remediation: Remediation | null = null;
  const evidence: ToolEvidence[] = [];
  let updatedMemory = memory;

  if (isCorrect === true) {
    updatedMemory = recordMastery(session.sessionId, "peak-velocity-check");
    updatedMemory = recordQuestionResult(session.sessionId, "peak-velocity-check", true);
  } else if (isCorrect === "partial") {
    updatedMemory = recordQuestionResult(session.sessionId, "peak-velocity-check", false);
    updatedMemory = recordMistake(session.sessionId, "peak-velocity-check", "Partially correct answer on peak-velocity check.");
  } else {
    updatedMemory = recordMistake(session.sessionId, "peak-velocity-check", "Incorrect answer on peak-velocity check.");
    updatedMemory = recordQuestionResult(session.sessionId, "peak-velocity-check", false);
    if (isSubjectRegistered(session.subject)) {
      const ev = physicsEvidence("checkMisconception", studentInput?.misconceptionParams ?? {});
      evidence.push(ev);
      const detected = ev.result as { id: string; whyItIsWrong: string; recoveryHint: string } | null;
      if (detected) {
        misconceptionDetected = detected.id;
        remediation = { misconceptionId: detected.id, explanation: detected.whyItIsWrong, recoveryHint: detected.recoveryHint };
        updatedMemory = recordMisconception(session.sessionId, detected.id);
      }
    }
  }

  const spokenText =
    isCorrect === true ? `${name}: Correct — total velocity is not zero at the peak, only the vertical component is.`
    : isCorrect === "partial" ? `${name}: You're partly right — let's tighten that up.`
    : `${name}: Not quite. Let's look at why.`;

  const turn = baseTurn(session, next, { spokenText, misconceptionDetected, remediation, toolEvidence: evidence });
  return { turn, memory: updatedMemory, nextSession: { ...session, stage: next } };
}

export function advance(session: SessionState, studentInput?: StudentInput): { turn: TeacherTurn; memory: SessionMemory; nextSession: SessionState } {
  const memory = getOrCreateMemory(session.sessionId);
  const name = TEACHER_NAME[session.teacherId];

  if (isTerminalStage(session.stage)) {
    const turn = baseTurn(session, session.stage, { spokenText: `${name}: This lesson is complete. Great work.`, expression: "happy" });
    return { turn, memory, nextSession: session };
  }

  switch (session.stage) {
    case "INITIALIZE": {
      const next = transition("INITIALIZE", "GREET");
      const turn = baseTurn(session, next, { spokenText: `${name}: Hi! I'm ${name}, your AI physics teacher. Let's get started.`, gesture: "wave", expression: "friendly" });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "GREET": {
      const next = transition("GREET", "DIAGNOSE");
      const turn = baseTurn(session, next, { spokenText: `${name}: Before we begin ${session.lesson}, tell me — have you studied this before?`, expression: "curious" });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "DIAGNOSE": {
      const next = transition("DIAGNOSE", "PLAN");
      const level = memory.currentLevel;
      const turn = baseTurn(session, next, { spokenText: `${name}: Good to know. I'll teach this at a ${level} pace and adjust as we go.` });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "PLAN": {
      const next = transition("PLAN", "EXPLAIN");
      const turn = baseTurn(session, next, { spokenText: `${name}: Here's the plan for ${session.lesson}: understand the concept, see it demonstrated, then you'll try a question yourself.` });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "EXPLAIN": {
      const next = transition("EXPLAIN", "DEMONSTRATE");
      const evidence: ToolEvidence[] = [];
      const board: BoardAction[] = [];
      if (isSubjectRegistered(session.subject)) {
        const ev = physicsEvidence("solveProjectile", DEMO_PROJECTILE_PARAMS);
        evidence.push(ev);
        board.push({ type: "equation", content: "v0x = v0·cos(θ), v0y = v0·sin(θ)" }, { type: "equation", content: "y = y0 + v0y·t − ½gt²" });
      }
      const turn = baseTurn(session, next, {
        spokenText: `${name}: In projectile motion, horizontal and vertical motion are independent but share the same clock. Let's see that on the board.`,
        boardActions: board,
        toolEvidence: evidence,
      });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "DEMONSTRATE": {
      const next = transition("DEMONSTRATE", "ASK");
      const evidence: ToolEvidence[] = [];
      let spokenText = `${name}: Watch how the numbers work out.`;
      if (isSubjectRegistered(session.subject)) {
        const ev = physicsEvidence("solveProjectile", DEMO_PROJECTILE_PARAMS);
        evidence.push(ev);
        const data = ev.result as { summary: { v0x: number; v0y: number; timeOfFlight: number; maxHeightAboveLaunch: number; range: number } };
        spokenText = `${name}: At ${DEMO_PROJECTILE_PARAMS.speed} m/s and ${DEMO_PROJECTILE_PARAMS.angleDegrees}°, the horizontal component is ${data.summary.v0x.toFixed(2)} m/s and the vertical component is ${data.summary.v0y.toFixed(2)} m/s. It reaches ${data.summary.maxHeightAboveLaunch.toFixed(2)} m at the peak and lands ${data.summary.range.toFixed(2)} m away after ${data.summary.timeOfFlight.toFixed(2)} s.`;
      }
      const turn = baseTurn(session, next, { spokenText, toolEvidence: evidence, gesture: "point-at-board" });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "ASK": {
      const next = transition("ASK", "WAIT_FOR_STUDENT");
      const turn = baseTurn(session, next, {
        spokenText: `${name}: Your turn. At the highest point of the trajectory, what happens to the total velocity?`,
        question: {
          id: "peak-velocity-check",
          prompt: "At the highest point of the trajectory, what happens to the total velocity?",
          expectedResponseType: "multiple-choice",
          choices: ["It becomes exactly zero", "Only the vertical component is zero", "It stays the same as launch"],
        },
        expectedResponseType: "multiple-choice",
        waitForStudent: true,
      });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "WAIT_FOR_STUDENT": {
      if (!studentInput) {
        const turn = baseTurn(session, "WAIT_FOR_STUDENT", { spokenText: `${name}: Take your time.`, waitForStudent: true });
        return { turn, memory, nextSession: session };
      }
      if (studentInput.intent) {
        const next = transition("WAIT_FOR_STUDENT", "DEMONSTRATE");
        const evidence: ToolEvidence[] = [];
        let spokenText = `${name}: Sure, let's go over it again.`;
        if (studentInput.intent === "confused") {
          spokenText = `${name}: No problem — let's slow down. Horizontal and vertical motion happen at the same time, but they don't affect each other.`;
        } else if (studentInput.intent === "explain-again") {
          spokenText = `${name}: Here it is a different way: imagine dropping a ball while also rolling one — they hit the ground at the same instant.`;
        } else if (studentInput.intent === "easier-example") {
          // A real, physically valid arc (angle 0 + zero height would never leave
          // the ground — the Physics Engine correctly rejects that combination).
          const easyParams = { speed: 10, angleDegrees: 30, gravity: 10 };
          const ev = physicsEvidence("solveProjectile", easyParams);
          evidence.push(ev);
          const data = ev.result as { summary: { timeOfFlight: number; range: number } };
          spokenText = `${name}: Let's try something simpler: ${easyParams.speed} m/s at ${easyParams.angleDegrees}°. It's in the air for ${data.summary.timeOfFlight.toFixed(2)} s and lands ${data.summary.range.toFixed(2)} m away.`;
        }
        const turn = baseTurn(session, next, { spokenText, toolEvidence: evidence, gesture: "reassure" });
        return { turn, memory, nextSession: { ...session, stage: next } };
      }
      // An actual answer was submitted — evaluate it in this same round-trip
      // rather than returning a placeholder "let me check" turn and forcing
      // a second, input-less call just to get the real result.
      return evaluateAnswer(session, memory, studentInput);
    }
    case "EVALUATE": {
      // Reachable if some other caller explicitly drives the state machine
      // stage-by-stage rather than using the WAIT_FOR_STUDENT fast path above.
      return evaluateAnswer(session, memory, studentInput);
    }
    case "FEEDBACK": {
      const lastQuestion = memory.questionHistory[memory.questionHistory.length - 1];
      const hasMisconception = Boolean(lastQuestion && !lastQuestion.correct && memory.misconceptions.length > 0);
      const next = transition("FEEDBACK", hasMisconception ? "REMEDIATE" : "CHECK_UNDERSTANDING");
      const turn = baseTurn(session, next, { spokenText: hasMisconception ? `${name}: Let's fix that misunderstanding before moving on.` : `${name}: Nice work — let's confirm you've got it.` });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "REMEDIATE": {
      const lastMisconceptionId = memory.misconceptions[memory.misconceptions.length - 1];
      const next = transition("REMEDIATE", "ASK");
      let spokenText = `${name}: Let's revisit this idea.`;
      let remediation: Remediation | null = null;
      if (lastMisconceptionId) {
        const m = getMisconception(lastMisconceptionId);
        spokenText = `${name}: ${m.whyItIsWrong} ${m.recoveryHint}`;
        remediation = { misconceptionId: m.id, explanation: m.whyItIsWrong, recoveryHint: m.recoveryHint };
      }
      const turn = baseTurn(session, next, { spokenText, remediation });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "CHECK_UNDERSTANDING": {
      const hasMore = studentInput?.hasMoreObjectives ?? false;
      const next = transition("CHECK_UNDERSTANDING", hasMore ? "CONTINUE" : "SUMMARIZE");
      const turn = baseTurn(session, next, { spokenText: hasMore ? `${name}: One more idea to cover.` : `${name}: You've covered the objective for this lesson.` });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "CONTINUE": {
      const next = transition("CONTINUE", "PLAN");
      const turn = baseTurn(session, next, { spokenText: `${name}: Let's move to the next part.` });
      return { turn, memory, nextSession: { ...session, stage: next } };
    }
    case "SUMMARIZE": {
      const next = transition("SUMMARIZE", "COMPLETE");
      const updatedMemory = setLessonProgress(session.sessionId, 1);
      const turn = baseTurn(session, next, {
        spokenText: `${name}: To summarize ${session.lesson}: ${updatedMemory.masteredConcepts.length ? updatedMemory.masteredConcepts.join(", ") : "we covered the core idea"}. Well done.`,
        expression: "happy",
      });
      return { turn, memory: updatedMemory, nextSession: { ...session, stage: next } };
    }
    default: {
      throw new Error(`Teaching orchestrator error: unhandled stage "${session.stage}".`);
    }
  }
}
