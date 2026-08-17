/**
 * teaching-state-machine.ts
 *
 * Owns lesson-stage transitions. The orchestrator asks this module whether
 * a transition is allowed; it never advances a stage on its own authority.
 */

export const TEACHING_STAGES = [
  "INITIALIZE",
  "GREET",
  "DIAGNOSE",
  "PLAN",
  "EXPLAIN",
  "DEMONSTRATE",
  "ASK",
  "WAIT_FOR_STUDENT",
  "EVALUATE",
  "FEEDBACK",
  "REMEDIATE",
  "CHECK_UNDERSTANDING",
  "CONTINUE",
  "SUMMARIZE",
  "COMPLETE",
] as const;

export type TeachingStage = (typeof TEACHING_STAGES)[number];

/**
 * Directed graph of allowed transitions. REMEDIATE loops back into
 * DEMONSTRATE/EXPLAIN so a corrected misconception gets re-taught; CONTINUE
 * loops back into PLAN for the next objective; COMPLETE is terminal.
 */
export const VALID_TRANSITIONS: Record<TeachingStage, TeachingStage[]> = {
  INITIALIZE: ["GREET"],
  GREET: ["DIAGNOSE"],
  DIAGNOSE: ["PLAN"],
  PLAN: ["EXPLAIN"],
  EXPLAIN: ["DEMONSTRATE"],
  DEMONSTRATE: ["ASK"],
  ASK: ["WAIT_FOR_STUDENT"],
  // A student can also ask for clarification instead of answering, which
  // loops back into DEMONSTRATE with a different explanation rather than
  // forcing an evaluation the student isn't ready for. And a real answer is
  // evaluated in the same round-trip rather than needing a separate
  // EVALUATE-stage call, so WAIT_FOR_STUDENT can go straight to FEEDBACK.
  WAIT_FOR_STUDENT: ["EVALUATE", "DEMONSTRATE", "FEEDBACK"],
  EVALUATE: ["FEEDBACK"],
  FEEDBACK: ["REMEDIATE", "CHECK_UNDERSTANDING"],
  REMEDIATE: ["DEMONSTRATE", "ASK"],
  CHECK_UNDERSTANDING: ["CONTINUE", "SUMMARIZE"],
  CONTINUE: ["PLAN", "EXPLAIN"],
  SUMMARIZE: ["COMPLETE"],
  COMPLETE: [],
};

export function isValidTransition(from: TeachingStage, to: TeachingStage): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Validates and returns `to`, or throws a descriptive error for an illegal transition. */
export function transition(from: TeachingStage, to: TeachingStage): TeachingStage {
  if (!isValidTransition(from, to)) {
    throw new Error(`Teaching state machine error: illegal transition ${from} → ${to}. Valid next stages from ${from} are: [${VALID_TRANSITIONS[from].join(", ")}].`);
  }
  return to;
}

/** Every non-terminal stage must have at least one valid next stage; COMPLETE must have none. This is verified by a test, not assumed. */
export function isTerminalStage(stage: TeachingStage): boolean {
  return VALID_TRANSITIONS[stage].length === 0;
}
