/**
 * Build AI elementary class packages:
 * video shot-list + spoken script + interactive activities.
 * Works offline from teacherExplanation; optionally enhances via LLM.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  erpAppendAudit,
  erpNow,
  erpReadJson,
  erpRoot,
  erpWriteJson,
} from '../admin/enterprise-erp-store.js';
import { ensureElementaryTeacher } from './seed-elementary-teacher.js';
import { withAiAssistantTitle } from './ai-assistant-teacher.js';

const LESSON_DEFS = Object.freeze({
  'jordan-g1-math-number-line-addition': {
    gradeAr: 'الصف الأول',
    subject: 'الرياضيات',
    unit: 'الجمع',
    titleAr: 'الجمع باستعمال خط الأعداد',
    teacherId: 'teacher-jo-lama-nouri',
    teacherName: withAiAssistantTitle('أ. لاما النوري'),
    href: '/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد',
    visualizer: 'numberline',
  },
  'jordan-g1-science-alike-different': {
    gradeAr: 'الصف الأول',
    subject: 'العلوم',
    unit: 'الإنسان والصحة',
    titleAr: 'نحن متشابهون ومختلفون',
    teacherId: 'teacher-jo-raneem-saleh',
    teacherName: withAiAssistantTitle('أ. رنيم صالح'),
    href: '/digital-library/middle-east/jordan/national/grade-1/العلوم/الإنسان-والصحة/نحن-متشابهون-ومختلفون',
    visualizer: 'orbital',
  },
  'jordan-g2-math-tens-ones': {
    gradeAr: 'الصف الثاني',
    subject: 'الرياضيات',
    unit: 'القيمة المكانية',
    titleAr: 'العشرات والآحاد',
    teacherId: 'teacher-jo-lama-nouri',
    teacherName: withAiAssistantTitle('أ. لاما النوري'),
    href: '/digital-library/middle-east/jordan/national/grade-2/الرياضيات/القيمة-المكانية/العشرات-والآحاد',
    visualizer: 'numberline',
  },
});

function storeDir() {
  const dir = path.join(erpRoot(), 'elementary-ai-classes');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadTeacherExplanation(slug) {
  // Dynamic import path for TS modules compiled by Next; for Node we read via registry bridge.
  // Content is duplicated lightly for engine autonomy when TS import is unavailable.
  if (slug === 'jordan-g1-math-number-line-addition') {
    return {
      totalMinutes: 35,
      segments: [
        {
          id: 'warmup',
          minutes: 5,
          titleAr: 'تهيئة حنونة',
          teacherScript:
            'يا قمري… أنا معلّمتك لاما. اليوم نجمع بالحلوى والقفز على خط الأعداد. صفّق مرتين وابتسم — جاهزين؟',
          studentMoves: ['يبتسم ويصفّق', 'يخمن قصة جمع قصيرة'],
          boardCue: 'جمع = نحط مع بعض',
          visualDirection: 'معلّمة تبتسم · بطاقات أعداد ملونة تظهر',
        },
        {
          id: 'model',
          minutes: 8,
          titleAr: 'شرح بالقفز',
          teacherScript:
            'ارسم خط أعداد من 0 إلى 20. المسألة 3 + 4: نبدأ على 3، أربع قفزات لليمين، نصل 7. افتح المجسّم الثلاثي الأبعاد وشوف القفز.',
          studentMoves: ['يقفز بإصبعه', 'يفتح 3D'],
          boardCue: '3 → hop×4 → 7',
          visualDirection: 'أنيميشن كرة تقفز على خط الأعداد من 3 إلى 7',
        },
        {
          id: 'guided',
          minutes: 10,
          titleAr: 'تدريب موجّه',
          teacherScript:
            'نحل سوا: 2+3، 5+2، قصة 6 تفاحات +3، و8+7. كل خطوة بصوت عالٍ، والغلط عادي ونصحح بحب.',
          studentMoves: ['يجيب بصوت عالٍ', 'يتحقق بمكعبات'],
          boardCue: 'جدول مسائل',
          visualDirection: 'جدول تفاعلي يظهر الإجابات بعد كل إجابة صحيحة',
        },
        {
          id: 'independent',
          minutes: 7,
          titleAr: 'تدريب مستقل',
          teacherScript:
            'سبع دقايق لوحدك: 4+4، 1+9، 7+3، وقصة ملصقات 5+6. ابدأ → اقفز → اقرأ → تحقق.',
          studentMoves: ['يحل 4 مسائل', 'يستخدم مساحة العمل'],
          boardCue: 'مؤقت 7:00',
          visualDirection: 'مؤقت على الشاشة · مساحة عمل الطالب',
        },
        {
          id: 'exit',
          minutes: 5,
          titleAr: 'ختام',
          teacherScript:
            'سؤال خروج: الجمع لليمين؟ ابدأ 6 واقفز 2. علّم أخاك بجملة. أحبكم يا قمري!',
          studentMoves: ['يجيب سؤالين', 'يقول جملة شرح'],
          boardCue: 'بطاقات خروج',
          visualDirection: 'ملصقات نجوم · شاشة تلخيص',
        },
      ],
    };
  }
  if (slug === 'jordan-g1-science-alike-different') {
    return {
      totalMinutes: 35,
      segments: [
        {
          id: 'warmup',
          minutes: 5,
          titleAr: 'ترحيب',
          teacherScript:
            'يا حبيبي… أنا معلّمتك رنيم. اليوم نتشابه ونختلف باحترام. كل واحد زهرة في حديقة الصف.',
          studentMoves: ['يضع يده على قلبه', 'يبتسم لزميل'],
          boardCue: 'حديقة الصف',
          visualDirection: 'حديقة زهور متنوعة',
        },
        {
          id: 'alike',
          minutes: 8,
          titleAr: 'نتشابه',
          teacherScript:
            'كلنا عيون ومي وأكل وهوا ونلعب. ارفع إيدك إذا بتتنفس وتحب تلعب.',
          studentMoves: ['يرفع يده', 'يرسم وجهًا'],
          boardCue: 'حواس وحاجات',
          visualDirection: 'أيقونات حواس بسيطة',
        },
        {
          id: 'different',
          minutes: 9,
          titleAr: 'نختلف بحب',
          teacherScript:
            'نختلف بالطول والشعر والهوايات. الاختلاف مش عيب — حلو. ما بنضحك على حدّا.',
          studentMoves: ['يقول صفة مختلفة', 'يضع بطاقة قلب'],
          boardCue: 'مختلف = جميل',
          visualDirection: 'بطاقات قلوب متشابه/مختلف',
        },
        {
          id: 'practice',
          minutes: 8,
          titleAr: 'تصنيف',
          teacherScript:
            'صنّف أمثلة: نتنفس، طول مختلف، نحتاج مي، هوايات مختلفة.',
          studentMoves: ['يكمل 4 جمل', 'يشارك مثالًا'],
          boardCue: 'جدول تصنيف',
          visualDirection: 'لعبة سحب وإفلات',
        },
        {
          id: 'exit',
          minutes: 5,
          titleAr: 'وعد',
          teacherScript: 'وعد الصف: نحتفل ببعض. أحضنكم بالكلام!',
          studentMoves: ['يقول الوعد'],
          boardCue: 'وعد الحضن',
          visualDirection: 'ختام دافئ',
        },
      ],
    };
  }
  return {
    totalMinutes: 30,
    segments: [
      {
        id: 'main',
        minutes: 30,
        titleAr: 'شرح أساسي',
        teacherScript: 'مرحبا يا أبطال. اليوم نفهم الدرس خطوة خطوة.',
        studentMoves: ['يستمع ويشارك'],
        boardCue: 'عنوان الدرس',
        visualDirection: 'سبورة بسيطة',
      },
    ],
  };
}

function buildActivities(slug, def) {
  if (slug === 'jordan-g1-math-number-line-addition') {
    return [
      {
        id: 'hop-count',
        type: 'tap-count',
        titleAr: 'عدّ القفزات',
        promptAr: 'ابدأ من 3. كم قفزة لتصل إلى 7؟',
        answer: 4,
        feedbackCorrect: 'برافو يا قمري! 3 + 4 = 7',
        feedbackWrong: 'جرّب مرة ثانية: من 3 لـ 7… عدّ بهدوء.',
      },
      {
        id: 'pick-sum',
        type: 'mcq',
        titleAr: 'اختَر الناتج',
        promptAr: '5 + 2 = ؟',
        choices: ['6', '7', '8', '9'],
        correctIndex: 1,
        feedbackCorrect: 'ممتاز! hop hop من 5 نوصل 7.',
        feedbackWrong: 'ابدأ على 5 واقفز مرتين.',
      },
      {
        id: 'story-sum',
        type: 'mcq',
        titleAr: 'قصة الجمع',
        promptAr: 'سارة معها 6 تفاحات وأمها أعطتها 3. كم صارت؟',
        choices: ['8', '9', '10'],
        correctIndex: 1,
        feedbackCorrect: 'يا عسل! 6 + 3 = 9',
        feedbackWrong: 'ابدأ 6… ثلاث قفزات.',
      },
      {
        id: 'drag-start',
        type: 'open',
        titleAr: 'وين نبدأ؟',
        promptAr: 'في المسألة 8 + 7، على أي رقم نضع إصبعنا أولًا؟',
        sampleAnswer: '8',
        feedbackCorrect: 'صح — نبدأ من المضاف الأول.',
        feedbackWrong: 'نبدأ من الرقم الأول: 8.',
      },
    ];
  }
  if (slug === 'jordan-g1-science-alike-different') {
    return [
      {
        id: 'alike-breath',
        type: 'mcq',
        titleAr: 'متشابه؟',
        promptAr: 'أنا وزميلي نتنفس. هذا…',
        choices: ['متشابه', 'مختلف', 'غلط'],
        correctIndex: 0,
        feedbackCorrect: 'صح — حاجة بشرية مشتركة.',
        feedbackWrong: 'التنفس حاجة مشتركة لكل البشر.',
      },
      {
        id: 'diff-hobby',
        type: 'mcq',
        titleAr: 'مختلف بحب',
        promptAr: 'هوايتي رسم وهواية صديقي كرة. هذا…',
        choices: ['عيب', 'مختلف ولطيف', 'نفس الشيء'],
        correctIndex: 1,
        feedbackCorrect: 'حلو — الاختلاف تنوع جميل.',
        feedbackWrong: 'الاختلاف مش عيب — حلو ومحترم.',
      },
      {
        id: 'respect-promise',
        type: 'open',
        titleAr: 'وعد الصف',
        promptAr: 'أكمل: اختلاف زميلي…',
        sampleAnswer: 'أحترمه',
        feedbackCorrect: 'أحسنت.',
        feedbackWrong: 'كلمة لطيفة: أحترمه / أتعلّم منه.',
      },
    ];
  }
  return [
    {
      id: 'check-in',
      type: 'open',
      titleAr: 'ماذا تعلّمت؟',
      promptAr: `اكتب جملة واحدة عن درس ${def.titleAr}`,
      sampleAnswer: 'فهمت الفكرة الأساسية',
      feedbackCorrect: 'ممتاز',
      feedbackWrong: 'حاول بجملة قصيرة',
    },
  ];
}

function buildShots(explanation, def) {
  let t = 0;
  const shots = [];
  for (const seg of explanation.segments || []) {
    const start = t;
    t += seg.minutes;
    shots.push({
      id: seg.id,
      startMin: start,
      endMin: t,
      minutes: seg.minutes,
      titleAr: seg.titleAr,
      spokenAr: seg.teacherScript,
      studentMoves: seg.studentMoves || [],
      boardCue: seg.boardCue || '',
      visualDirection: seg.visualDirection || `مشهد صفّي · ${seg.titleAr}`,
      onScreenText: seg.boardCue || seg.titleAr,
    });
  }
  return shots;
}

export function buildElementaryAiClass(slug) {
  ensureElementaryTeacher();
  const def = LESSON_DEFS[slug];
  if (!def) throw new Error('LESSON_NOT_SUPPORTED');

  const explanation = loadTeacherExplanation(slug);
  const shots = buildShots(explanation, def);
  const activities = buildActivities(slug, def);
  const fullScript = shots.map((s) => s.spokenAr).join('\n\n');
  const words = fullScript.split(/\s+/).filter(Boolean).length;

  const pack = {
    schema: 'success-os.elementary-ai-class.v1',
    id: `ai-class-${slug}`,
    slug,
    builtAt: erpNow(),
    fictionalTeachers: true,
    lesson: def,
    video: {
      status: 'script-ready',
      totalMinutes: explanation.totalMinutes || shots.reduce((n, s) => n + s.minutes, 0),
      words,
      estimatedMinutes: Math.max(
        explanation.totalMinutes || 0,
        Math.ceil(words / 110),
      ),
      language: 'ar',
      shots,
      fullScriptAr: fullScript,
      productionNoteAr:
        'السكربت جاهز للتصوير/الأفاتار. التشغيل الفوري عبر قارئ الصوت في المتصفح إلى حين ربط HeyGen/Synthesia.',
    },
    activities,
    quizHref: `${def.href}#quiz`,
    visualizerHref: `${def.href}#visualizer`,
    explainHref: `${def.href}#ai-class`,
  };

  const file = path.join(storeDir(), `${slug}.json`);
  erpWriteJson(file, pack);
  erpAppendAudit({
    actor: 'SUCCESS OS · AI Class',
    action: 'elementary.ai-class.build',
    moduleId: 'curriculum-os',
    entityId: pack.id,
  });
  return pack;
}

export function getElementaryAiClass(slug) {
  if (!slug) return null;
  const file = path.join(storeDir(), `${slug}.json`);
  const existing = erpReadJson(file);
  if (existing?.schema) return existing;
  try {
    return buildElementaryAiClass(slug);
  } catch {
    return null;
  }
}

export function listElementaryAiClasses() {
  ensureElementaryTeacher();
  return Object.keys(LESSON_DEFS).map((slug) => {
    const pack = getElementaryAiClass(slug);
    return {
      slug,
      titleAr: pack?.lesson?.titleAr || slug,
      gradeAr: pack?.lesson?.gradeAr,
      subject: pack?.lesson?.subject,
      teacherName: pack?.lesson?.teacherName,
      totalMinutes: pack?.video?.totalMinutes,
      activities: pack?.activities?.length || 0,
      href: pack?.explainHref,
      status: pack?.video?.status || 'missing',
    };
  });
}
