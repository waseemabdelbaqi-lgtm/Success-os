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
import {
  nextUnusedRemediation,
  recordPerformanceUse,
  setWaitingForAnswer,
} from "./session-memory";
import { fingerprintSay } from "./performance-variety";

function contentHintFor(mode: RemediationMode | string): TeacherMindDecision["contentHint"] {
  if (mode === "diagram") return "draw_diagram";
  if (mode === "experiment") return "run_experiment";
  if (mode === "model_3d") return "show_model";
  if (mode === "slower_steps" || mode === "simpler_words") return "write_board";
  if (mode === "analogy") return "write_board";
  return "speech_only";
}

function subjectHint(subject: string): "math" | "science" | "general" {
  const s = subject.toLowerCase();
  if (/math|رياضيات|جبر|عدد/.test(s)) return "math";
  if (/sci|علوم|فيز|كيم|physics/.test(s)) return "science";
  return "general";
}

/** Multiple phrasings per mode — indexed by confusion count so words never clone. */
function sayForRemediation(
  profile: TeacherMindProfile,
  mode: RemediationMode,
  topic: string,
  subject: string,
  variant: number,
): string {
  const open = profile.phrases.reexplainOpener;
  const name = profile.phrases.addressStudent;
  const sub = subjectHint(subject);
  const v = variant % 3;
  const bank: Record<RemediationMode, string[]> = {
    analogy: [
      `${open}. ${name}، تخيّلوا «${topic}» كشيء من يومكم، وبعدها نكتب الخطوة ببساطة.`,
      `${open}. تشبيه جديد: «${topic}» يشبه… ثم نحوّل التشبيه إلى خطوة على السبورة.`,
      `${open}. ${sub === "math" ? "كالفلوس في الجيب" : sub === "science" ? "كالماء في الكوب" : "كموقف يومي"} — هكذا نفهم «${topic}» دون تكرار الشرح السابق.`,
    ],
    diagram: [
      `${open}. هالمرة برسم مخطط على السبورة يوضح «${topic}» بدل ما نكرر الكلام.`,
      `${open}. رسم بياني جديد لـ«${topic}»: أسهم وعلاقات — شوفوا أين تتجه الفكرة.`,
      `${open}. نمحو الشرح اللفظي ونثبّت «${topic}» برسم واضح خطوة خطوة.`,
    ],
    experiment: [
      `${open}. خلينا نجرّب عملياً: نلاحظ التغير ونربطه بـ«${topic}».`,
      `${open}. محاكاة قصيرة: نغيّر عاملاً واحداً ونراقب أثره على «${topic}».`,
      `${open}. تجربة سريعة في المختبر الافتراضي حول «${topic}» — ملاحظة ثم استنتاج.`,
    ],
    model_3d: [
      `${open}. بشغّل نموذجاً ثلاثي الأبعاد، أديره وأكبّره عشان نشوف «${topic}» من زاوية ثانية.`,
      `${open}. نموذج 3D لـ«${topic}»: أديره ببطء، ثم أكبّر الجزء المهم.`,
      `${open}. نمسك المجسم، نلفّه 90 درجة، ونكبّر التفاصيل المرتبطة بـ«${topic}».`,
    ],
    slower_steps: [
      `${open}. نبطّئ: خطوة واحدة فقط عن «${topic}»، ثم نتأكد قبل ما نكمّل.`,
      `${open}. إيقاع أهدأ: جملة → مثال صغير → توقف. موضوعنا «${topic}».`,
      `${open}. نقسم «${topic}» إلى جزئين فقط الآن؛ الباقي بعد ما نتأكد.`,
    ],
    simpler_words: [
      `${open}. بجمل أبسط: «${topic}» تعني… ونعيدها بكلمات يومية.`,
      `${open}. بلا مصطلحات ثقيلة: «${topic}» = فكرة بسيطة نقدر نشرحها لصديق.`,
      `${open}. ${profile.phrases.encourage} نعيد تعريف «${topic}» بكلمات الصف.`,
    ],
  };
  return bank[mode]?.[v] || `${open}. نشرح «${topic}» بطريقة مختلفة (#${variant}).`;
}

