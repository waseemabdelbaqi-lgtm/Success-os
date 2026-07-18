/**
 * Jordan National Curriculum — original pedagogical knowledge maps.
 * Aligned to MoE / NCCD grade×subject structure. Never copies textbook prose.
 */

function bandFromGrade(grade) {
  if (grade === 'رياض الأطفال') return 'kg';
  const m = String(grade).match(/(\d+)/);
  const n = m ? Number(m[1]) : 0;
  if (n >= 1 && n <= 4) return 'lower-basic';
  if (n >= 5 && n <= 7) return 'mid-basic';
  if (n >= 8 && n <= 10) return 'upper-basic';
  if (n >= 11) return 'secondary';
  return 'basic';
}

function familyOf(subject) {
  const s = String(subject || '');
  if (/رياضيات|رياضيات مبكرة/.test(s)) return 'math';
  if (/فيزياء/.test(s)) return 'physics';
  if (/كيمياء/.test(s)) return 'chemistry';
  if (/علوم حياتية|أحياء/.test(s)) return 'biology';
  if (/علوم الأرض|بيئة/.test(s)) return 'earth';
  if (/علوم|استكشاف/.test(s)) return 'science';
  if (/عربية|لغة والتواصل/.test(s)) return 'arabic';
  if (/إنجليزية|English/.test(s)) return 'english';
  if (/إسلامية/.test(s)) return 'islamic';
  if (/وطنية|مدنية/.test(s)) return 'civics';
  if (/تاريخ/.test(s)) return 'history';
  if (/جغرافيا/.test(s)) return 'geography';
  if (/اجتماعية/.test(s)) return 'social';
  if (/رقمية|حاسوب|تكنولوجيا المعلومات/.test(s)) return 'digital';
  if (/مالية/.test(s)) return 'finance';
  if (/رياضية|بدنية/.test(s)) return 'pe';
  if (/فنية|موسيقية|مسرح|فنون/.test(s)) return 'arts';
  if (/مهنية|مهارية حياتية/.test(s)) return 'life-skills';
  if (/فلسفة/.test(s)) return 'philosophy';
  if (/نفس|اجتماع/.test(s)) return 'psych-soc';
  if (/أعمال|هندسة|ضيافة|سفر|زراعة|بناء/.test(s)) return 'vocational';
  return 'general';
}

