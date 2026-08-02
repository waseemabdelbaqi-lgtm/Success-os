/**
 * Teacher Mind — Behaviour Tree + Blackboard orchestrate full teaching decisions.
 * Human Engine uses this for what to say/do, not only how to move.
 */
import type {
  RemediationMode,
  TeacherBlackboard,
  TeacherMindDecision,
  TeacherMindProfile,
  TeacherMindState,
  TeacherSessionMemory,
} from "@/types/teacher-mind";
import {
  buildTeacherBehaviourTree,
  tickBehaviourTree,
  type BtRegistry,
} from "./behaviour-tree";
import { nextUnusedRemediation } from "./session-memory";

function contentHintFor(mode: RemediationMode | string): TeacherMindDecision["contentHint"] {
  if (mode === "diagram") return "draw_diagram";
  if (mode === "experiment") return "run_experiment";
  if (mode === "model_3d") return "show_model";
  if (mode === "slower_steps" || mode === "simpler_words") return "write_board";
  if (mode === "analogy") return "write_board";
  return "speech_only";
}

function sayForRemediation(
  profile: TeacherMindProfile,
  mode: RemediationMode,
  topic: string,
): string {
  const open = profile.phrases.reexplainOpener;
  const name = profile.phrases.addressStudent;
  switch (mode) {
    case "analogy":
      return `${open}. ${name}، تخيّلوا «${topic}» كشيء من يومكم، وبعدها نكتب الخطوة ببساطة.`;
    case "diagram":
      return `${open}. هالمرة برسم مخطط على السبورة يوضح «${topic}» بدل ما نكرر الكلام.`;
    case "experiment":
      return `${open}. خلينا نجرّب عملياً: نلاحظ التغير ونربطه بـ«${topic}».`;
    case "model_3d":
      return `${open}. بشغّل نموذجاً ثلاثي الأبعاد، أديره وأكبّره عشان نشوف «${topic}» من زاوية ثانية.`;
    case "slower_steps":
      return `${open}. نبطّئ: خطوة واحدة فقط عن «${topic}»، ثم نتأكد قبل ما نكمّل.`;
    case "simpler_words":
      return `${open}. بجمل أبسط: «${topic}» تعني… ونعيدها بكلمات يومية.`;
    default:
      return `${open}. نشرح «${topic}» بطريقة مختلفة.`;
  }
}

function sayForAnswer(profile: TeacherMindProfile, question: string, topic: string): string {
  const q = question.slice(0, 70);
  switch (profile.teaching.answerStyle) {
    case "analogy_then_steps":
      return `سؤال ممتاز عن «${q}». ${profile.phrases.addressStudent}، نربطه بمثال قريب ثم خطوة على السبورة حول «${topic}».`;
    case "definition_then_example":
      return `حسناً. بخصوص «${q}»: نعرّف «${topic}» بجملة واحدة، ثم مثال تطبيقي مباشر.`;
    case "socratic_questions":
      return `سؤال ذكي: «${q}». قبل الجواب النهائي، ما الجزء الأهم في «${topic}» برأيك؟ بعدها نثبت الإجابة.`;
    case "visual_first":
      return `بخصوص «${q}»: خلينا نشوفها بصرياً أولاً على السبورة/النموذج، ثم نلخّص «${topic}».`;
    default:
      return `بخصوص «${q}» نرجع لأساس «${topic}».`;
  }
}

function setDecision(bb: TeacherBlackboard, d: TeacherMindDecision): void {
  bb.lastDecision = d;
  bb.state = d.state;
}

