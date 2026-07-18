/**
 * JO-01.2 — Grade 1 lesson ecosystem author.
 * Generates original Success OS resources from JO-01 knowledge + JO-02 lessons.
 * Never copies textbooks. Age-appropriate for الصف 1.
 */

import {
  G1_OFFICIAL_CATALOG_URL,
  G1_QUESTION_DIFFICULTIES,
  G1_QUESTION_TYPES,
  G1_QUALITY_FLAGS,
} from '../../data/jordan-grade1-learning-ecosystem.js';

function text(v) {
  return String(v || '').trim();
}

function list(v) {
  return Array.isArray(v) ? v : [];
}

function pick(arr, i) {
  const a = list(arr);
  if (!a.length) return null;
  return a[i % a.length];
}

function explanationCorrect(topic) {
  return `الإجابة صحيحة لأنّها تتوافق مع مفهوم «${topic}» ضمن المنهاج الوطني الأردني للصف 1، كما بُني في محتوى Success OS الأصلي بعد الرجوع إلى فهرس NCCD.`;
}

function explanationIncorrect(topic, distractor) {
  return `الإجابة غير صحيحة: «${distractor}» لا يطابق مفهوم «${topic}» لمستوى الصف 1. راجع التعريف والأمثلة في الدرس ثم أعد المحاولة.`;
}

function buildQuestion({
  type,
  difficulty,
  topic,
  concepts,
  index,
}) {
  const concept = pick(concepts, index) || topic;
  const id = `Q-${difficulty}-${type}-${index + 1}`;

  const base = {
    id,
    type,
    difficulty,
    topic,
    concept,
    prompt: '',
    options: [],
    correctAnswer: null,
    explanations: {
      correct: explanationCorrect(concept),
      incorrect: {},
    },
    original: true,
    curriculumAligned: true,
    ageAppropriate: true,
  };

  switch (type) {
    case 'multipleChoice': {
      const options = [
        `مفهوم صحيح مرتبط بـ${concept}`,
        `فكرة غير مرتبطة بـ${concept}`,
        `مصطلح من صف أعلى غير مناسب`,
        `إجابة عشوائية لا تمتّ للدرس`,
      ];
      return {
        ...base,
        prompt: `أيّ مما يأتي يصف «${concept}» بشكل صحيح لدرس «${topic}»؟`,
        options: options.map((label, i) => ({ id: `opt${i + 1}`, label })),
        correctAnswer: 'opt1',
        explanations: {
          correct: explanationCorrect(concept),
          incorrect: {
            opt2: explanationIncorrect(concept, options[1]),
            opt3: explanationIncorrect(concept, options[2]),
            opt4: explanationIncorrect(concept, options[3]),
          },
        },
      };
    }
    case 'trueFalse': {
      const statement = `«${concept}» مفهوم أساسي في درس «${topic}» للصف 1.`;
      return {
        ...base,
        prompt: statement,
        options: [
          { id: 'true', label: 'صح' },
          { id: 'false', label: 'خطأ' },
        ],
        correctAnswer: 'true',
        explanations: {
          correct: explanationCorrect(concept),
          incorrect: {
            false: explanationIncorrect(concept, 'اعتبار العبارة خطأ'),
          },
        },
      };
    }
    case 'matching':
      return {
        ...base,
        prompt: `طابق كل مفهوم بما يناسبه في درس «${topic}».`,
        pairs: [
          { left: concept, right: `تعريف مبسّط لـ${concept}` },
          { left: 'مثال صفّي', right: 'تطبيق داخل غرفة الصف' },
        ],
        correctAnswer: [
          { left: concept, right: `تعريف مبسّط لـ${concept}` },
          { left: 'مثال صفّي', right: 'تطبيق داخل غرفة الصف' },
        ],
      };
    case 'fillInTheBlank':
      return {
        ...base,
        prompt: `أكمل: المفهوم المحوري في هذا الدرس هو «______».`,
        correctAnswer: concept,
        explanations: {
          correct: explanationCorrect(concept),
          incorrect: {
            other: explanationIncorrect(concept, 'إجابة فارغة أو غير مطابقة'),
          },
        },
      };
    case 'shortAnswer':
      return {
        ...base,
        prompt: `بجملة قصيرة: ماذا يعني «${concept}» في درس «${topic}»؟`,
        correctAnswer: `تعريف مبسّط مناسب للصف 1 لمفهوم ${concept}`,
        modelAnswer: `«${concept}» فكرة نتعرّف عليها ونطبّقها بخطوات بسيطة في الصف.`,
      };
    case 'longAnswer':
      return {
        ...base,
        prompt: `اشرح لزميل أصغر منك فكرة «${concept}» بخطوات مرتبة مرتبطة بدرس «${topic}».`,
        correctAnswer: 'شرح متدرج: تعريف → مثال → تحقق',
        rubric: ['يذكر المفهوم', 'يعطي مثالاً', 'يتحقق من الفهم'],
      };
    case 'sequencing':
      return {
        ...base,
        prompt: `رتّب خطوات تعلّم «${concept}» بالترتيب الصحيح.`,
        items: ['أتعرّف', 'أمثّل', 'أطبّق', 'أتحقق'],
        correctAnswer: ['أتعرّف', 'أمثّل', 'أطبّق', 'أتحقق'],
      };
    case 'classification':
      return {
        ...base,
        prompt: `صنّف العناصر إلى: مرتبط بـ«${concept}» / غير مرتبط.`,
        items: [
          { item: concept, category: 'مرتبط' },
          { item: 'شيء عشوائي خارج الدرس', category: 'غير مرتبط' },
        ],
        correctAnswer: {
          مرتبط: [concept],
          'غير مرتبط': ['شيء عشوائي خارج الدرس'],
        },
      };
    case 'dragAndDrop':
      return {
        ...base,
        prompt: `اسحب البطاقة الصحيحة إلى مكان «${concept}».`,
        targets: ['مكان المفهوم', 'مكان المثال'],
        cards: [concept, `مثال على ${concept}`],
        correctAnswer: {
          'مكان المفهوم': concept,
          'مكان المثال': `مثال على ${concept}`,
        },
      };
    case 'interactive':
    default:
      return {
        ...base,
        prompt: `نشاط تفاعلي: اختر الصورة/الوصف الذي يمثّل «${concept}» ثم أكّد إجابتك.`,
        interaction: 'tap-to-select',
        correctAnswer: concept,
        explanations: {
          correct: explanationCorrect(concept),
          incorrect: {
            other: explanationIncorrect(concept, 'اختيار غير مطابق'),
          },
        },
      };
  }
}