function sayForAnswer(
  profile: TeacherMindProfile,
  question: string,
  topic: string,
  subject: string,
  variant: number,
): string {
  const q = question.slice(0, 70);
  const sub = subjectHint(subject);
  const v = variant % 2;
  if (profile.teaching.answerStyle === "analogy_then_steps") {
    return v === 0
      ? `سؤال ممتاز عن «${q}». ${profile.phrases.addressStudent}، نربطه بمثال قريب ثم خطوة على السبورة حول «${topic}».`
      : `حبّيت السؤال عن «${q}». مثال سريع من ${sub === "math" ? "الأرقام" : "الحياة"}، ثم نكتب الناتج عن «${topic}».`;
  }
  if (profile.teaching.answerStyle === "definition_then_example") {
    return v === 0
      ? `حسناً. بخصوص «${q}»: نعرّف «${topic}» بجملة واحدة، ثم مثال تطبيقي مباشر.`
      : `نضبط التعريف أولاً لـ«${topic}»، وبعدها مثال واحد يجيب على «${q}».`;
  }
  if (profile.teaching.answerStyle === "socratic_questions") {
    return `سؤال ذكي: «${q}». قبل الجواب النهائي، ما الجزء الأهم في «${topic}» برأيك؟ بعدها نثبت الإجابة.`;
  }
  if (profile.teaching.answerStyle === "visual_first") {
    return `بخصوص «${q}»: خلينا نشوفها بصرياً أولاً على السبورة/النموذج، ثم نلخّص «${topic}».`;
  }
  return `بخصوص «${q}» نرجع لأساس «${topic}».`;
}

