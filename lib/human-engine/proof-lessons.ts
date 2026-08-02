/**
 * Proof lessons — real ≥60s teaching scripts differentiated per teacher.
 */
import type { HumanCharacterId, HumanLessonInput } from "@/types/human-engine";
import { getTeacherPersona } from "./teacher-persona";

export type ProofLessonId =
  | "g1_count_three"
  | "forces_law_lab"
  | "fractions_half";

export type ProofLessonMeta = {
  id: ProofLessonId;
  title: string;
  titleAr: string;
  subject: string;
  grade: string;
  minDurationMs: number;
  descriptionAr: string;
};

export const PROOF_LESSONS: ProofLessonMeta[] = [
  {
    id: "g1_count_three",
    title: "Count to Three",
    titleAr: "العد حتى ثلاثة",
    subject: "math",
    grade: "g1",
    minDurationMs: 65000,
    descriptionAr: "درس صفّي حي: كتابة، عدّ، رسم، سؤال، وإعادة شرح",
  },
  {
    id: "forces_law_lab",
    title: "Force Law + Lab",
    titleAr: "قانون القوة وتجربة",
    subject: "science",
    grade: "g7",
    minDurationMs: 70000,
    descriptionAr: "قانون F=ma، رسم، نموذج 3D، تجربة، وسؤال طالب",
  },
  {
    id: "fractions_half",
    title: "Half of a Whole",
    titleAr: "النصف من الكل",
    subject: "math",
    grade: "g2",
    minDurationMs: 65000,
    descriptionAr: "مفهوم النصف: كتابة، رسم، نموذج، تحقق فهم",
  },
];

export function listProofLessons(): ProofLessonMeta[] {
  return PROOF_LESSONS;
}

export function getProofLessonMeta(id: string): ProofLessonMeta {
  return PROOF_LESSONS.find((l) => l.id === id) || PROOF_LESSONS[0]!;
}