const UNIT_BLUEPRINTS = {
  math: {
    'kg': ['العد والتصنيف', 'الأشكال في محيطي', 'المقارنة والقياس المبكر', 'الأنماط'],
    'lower-basic': ['الأعداد والعمليات', 'القيمة المكانية', 'الهندسة والقياس', 'البيانات البسيطة'],
    'mid-basic': ['الكسور والعمليات', 'الأعداد العشرية والنسب', 'الهندسة والمساحة', 'الإحصاء والاحتمال'],
    'upper-basic': ['الجبر والمعادلات', 'النسب والتناسب', 'الهندسة الإقليدية', 'الإحصاء التطبيقي'],
    'secondary': ['الدوال والجبر المتقدم', 'التفاضل أو المتتاليات', 'الهندسة التحليلية', 'الإحصاء والاحتمالات'],
  },
  science: {
    'kg': ['استكشاف الطبيعة', 'الحواس والملاحظة', 'المواد من حولنا', 'العناية بالبيئة'],
    'lower-basic': ['الكائنات الحية', 'المادة والطاقة', 'الأرض والفضاء', 'الصحة والسلامة'],
    'mid-basic': ['الجهاز والجسم', 'القوى والحركة', 'المواد والتغيرات', 'النظم البيئية'],
    'upper-basic': ['الخلية والتنوع', 'الموجات والطاقة', 'التفاعلات الكيميائية', 'الأرض والموارد'],
    'secondary': ['أسس علمية متكاملة', 'البحث العلمي', 'التطبيقات الحياتية', 'قضايا علمية معاصرة'],
  },
  physics: {
    'secondary': ['الميكانيكا', 'الكهرباء والمغناطيسية', 'الموجات والضوء', 'الطاقة والحرارة'],
  },
  chemistry: {
    'secondary': ['بنية الذرة والجدول الدوري', 'الروابط والتفاعلات', 'الحسابات الكيميائية', 'الكيمياء الحياتية والبيئية'],
  },
  biology: {
    'secondary': ['الخلية والوراثة', 'أجهزة الجسم', 'التنوع والتصنيف', 'البيئة والاستدامة'],
  },
  earth: {
    'secondary': ['بنية الأرض', 'الغلاف الجوي والمناخ', 'الموارد الطبيعية', 'المخاطر البيئية'],
  },
  arabic: {
    'kg': ['الاستماع والتحدث', 'الحروف والأصوات', 'قصص قصيرة', 'التعبير الشفوي'],
    'lower-basic': ['القراءة والفهم', 'الكتابة والإملاء', 'القواعد الأساسية', 'التعبير الكتابي'],
    'mid-basic': ['النصوص الأدبية', 'النحو والصرف', 'البلاغة المبسطة', 'الإنتاج الكتابي'],
    'upper-basic': ['تحليل النصوص', 'النحو المتقدم', 'الإعلام واللغة', 'المشاريع اللغوية'],
    'secondary': ['الأدب والنقد', 'النحو والبلاغة', 'الكتابة الأكاديمية', 'التواصل الرسمي'],
  },
  english: {
    'lower-basic': ['Listening & Speaking', 'Phonics & Vocabulary', 'Reading Basics', 'Simple Writing'],
    'mid-basic': ['Communication', 'Grammar Foundations', 'Reading Comprehension', 'Guided Writing'],
    'upper-basic': ['Functional English', 'Grammar in Use', 'Extended Reading', 'Paragraph Writing'],
    'secondary': ['Academic English', 'Advanced Grammar', 'Literature & Media', 'Essay Writing'],
    'kg': ['Sounds & Words', 'Classroom Talk', 'Songs & Stories', 'Early Writing Marks'],
  },
  islamic: {
    'lower-basic': ['العقيدة الميسرة', 'العبادات الأساسية', 'الأخلاق والآداب', 'قصص قرآنية ونبوية'],
    'mid-basic': ['أركان الإيمان', 'أحكام العبادات', 'السيرة النبوية', 'القيم الإسلامية'],
    'upper-basic': ['الفقه المبسط', 'التلاوة والتفسير', 'السيرة والمجتمع', 'الأخلاق والتعامل'],
    'secondary': ['أصول الدين', 'الفقه والمعاملات', 'الفكر الإسلامي', 'الهوية والقيم'],
  },
  social: {
    'lower-basic': ['الأسرة والمجتمع', 'الوطن والرمز', 'المهن والخدمات', 'التاريخ المحلي المبسط'],
    'mid-basic': ['المجتمع الأردني', 'الموارد والاقتصاد', 'حقوق وواجبات', 'التراث'],
    'upper-basic': ['المؤسسات الوطنية', 'القضايا الاجتماعية', 'التنمية', 'المواطنة الفاعلة'],
  },
  civics: {
    'lower-basic': ['الانتماء', 'القواعد المدرسية', 'الرموز الوطنية', 'التعاون'],
    'mid-basic': ['الدستور مبسطاً', 'المؤسسات', 'حقوق الطفل', 'الخدمة المجتمعية'],
    'upper-basic': ['المواطنة الرقمية', 'المشاركة المدنية', 'سيادة القانون', 'التنوع والاحترام'],
    'secondary': ['النظام السياسي', 'المسؤولية المدنية', 'حقوق الإنسان', 'المبادرات الوطنية'],
  },
  history: {
    'mid-basic': ['تاريخ محلي', 'حضارات المنطقة', 'أحداث محورية', 'مصادر التاريخ'],
    'upper-basic': ['تاريخ الأردن الحديث', 'الدولة الهاشمية', 'العلاقات الإقليمية', 'وثائق ومصادر'],
    'secondary': ['تاريخ الأردن المعاصر', 'القضايا التاريخية', 'التحليل التاريخي', 'الذاكرة الوطنية'],
  },
  geography: {
    'mid-basic': ['خرائط ومهارات', 'تضاريس الأردن', 'المناخ والموارد', 'السكان والاستيطان'],
    'upper-basic': ['الجغرافيا الاقتصادية', 'البيئات الأردنية', 'التخطيط المكاني', 'قضايا جغرافية'],
    'secondary': ['جغرافيا الأردن المتقدمة', 'الجغرافيا البشرية', 'الموارد والطاقة', 'الجغرافيا التطبيقية'],
  },
  digital: {
    'lower-basic': ['أساسيات الحاسوب', 'السلامة الرقمية', 'الرسم والوسائط', 'حل المشكلات البسيط'],
    'mid-basic': ['معالجة النصوص', 'الجداول والعروض', 'البحث الآمن', 'مقدمة البرمجة'],
    'upper-basic': ['خوارزميات مبسطة', 'شبكات وإنترنت', 'بيانات ومعلومات', 'مشاريع رقمية'],
    'secondary': ['برمجة وتطبيقات', 'قواعد البيانات', 'أمن معلومات', 'مشاريع تقنية'],
  },
  finance: {
    'mid-basic': ['النقود والقيمة', 'الادخار', 'الاحتياجات والرغبات', 'قرارات يومية'],
    'upper-basic': ['الميزانية الشخصية', 'المصارف المبسطة', 'ريادة مصغرة', 'مخاطر الاحتيال'],
    'secondary': ['التخطيط المالي', 'الاستثمار المبسط', 'الضرائب والحقوق', 'ريادة الأعمال'],
  },
  pe: {
    'kg': ['اللعب الحركي', 'التوازن', 'الألعاب الجماعية', 'العادات الصحية'],
    'lower-basic': ['المهارات الحركية', 'الألعاب المنظمة', 'اللياقة', 'السلامة الرياضية'],
    'mid-basic': ['الألعاب الجماعية', 'اللياقة البدنية', 'القواعد الرياضية', 'الصحة'],
    'upper-basic': ['مهارات متقدمة', 'التدريب', 'الروح الرياضية', 'الصحة المجتمعية'],
    'secondary': ['الأداء الرياضي', 'التخطيط التدريبي', 'الصحة والوقاية', 'القيادة الرياضية'],
  },
  arts: {
    'kg': ['الألوان والخطوط', 'الإيقاع', 'التمثيل اللعبي', 'التعبير الحر'],
    'lower-basic': ['عناصر الفن', 'الموسيقى المدرسية', 'المسرح المدرسي', 'المشاريع الإبداعية'],
    'mid-basic': ['تقنيات فنية', 'الإيقاع واللحن', 'الأداء المسرحي', 'التراث الفني'],
    'upper-basic': ['التصميم', 'الأداء', 'النقد الفني المبسط', 'معارض ومشاريع'],
    'secondary': ['ممارسة فنية متقدمة', 'تصميم وإنتاج', 'تاريخ الفن', 'محفظة أعمال'],
  },
  'life-skills': {
    'kg': ['العناية الذاتية', 'التعاون', 'السلامة', 'المشاعر'],
    'lower-basic': ['مهارات يومية', 'العمل الجماعي', 'حل النزاعات', 'المسؤولية'],
    'mid-basic': ['إدارة الوقت', 'التواصل', 'السلامة المنزلية', 'خدمة المجتمع'],
    'upper-basic': ['التخطيط الشخصي', 'مهارات مهنية مبكرة', 'اتخاذ القرار', 'ريادة مصغرة'],
    'secondary': ['مهارات العمل', 'المشاريع المهنية', 'السلامة المهنية', 'التطوير الذاتي'],
  },
  philosophy: {
    'secondary': ['التفكير النقدي', 'الأخلاق', 'المعرفة والحقيقة', 'قضايا إنسانية'],
  },
  'psych-soc': {
    'secondary': ['مدخل إلى علم النفس', 'النمو والشخصية', 'الجماعة والمجتمع', 'قضايا اجتماعية'],
  },
  vocational: {
    'secondary': ['أساسيات المسار', 'مهارات عملية', 'معايير السلامة والجودة', 'مشروع تطبيقي'],
  },
  general: {
    'kg': ['وحدة استكشافية 1', 'وحدة استكشافية 2', 'وحدة تطبيقية 1', 'وحدة تطبيقية 2'],
    'lower-basic': ['أسس المادة', 'مهارات أساسية', 'تطبيقات', 'مراجعة ومشروع'],
    'mid-basic': ['مفاهيم محورية', 'مهارات متوسطة', 'تطبيقات', 'تقويم ومشروع'],
    'upper-basic': ['تعمق مفاهيمي', 'تحليل', 'تطبيقات', 'مشروع ختامي'],
    'secondary': ['أسس متقدمة', 'تحليل ونقد', 'تطبيقات تخصصية', 'بحث مصغر'],
  },
};

