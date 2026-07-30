/**
 * Future-ready capability placeholders (no generation in this phase).
 */
import type { FutureCapabilityPlaceholder } from "@/types/interactive-lesson-engine";

export const FUTURE_CAPABILITY_PLACEHOLDERS: FutureCapabilityPlaceholder[] = [
  {
    id: "ai_teacher_video",
    status: "placeholder",
    label: { en: "AI teacher video", ar: "فيديو معلّم ذكي" },
    apiPath: "/api/interactive-lesson-engine/placeholders/ai-teacher-video",
    notes: {
      en: "Placeholder only — do not generate AI videos in this phase.",
      ar: "موضع فقط — لا توليد فيديو ذكي في هذه المرحلة.",
    },
  },
  {
    id: "human_recorded_lesson",
    status: "placeholder",
    label: { en: "Human recorded lesson", ar: "درس مسجّل بشريًا" },
    apiPath: "/api/interactive-lesson-engine/placeholders/human-recorded",
    notes: {
      en: "Reserved for marketplace / teacher uploads.",
      ar: "محجوز لسوق الدروس / رفع المعلّم.",
    },
  },
  {
    id: "voice_narration",
    status: "placeholder",
    label: { en: "Voice narration", ar: "سرد صوتي" },
    apiPath: "/api/interactive-lesson-engine/placeholders/voice-narration",
    notes: {
      en: "Placeholder for multilingual narration tracks.",
      ar: "موضع لمسارات السرد متعددة اللغات.",
    },
  },
  {
    id: "interactive_simulations",
    status: "placeholder",
    label: { en: "Interactive simulations", ar: "محاكاة تفاعلية" },
    apiPath: "/api/interactive-lesson-engine/placeholders/simulations",
    notes: {
      en: "3D / interactive sim runtime not shipped yet.",
      ar: "محرك المحاكاة ثلاثية الأبعاد غير مُصدَّر بعد.",
    },
  },
  {
    id: "virtual_labs",
    status: "placeholder",
    label: { en: "Virtual labs", ar: "مختبرات افتراضية" },
    apiPath: "/api/interactive-lesson-engine/placeholders/virtual-labs",
    notes: {
      en: "Placeholder for lab procedures.",
      ar: "موضع لإجراءات المختبر.",
    },
  },
  {
    id: "adaptive_learning",
    status: "placeholder",
    label: { en: "Adaptive learning", ar: "تعلّم تكيّفي" },
    apiPath: "/api/interactive-lesson-engine/placeholders/adaptive",
    notes: {
      en: "Path adaptation reserved for later phases.",
      ar: "تكيّف المسار محجوز لمراحل لاحقة.",
    },
  },
  {
    id: "quiz_engine",
    status: "placeholder",
    label: { en: "Quiz engine", ar: "محرك الاختبارات" },
    apiPath: "/api/interactive-lesson-engine/placeholders/quiz-engine",
    notes: {
      en: "Inline practice exists; full quiz engine later.",
      ar: "تدريب مضمّن موجود؛ محرك اختبار كامل لاحقًا.",
    },
  },
  {
    id: "unit_tests",
    status: "placeholder",
    label: { en: "Unit tests", ar: "اختبارات الوحدة" },
    apiPath: "/api/interactive-lesson-engine/placeholders/unit-tests",
    notes: {
      en: "Unit-level assessment placeholder.",
      ar: "موضع تقييم على مستوى الوحدة.",
    },
  },
  {
    id: "final_exams",
    status: "placeholder",
    label: { en: "Final exams", ar: "امتحانات نهائية" },
    apiPath: "/api/interactive-lesson-engine/placeholders/final-exams",
    notes: {
      en: "Subject / stage finals — not generated here.",
      ar: "نهائيات المادة / المرحلة — لا تُولَّد هنا.",
    },
  },
];
