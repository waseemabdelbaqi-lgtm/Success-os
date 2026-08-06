import type {
  StudioAdaptResponse,
  StudentStudioEvent,
  StudioLessonPlan,
} from "@/types/digital-human-studio";
import type { LearningPace, TeachingStyle } from "@/types/ai-teacher-engine";
import { coachLine, checkFeedback } from "@/lib/ai-teachers/master-coach";
import { directBehaviors, buildBoardCues } from "./behavior-director";

type Style = TeachingStyle;
type Pace = LearningPace;

export function adaptStudioSession(
  plan: StudioLessonPlan,
  event: StudentStudioEvent,
  sceneIndex: number,
): StudioAdaptResponse {
  const cast = plan.cast;
  const persona = {
    id: (cast.id === "ali" ? "ali" : "sara") as "sara" | "ali",
    nameAr: cast.displayNameAr,
    gender: cast.gender,
    style: cast.style,
  };
  const scene = plan.scenes[sceneIndex] ?? plan.scenes[0]!;
  const ctx = {
    beatTitle: scene.title,
    beatSubtitle: plan.analysis.summaryAr,
    mastery: 3,
  };

  if (event.type === "explain_simpler" || event.type === "explain_again") {
    const styleShift: Style = "simplified";
    const reply = coachLine(persona, "simpler", ctx);
    return {
      reply,
      audioKey: "simpler",
      styleShift,
      paceShift: "slow" as Pace,
      appendScene: {
        ...scene,
        id: `${scene.id}-reexplain-${Date.now()}`,
        purpose: "explain",
        teacherSay: reply,
        behaviors: directBehaviors({
          purpose: "explain",
          say: reply,
          analysis: { ...plan.analysis, teachingStyle: styleShift },
          sceneIndex: sceneIndex + 50,
        }),
        board: buildBoardCues({
          title: scene.title,
          purpose: "explain",
          analysis: plan.analysis,
          body: reply,
        }),
        transition: "dissolve",
      },
    };
  }

  if (event.type === "example") {
    return { reply: coachLine(persona, "example", ctx), audioKey: "example" };
  }
  if (event.type === "challenge") {
    return { reply: coachLine(persona, "challenge", ctx), audioKey: "challenge" };
  }
  if (event.type === "ask_text" || event.type === "ask_voice") {
    const q = event.type === "ask_text" ? event.text : event.transcript;
    const reply =
      cast.style === "warm"
        ? `سؤال ممتاز. بخصوص «${q.slice(0, 80)}»: نرجع للمفهوم الأساسي في «${scene.title}» ونربطه بمثال بسيط.`
        : `حسناً. سؤالك عن «${q.slice(0, 80)}» يُجاب عبر تعريف الدرس ثم مثال تطبيقي مباشر.`;
    return { reply, audioKey: null };
  }

  // default acknowledgement
  return {
    reply: checkFeedback(persona, true, "متابعة"),
    audioKey: "correct",
  };
}