function lessonTitlesFor(unitTitle, count = 4) {
  const stems = [
    'مقدمة ومفاهيم',
    'بناء المهارة',
    'تطبيق ومثال',
    'تقويم وتعزيز',
    'ربط بالحياة',
    'مراجعة الوحدة',
  ];
  return Array.from({ length: count }, (_, i) => `${unitTitle} — ${stems[i % stems.length]}`);
}

function outcomesFor(subject, grade, unit, lesson) {
  return [
    `أن يتعرف المتعلم مفهومًا محوريًا في ${subject} ضمن ${unit} بما يتوافق مع إطار المنهاج الوطني الأردني لـ${grade}.`,
    `أن يطبّق مهارة مرتبطة بـ«${lesson}» بخطوات واضحة قابلة للتحقق.`,
    `أن يربط التعلم بموقف حياتي أو مدرسي أردني مناسب للمرحلة.`,
  ];
}

function skillsFor(family) {
  const map = {
    math: ['حل المسائل', 'التمثيل الرياضي', 'التبرير', 'الدقة الحسابية'],
    science: ['الملاحظة', 'التصنيف', 'التجريب الآمن', 'الاستنتاج'],
    physics: ['النمذجة', 'القياس', 'تحليل العلاقات', 'حل المسائل'],
    chemistry: ['الترميز', 'الحساب الكيميائي', 'السلامة المخبرية', 'التفسير'],
    biology: ['التصنيف', 'الرسم العلمي', 'التحليل', 'الربط البيئي'],
    earth: ['قراءة الخرائط', 'تفسير الظواهر', 'تقييم المخاطر', 'الاستدامة'],
    arabic: ['القراءة الناقدة', 'الكتابة المنظمة', 'الاستماع', 'التحدث'],
    english: ['listening', 'speaking', 'reading', 'writing'],
    islamic: ['التلاوة', 'الفهم القيمي', 'التطبيق الأخلاقي', 'البحث الموجّه'],
    social: ['التحليل المجتمعي', 'قراءة المصادر', 'المناقشة', 'المشروع'],
    civics: ['المواطنة', 'الحوار', 'المشاركة', 'اتخاذ القرار'],
    history: ['تحليل المصدر', 'التسلسل الزمني', 'المقارنة', 'التفسير'],
    geography: ['مهارات الخريطة', 'تحليل البيانات', 'المقارنة المكانية', 'التقييم'],
    digital: ['التشغيل الآمن', 'حل المشكلات', 'الإنتاج الرقمي', 'التعاون'],
    finance: ['التخطيط', 'الحساب المالي', 'اتخاذ القرار', 'تقييم المخاطر'],
    pe: ['الأداء الحركي', 'التعاون', 'اللياقة', 'السلامة'],
    arts: ['الإبداع', 'التقنية', 'الأداء', 'التذوق'],
    'life-skills': ['الاستقلالية', 'التواصل', 'المسؤولية', 'المرونة'],
    philosophy: ['النقد', 'الحجاج', 'التأمل', 'الكتابة التحليلية'],
    'psych-soc': ['الملاحظة', 'التفسير', 'التعاطف', 'البحث الوصفي'],
    vocational: ['المهارة العملية', 'الجودة', 'السلامة', 'إدارة المشروع'],
    general: ['الفهم', 'التطبيق', 'التحليل', 'التواصل'],
  };
  return map[family] || map.general;
}