function uniqueSay(bb: TeacherBlackboard, candidates: string[]): string {
  for (const c of candidates) {
    const fp = fingerprintSay(c);
    if (!bb.memory.usedSayFingerprints.includes(fp)) return c;
  }
  // Force uniqueness with session salt
  const base = candidates[bb.memory.confusionCount % candidates.length] || candidates[0]!;
  return `${base} (${bb.memory.answers.length + 1})`;
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
        const say = sayForRemediation(
          bb.profile,
          mode,
          topic,
          bb.memory.subject,
          bb.memory.confusionCount + bb.memory.strategiesUsed.length,
        );
        setDecision(bb, {
          state: "remediate",
          strategy: mode,
          say,
          contentHint: contentHintFor(mode),
          emotion:
            bb.profile.teaching.reexplainPatience > 0.7
              ? "patient"
              : "focused",
          reason: `BT remediate · mode=${mode} · confusion=${bb.memory.confusionCount} · unused-first · subject=${bb.memory.subject}`,
          cameraBias: mode === "model_3d" ? "prop_orbit" : "over_shoulder_board",
          lightBias: mode === "experiment" ? "experiment_practical" : "board_accent",
        });
        return "success";
      },
      decideAnswerQuestion: (bb) => {
        const text =
          bb.pendingEvent?.type === "ask" ? bb.pendingEvent.text : "السؤال";
        const topic = bb.focusTopic || bb.memory.lessonTitle;
        const say = sayForAnswer(
          bb.profile,
          text,
          topic,
          bb.memory.subject,
          bb.memory.answers.length,
        );
        setDecision(bb, {
          state: "answer_question",
          strategy: "direct_explain",
          say,
          contentHint:
            bb.profile.teaching.answerStyle === "visual_first"
              ? "draw_diagram"
              : "write_board",
          emotion: bb.profile.teaching.defaultEmotion,
          reason: `BT answer · style=${bb.profile.teaching.answerStyle} · subject=${bb.memory.subject}`,
          cameraBias: "close_face",
          lightBias: "closeup_beauty",
        });
        return "success";
      },
      decideEncourage: (bb) => {
        const say = uniqueSay(bb, [
          bb.profile.phrases.celebrate,
          `${bb.profile.phrases.celebrate}. ${bb.profile.phrases.encourage}`,
          bb.profile.teaching.motivation === "challenge_forward"
            ? `${bb.profile.phrases.celebrate}. جاهزين للتحدي التالي؟`
            : `${bb.profile.phrases.celebrate} — تقدم واضح في «${bb.memory.lessonTitle}».`,
        ]);
        setDecision(bb, {
          state: "encourage",
          strategy: "celebrate",
          say,
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
        const say = uniqueSay(bb, [
          `${bb.profile.phrases.addressStudent}، مثال من الحياة عن «${topic}»، ثم نكتب الناتج.`,
          `مثال تطبيقي مباشر على «${topic}»، ثم تحقق سريع.`,
          `خلينا نمثّل «${topic}» برقم/حالة واحدة فقط على السبورة.`,
        ]);
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
        const say = uniqueSay(bb, [
          `مرحبا ${bb.profile.phrases.addressStudent}. أنا ${bb.profile.displayName.ar}. ${bb.profile.phrases.explainVerb}: ${bb.memory.lessonTitle}.`,
          `أهلاً. درسنا اليوم «${bb.memory.lessonTitle}» — مادة ${bb.memory.subject}. نبدأ بوضوح.`,
        ]);
        setDecision(bb, {
          state: "hook",
          strategy: "hook",
          say,
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
        const say = uniqueSay(bb, [
          `${bb.profile.phrases.checkPhrase}: ما الفكرة الأساسية في «${topic}»؟`,
          `تقييم سريع: اشرحوا «${topic}» بجملة واحدة بكلامكم.`,
          `قبل ما نكمل — هل «${topic}» واضح؟ جاوبوا بجملة قصيرة.`,
        ]);
        bb.memory = setWaitingForAnswer(bb.memory, say);
        setDecision(bb, {
          state: "wait_answer",
          strategy: "check",
          say,
          contentHint: "ask_check",
          emotion: "curious",
          reason: `BT check/wait · freq=${bb.profile.teaching.checkFrequency}`,
          cameraBias: "close_face",
          lightBias: "cool_focus",
        });
        return "success";
      },
      decideClose: (bb) => {
        const say = uniqueSay(bb, [
          `${bb.profile.phrases.celebrate}. لخّصنا ${bb.memory.lessonTitle}. إلى اللقاء.`,
          `نغلق الحصة: أهم نقطة في «${bb.memory.lessonTitle}» صارت واضحة. إلى اللقاء.`,
        ]);
        setDecision(bb, {
          state: "close",
          strategy: "close",
          say,
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
        const level = bb.memory.studentLevel;
        const candidates =
          level === "below" || pace === "slow"
            ? [
                `${bb.profile.phrases.explainVerb} ببطء: «${topic}»… نأخذ جملة جملة.`,
                `نبطّئ الإيقاع: فكرة واحدة عن «${topic}» ثم مثال صغير.`,
              ]
            : level === "above" || pace === "brisk"
              ? [
                  `${bb.profile.phrases.explainVerb}: «${topic}» — تعريف، مثال، ثم نكمل.`,
                  `بإيقاع أسرع المناسب لمستواكم: نكثّف «${topic}» ثم تطبيق.`,
                ]
              : [
                  `${bb.profile.phrases.explainVerb}: نوضح «${topic}» ثم نثبته على السبورة.`,
                  `نشرّح «${topic}» ثم نرسم/نكتب الخلاصة.`,
                ];
        const say = uniqueSay(bb, candidates);
        setDecision(bb, {
          state: "explain",
          strategy: "direct_explain",
          say,
          contentHint:
            bb.profile.teaching.boardWriting === "diagram_heavy"
              ? "draw_diagram"
              : "write_board",
          emotion: bb.profile.teaching.defaultEmotion,
          reason: `BT explain · pace=${pace} · level=${level} · subject=${bb.memory.subject}`,
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
  // Persist anti-repeat fingerprints into STM
  if (bb.lastDecision) {
    bb.memory = recordPerformanceUse(bb.memory, {
      say: bb.lastDecision.say,
      camera: bb.lastDecision.cameraBias,
    });
    if (bb.lastDecision.state !== "wait_answer") {
      bb.memory = setWaitingForAnswer(bb.memory, null);
    }
  }
  bb.pendingEvent = null;
  return bb.lastDecision!;
}

export function describeTeacherMindTree(): ReturnType<typeof buildTeacherBehaviourTree> {
  return TREE;
}
