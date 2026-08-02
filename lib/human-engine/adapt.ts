/**
 * Live student interaction via Teacher Mind (Behaviour Tree + session memory).
 * Never repeats the same remediation strategy when student is still confused.
 */
import type {
  HumanCharacterId,
  HumanLessonInput,
  HumanPerformancePlan,
} from "@/types/human-engine";
import type {
  TeacherBlackboard,
  TeacherMindDecision,
  TeacherMindProfile,
  TeacherSessionMemory,
} from "@/types/teacher-mind";
import { directLesson } from "./lesson-director";
import { getDefaultTeacherProfile } from "./teacher-profiles-defaults";
import {
  createSessionMemory,
  markStrategyUsed,
  recordAnswer,
  recordConfusion,
  tickMemory,
} from "./session-memory";
import { createBlackboard, tickTeacherMind } from "./teacher-mind";

export type StudentLiveEvent =
  | { type: "ask_text"; text: string }
  | { type: "explain_simpler" }
  | { type: "explain_again" }
  | { type: "example" }
  | { type: "confused" }
  | { type: "answer"; text: string; correct?: boolean };

export type LiveAdaptResult = {
  reply: string;
  audioKey: string | null;
  microPlan: HumanPerformancePlan;
  strategy: string;
  decision: TeacherMindDecision;
  memory: TeacherSessionMemory;
  contentHint: TeacherMindDecision["contentHint"];
};

function microInput(
  teacherId: HumanCharacterId,
  lessonTitle: string,
  text: string,
  hint: TeacherMindDecision["contentHint"],
): HumanLessonInput {
  const kind =
    hint === "ask_check"
      ? "check"
      : hint === "draw_diagram" || hint === "run_experiment" || hint === "show_model"
        ? "example"
        : "explain";
  // Embed content act cues in text so semantic director picks draw/model/experiment
  let enriched = text;
  if (hint === "draw_diagram" && !/أرسم|برسم|رسم/.test(text)) {
    enriched = `${text} أرسم ذلك على السبورة الآن.`;
  }
  if (hint === "show_model" && !/نموذج|ثلاثي|أدير/.test(text)) {
    enriched = `${text} هذا نموذج ثلاثي الأبعاد، أمسكه وأديره ثم أكبّره.`;
  }
  if (hint === "run_experiment" && !/نجرب|تجرب/.test(text)) {
    enriched = `${text} نجرب في المختبر ونلاحظ التغير.`;
  }
  if (hint === "write_board" && !/اكتب|بكتب|سبور/.test(text)) {
    enriched = `${text} اكتبوا معي على السبورة.`;
  }
  return {
    lessonId: `live_adapt_${Date.now().toString(36)}`,
    title: lessonTitle,
    titleAr: lessonTitle,
    preferredCharacterId: teacherId,
    language: "ar",
    durationMs: 14000,
    blocks: [{ id: "adapt", kind, text: enriched }],
  };
}

function audioFor(decision: TeacherMindDecision): string | null {
  if (decision.state === "encourage") return "correct";
  if (decision.state === "remediate") return "simpler";
  if (decision.contentHint === "ask_check") return "challenge";
  return "example";
}

export function adaptLiveTeacher(opts: {
  teacherId: HumanCharacterId;
  lessonTitle: string;
  lessonId?: string;
  subject?: string;
  grade?: string;
  currentLine?: string;
  event: StudentLiveEvent;
  /** Pass prior memory to keep contextual continuity */
  memory?: TeacherSessionMemory;
  elapsedMs?: number;
  /** Server/admin can pass live profile overrides; client uses defaults */
  profile?: TeacherMindProfile;
}): LiveAdaptResult {
  const profile =
    opts.profile ||
    getDefaultTeacherProfile(opts.teacherId === "ali" ? "ali" : "sara");
  let memory =
    opts.memory ||
    createSessionMemory({
      teacherId: profile.id,
      lessonId: opts.lessonId || "live",
      lessonTitle: opts.lessonTitle,
      subject: opts.subject,
      grade: opts.grade,
    });
  if (opts.elapsedMs != null) memory = tickMemory(memory, opts.elapsedMs);

  const topic = opts.currentLine?.slice(0, 64) || opts.lessonTitle;
  const bb: TeacherBlackboard = createBlackboard({
    profile,
    memory,
    focusTopic: topic,
  });

  // Map live events → blackboard pending events + memory updates
  switch (opts.event.type) {
    case "ask_text":
      bb.pendingEvent = { type: "ask", text: opts.event.text.trim() || "السؤال" };
      break;
    case "explain_simpler":
    case "explain_again":
      memory = recordConfusion(memory, topic, "requested simpler re-explain");
      bb.memory = memory;
      bb.pendingEvent = { type: "request_simpler" };
      break;
    case "confused":
      memory = recordConfusion(memory, topic, "student confused");
      bb.memory = memory;
      bb.pendingEvent = { type: "confused" };
      break;
    case "example":
      bb.pendingEvent = { type: "request_example" };
      break;
    case "answer":
      memory = recordAnswer(memory, {
        question: topic,
        answer: opts.event.text,
        correct: opts.event.correct ?? null,
        topic,
      });
      bb.memory = memory;
      bb.pendingEvent = {
        type: "answer",
        text: opts.event.text,
        correct: opts.event.correct,
      };
      break;
    default:
      bb.pendingEvent = { type: "tick" };
  }

  const decision = tickTeacherMind(bb);

  // Persist strategy into memory so next remediation differs
  if (
    decision.strategy !== "check" &&
    decision.strategy !== "celebrate" &&
    decision.strategy !== "hook" &&
    decision.strategy !== "close"
  ) {
    memory = markStrategyUsed(
      bb.memory,
      decision.strategy === "direct_explain" ? "direct_explain" : decision.strategy,
      topic,
    );
  } else {
    memory = bb.memory;
  }

  const microPlan = directLesson({
    input: microInput(opts.teacherId, opts.lessonTitle, decision.say, decision.contentHint),
    maxDurationMs: 14000,
  });

  return {
    reply: decision.say,
    audioKey: audioFor(decision),
    microPlan,
    strategy: String(decision.strategy),
    decision,
    memory,
    contentHint: decision.contentHint,
  };
}

/** Re-export helpers for studio session wiring */
export { createSessionMemory, tickMemory };