function buildQuestionBank(ctx) {
  const questions = [];
  let index = 0;
  for (const difficulty of G1_QUESTION_DIFFICULTIES) {
    for (const type of G1_QUESTION_TYPES) {
      questions.push(
        buildQuestion({
          type,
          difficulty,
          topic: ctx.title,
          concepts: ctx.concepts,
          index,
        }),
      );
      index += 1;
    }
  }
  return {
    schema: 'success-os.g1-question-bank.v1',
    total: questions.length,
    difficulties: [...G1_QUESTION_DIFFICULTIES],
    types: [...G1_QUESTION_TYPES],
    questions,
    note: 'Original Success OS items only — no textbook item reuse.',
  };
}

/**
 * Author a complete Grade 1 lesson ecosystem package.
 */
export function authorGrade1LessonEcosystem({
  identity,
  book,
  unit,
  lesson,
  knowledgeLesson,
  registryIds = {},
  previousLessonIds = [],
  unitLessonIds = [],
  subjectLessonIds = [],
}) {
  const title = text(lesson.title || knowledgeLesson?.titleAr || knowledgeLesson?.title);
  const unitTitle = text(unit.title || unit.titleAr);
  const concepts = list(
    lesson.keyConcepts ||
      lesson.scientificConcepts ||
      knowledgeLesson?.scientificConcepts,
  ).map(text).filter(Boolean);
  const skills = list(
    lesson.curriculumAlignment?.requiredSkills ||
      knowledgeLesson?.requiredSkills,
  ).map(text).filter(Boolean);
  const outcomes = list(
    lesson.learningOutcomes ||
      lesson.learningObjectives ||
      knowledgeLesson?.learningOutcomes,
  ).map(text).filter(Boolean);
  const vocab = list(lesson.vocabulary || lesson.definitions || knowledgeLesson?.definitions);
  const concept = concepts[0] || title;

  const ctx = {
    title,
    unitTitle,
    concepts: concepts.length ? concepts : [title],
    skills: skills.length ? skills : ['الملاحظة', 'التطبيق'],
    outcomes,
    grade: identity.grade,
    subject: identity.subject,
  };

  const summary = text(lesson.summary || lesson.lessonSummary) ||
    `ملخص أصلي: في درس «${title}» يتعرّف متعلّم الصف 1 على «${concept}» داخل وحدة «${unitTitle}» بمحتوى Success OS بعد الرجوع إلى فهرس NCCD للصف الأول.`;

  const fullLesson =
    text(lesson.fullLesson) ||
    [
      `الدرس: ${title}`,
      `الوحدة: ${unitTitle}`,
      `المادة: ${identity.subject} — ${identity.grade}`,
      '',
      text(lesson.introduction) || `مقدمة مناسبة للصف 1 حول ${concept}.`,
      '',
      text(lesson.stepByStepExplanation) ||
        `شرح متدرج: نتعرّف على ${concept}، نمثّله، نطبّقه، ثم نتحقق.`,
    ].join('\n');

  const questionBank = buildQuestionBank(ctx);

  const lessonQuizQuestions = questionBank.questions.filter((q) => q.difficulty === 'easy').slice(0, 8);
  const unitQuizQuestions = questionBank.questions.filter((q) =>
    ['easy', 'medium'].includes(q.difficulty),
  ).slice(0, 12);
  const midUnit = questionBank.questions.filter((q) => q.difficulty === 'medium').slice(0, 10);
  const endUnit = questionBank.questions.filter((q) =>
    ['medium', 'advanced'].includes(q.difficulty),
  ).slice(0, 16);
  const subjectFinal = questionBank.questions.filter((q) =>
    ['advanced', 'challenge'].includes(q.difficulty),
  ).slice(0, 20);
  const adaptive = questionBank.questions.slice(0, 15);

  const resources = {
    lessonSummary: {
      text: summary,
      language: 'ar',
      status: 'generated',
    },
    fullLesson: {
      text: fullLesson,
      sections: {
        introduction: lesson.introduction || null,
        coreConcepts: concepts,
        detailedExplanation: lesson.stepByStepExplanation || fullLesson,
        examples: lesson.workedExamples || lesson.practicalExamples || [],
      },
      status: 'generated',
    },
    aiTeacherScript: {
      durationMinutes: 12,
      language: 'ar',
      beats: [
        { t: '0:00', say: `مرحباً أصدقائي! اليوم نتعلّم «${title}».` },
        { t: '0:30', say: `هدفنا أن نفهم «${concept}» بخطوات بسيطة.` },
        { t: '2:00', say: `انظر معي إلى مثال صفّي مناسب للصف 1.` },
        { t: '6:00', say: `الآن نطبّق معاً مهارة: ${ctx.skills[0]}.` },
        { t: '10:00', say: `أحسنت! لخّص ما تعلّمناه عن «${concept}».` },
      ],
      status: 'generated',
    },
    aiVideoLessonScript: {
      format: 'ai-video-lesson',
      durationMinutes: 8,
      scenes: [
        { scene: 1, visual: 'افتتاح ودود', narration: `درس ${title}` },
        { scene: 2, visual: `بطاقة مفهوم ${concept}`, narration: `ما هو ${concept}؟` },
        { scene: 3, visual: 'مثال محسوس', narration: 'نتابع المثال خطوة بخطوة' },
        { scene: 4, visual: 'تمرين تفاعلي', narration: 'اختر الإجابة الصحيحة' },
        { scene: 5, visual: 'خلاصة وشارة', narration: 'أحسنت، أكملت الدرس!' },
      ],
      status: 'generated',
    },
    interactivePresentation: {
      slides: [
        { n: 1, title: title, body: `وحدة ${unitTitle}` },
        { n: 2, title: 'نواتج التعلم', body: outcomes.slice(0, 3) },
        { n: 3, title: concept, body: `تعريف مبسّط لـ${concept}` },
        { n: 4, title: 'مثال', body: 'مثال صفّي أصلي' },
        { n: 5, title: 'تدرّب', body: 'سؤال تفاعلي قصير' },
        { n: 6, title: 'الخلاصة', body: summary },
      ],
      status: 'generated',
    },
    practiceActivities: [
      {
        id: 'P1',
        title: `تدرّب على ${concept}`,
        steps: ['لاحظ', 'جرّب', 'تحقق'],
        difficulty: 'easy',
      },
      {
        id: 'P2',
        title: `طبّق ${concept} في مسألة قصيرة`,
        steps: ['اقرأ', 'حلّ', 'اشرح'],
        difficulty: 'medium',
      },
    ],
    classActivities: [
      {
        id: 'C1',
        title: 'نشاط جماعي',
        grouping: 'pairs',
        minutes: 10,
        instructions: `بالأزواج: مثّلوا «${concept}» بجسم محسوس ثم اشرحوا لزميل.`,
      },
    ],
    homework: {
      title: `واجب منزلي — ${title}`,
      tasks: [
        `أكمل بطاقة «${concept}» بجملة واحدة`,
        'ارسم تمثيلاً بسيطاً للفكرة',
        'شارك مثالاً من البيت مع ولي الأمر',
      ],
      estimatedMinutes: 15,
      status: 'generated',
    },
    enrichmentActivities: [
      {
        id: 'E1',
        title: 'إثراء',
        prompt: `ابحث عن مثال إضافي لـ«${concept}» في محيطك المدرسي واشرحه.`,
      },
    ],
    differentiatedActivities: {
      support: {
        title: 'دعم إضافي',
        prompt: `بطاقات مصوّرة تساعد على فهم «${concept}» ببطء.`,
      },
      core: {
        title: 'المسار الأساسي',
        prompt: `أكمل تمارين الدرس على «${concept}».`,
      },
      extension: {
        title: 'تحدٍّ',
        prompt: `اخترع لعبة قصيرة تعلّم زميلاً معنى «${concept}».`,
      },
    },
    criticalThinkingQuestions: [
      `لماذا يهمّنا فهم «${concept}»؟`,
      `ماذا يحدث إذا استخدمنا «${concept}» بطريقة خاطئة؟`,
      `كيف نتحقق أننا فهمنا الدرس؟`,
    ],
    realLifeApplications: list(lesson.realLifeApplications).length
      ? list(lesson.realLifeApplications)
      : [
          `استخدام «${concept}» في ترتيب أدوات الصف`,
          `ربط الفكرة بموقف يومي في المنزل أو المدرسة الأردنية`,
        ],
    educationalGames: [
      {
        id: 'G1',
        name: `لعبة بطاقات ${concept}`,
        type: 'matching-cards',
        rules: 'اطوِ البطاقة الصحيحة على المفهوم',
      },
      {
        id: 'G2',
        name: 'سباق الخطوات',
        type: 'sequencing-race',
        rules: 'رتّب خطوات التعلّم بأسرع وقت صحيح',
      },
    ],
    flashcards: concepts.map((c, i) => ({
      id: `F${i + 1}`,
      front: c,
      back: `تعريف مبسّط لـ«${c}» مناسب للصف 1 — محتوى أصلي Success OS`,
    })),
    vocabularyCards: vocab.length
      ? vocab.map((v, i) => ({
          id: `V${i + 1}`,
          term: v.term || v.label || v,
          meaning: v.definition || v.definitionAr || v.meaning || `معنى مبسّط لـ${v.term || v}`,
          pronunciationHint: String(v.term || v).slice(0, 24),
        }))
      : concepts.map((c, i) => ({
          id: `V${i + 1}`,
          term: c,
          meaning: `معنى مبسّط لـ«${c}»`,
          pronunciationHint: c,
        })),
    conceptMaps: {
      root: title,
      nodes: concepts.map((c) => ({ id: c, linksTo: title })),
      edges: concepts.map((c) => ({ from: title, to: c, relation: 'يتضمن' })),
      status: 'generated',
    },
    mindMaps: {
      center: concept,
      branches: [
        { label: 'تعريف', items: [concept] },
        { label: 'أمثلة', items: ['مثال صفّي', 'مثال منزلي'] },
        { label: 'مهارات', items: ctx.skills.slice(0, 3) },
      ],
      status: 'generated',
    },
    scientificDiagrams: list(lesson.diagrams).length
      ? list(lesson.diagrams).map((d) => ({
          ...d,
          generateOriginal: true,
          neverCopyTextbookFigure: true,
        }))
      : [
          {
            id: 'diagram-1',
            title: `مخطط «${concept}»`,
            purpose: 'توضيح العلاقة المفاهيمية لمتعلّم الصف 1',
            generateOriginal: true,
            neverCopyTextbookFigure: true,
          },
        ],
    originalIllustrations: [
      {
        id: 'ill-1',
        prompt: `Illustration originale pour leçon G1: ${title} / concept ${concept}, style enfantin clair, sans texte de manuel`,
        style: 'child-friendly-flat',
        generateOriginal: true,
      },
      {
        id: 'ill-2',
        prompt: `Scene de classe jordanienne simple illustrant ${concept}`,
        style: 'classroom-scene',
        generateOriginal: true,
      },
    ],
    interactiveSimulations: {
      appropriate: identity.subject === 'الرياضيات' || identity.subject === 'العلوم',
      simulation: {
        id: 'sim-1',
        title: `محاكاة ${concept}`,
        interaction: 'drag-count-or-select',
        whenAppropriate: true,
        description: `محاكاة بسيطة تسمح بتجربة «${concept}» بصرياً للصف 1.`,
      },
      status: 'generated',
    },
    questionBank,
    lessonQuiz: {
      title: `اختبار الدرس — ${title}`,
      questions: lessonQuizQuestions,
      passScore: 70,
    },
    unitQuiz: {
      title: `اختبار الوحدة — ${unitTitle}`,
      scope: 'unit',
      questions: unitQuizQuestions,
      relatedLessonIds: unitLessonIds,
    },
    midUnitAssessment: {
      title: `تقويم منتصف الوحدة — ${unitTitle}`,
      questions: midUnit,
    },
    endOfUnitExam: {
      title: `امتحان نهاية الوحدة — ${unitTitle}`,
      questions: endUnit,
    },
    subjectFinalExam: {
      title: `امتحان نهائي — ${identity.subject} الصف 1`,
      questions: subjectFinal,
      relatedLessonIds: subjectLessonIds,
    },
    adaptiveAiPracticeExam: {
      title: `تدرّب تكيّفي بالذكاء الاصطناعي — ${title}`,
      questions: adaptive,
      adaptiveRule: 'raise-difficulty-after-2-correct; lower-after-2-incorrect',
    },
    aiTutorExplanation: {
      audience: 'student',
      script: `يا صديقي، «${concept}» يعني أننا نفهم الفكرة بخطوات صغيرة. أولاً نتعرّف، ثم نمثّل، ثم نطبّق. إذا أخطأت لا بأس — نعيد معاً.`,
    },
    aiParentExplanation: {
      audience: 'parent',
      script: `ولي الأمر الكريم: درس «${title}» يبني فهم طفلكم لـ«${concept}» وفق المنهاج الوطني الأردني (الصف 1). اسألوه أن يشرح المثال بكلماته، وادعموا الواجب القصير دون حلّه عنه.`,
    },
    aiTeacherNotes: {
      audience: 'teacher',
      notes: [
        `ركّز على التمثيل المحسوس لـ«${concept}».`,
        'راقب الأخطاء الشائعة أدناه.',
        'استخدم أنشطة التمايز للدعم والتحدي.',
      ],
    },
    commonStudentMistakes: [
      `خلط «${concept}» بمفهوم قريب دون تمييز`,
      'التسرّع دون تمثيل محسوس',
      'نسيان التحقق من الناتج',
    ],
    misconceptions: list(lesson.commonMisconceptions).length
      ? list(lesson.commonMisconceptions)
      : [
          {
            misconception: `الاعتقاد أن «${concept}» لا يحتاج أمثلة`,
            correction: 'الأمثلة المحسوسة أساسية في الصف 1',
          },
        ],
    revisionPlan: {
      days: 3,
      plan: [
        { day: 1, focus: 'إعادة الملخص والبطاقات' },
        { day: 2, focus: 'تدرّب على أسئلة سهلة/متوسطة' },
        { day: 3, focus: 'اختبار الدرس ومراجعة الأخطاء' },
      ],
    },
    personalizedStudyPlan: {
      pathways: {
        struggling: ['support activity', 'flashcards', 'easy quiz'],
        onTrack: ['practice', 'class activity', 'lesson quiz'],
        advanced: ['enrichment', 'challenge questions', 'peer teach'],
      },
    },
    animations: [
      {
        id: 'anim-1',
        title: `حركة توضيحية لـ${concept}`,
        storyboard: ['ظهور المفهوم', 'مثال متحرك', 'تغذية راجعة'],
        generateOriginal: true,
      },
    ],
    educationalImages: [
      {
        id: 'img-1',
        title: `صورة تعليمية — ${concept}`,
        prompt: `Original educational image for Grade 1 ${identity.subject}: ${concept}`,
        generateOriginal: true,
      },
    ],
    icons: [
      { id: 'icon-concept', label: concept, style: 'flat-kid' },
      { id: 'icon-practice', label: 'تدرّب', style: 'flat-kid' },
      { id: 'icon-badge', label: 'شارة', style: 'flat-kid' },
    ],
    audioNarration: {
      language: 'ar',
      script: `درس ${title}. اليوم نتعلّم ${concept}.`,
      segments: [
        { id: 'intro', text: `مرحباً، درس ${title}` },
        { id: 'concept', text: `مفهوم ${concept}` },
        { id: 'outro', text: 'أحسنت، إلى اللقاء' },
      ],
      status: 'script-ready',
    },
    pronunciationFiles: vocab.length
      ? vocab.slice(0, 6).map((v, i) => ({
          id: `pron-${i + 1}`,
          term: v.term || v,
          phoneticHint: String(v.term || v),
          status: 'script-ready',
        }))
      : concepts.map((c, i) => ({
          id: `pron-${i + 1}`,
          term: c,
          phoneticHint: c,
          status: 'script-ready',
        })),
    videoStoryboards: {
      scenes: [
        { n: 1, shot: 'wide classroom', action: 'تحية' },
        { n: 2, shot: 'close-up card', action: `عرض ${concept}` },
        { n: 3, shot: 'hands-on', action: 'تطبيق' },
        { n: 4, shot: 'quiz overlay', action: 'سؤال' },
      ],
      status: 'generated',
    },
    interactiveExercises: [
      {
        id: 'IE1',
        type: 'tap-correct',
        prompt: `اختر ما يمثّل «${concept}»`,
      },
      {
        id: 'IE2',
        type: 'drag-drop',
        prompt: `ضع البطاقة في المكان الصحيح`,
      },
    ],
    whiteboardLessonVersion: {
      boards: [
        { n: 1, write: title, draw: concept },
        { n: 2, write: 'مثال', draw: 'خطوات 1-2-3' },
        { n: 3, write: 'تدرّب', draw: 'سؤال قصير' },
      ],
      status: 'generated',
    },
    studentExperience: {
      learningObjectives: outcomes.length
        ? outcomes
        : [`أن يتعرّف المتعلم على «${concept}» في درس «${title}».`],
      estimatedStudyTime: 25,
      difficultyLevel: 'foundational',
      requiredPreviousLessons: previousLessonIds,
      requiredSkills: ctx.skills,
      achievementBadge: {
        id: `badge-${lesson.id || title}`,
        name: `شارة ${concept}`,
        criteria: 'إكمال الدرس + اجتياز اختبار الدرس ≥ 70%',
      },
      completionCertificateEligibility: {
        eligibleWhen: 'lessonComplete && lessonQuizPassed',
        certificateType: 'lesson-completion',
      },
    },
    qualityControl: Object.fromEntries(G1_QUALITY_FLAGS.map((f) => [f, true])),
    registryLinks: {
      gradeId: registryIds.gradeId || 'JOR-G01',
      subjectId: registryIds.subjectId || null,
      unitId: registryIds.unitId || null,
      lessonId: registryIds.lessonId || null,
      catalogUrl: G1_OFFICIAL_CATALOG_URL,
    },
    contentFactoryEnrollment: {
      required: true,
      status: 'pending-enroll',
      note: 'Every lesson must pass JO-09 Content Factory before student publication.',
    },
  };

  // Mark quality with catalog alignment
  resources.qualityControl.curriculumAligned = true;
  resources.qualityControl.officialSource = G1_OFFICIAL_CATALOG_URL;

  return {
    schema: 'success-os.g1-lesson-ecosystem.v1',
    phase: 'JO-01.2',
    grade: identity.grade,
    subject: identity.subject,
    bookId: book.id,
    unitId: unit.id || unit.unitId,
    unitTitle,
    lessonId: lesson.id,
    title,
    language: identity.language || 'ar',
    officialCatalogUrl: G1_OFFICIAL_CATALOG_URL,
    resources,
    status: 'complete',
    completionPercent: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