function makeRegistry(): BtRegistry {
  return {
    conditions: {
      hasConfusedEvent: (bb) => bb.pendingEvent?.type === "confused",
      hasAskEvent: (bb) => bb.pendingEvent?.type === "ask",
      hasWrongAnswer: (bb) =>
        bb.pendingEvent?.type === "answer" && bb.pendingEvent.correct === false,
      hasCorrectAnswer: (bb) =>
        bb.pendingEvent?.type === "answer" && bb.pendingEvent.correct === true,
      hasSimplerRequest: (bb) => bb.pendingEvent?.type === "request_simpler",
      hasExampleRequest: (bb) => bb.pendingEvent?.type === "request_example",
      isEarlyLesson: (bb) => bb.memory.elapsedMs < 12_000 && bb.memory.topicsCovered.length === 0,
      isLateLesson: (bb) => bb.memory.elapsedMs > 55_000 || bb.memory.masteryHint > 0.85,
      shouldCheckUnderstanding: (bb) => {
        const freq = bb.profile.teaching.checkFrequency;
        const due =
          bb.memory.answers.length === 0
            ? bb.memory.elapsedMs > 18_000
            : bb.memory.elapsedMs - (bb.memory.answers.at(-1)?.atMs || 0) > 16_000;
        // Deterministic threshold from session clock (no Math.random)
        const pulse = (bb.memory.elapsedMs / 1000) % 10;
        return due && pulse / 10 < freq;
      },
    },
    actions: {
      decideRemediate: (bb) => {
        const mode = nextUnusedRemediation(bb.memory, bb.profile.remediationOrder);
        const topic = bb.focusTopic || bb.memory.lessonTitle;
        setDecision(bb, {
          state: "remediate",
          strategy: mode,
          say: sayForRemediation(bb.profile, mode, topic),
          contentHint: contentHintFor(mode),
          emotion:
            bb.profile.teaching.reexplainPatience > 0.7
              ? "patient"
              : "focused",
          reason: `BT remediate · mode=${mode} · confusion=${bb.memory.confusionCount} · unused-first`,
          cameraBias: mode === "model_3d" ? "prop_orbit" : "over_shoulder_board",
          lightBias: mode === "experiment" ? "experiment_practical" : "board_accent",
        });
        return "success";
      },
      decideAnswerQuestion: (bb) => {
        const text =
          bb.pendingEvent?.type === "ask" ? bb.pendingEvent.text : "السؤال";
        const topic = bb.focusTopic || bb.memory.lessonTitle;
        setDecision(bb, {
          state: "answer_question",
          strategy: "direct_explain",
          say: sayForAnswer(bb.profile, text, topic),
          contentHint:
            bb.profile.teaching.answerStyle === "visual_first"
              ? "draw_diagram"
              : "write_board",
          emotion: bb.profile.teaching.defaultEmotion,
          reason: `BT answer · style=${bb.profile.teaching.answerStyle}`,
          cameraBias: "close_face",
          lightBias: "closeup_beauty",
        });
        return "success";
      },
      decideEncourage: (bb) => {
        setDecision(bb, {
          state: "encourage",
          strategy: "celebrate",
          say:
            bb.profile.teaching.motivation === "encourage_often"
              ? bb.profile.phrases.celebrate
              : bb.profile.teaching.motivation === "challenge_forward"
                ? `${bb.profile.phrases.celebrate}. جاهزين للتحدي التالي؟`
                : bb.profile.phrases.celebrate,
          contentHint: "speech_only",
          emotion: "celebratory",
          reason: `BT encourage · motivation=${bb.profile.teaching.motivation}`,
          cameraBias: "close_face",
          lightBias: "warm_encourage",
        });
        return "success";
      },
      decideExample: (bb) => {
        const topic = bb.focusTopic || bb.memory.lessonTitle;
        const say =
          bb.profile.teaching.answerStyle === "analogy_then_steps"
            ? `${bb.profile.phrases.addressStudent}، مثال من الحياة عن «${topic}»، ثم نكتب الناتج.`
            : `مثال تطبيقي مباشر على «${topic}»، ثم تحقق سريع.`;
        setDecision(bb, {
          state: "demonstrate",
          strategy: "analogy",
          say,
          contentHint: "write_board",
          emotion: bb.profile.teaching.defaultEmotion,
          reason: "BT example request",
          cameraBias: "over_shoulder_board",
          lightBias: "board_accent",
        });
        return "success";
      },
      decideHook: (bb) => {
        setDecision(bb, {
          state: "hook",
          strategy: "hook",
          say: `مرحبا ${bb.profile.phrases.addressStudent}. أنا ${bb.profile.displayName.ar}. ${bb.profile.phrases.explainVerb}: ${bb.memory.lessonTitle}.`,
          contentHint: "speech_only",
          emotion: bb.profile.teaching.defaultEmotion,
          reason: "BT early hook",
          cameraBias: "wide_establishing",
          lightBias: "soft_classroom",
        });
        return "success";
      },
      decideCheck: (bb) => {
        const topic = bb.focusTopic || bb.memory.lessonTitle;
        setDecision(bb, {
          state: "check_understanding",
          strategy: "check",
          say: `${bb.profile.phrases.checkPhrase}: ما الفكرة الأساسية في «${topic}»؟`,
          contentHint: "ask_check",
          emotion: "curious",
          reason: `BT check · freq=${bb.profile.teaching.checkFrequency}`,
          cameraBias: "close_face",
          lightBias: "cool_focus",
        });
        return "success";
      },
      decideClose: (bb) => {
        setDecision(bb, {
          state: "close",
          strategy: "close",
          say: `${bb.profile.phrases.celebrate}. لخّصنا ${bb.memory.lessonTitle}. إلى اللقاء.`,
          contentHint: "speech_only",
          emotion: "warm",
          reason: "BT close",
          cameraBias: "medium_teacher",
          lightBias: "warm_encourage",
        });
        return "success";
      },
      decideExplain: (bb) => {
        const topic = bb.focusTopic || bb.memory.lessonTitle;
        const pace = bb.profile.teaching.pace;
        const say =
          pace === "slow"
            ? `${bb.profile.phrases.explainVerb} ببطء: «${topic}»… نأخذ جملة جملة.`
            : pace === "brisk"
              ? `${bb.profile.phrases.explainVerb}: «${topic}» — تعريف، مثال، ثم نكمل.`
              : `${bb.profile.phrases.explainVerb}: نوضح «${topic}» ثم نثبته على السبورة.`;
        setDecision(bb, {
          state: "explain",
          strategy: "direct_explain",
          say,
          contentHint:
            bb.profile.teaching.boardWriting === "diagram_heavy"
              ? "draw_diagram"
              : "write_board",
          emotion: bb.profile.teaching.defaultEmotion,
          reason: `BT explain · pace=${pace} · level=${bb.memory.studentLevel}`,
          cameraBias: "medium_teacher",
          lightBias: "key_fill_rim",
        });
        return "success";
      },
    },
  };
}

