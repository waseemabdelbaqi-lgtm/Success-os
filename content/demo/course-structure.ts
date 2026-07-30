/**
 * Demo Course package — Course → Unit → Lesson with full lesson blocks.
 * Explicitly demo; not production curriculum.
 */
import type { CourseDefinition } from "@/types/course-structure";
import { LESSON_BLOCK_ORDER } from "@/types/course-structure";

export const COURSE_DEMO_META = {
  isDemo: true as const,
  source: "course-structure-demo",
  version: "2026.07.30",
  disclaimer:
    "Demo Course → Unit → Lesson structure for Success OS. Replace with production curriculum packages after academic review.",
};

function lessonBlocksBase(overrides: Partial<CourseDefinition["units"][0]["lessons"][0]["blocks"]> = {}) {
  return {
    interactiveSlides: [
      {
        id: "s1",
        title: { en: "Warm-up", ar: "تهيئة" },
        body: {
          en: "What do you already know about electric current?",
          ar: "ماذا تعرف مسبقًا عن التيار الكهربائي؟",
        },
        kind: "intro" as const,
      },
      {
        id: "s2",
        title: { en: "Core idea", ar: "الفكرة الأساسية" },
        body: {
          en: "Current is the rate of charge flow: I = Q ÷ t.",
          ar: "التيار هو معدل تدفق الشحنة: I = Q ÷ t.",
        },
        kind: "concept" as const,
        visualPrompt: {
          en: "Simple circuit with ammeter",
          ar: "دائرة بسيطة مع أميتر",
        },
      },
      {
        id: "s3",
        title: { en: "Worked example", ar: "مثال محلول" },
        body: {
          en: "If 20 C pass in 5 s, I = 4 A.",
          ar: "إذا مرت 20 C خلال 5 s فإن I = 4 A.",
        },
        kind: "example" as const,
      },
      {
        id: "s4",
        title: { en: "Check", ar: "تحقق" },
        body: {
          en: "18 C in 6 s → find I.",
          ar: "مرّت 18 C خلال 6 s. احسب التيار.",
        },
        kind: "practice" as const,
      },
    ],
    teacherVideo: {
      status: "not-produced" as const,
      title: {
        en: "Teacher: Charge and current",
        ar: "المعلم: الشحنة والتيار",
      },
      durationMinutes: 18,
      videoUrl: null,
      chapters: [
        { id: "c1", title: { en: "Hook", ar: "افتتاح" }, startSeconds: 0 },
        { id: "c2", title: { en: "Definition", ar: "تعريف" }, startSeconds: 120 },
        { id: "c3", title: { en: "Examples", ar: "أمثلة" }, startSeconds: 420 },
      ],
      note: {
        en: "Recorded teacher video is not produced yet. Script/storyboard is never labeled as finished video.",
        ar: "فيديو المعلم المسجّل غير مُنتَج بعد. لا يُعتبر السيناريو فيديوًا نهائيًا.",
      },
    },
    aiExplanation: {
      summary: {
        en: "Electric current measures how quickly charge moves past a point in a circuit.",
        ar: "يقيس التيار الكهربائي سرعة مرور الشحنة عبر نقطة في الدائرة.",
      },
      steps: [
        {
          en: "Identify charge Q in coulombs and time t in seconds.",
          ar: "حدّد الشحنة Q بالكولوم والزمن t بالثواني.",
        },
        {
          en: "Apply I = Q ÷ t and report the answer in amperes (A).",
          ar: "طبّق I = Q ÷ t واكتب الناتج بالأمبير (A).",
        },
        {
          en: "Check units and whether the result is realistic for the circuit.",
          ar: "تحقق من الوحدات ومن واقعية الناتج للدائرة.",
        },
      ],
      keyIdeas: [
        { en: "1 A = 1 C/s", ar: "1 A = 1 C/s" },
        {
          en: "Current is a rate, not an amount of charge.",
          ar: "التيار معدّل وليس كمية شحنة.",
        },
      ],
      commonMistakes: [
        {
          en: "Swapping Q and t in the formula.",
          ar: "عكس موضعي Q و t في القانون.",
        },
        {
          en: "Mixing minutes with seconds.",
          ar: "خلط الدقائق مع الثواني.",
        },
      ],
    },
    simulation3d: {
      status: "planned" as const,
      title: {
        en: "Circuit charge-flow simulation",
        ar: "محاكاة تدفق الشحنة في الدائرة",
      },
      purpose: {
        en: "Visualize charge carriers moving through a wire while an ammeter reading updates.",
        ar: "تصوّر حركة حاملات الشحنة في سلك مع تحديث قراءة الأميتر.",
      },
      subject: "physics",
      controls: [
        { en: "Adjust charge amount", ar: "ضبط كمية الشحنة" },
        { en: "Adjust time window", ar: "ضبط نافذة الزمن" },
      ],
      placeholderNote: {
        en: "3D runtime ships later; this block reserves the lesson slot.",
        ar: "محرك المحاكاة ثلاثية الأبعاد لاحقًا؛ هذه الخانة محجوزة في الدرس.",
      },
    },
    notes: {
      studentNotes: {
        en: "Current I is charge per unit time. Keep units consistent. Practice with at least three numerical examples.",
        ar: "التيار I هو الشحنة لكل وحدة زمن. حافظ على اتساق الوحدات. تدرّب على ثلاثة أمثلة عددية على الأقل.",
      },
      teacherNotes: {
        en: "Pause after the worked example and ask students to predict before revealing I.",
        ar: "توقّف بعد المثال المحلول واطلب من الطلاب التوقع قبل إظهار I.",
      },
      parentNotes: {
        en: "Ask your learner to explain I = Q ÷ t in their own words.",
        ar: "اطلب من المتعلم شرح I = Q ÷ t بكلماته.",
      },
      keyTakeaways: [
        { en: "I = Q ÷ t", ar: "I = Q ÷ t" },
        { en: "Ampere is coulomb per second", ar: "الأمبير = كولوم لكل ثانية" },
      ],
    },
    attachments: [
      {
        id: "a1",
        title: { en: "Formula sheet (draft)", ar: "ورقة القوانين (مسودة)" },
        kind: "pdf" as const,
        url: null,
        protected: true,
        description: {
          en: "Printable notes after academic review.",
          ar: "ملاحظات قابلة للطباعة بعد المراجعة الأكاديمية.",
        },
      },
      {
        id: "a2",
        title: { en: "Circuit diagram worksheet", ar: "ورقة عمل مخطط الدائرة" },
        kind: "worksheet" as const,
        url: null,
        protected: false,
      },
    ],
    interactiveQuestions: [
      {
        id: "iq1",
        prompt: {
          en: "If 10 C pass in 2 s, what is the current?",
          ar: "إذا مرت 10 C خلال 2 s فما التيار؟",
        },
        type: "mcq" as const,
        options: [
          { en: "5 A", ar: "5 A" },
          { en: "20 A", ar: "20 A" },
          { en: "8 A", ar: "8 A" },
          { en: "0.2 A", ar: "0.2 A" },
        ],
        answer: "0",
        explanation: {
          en: "I = 10 ÷ 2 = 5 A.",
          ar: "I = 10 ÷ 2 = 5 A.",
        },
      },
      {
        id: "iq2",
        prompt: {
          en: "Current is an amount of charge stored in a battery. True or false?",
          ar: "التيار كمية شحنة مخزّنة في البطارية. صحيح أم خطأ؟",
        },
        type: "true_false" as const,
        options: [
          { en: "True", ar: "صحيح" },
          { en: "False", ar: "خطأ" },
        ],
        answer: "1",
        explanation: {
          en: "False — current is a rate of charge flow.",
          ar: "خطأ — التيار معدّل تدفق الشحنة.",
        },
      },
    ],
    aiChat: {
      enabled: true,
      starterPrompts: [
        {
          en: "Explain current like I am new to physics.",
          ar: "اشرح التيار كأنني مبتدئ في الفيزياء.",
        },
        {
          en: "Give me another worked example with different numbers.",
          ar: "أعطني مثالًا محلولًا بأرقام مختلفة.",
        },
        {
          en: "What units must match when using I = Q ÷ t?",
          ar: "ما الوحدات التي يجب أن تتوافق عند استخدام I = Q ÷ t؟",
        },
      ],
      systemHint: {
        en: "Stay on this lesson: charge, current, and I = Q ÷ t. Do not invent curriculum claims.",
        ar: "ابقَ ضمن هذا الدرس: الشحنة والتيار و I = Q ÷ t. لا تختلق متطلبات منهجية.",
      },
      endpoint: "/api/student/lesson-chat",
    },
    homework: [
      {
        id: "hw1",
        title: { en: "Three calculations", ar: "ثلاثة حسابات" },
        instructions: {
          en: "Solve three I = Q ÷ t problems and show units each time.",
          ar: "حل ثلاث مسائل I = Q ÷ t مع إظهار الوحدات في كل مرة.",
        },
        estimatedMinutes: 20,
      },
      {
        id: "hw2",
        title: { en: "Explain in writing", ar: "اشرح كتابةً" },
        instructions: {
          en: "Write 5–7 sentences explaining why current is a rate.",
          ar: "اكتب 5–7 جمل تشرح لماذا التيار معدّل.",
        },
        estimatedMinutes: 15,
      },
    ],
    quiz: [
      {
        id: "q1",
        question: {
          en: "What is the SI unit of electric current?",
          ar: "ما وحدة التيار الكهربائي في النظام الدولي؟",
        },
        options: [
          { en: "Volt", ar: "فولت" },
          { en: "Ampere", ar: "أمبير" },
          { en: "Ohm", ar: "أوم" },
          { en: "Watt", ar: "واط" },
        ],
        answerIndex: 1,
        explanation: {
          en: "Current is measured in amperes (A).",
          ar: "يُقاس التيار بالأمبير (A).",
        },
      },
      {
        id: "q2",
        question: {
          en: "30 C pass a point in 10 s. Current equals…",
          ar: "مرت 30 C عبر نقطة خلال 10 s. التيار يساوي…",
        },
        options: [
          { en: "3 A", ar: "3 A" },
          { en: "40 A", ar: "40 A" },
          { en: "0.3 A", ar: "0.3 A" },
          { en: "300 A", ar: "300 A" },
        ],
        answerIndex: 0,
        explanation: { en: "I = 30 ÷ 10 = 3 A.", ar: "I = 30 ÷ 10 = 3 A." },
      },
      {
        id: "q3",
        question: {
          en: "Which quantity is charge?",
          ar: "أي كمية تمثل الشحنة؟",
        },
        options: [
          { en: "I", ar: "I" },
          { en: "Q", ar: "Q" },
          { en: "t", ar: "t" },
          { en: "V", ar: "V" },
        ],
        answerIndex: 1,
        explanation: {
          en: "Q stands for charge in coulombs.",
          ar: "Q ترمز للشحنة بالكولوم.",
        },
      },
    ],
    progress: {
      objectives: [
        {
          en: "Define electric current and the ampere.",
          ar: "تعريف التيار الكهربائي والأمبير.",
        },
        {
          en: "Calculate I from Q and t.",
          ar: "حساب I من Q و t.",
        },
        {
          en: "Avoid common unit mistakes.",
          ar: "تجنّب أخطاء الوحدات الشائعة.",
        },
      ],
      masteryPercent: 0,
      blocksCompleted: [],
      estimatedMinutes: 35,
      lastVisitedAt: null,
    },
    ...overrides,
  };
}