export function buildProofLessonInput(
  lessonId: ProofLessonId | string,
  teacherId: HumanCharacterId,
): HumanLessonInput {
  const meta = getProofLessonMeta(lessonId);
  const p = getTeacherPersona(teacherId);
  const isAli = p.id === "ali";

  if (meta.id === "forces_law_lab") {
    return {
      lessonId: `proof_${meta.id}_${p.id}`,
      title: meta.title,
      titleAr: meta.titleAr,
      subject: meta.subject,
      grade: meta.grade,
      language: "ar",
      preferredCharacterId: p.id,
      durationMs: meta.minDurationMs,
      blocks: [
        {
          id: "hook",
          kind: "hook",
          text: isAli
            ? `أهلاً ${p.addressStudent}. أنا ${p.displayName.ar}. اليوم ${p.explainVerb}: قانون القوة، رسم، نموذج ثلاثي الأبعاد، وتجربة.`
            : `مرحبا ${p.addressStudent}. أنا ${p.displayName.ar}. هيا ${p.explainVerb}: قانون القوة، رسم، نموذج، وتجربة بسيطة.`,
        },
        {
          id: "law",
          kind: "explain",
          text: isAli
            ? "اكتبوا القانون بدقة على السبورة: القوة تساوي الكتلة في التسارع. F = m × a. كل رمز له معنى."
            : "اكتبوا معي على السبورة بلطف: القوة تساوي الكتلة في التسارع. F = m × a. شوفوا كل حرف.",
        },
        {
          id: "draw",
          kind: "example",
          text: isAli
            ? "الآن أرسم مخطط القوة: سهم للاتجاه ونقطة للجسم. لاحظوا ميل السهم."
            : "الآن برسم سهم القوة على السبورة. خلينا نرسم ببطء ونشوف الاتجاه.",
        },
        {
          id: "model",
          kind: "example",
          text: isAli
            ? "هذا نموذج ثلاثي الأبعاد للجسم. أمسكه، أديره، ثم أكبّره لنشوف التفاصيل، وبعدها أصغّره."
            : "وهذا نموذج ثلاثي الأبعاد. أمسكه بهدوء، أديره، أكبّره شوي، وبعدين أصغّره.",
        },
        {
          id: "experiment",
          kind: "practice",
          text: isAli
            ? "نجرب في المختبر: نزيد القوة ونلاحظ التسارع. ركّزوا على التغير أثناء التجربة."
            : "نجرب معاً: نزيد القوة ونشوف التسارع. لاحظوا التغير على الشاشة.",
        },
        {
          id: "check",
          kind: "check",
          text: isAli
            ? `${p.checkPhrase}: إذا زادت الكتلة وثبتت القوة، ماذا يحدث للتسارع؟`
            : `${p.checkPhrase}: إذا صارت الكتلة أكبر والقوة ثابتة، شو بصير للتسارع؟`,
        },
        {
          id: "close",
          kind: "close",
          text: isAli
            ? `${p.celebrate}. القانون والرسم والتجربة والنموذج اشتغلوا معاً. إلى اللقاء.`
            : `${p.celebrate}. كتبنا ورسمنا وجربنا وفهمنا. إلى اللقاء.`,
        },
      ],
    };
  }

  if (meta.id === "fractions_half") {
    return {
      lessonId: `proof_${meta.id}_${p.id}`,
      title: meta.title,
      titleAr: meta.titleAr,
      subject: meta.subject,
      grade: meta.grade,
      language: "ar",
      preferredCharacterId: p.id,
      durationMs: meta.minDurationMs,
      blocks: [
        {
          id: "hook",
          kind: "hook",
          text: `مرحبا ${p.addressStudent}. أنا ${p.displayName.ar}. اليوم نتعلم النصف من الكل.`,
        },
        {
          id: "write",
          kind: "explain",
          text: isAli
            ? "اكتبوا على السبورة: النصف يعني قسمة الكل إلى قسمين متساويين. 1/2."
            : "اكتبوا معي: النصف يعني نقسم الشيء لنصفين متساويين. 1/2.",
        },
        {
          id: "draw",
          kind: "example",
          text: "أرسم دائرة وأقسمها بخط في المنتصف. شوفوا كيف النصفين متساويين.",
        },
        {
          id: "model",
          kind: "example",
          text: "هذا نموذج ثلاثي الأبعاد لتفاحة. أمسكه، أديره، ثم أكبّره لنشوف خط النصف.",
        },
        {
          id: "check",
          kind: "check",
          text: `${p.checkPhrase}: إذا قسمنا مستطيلاً لنصفين متساويين، كم نصفاً لدينا؟`,
        },
        {
          id: "close",
          kind: "encourage",
          text: `${p.celebrate}. النصف صار واضحاً. إلى اللقاء.`,
        },
      ],
    };
  }

  // g1_count_three default
  return {
    lessonId: `proof_${meta.id}_${p.id}`,
    title: meta.title,
    titleAr: meta.titleAr,
    subject: meta.subject,
    grade: meta.grade,
    language: "ar",
    preferredCharacterId: p.id,
    durationMs: meta.minDurationMs,
    blocks: [
      {
        id: "hook",
        kind: "hook",
        text: isAli
          ? `أهلاً ${p.addressStudent}. أنا ${p.displayName.ar}. اليوم نعدّ بوضوح حتى ثلاثة.`
          : `مرحبا ${p.addressStudent}. أنا ${p.displayName.ar}. هيا نعدّ معاً حتى ثلاثة.`,
      },
      {
        id: "one",
        kind: "explain",
        text: isAli
          ? "شوف السبورة. بكتب الرقم واحد. واحد يعني كمية واحدة فقط. عدّوا: واحد."
          : "شوفوا السبورة معي. برسم الرقم واحد. واحد يعني شيء واحد. عدّوا وراي: واحد.",
      },
      {
        id: "two",
        kind: "example",
        text: isAli
          ? "الآن اثنان. أكتب ٢ وأشير إلى تفاحتين. لاحظوا الترتيب: بعد الواحد يأتي اثنان."
          : "هلا اثنين. بكتب ٢ وبرسم تفاحتين. شوفوا كيف صارت أكثر من واحدة.",
      },
      {
        id: "three",
        kind: "example",
        text: isAli
          ? "ثلاثة. أكتب ٣ على السبورة. هذا نموذج ثلاثي الأبعاد لثلاث كرات. أمسكه وأديره ثم أكبّره."
          : "ثلاثة. بكتب ٣. وهذا نموذج ثلاثي الأبعاد لثلاث نجمات. أمسكه، أديره، وأكبّره شوي.",
      },
      {
        id: "draw",
        kind: "practice",
        text: "أرسم ثلاثة نجوم على السبورة واحداً بعد الآخر. عدّوا وأنتم تشوفون الرسم.",
      },
      {
        id: "check",
        kind: "check",
        text: `${p.checkPhrase}: كم يصبح واحد زائد اثنين؟`,
      },
      {
        id: "close",
        kind: "close",
        text: `${p.celebrate}. عدَدنا وكتبنا ورسمنا. إلى اللقاء.`,
      },
    ],
  };
}
