import type { LessonModuleContent } from "@/src/lib/digital-library/types";

/**
 * Jordan · Grade 2 · Mathematics — place value (tens & ones)
 * Original SUCCESS OS elementary lesson.
 */
export const JORDAN_G2_MATH_TENS_ONES: LessonModuleContent = {
  slug: "jordan-g2-math-tens-ones",
  title: "العشرات والآحاد",
  subtitle: "الأردن · الصف الثاني · الرياضيات · القيمة المكانية",
  estimatedMinutes: 35,
  learningObjectives: [
    "أن يفكّك المتعلم عددًا من منزلتين إلى عشرات وآحاد.",
    "أن يمثّل العدد بحزم عشرات ووحدات منفردة.",
    "أن يقرأ ويكتب أعدادًا مثل $34 = 3$ عشرات و $4$ آحاد.",
    "أن يحلّ مسألة قصيرة باستخدام القيمة المكانية.",
  ],
  knowledgeMarkdown: `
## ما العشرة؟ وما الآحاد؟

العدد ذو المنزلتين يتكوّن من:

- **العشرات**: مجموعات من عشرة.
- **الآحاد**: الوحدات المتبقية (أقل من عشرة).

$$
34 = 3 \\text{ عشرات} + 4 \\text{ آحاد} = 30 + 4
$$

### على خط الأعداد / بالحزم

- كل **حزمة** = $10$.
- الوحدات خارج الحزم = الآحاد.

### مثال أردني

«في صندوق أقلام الصف $2$ علب × $10$ أقلام، و $5$ أقلام مفردة.»

$$
2 \\text{ عشرات} + 5 \\text{ آحاد} = 25
$$

### تحقق سريع

اقرأ العدد من اليسار: منزلة العشرات ثم منزلة الآحاد.
`,
  visualizer: {
    kind: "numberline",
    caption: "شاهد كيف تتجمّع القفزات في مجموعات — تمهيد بصري لفهم العشرات على الخط.",
  },
  examples: [
    {
      difficulty: "Easy",
      title: "فكّك 27",
      prompt: "كم عشرة وكم واحدًا في $27$؟",
      steps: ["$20$ عشرتان", "$7$ آحاد", "$27 = 2$ عشرات و $7$ آحاد"],
      finalAnswer: "عشرتان وسبعة آحاد",
    },
    {
      difficulty: "Medium",
      title: "كوّن العدد",
      prompt: "لديك $4$ عشرات و $1$ آحاد. ما العدد؟",
      steps: ["$4 \\times 10 = 40$", "$40 + 1 = 41$"],
      finalAnswer: "$41$",
    },
    {
      difficulty: "Hard",
      title: "مسألة أقلام",
      prompt: "علبة فيها $3$ عشرات أقلام وبقي $8$ أقلام. كم قلمًا كلها؟",
      steps: ["$3$ عشرات = $30$", "$30 + 8 = 38$"],
      finalAnswer: "$38$ قلمًا",
    },
  ],
  quiz: [
    {
      id: "t1",
      type: "mcq",
      prompt: "$52$ يعني:",
      choices: [
        "5 آحاد و 2 عشرات",
        "5 عشرات و 2 آحاد",
        "52 عشرات",
        "7 آحاد فقط",
      ],
      correctIndex: 1,
      hint: "الرقم على اليسار للعشرات.",
      explanation: "$5$ في منزلة العشرات و $2$ في الآحاد.",
    },
    {
      id: "t2",
      type: "mcq",
      prompt: "3 عشرات و 0 آحاد =",
      choices: ["$3$", "$30$", "$13$", "$300$"],
      correctIndex: 1,
      hint: "كل عشرة = 10.",
      explanation: "$3 \\times 10 = 30$.",
    },
    {
      id: "t3",
      type: "open",
      prompt: "اكتب $46$ على صورة عشرات + آحاد.",
      sampleAnswer: "$4$ عشرات و $6$ آحاد أو $40+6$",
      hint: "اقسم إلى 40 و 6.",
      explanation: "$46 = 40 + 6$.",
    },
  ],
  sources: [
    {
      label: "SUCCESS OS · Jordan Elementary Stage",
      url: "/curriculum/jordan/elementary",
    },
    {
      label: "Minhaji · Grade 2 structure index",
      url: "https://minhaji.net/lesson/3",
    },
  ],
};
