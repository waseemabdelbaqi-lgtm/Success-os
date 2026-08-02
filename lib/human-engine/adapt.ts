/**
 * Live student interaction — ask / re-explain with persona-differentiated replies.
 * Returns a short Human Engine micro-plan the studio can splice in.
 */
import type {
  HumanCharacterId,
  HumanLessonInput,
  HumanPerformancePlan,
} from "@/types/human-engine";
import { directLesson } from "./lesson-director";
import { getTeacherPersona } from "./teacher-persona";

export type StudentLiveEvent =
  | { type: "ask_text"; text: string }
  | { type: "explain_simpler" }
  | { type: "explain_again" }
  | { type: "example" };

export type LiveAdaptResult = {
  reply: string;
  audioKey: string | null;
  /** Micro performance plan (~8–14s) driven by the reply text */
  microPlan: HumanPerformancePlan;
  strategy: string;
};

function microInput(
  teacherId: HumanCharacterId,
  lessonTitle: string,
  text: string,
  kind: "explain" | "check" | "encourage" | "example",
): HumanLessonInput {
  return {
    lessonId: `live_adapt_${Date.now().toString(36)}`,
    title: lessonTitle,
    titleAr: lessonTitle,
    preferredCharacterId: teacherId,
    language: "ar",
    durationMs: 14000,
    blocks: [
      {
        id: "adapt",
        kind: kind === "example" ? "example" : kind === "check" ? "check" : kind === "encourage" ? "encourage" : "explain",
        text,
      },
    ],
  };
}

export function adaptLiveTeacher(opts: {
  teacherId: HumanCharacterId;
  lessonTitle: string;
  currentLine?: string;
  event: StudentLiveEvent;
}): LiveAdaptResult {
  const persona = getTeacherPersona(opts.teacherId);
  const topic = opts.currentLine?.slice(0, 48) || opts.lessonTitle;

  if (opts.event.type === "ask_text") {
    const q = opts.event.text.trim() || "السؤال";
    const reply =
      persona.interaction.reexplainStrategy === "analogy_then_steps"
        ? `${persona.answerOpener(q)}. مثل قصة قصيرة: ${topic}. ثم نرجع لخطوة واحدة واضحة على السبورة.`
        : `${persona.answerOpener(q)}. التعريف أولاً حول «${topic}»، ثم مثال تطبيقي مباشر.`;
    const microPlan = directLesson({
      input: microInput(opts.teacherId, opts.lessonTitle, reply, "explain"),
      maxDurationMs: 14000,
    });
    return {
      reply,
      audioKey: "example",
      microPlan,
      strategy: persona.interaction.reexplainStrategy,
    };
  }

  if (opts.event.type === "explain_simpler" || opts.event.type === "explain_again") {
    const reply =
      persona.interaction.reexplainStrategy === "analogy_then_steps"
        ? `${persona.reexplainOpener}. تخيّلوا ${topic} كشيء تعيشونه يومياً، وبعدها نكتب الخطوة على السبورة.`
        : `${persona.reexplainOpener}. نعرّف «${topic}» بجملة واحدة، ثم مثال، ثم تحقق سريع.`;
    const microPlan = directLesson({
      input: microInput(opts.teacherId, opts.lessonTitle, reply, "explain"),
      maxDurationMs: 14000,
    });
    return {
      reply,
      audioKey: "simpler",
      microPlan,
      strategy: persona.interaction.reexplainStrategy,
    };
  }

  // example
  const reply = persona.style === "warm"
    ? `مثال قريب: نربط «${topic}» بشيء من حياتكم، ونعدّه أو نرسمه على السبورة.`
    : `مثال تطبيقي: نطبّق «${topic}» برقم واضح على السبورة ثم نتحقق.`;
  const microPlan = directLesson({
    input: microInput(opts.teacherId, opts.lessonTitle, reply, "example"),
    maxDurationMs: 12000,
  });
  return { reply, audioKey: "example", microPlan, strategy: "example" };
}
