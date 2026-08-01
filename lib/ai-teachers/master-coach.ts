/**
 * Master-coach layer — adaptive scaffolding that outpaces a typical human tutor:
 * instant rephrase levels, concrete examples, challenge stretch, praise with evidence.
 */

export type CoachLevel = "simpler" | "example" | "challenge" | "celebrate" | "hint";

export type TeacherPersona = {
  id: "sara" | "ali";
  nameAr: string;
  gender: "female" | "male";
  /** Warm Sara vs crisp Ali */
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
    if (style === "warm") {
      return `لا بأس يا بطل. أنا ${nameAr} و${ready} أبسّطها لك. ${ctx.beatTitle}: ${ctx.beatSubtitle}. نعد ببطء معاً: واحد… اثنان… ثلاثة. كرّر ورائي.`;
    }
    return `ركز معي. ${ctx.beatTitle}. المعنى ببساطة: الرقم يساوي الكمية. واحد شيء، اثنان شيئان، ثلاثة أشياء. أعد الخطوة الآن.`;
  }

  if (level === "example") {
    if (style === "warm") {
      return `مثال من حياتنا: قلم واحد على الطاولة هو واحد. قلمان هما اثنان. ثلاثة أقلام هي ثلاثة. شوف السبورة وتابع معي.`;
    }
    return `مثال عملي: كرة واحدة = واحد. كرتان = اثنان. ثلاث كرات = ثلاثة. طابق الرقم مع الكمية فوراً.`;
  }

  if (level === "challenge") {
    return `تحدٍّ سريع: إذا رأيت تفاحتين، أي رقم؟ وإذا رأيت ثلاثة نجوم؟ قل الجواب بصوت عالٍ ثم اضغط التالي.`;
  }

  if (level === "hint") {
    return `تلميح: انظر إلى عدد الأشياء، لا إلى شكلها. الكمية هي السر.`;
  }

  // celebrate
  const stars = Math.min(5, Math.max(1, Math.round(ctx.mastery)));
  return `أحسنت! أنا ${proud} فيك. حصلت على ${stars} من ٥ نجوم إتقان. ${ctx.beatTitle} صار أوضح الآن. هيا نكمل!`;
}

export function checkFeedback(
  persona: TeacherPersona,
  correct: boolean,
  answerLabel: string,
): string {
  if (correct) {
    return persona.style === "warm"
      ? `ممتاز! جوابك «${answerLabel}» صحيح. أنت تتقدم بسرعة.`
      : `صحيح. «${answerLabel}» هو الجواب الدقيق. ممتاز.`;
  }
  return persona.style === "warm"
    ? `قرّبنا! الجواب الصحيح هو «${answerLabel}». لا بأس — نتعلم بالمحاولة. هيا نعيدها معاً.`
    : `ليس بعد. الجواب الصحيح «${answerLabel}». ركّز على الكمية ثم أعد.`;
}
