/**
 * Classroom coach lines — sound like a real Jordanian teacher, respond faster.
 */

export type CoachLevel = "simpler" | "example" | "challenge" | "celebrate" | "hint";

export type TeacherPersona = {
  id: "sara" | "ali";
  nameAr: string;
  gender: "female" | "male";
  style: "warm" | "crisp";
};

function genderVerb(g: "female" | "male", male: string, female: string) {
  return g === "male" ? male : female;
}

export function coachLine(
  persona: TeacherPersona,
  level: CoachLevel,
  ctx: { beatTitle: string; beatSubtitle: string; mastery: number },
): string {
  const { nameAr, gender, style } = persona;
  const proud = genderVerb(gender, "فخور", "فخورة");
  const ready = genderVerb(gender, "جاهز", "جاهزة");

  if (level === "simpler") {
    return style === "warm"
      ? `ولا يهمك. أنا ${nameAr} و${ready} أشرح أبطأ. ${ctx.beatTitle}. المعنى: نعد الأشياء. واحد… اثنان… ثلاثة. كرّر وراي بهدوء.`
      : `تمام، نبسّط. ${ctx.beatTitle}. الرقم = الكمية. شيء واحد، شيئان، ثلاثة أشياء. أعد معي الآن.`;
  }

  if (level === "example") {
    return style === "warm"
      ? `مثال من الصف: قلم واحد على الطاولة هو واحد. قلمان اثنان. ثلاثة أقلام ثلاثة. شوف السبورة وطابق.`
      : `مثال عملي: كرة واحدة = واحد. كرتان = اثنان. ثلاث كرات = ثلاثة. طابق فوراً.`;
  }

  if (level === "challenge") {
    return `سؤال صفّي: إذا شفت تفاحتين، الرقم كم؟ وإذا شفت ثلاث نجوم؟ جاوب بصوت عالي ثم التالي.`;
  }

  if (level === "hint") {
    return `تلميح المعلم: لا تركز على الشكل… ركز على العدد.`;
  }

  const stars = Math.min(5, Math.max(1, Math.round(ctx.mastery)));
  return `أحسنت. أنا ${proud} فيك. عندك ${stars} من ٥. ${ctx.beatTitle} صار أوضح. نكمل.`;
}

export function checkFeedback(
  persona: TeacherPersona,
  correct: boolean,
  answerLabel: string,
): string {
  if (correct) {
    return persona.style === "warm"
      ? `صح عليك! «${answerLabel}» جواب صفّي ممتاز.`
      : `صحيح. «${answerLabel}» هو الجواب. ممتاز.`;
  }
  return persona.style === "warm"
    ? `قرّبنا. الجواب الصحيح «${answerLabel}». عادي، هيك بنتعلم. نعيدها.`
    : `ليس بعد. الصحيح «${answerLabel}». ركّز على الكمية وأعد.`;
}