export const DEMO_COURSE: CourseDefinition = {
  schema: "success-os.course-structure.v1",
  id: "course-demo-edexcel-as-physics-current",
  slug: "edexcel-as-physics-charge-current",
  title: {
    en: "Edexcel AS Physics — Charge & Current",
    ar: "إدكسل فيزياء AS — الشحنة والتيار",
  },
  description: {
    en: "Demo course showing the Success OS Course → Unit → Lesson workspace with all lesson blocks.",
    ar: "دورة تجريبية تعرض مساحة عمل Course → Unit → Lesson مع كل كتل الدرس.",
  },
  country: "international",
  curriculum: "Edexcel AS Physics",
  grade: "AS",
  subject: "Physics",
  language: "bilingual",
  status: "draft",
  updatedAt: "2026-07-30T00:00:00.000Z",
  hierarchy: {
    course: true,
    unit: true,
    lesson: true,
    lessonBlocks: [...LESSON_BLOCK_ORDER],
  },
  units: [
    {
      id: "unit-3-1",
      order: 1,
      title: { en: "Unit 3.1 Electric circuits", ar: "الوحدة 3.1 الدوائر الكهربائية" },
      description: {
        en: "Foundations of charge, current, and circuit quantities.",
        ar: "أساسيات الشحنة والتيار وكميات الدائرة.",
      },
      lessons: [
        {
          id: "lesson-3-1-1",
          order: 1,
          title: { en: "Charge and current", ar: "الشحنة والتيار الكهربائي" },
          summary: {
            en: "Learn to calculate current and interpret the ampere as coulomb per second.",
            ar: "تعلّم حساب التيار وتفسير الأمبير ككولوم لكل ثانية.",
          },
          objectives: [
            {
              en: "Calculate current using I = Q ÷ t",
              ar: "حساب التيار باستخدام I = Q ÷ t",
            },
            {
              en: "Explain the meaning of the ampere",
              ar: "شرح معنى الأمبير",
            },
          ],
          estimatedMinutes: 35,
          blocks: lessonBlocksBase(),
        },
        {
          id: "lesson-3-1-2",
          order: 2,
          title: { en: "Potential difference intro", ar: "مقدمة فرق الجهد" },
          summary: {
            en: "Connect energy transfer to potential difference (demo scaffold lesson).",
            ar: "ربط انتقال الطاقة بفرق الجهد (درس تجريبي هيكلي).",
          },
          objectives: [
            {
              en: "State what potential difference measures",
              ar: "بيان ما يقيسه فرق الجهد",
            },
          ],
          estimatedMinutes: 30,
          blocks: lessonBlocksBase({
            interactiveSlides: [
              {
                id: "s1",
                title: { en: "From current to voltage", ar: "من التيار إلى الجهد" },
                body: {
                  en: "Potential difference relates to energy per unit charge.",
                  ar: "يرتبط فرق الجهد بالطاقة لكل وحدة شحنة.",
                },
                kind: "intro",
              },
            ],
            teacherVideo: {
              status: "not-produced",
              title: { en: "Teacher: Potential difference", ar: "المعلم: فرق الجهد" },
              videoUrl: null,
              note: {
                en: "Not produced yet.",
                ar: "غير مُنتَج بعد.",
              },
            },
            progress: {
              objectives: [
                {
                  en: "Introduce V qualitatively",
                  ar: "تقديم V نوعيًا",
                },
              ],
              masteryPercent: 0,
              blocksCompleted: [],
              estimatedMinutes: 30,
              lastVisitedAt: null,
            },
          }),
        },
      ],
    },
  ],
};

export function listDemoCourses(): CourseDefinition[] {
  return [DEMO_COURSE];
}
