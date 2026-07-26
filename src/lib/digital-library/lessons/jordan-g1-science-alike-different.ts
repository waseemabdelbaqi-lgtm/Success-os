import type { LessonModuleContent } from "@/src/lib/digital-library/types";
import { JORDAN_G1_SCIENCE_ALIKE_TEACHER_35M } from "@/src/lib/digital-library/teacher-explanations/jordan-g1-science-alike-35m";

/**
 * Jordan · Grade 1 · Science — الإنسان والصحة
 * Original SUCCESS OS lesson aligned to elementary structure titles.
 * Full teacher explanation: أ. رنيم العبادي — warm age-fit voice (35 min).
 */
export const JORDAN_G1_SCIENCE_ALIKE_DIFFERENT: LessonModuleContent = {
  slug: "jordan-g1-science-alike-different",
  title: "نحن متشابهون ومختلفون",
  subtitle:
    "الأردن · الصف الأول · العلوم · أ. رنيم العبادي · شرح حنّي 35د",
  estimatedMinutes: 35,
  teacherExplanation: JORDAN_G1_SCIENCE_ALIKE_TEACHER_35M,
  learningObjectives: [
    "أن يلاحظ المتعلم صفات مشتركة بين البشر (عيون، أيدي، حاجة للطعام والماء).",
    "أن يميّز اختلافات بسيطة محترمة (الطول، لون الشعر، الهوايات).",
    "أن يربط التشابه والاختلاف بالاحترام والتنوع في الصف الأردني.",
    "أن يصنّف صورًا/أمثلة إلى «متشابه» و«مختلف» مع تبرير قصير.",
  ],
  knowledgeMarkdown: `
## فكرة الدرس

كلنا **بشر** — نتشابه في حاجات أساسية، ونختلف في تفاصيل تجعل كل شخص مميزًا.

### نتشابه لأننا

- نحتاج **طعامًا وماءً وهواءً**.
- لنا **حواس** تساعدنا نعرف العالم.
- ننمو ونتعلّم ونلعب.

### نختلف باحترام

- الطول ولون الشعر واللغة الأم واللهجة.
- الأطعمة المفضّلة والألعاب والهوايات.
- الاختلاف **ليس أفضل أو أسوأ** — هو تنوع جميل.

### نشاط صفّي أردني

«في ساحة المدرسة: ما الصفة المشتركة بين زملائك؟ وما صفة مختلفة لطيفة تحترمها؟»

### قاعدة ذهبية

نحتفل بما يجمعنا، ونحترم ما يميّز كل واحد منا.
`,
  visualizer: {
    kind: "orbital",
    caption: "مجسّم رمزي: نواة مشتركة (الإنسان) ومدارات اختلافات محترمة تدور حولها.",
  },
  examples: [
    {
      difficulty: "Easy",
      title: "صفة مشتركة",
      prompt: "أي مما يلي صفة مشتركة بين معظم الأطفال؟",
      steps: [
        "فكّر: هل الجميع يحتاج الماء؟",
        "نعم — الحاجة للماء مشتركة.",
      ],
      finalAnswer: "الحاجة إلى الماء والطعام صفة مشتركة.",
    },
    {
      difficulty: "Medium",
      title: "صفة مختلفة محترمة",
      prompt: "سارة تحب كرة القدم، وأحمد يحب الرسم. هل هذا اختلاف مقبول؟ لماذا؟",
      steps: [
        "الهوايات تختلف بين الأشخاص.",
        "الاختلاف هنا لا يؤذي أحدًا.",
        "نحترم اختيار كل صديق.",
      ],
      finalAnswer: "نعم، اختلاف الهوايات تنوع محترم.",
    },
    {
      difficulty: "Hard",
      title: "صنّف بنفسك",
      prompt: "صنّف: (لون العين) و(الحاجة للنوم) إلى متشابه/مختلف بين زملاء الصف.",
      steps: [
        "لون العين غالبًا يختلف → مختلف.",
        "الحاجة للنوم عامة للجميع → متشابه.",
      ],
      finalAnswer: "لون العين: مختلف · الحاجة للنوم: متشابه.",
    },
  ],
  quiz: [
    {
      id: "s1",
      type: "mcq",
      prompt: "أي جملة صحيحة؟",
      choices: [
        "يجب أن نتشابه في كل شيء",
        "نتشابه في حاجات أساسية ونختلف باحترام",
        "الاختلاف يعني أن أحدنا أفضل",
        "لا نتشابه أبدًا",
      ],
      correctIndex: 1,
      hint: "تذكّر القاعدة الذهبية.",
      explanation: "التشابه في الحاجات + احترام الاختلاف هو جوهر الدرس.",
    },
    {
      id: "s2",
      type: "mcq",
      prompt: "الحاجة إلى الهواء مثال على:",
      choices: ["اختلاف", "تشابه أساسي", "هواية", "لون شعر"],
      correctIndex: 1,
      hint: "هل يحتاجها الجميع؟",
      explanation: "الجميع يحتاج الهواء — صفة مشتركة.",
    },
    {
      id: "s3",
      type: "open",
      prompt: "اكتب صفة واحدة تشبه بها زميلك، وصفة واحدة تختلفان فيها باحترام.",
      sampleAnswer: "نتشابه: نحب اللعب · نختلف: لون الشعر / الهواية",
      hint: "فكّر بحواس وحاجات وهوايات.",
      explanation: "أي إجابة محترمة توضّح تشابهًا واختلافًا مقبولين.",
    },
  ],
  sources: [
    {
      label: "SUCCESS OS · Jordan Elementary Stage",
      url: "/curriculum/jordan/elementary",
    },
    {
      label: "NCCD Grade 1 catalogue",
      url: "https://nccd.gov.jo/ar/pages/TextBooksGrade/68",
    },
  ],
};
