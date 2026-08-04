/**
 * Derive LiveTeacherState from Human Engine frame samples.
 * Reuses existing ContentAct / gesture / locomotion — no parallel state machine.
 */
import type { ContentAct, HumanFrameSample } from "@/types/human-engine";
import {
  TeacherState,
  type LiveTeacherState,
} from "@/src/ai-teacher/core/LiveTeacherState";

export type DeriveLiveTeacherStateOpts = {
  frame: HumanFrameSample | null;
  lessonId: string;
  currentTopic?: string;
  currentSentence?: number;
  /** Student interaction: waiting for answer / listening */
  waitingForStudent?: boolean;
  listening?: boolean;
  finished?: boolean;
};

function stateFromAct(
  act: ContentAct | null | undefined,
  frame: HumanFrameSample | null,
  opts: DeriveLiveTeacherStateOpts,
): TeacherState {
  if (opts.finished) return TeacherState.FINISHED;
  if (opts.waitingForStudent) return TeacherState.WAITING;
  if (opts.listening && !frame?.speaking) return TeacherState.LISTENING;
  if (!frame) return TeacherState.IDLE;

  const walking =
    frame.locomotion === "walk_in" ||
    frame.locomotion === "step_to_board" ||
    frame.locomotion === "step_to_prop" ||
    frame.locomotion === "step_to_student";
  if (walking && !frame.speaking) return TeacherState.WALKING;

  switch (act) {
    case "greet_hook":
      return TeacherState.GREETING;
    case "explain_concept":
      return TeacherState.EXPLAINING;
    case "write_board":
    case "write_law":
      return TeacherState.WRITING;
    case "draw_diagram":
      return TeacherState.DRAWING;
    case "point_content":
      return TeacherState.POINTING;
    case "ask_check":
      return TeacherState.ASKING;
    case "celebrate":
      return TeacherState.PRAISING;
    case "show_model":
    case "hold_model":
    case "rotate_model":
    case "zoom_in_model":
    case "zoom_out_model":
      return TeacherState.SHOWING_MODEL;
    case "run_experiment":
      return TeacherState.DEMONSTRATING;
    case "count_sequence":
      return TeacherState.SOLVING;
    default:
      break;
  }

  switch (frame.behaviourGoal) {
    case "encourage":
      return TeacherState.ENCOURAGING;
    case "remediate":
      return TeacherState.CORRECTING;
    case "check":
      return TeacherState.ASKING;
    case "close":
      return TeacherState.SUMMARIZING;
    case "demonstrate":
      return TeacherState.DEMONSTRATING;
    case "hook":
      return TeacherState.GREETING;
    case "explain":
      return TeacherState.TEACHING;
    default:
      return frame.speaking ? TeacherState.TEACHING : TeacherState.OBSERVING;
  }
}

/** Map one HE frame (+ session hints) → LiveTeacherState for UI / adapters. */
export function deriveLiveTeacherState(
  opts: DeriveLiveTeacherStateOpts,
): LiveTeacherState {
  const frame = opts.frame;
  const gesture = frame?.gesture || "idle_breathe";
  const writing =
    gesture === "write_board" ||
    frame?.contentAct === "write_board" ||
    frame?.contentAct === "write_law";
  const pointing =
    gesture === "point_board" || frame?.contentAct === "point_content";
  const walking =
    !!frame &&
    (frame.locomotion === "walk_in" ||
      frame.locomotion === "step_to_board" ||
      frame.locomotion === "step_to_prop" ||
      frame.locomotion === "step_to_student");

  const state = stateFromAct(frame?.contentAct, frame, opts);
  const waitingForStudent = !!opts.waitingForStudent || state === TeacherState.WAITING;

  return {
    state,
    lessonId: opts.lessonId,
    currentTopic: opts.currentTopic || frame?.lineText?.slice(0, 80) || "",
    currentSentence: opts.currentSentence ?? 0,
    attention: Math.min(
      1,
      Math.max(
        0.35,
        (frame?.emotionIntensity ?? 0.55) + (frame?.speaking ? 0.15 : 0),
      ),
    ),
    emotion: frame?.emotion || "neutral",
    gesture,
    cameraMode: frame?.camera || "medium_teacher",
    eyeTarget: frame?.gaze || "student",
    speaking: !!frame?.speaking,
    listening: !!opts.listening || waitingForStudent,
    walking,
    writing,
    pointing,
    waitingForStudent,
  };
}

export { TeacherState };
export type { LiveTeacherState };
