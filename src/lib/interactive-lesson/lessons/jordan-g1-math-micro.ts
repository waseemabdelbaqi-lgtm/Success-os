import type { InteractiveLessonDefinition } from "@/src/lib/interactive-lesson/types";

/**
 * Focused 60–90s interactive prototype (not an MP4).
 * Flow: teacher demo → pause → MCQ → hint/re-explain → celebrate → continue.
 */
export const JORDAN_G1_MATH_MICRO_PROTOTYPE: InteractiveLessonDefinition = {
  schema: "success-os.interactive-lesson.v1",
  lessonId: "jordan-g1-math-micro-prototype",
  country: "Jordan",
  curriculum: "national",
  grade: "1",
  subject: "Mathematics",
  unit: "Addition",
  title: {
    ar: "نموذج تفاعلي: الجمع بخط الأعداد",
    en: "Interactive prototype: Number-line addition",
  },
  preparedBy: "Prepared by Mr Waseem Allabadi",
  teacherName: { ar: "أ. لاما النوري", en: "Ms. Lama Al-Nouri" },
  teacherTitle: { ar: "معلّمة مساعدة", en: "AI Assistant Teacher" },
  objectives: [
    {
      ar: "أتابع شرحاً متحركاً لـ 3 + 2 ثم أجيب بنفسي.",
      en: "I follow an animated 3 + 2 demo, then answer myself.",
    },
  ],
  estimatedMinutes: 2,
  nextLessonHint: {
    ar: "بعد الموافقة: الدرس الكامل التفاعلي",
    en: "After approval: full interactive lesson",
  },
  scenes: [
    {
      sceneId: "demo",
      sceneType: "demo",
      durationMs: 28000,
      learningGoal: { ar: "شرح 3+2 بالقفز", en: "Explain 3+2 with jumps" },
      narration: {
        ar: "شاهدوا معي على السبورة. ثلاثة زائد اثنين. نقف عند الرقم ثلاثة. قفزة إلى أربعة. قفزة إلى خمسة. الناتج خمسة.",
        en: "Watch the board with me. Three plus two. Stand on three. Jump to four. Jump to five. The sum is five.",
      },
      captions: {
        ar: "3 → 4 → 5 · الناتج 5",
        en: "3 → 4 → 5 · sum 5",
      },
      board: "jumps",
      visualTimeline: [
        { atMs: 400, action: "show_line" },
        { atMs: 1200, action: "show_equation", value: "3 + 2 = ?" },
        { atMs: 4500, action: "place_start", value: 3 },
        { atMs: 9000, action: "jump", from: 3, to: 4 },
        { atMs: 14000, action: "jump", from: 4, to: 5 },
        { atMs: 19000, action: "show_equation", value: "3 + 2 = 5" },
        { atMs: 22000, action: "celebrate" },
      ],
      interactionType: "none",
      correctAnswer: 0,
      accessibilityText: {
        ar: "عرض متحرك: ثلاثة زائد اثنين يساوي خمسة",
        en: "Animated demo: three plus two equals five",
      },
      completionRule: "auto",
      audio: {
        ar: "/interactive-lessons/g1-math/audio/ar/demo-3-plus-2.mp3",
        en: "/interactive-lessons/g1-math/audio/en/demo-3-plus-2.mp3",
      },
    },
    {
      sceneId: "your-turn",
      sceneType: "your_turn",
      durationMs: 7000,
      learningGoal: { ar: "دورك", en: "Your turn" },
      narration: {
        ar: "دورك الآن. ثلاثة زائد اثنين يساوي كام؟ اختر الإجابة. لن أكمل حتى تجيب.",
        en: "Your turn. What is three plus two? Choose an answer. I will wait until you reply.",
      },
      captions: { ar: "٣ + ٢ = ؟ · دورك", en: "3 + 2 = ? · Your turn" },
      board: "jumps",
      visualTimeline: [
        { atMs: 200, action: "show_line" },
        { atMs: 400, action: "place_start", value: 3 },
        { atMs: 700, action: "show_equation", value: "3 + 2 = ?" },
      ],
      interactionType: "mcq",
      question: { ar: "٣ + ٢ = ؟", en: "3 + 2 = ?" },
      answerOptions: [
        { ar: "4", en: "4" },
        { ar: "5", en: "5" },
        { ar: "6", en: "6" },
      ],
      correctAnswer: 1,
      firstHint: {
        ar: "ابدأ من 3، ثم اقفز قفزتين لليمين فقط.",
        en: "Start at 3, then make only two jumps right.",
      },
      secondExplanation: {
        ar: "من 3 إلى 4، ثم من 4 إلى 5. إذن الناتج 5.",
        en: "From 3 to 4, then 4 to 5. So the answer is 5.",
      },
      correctFeedback: { ar: "أحسنت! الناتج 5. اضغط متابعة.", en: "Great! The sum is 5. Press Continue." },
      incorrectFeedback: { ar: "حاول بهدوء مرة أخرى.", en: "Try again calmly." },
      accessibilityText: { ar: "سؤال تفاعلي يتوقف عنده الدرس", en: "Interactive question that pauses the lesson" },
      completionRule: "interaction",
      easierBoard: "jumps",
      easierVisualTimeline: [
        { atMs: 200, action: "show_line" },
        { atMs: 500, action: "place_start", value: 3 },
        { atMs: 1500, action: "jump", from: 3, to: 4 },
        { atMs: 3200, action: "jump", from: 4, to: 5 },
        { atMs: 4800, action: "show_equation", value: "3 + 2 = 5" },
      ],
      audio: {
        ar: "/interactive-lessons/g1-math/audio/ar/guided-1.mp3",
        en: "/interactive-lessons/g1-math/audio/en/guided-1.mp3",
      },
    },
    {
      sceneId: "result",
      sceneType: "result",
      durationMs: 8000,
      learningGoal: { ar: "تشجيع", en: "Celebration" },
      narration: {
        ar: "ممتاز! أنهيت النموذج التفاعلي. الجمع بخط الأعداد يعني القفز لليمين.",
        en: "Excellent! You finished the interactive prototype. Number-line addition means jumping right.",
      },
      captions: { ar: "أحسنت · النموذج التفاعلي اكتمل", en: "Well done · interactive prototype complete" },
      board: "celebrate",
      visualTimeline: [
        { atMs: 200, action: "celebrate" },
        { atMs: 600, action: "show_equation", value: "3 + 2 = 5 ★" },
      ],
      interactionType: "none",
      correctAnswer: 0,
      accessibilityText: { ar: "نتيجة النموذج والتشجيع", en: "Prototype result and encouragement" },
      completionRule: "continue",
      audio: {
        ar: "/interactive-lessons/g1-math/audio/ar/result.mp3",
        en: "/interactive-lessons/g1-math/audio/en/result.mp3",
      },
    },
  ],
};
