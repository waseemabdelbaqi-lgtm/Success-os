/**
 * teacher-turn.ts
 *
 * The structured output every AI Teacher turn produces. The UI (TutorPanel /
 * AITeacherPanel) renders this shape and this shape only — it must never
 * parse arbitrary prose to decide what to show, and it must never compute
 * any of these fields itself.
 */

import type { TeacherId } from "./teacher-identity.ts";
import type { TeachingStage } from "./teaching-state-machine.ts";

export interface BoardAction {
  type: "equation" | "diagram" | "graph" | "text" | "highlight";
  content: string;
}

export interface VisualAction {
  type: "point" | "circle" | "underline" | "arrow";
  target: string;
}

export type ExpectedResponseType = "multiple-choice" | "numeric" | "free-text" | "none";

export interface TeacherQuestion {
  id: string;
  prompt: string;
  expectedResponseType: ExpectedResponseType;
  choices?: string[];
}

export interface ToolEvidence {
  subject: string;
  tool: string;
  action: string;
  /** Raw structured result returned by the subject tool (e.g. the Physics Engine). Never re-derived by the UI. */
  result: unknown;
}

export interface Remediation {
  misconceptionId: string;
  explanation: string;
  recoveryHint: string;
}

export interface TeacherTurn {
  teacherId: TeacherId;
  sessionId: string;
  subject: string;
  lesson: string;
  stage: TeachingStage;
  spokenText: string;
  boardActions: BoardAction[];
  visualActions: VisualAction[];
  gesture: string;
  expression: string;
  question: TeacherQuestion | null;
  expectedResponseType: ExpectedResponseType;
  waitForStudent: boolean;
  misconceptionDetected: string | null;
  remediation: Remediation | null;
  nextStage: TeachingStage;
  toolEvidence: ToolEvidence[];
}