function conceptsFor(family, subject) {
  const base = {
    math: ['عدد', 'عملية', 'نمط', 'قياس', 'تمثيل'],
    science: ['مادة', 'طاقة', 'نظام', 'تغير', 'دليل'],
    physics: ['قوة', 'شغل', 'طاقة', 'موجة', 'تيار'],
    chemistry: ['ذرة', 'مركب', 'تفاعل', 'مول', 'محلول'],
    biology: ['خلية', 'وراثة', 'نظام حيوي', 'توازن', 'تنوع'],
    earth: ['صخور', 'مناخ', 'موارد', 'دورة', 'مخاطر'],
    arabic: ['نص', 'معنى', 'أسلوب', 'قاعدة', 'سياق'],
    english: ['vocabulary', 'structure', 'fluency', 'comprehension', 'genre'],
    islamic: ['عقيدة', 'عبادة', 'خلق', 'سيرة', 'قيمة'],
    social: ['مجتمع', 'مؤسسة', 'موارد', 'هوية', 'تنمية'],
    civics: ['مواطنة', 'حق', 'واجب', 'قانون', 'مشاركة'],
    history: ['حدث', 'مصدر', 'سبب', 'نتيجة', 'تغيير'],
    geography: ['مكان', 'إقليم', 'توزيع', 'تفاعل', 'استدامة'],
    digital: ['بيانات', 'خوارزمية', 'شبكة', 'خصوصية', 'وسائط'],
    finance: ['دخل', 'مصروف', 'ادخار', 'ميزانية', 'مخاطرة'],
    pe: ['مهارة حركية', 'لياقة', 'تعاون', 'قاعدة', 'صحة'],
    arts: ['خط', 'لون', 'إيقاع', 'أداء', 'تكوين'],
    'life-skills': ['ذات', 'آخر', 'قرار', 'سلامة', 'هدف'],
    philosophy: ['سؤال', 'حجة', 'قيمة', 'معرفة', 'حرية'],
    'psych-soc': ['سلوك', 'شخصية', 'جماعة', 'نمو', 'تأثير'],
    vocational: ['معيار', 'أداة', 'عملية', 'جودة', 'مشروع'],
    general: ['مفهوم', 'مهارة', 'تطبيق', 'تقويم', 'ربط'],
  };
  return (base[family] || base.general).map((c) => ({
    term: c,
    subject,
    note: 'مفهوم إطار منهاجي — محتوى أصلي Success OS غير منسوخ من كتاب مدرسي',
  }));
}