const TREE = buildTeacherBehaviourTree();
const REGISTRY = makeRegistry();

export function createBlackboard(opts: {
  profile: TeacherMindProfile;
  memory: TeacherSessionMemory;
  focusTopic?: string;
  state?: TeacherMindState;
}): TeacherBlackboard {
  return {
    profile: opts.profile,
    memory: opts.memory,
    state: opts.state || "idle",
    focusTopic: opts.focusTopic || opts.memory.lessonTitle,
    pendingEvent: null,
    lastDecision: null,
  };
}

/**
 * Tick Teacher Mind once — returns a decision driven by BT + blackboard.
 */
export function tickTeacherMind(bb: TeacherBlackboard): TeacherMindDecision {
  const status = tickBehaviourTree(TREE, bb, REGISTRY);
  if (!bb.lastDecision) {
    // Fallback should be rare — BT always ends in decideExplain
    setDecision(bb, {
      state: "explain",
      strategy: "direct_explain",
      say: bb.profile.phrases.explainVerb,
      contentHint: "speech_only",
      emotion: bb.profile.teaching.defaultEmotion,
      reason: `BT fallback status=${status}`,
    });
  }
  bb.pendingEvent = null;
  return bb.lastDecision!;
}

export function describeTeacherMindTree(): ReturnType<typeof buildTeacherBehaviourTree> {
  return TREE;
}
