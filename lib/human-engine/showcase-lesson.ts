/**
 * World-class showcase lesson — exercises write/draw/law/experiment/3D model acts.
 * Used by the live Human Engine studio experience.
 */
import type { HumanCharacterId, HumanLessonInput } from "@/types/human-engine";

export function showcaseLessonInput(characterId: HumanCharacterId): HumanLessonInput {
  const isAli = characterId === "ali";
  const name = isAli ? "المعلم علي" : "المعلمة سارة";

  return {
    lessonId: `he_showcase_studio_${characterId}`,
    title: "Forces & Form — Teaching Studio Showcase",
    titleAr: "القوة والشكل — عرض استوديو تعليمي",
    subject: isAli ? "science" : "math",
    grade: isAli ? "g7" : "g1",
    language: "ar",
    preferredCharacterId: characterId,
    durationMs: 48000,
    blocks: [
      {
        id: "hook",
        kind: "hook",
        text: isAli
          ? `أهلاً، أنا ${name}. اليوم ندخل استوديو تعليمي حقيقي: قانون، رسم، تجربة، ونموذج ثلاثي الأبعاد.`
          : `مرحبا، أنا ${name}. هيا ندخل استوديو تعليمي عالمي: نكتب، نرسم، ونفهم معاً.`,
      },
      {
        id: "law",
        kind: "explain",
        text: isAli
          ? "اكتبوا معي القانون على السبورة: القوة تساوي الكتلة في التسارع. F = m × a. ركّزوا على كل رمز."
          : "اكتبوا معي على السبورة: واحد زائد اثنين يساوي ثلاثة. 1 + 2 = 3. شوفوا كيف يتكون الناتج.",
      },
      {
        id: "draw",
        kind: "example",
        text: isAli
          ? "الآن أرسم مخطط القوة: سهم للاتجاه، ونقطة للجسم. لاحظوا ميل السهم وهو يوضح الاتجاه."
          : "الآن برسم نجمتين على السبورة، ثم نجمة ثالثة. عدّوا وراي وأنتم تشوفون الرسم.",
      },
      {
        id: "model",
        kind: "example",
        text: isAli
          ? "هذا نموذج ثلاثي الأبعاد للجسم. أمسكه، ثم أديره ببطء، بعدين أكبّره لنشوف التفاصيل، وبعدها أصغّره."
          : "هذا نموذج ثلاثي الأبعاد للعدد. أمسكه، أديره، ثم أكبّره، وبعدين أصغّره عشان نشوف كل جانب.",
      },
      {
        id: "experiment",
        kind: "practice",
        text: isAli
          ? "نجرب في المختبر: نزيد القوة ونلاحظ التسارع. شوفوا كيف تتغير النتيجة أثناء التجربة."
          : "نجرب معاً: نضيف تفاحة ثم تفاحتين. لاحظوا التغير على السبورة أثناء التجربة.",
      },
      {
        id: "check",
        kind: "check",
        text: isAli
          ? "فكر معي: إذا زادت الكتلة وثبتت القوة، ماذا يحدث للتسارع؟"
          : "سؤالي: كم يصبح واحد زائد اثنين؟ فكر بهدوء قبل ما تجاوب.",
      },
      {
        id: "close",
        kind: "close",
        text: isAli
          ? "أحسنت المتابعة. القانون والرسم والتجربة والنموذج اشتغلوا معاً. إلى اللقاء."
          : "أحسنت! كتبت ورسمت وجربت وفهمت. إلى اللقاء.",
      },
    ],
  };
}

export function preview10sLessonInput(characterId: HumanCharacterId): HumanLessonInput {
  const full = showcaseLessonInput(characterId);
  return {
    ...full,
    lessonId: `he_preview_10s_${characterId}`,
    durationMs: 10000,
    blocks: full.blocks.slice(0, 3),
  };
}