function definitionsFor(concepts) {
  return concepts.slice(0, 4).map((c) => ({
    term: c.term,
    definitionAr: `تعريف تعليمي أصلي لمفهوم «${c.term}» ضمن إطار المنهاج الوطني الأردني، يُبنى لأغراض التدريس في Success OS دون اقتباس نص الكتاب المدرسي.`,
  }));
}

function examplesFor(subject, grade, lesson) {
  return [
    {
      title: 'مثال صفّي',
      text: `موقف تعليمي أصلي لـ${grade} في ${subject} يوضح تطبيق فكرة درس «${lesson}» بخطوات قابلة للمتابعة.`,
    },
    {
      title: 'مثال حياتي أردني',
      text: `ربط الدرس بسياق يومي مناسب للمتعلم في الأردن (مدرسة، منزل، مجتمع محلي) دون الاعتماد على نص كتابي محمي.`,
    },
  ];
}

function diagramsFor(family, unit) {
  const kinds = {
    math: 'number-line-or-bar-model',
    science: 'process-cycle-diagram',
    physics: 'force-vector-or-circuit',
    chemistry: 'particle-model',
    biology: 'system-organs-or-cell',
    earth: 'layered-earth-or-map',
    arabic: 'text-structure-map',
    english: 'language-skills-wheel',
    islamic: 'values-map',
    social: 'community-map',
    civics: 'rights-duties-chart',
    history: 'timeline',
    geography: 'thematic-map',
    digital: 'flowchart',
    finance: 'budget-pie',
    pe: 'movement-sequence',
    arts: 'composition-grid',
    'life-skills': 'decision-tree',
    philosophy: 'argument-map',
    'psych-soc': 'behavior-factor-map',
    vocational: 'process-workflow',
    general: 'concept-map',
  };
  return [
    {
      id: `${kinds[family] || 'concept-map'}`,
      title: `مخطط تعليمي لوحدة ${unit}`,
      purpose: 'توضيح العلاقات المفاهيمية للمتعلم',
      generateOriginal: true,
      neverCopyTextbookFigure: true,
    },
  ];
}

/**
 * Build original curriculum-aligned knowledge payload for one Jordan grade×subject cell.
 */
export function buildSubjectKnowledgeNode({
  stage,
  grade,
  subject,
  officialCatalogUrl = null,
  catalogueStatus = 'structure-from-national-profile',
  authorities = [],
}) {
  const band = bandFromGrade(grade);
  const family = familyOf(subject);
  const unitTitles =
    UNIT_BLUEPRINTS[family]?.[band] ||
    UNIT_BLUEPRINTS[family]?.secondary ||
    UNIT_BLUEPRINTS.general[band] ||
    UNIT_BLUEPRINTS.general['lower-basic'];

  const skills = skillsFor(family);
  const concepts = conceptsFor(family, subject);
  const definitions = definitionsFor(concepts);

  const units = unitTitles.map((unitTitle, ui) => {
    const lessons = lessonTitlesFor(unitTitle, 4).map((lessonTitle, li) => ({
      lessonId: `L${ui + 1}.${li + 1}`,
      titleAr: lessonTitle,
      learningOutcomes: outcomesFor(subject, grade, unitTitle, lessonTitle),
      requiredSkills: skills.slice(0, 3),
      scientificConcepts: concepts.slice(0, 3).map((c) => c.term),
      definitions: definitions.slice(0, 2),
      examples: examplesFor(subject, grade, lessonTitle),
      educationalDiagrams: diagramsFor(family, unitTitle),
      officialCurriculumReference: {
        curriculum: 'Jordan National Curriculum',
        curriculumAr: 'المنهاج الوطني الأردني',
        stage,
        grade,
        subject,
        catalogUrl: officialCatalogUrl,
        authorities,
        note: 'Lesson authored only after referencing official Jordanian curriculum structure for this grade/subject.',
      },
      contentOrigin: 'success-os-original-curriculum-aligned',
      rights: {
        copyBookText: false,
        generateOriginalOnly: true,
      },
    }));
    return {
      unitId: `U${ui + 1}`,
      titleAr: unitTitle,
      lessons,
    };
  });

  return {
    stage,
    grade,
    subject,
    subjectFamily: family,
    gradeBand: band,
    officialCatalogUrl,
    catalogueStatus,
    curriculumFramework: {
      name: 'Jordan National Curriculum',
      nameAr: 'المنهاج الوطني الأردني',
      stage,
      grade,
      subject,
      semesters: ['الفصل الأول', 'الفصل الثاني'],
    },
    gradeStructure: { grade, band, stage },
    subjectStructure: { subject, family, unitCount: units.length },
    units,
    learningOutcomes: units.flatMap((u) => u.lessons.flatMap((l) => l.learningOutcomes)),
    requiredSkills: skills,
    scientificConcepts: concepts,
    definitions,
    examples: units.flatMap((u) => u.lessons.flatMap((l) => l.examples)).slice(0, 8),
    educationalDiagrams: units.flatMap((u) => u.lessons.flatMap((l) => l.educationalDiagrams)),
    references: [
      ...authorities,
      ...(officialCatalogUrl
        ? [{ name: `NCCD catalogue — ${grade}`, url: officialCatalogUrl, type: 'official-grade-catalogue' }]
        : []),
      { name: 'Darsak Platform', url: 'https://darsak.gov.jo/', type: 'official-digital-platform' },
      { name: 'MoE Jordan', url: 'https://moe.gov.jo/', type: 'ministry-education' },
    ],
    contentOrigin: 'success-os-original-curriculum-aligned',
    rights: {
      copyBookText: false,
      copyTeacherGuideProse: false,
      generateOriginalSuccessOsContentOnly: true,
    },
  };
}

export function listSubjectFamilies() {
  return Object.keys(UNIT_BLUEPRINTS);
}
