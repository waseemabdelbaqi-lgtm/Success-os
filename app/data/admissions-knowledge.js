/**
 * Admissions knowledge layer — majors, subjects, language benchmarks, docs.
 * Sources researched 2026-07 (ISCED-F 2013 / UNESCO UIS, Common App / UCAS /
 * OUAC / Studielink / uni-assist / DAAD / Study in Saudi / Study in Türkiye,
 * typical US/CA/UK/EU international first-year requirements).
 * Always verify programme pages before applying — thresholds change by intake.
 */

/** ISCED-F 2013 broad fields mapped to Arabic UI labels used in the registry. */
export const ISCED_FIELDS = Object.freeze([
  {
    code: '01',
    id: 'education',
    labelEn: 'Education',
    labelAr: 'تربية وتعليم',
    aliases: ['تربية', 'تعليم'],
  },
  {
    code: '02',
    id: 'arts-humanities',
    labelEn: 'Arts and humanities',
    labelAr: 'آداب',
    aliases: ['فنون', 'إنسانيات', 'لغات'],
  },
  {
    code: '03',
    id: 'social-sciences',
    labelEn: 'Social sciences, journalism and information',
    labelAr: 'علوم اجتماعية',
    aliases: ['إعلام', 'سياسة', 'علم نفس'],
  },
  {
    code: '04',
    id: 'business-law',
    labelEn: 'Business, administration and law',
    labelAr: 'أعمال',
    aliases: ['إدارة', 'قانون', 'محاسبة', 'اقتصاد'],
  },
  {
    code: '05',
    id: 'natural-sciences',
    labelEn: 'Natural sciences, mathematics and statistics',
    labelAr: 'علوم',
    aliases: ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء'],
  },
  {
    code: '06',
    id: 'ict',
    labelEn: 'Information and Communication Technologies',
    labelAr: 'حوسبة',
    aliases: ['تقنية معلومات', 'برمجة', 'ذكاء اصطناعي'],
  },
  {
    code: '07',
    id: 'engineering',
    labelEn: 'Engineering, manufacturing and construction',
    labelAr: 'هندسة',
    aliases: ['عمارة', 'صناعة'],
  },
  {
    code: '08',
    id: 'agriculture',
    labelEn: 'Agriculture, forestry, fisheries and veterinary',
    labelAr: 'زراعة وبيطرة',
    aliases: ['زراعة', 'بيطرة'],
  },
  {
    code: '09',
    id: 'health',
    labelEn: 'Health and welfare',
    labelAr: 'طب وصحة',
    aliases: ['تمريض', 'صيدلة', 'صحة عامة'],
  },
  {
    code: '10',
    id: 'services',
    labelEn: 'Services',
    labelAr: 'خدمات وسياحة',
    aliases: ['ضيافة', 'رياضة', 'أمن'],
  },
]);

/**
 * Major clusters with typical secondary-subject prerequisites and notes.
 * Labels align with `globalInstitutions[].fields` where possible.
 */
export const MAJOR_CLUSTERS = Object.freeze([
  {
    id: 'engineering',
    labelAr: 'هندسة',
    labelEn: 'Engineering',
    isced: '07',
    secondarySubjectsAr: ['رياضيات متقدمة', 'فيزياء', 'كيمياء (غالباً)', 'لغة البرنامج'],
    secondarySubjectsEn: ['Advanced mathematics', 'Physics', 'Chemistry (often)', 'Programme language'],
    competitiveNoteAr:
      'برامج الهندسة تنافسية: غالباً معدل أعلى + مواد STEM قوية؛ بعض الدول تشترط اختبارات قبول أو سنة تحضيرية.',
    typicalLanguage: { ielts: 6.0, toeflIbt: 80, noteAr: 'الهندسة التنافسية غالباً IELTS 6.5+' },
    relatedPortals: ['ucas', 'uni-assist', 'studielink', 'common-app', 'ouac'],
  },
  {
    id: 'computing',
    labelAr: 'حوسبة',
    labelEn: 'Computing / ICT',
    isced: '06',
    secondarySubjectsAr: ['رياضيات', 'علوم حاسوب إن وجدت', 'لغة إنجليزية أو لغة البرنامج'],
    secondarySubjectsEn: ['Mathematics', 'Computer science if available', 'English / programme language'],
    competitiveNoteAr:
      'يفضَّل إثبات قدرات منطقية/برمجية؛ بعض الجامعات تقبل مساراً عاماً ثم تخصصاً لاحقاً.',
    typicalLanguage: { ielts: 6.0, toeflIbt: 79, noteAr: 'برامج AI/CS المتقدمة قد ترفع الحد الأدنى' },
    relatedPortals: ['common-app', 'ucas', 'bachelorsportal', 'coursera-degrees'],
  },
  {
    id: 'business',
    labelAr: 'أعمال',
    labelEn: 'Business & administration',
    isced: '04',
    secondarySubjectsAr: ['رياضيات', 'لغة إنجليزية', 'اقتصاد أو محاسبة إن وجدت'],
    secondarySubjectsEn: ['Mathematics', 'English', 'Economics or accounting if available'],
    competitiveNoteAr:
      'بعض برامج إدارة الأعمال الدولية تشترط مقالاً أو مقابلة؛ الماجستير غالباً يحتاج بكالوريوس + IELTS أعلى.',
    typicalLanguage: { ielts: 6.0, toeflIbt: 80, noteAr: 'MBA / MSc غالباً IELTS 6.5–7.0' },
    relatedPortals: ['ucas', 'common-app', 'ouac', 'studielink'],
  },
  {
    id: 'sciences',
    labelAr: 'علوم',
    labelEn: 'Natural sciences',
    isced: '05',
    secondarySubjectsAr: ['رياضيات', 'فيزياء أو كيمياء أو أحياء حسب التخصص'],
    secondarySubjectsEn: ['Mathematics', 'Physics / Chemistry / Biology by track'],
    competitiveNoteAr:
      'التخصصات المخبرية تشترط مواد علوم بمختبر؛ الطب والصيدلة لها مسارات وحصص منفصلة.',
    typicalLanguage: { ielts: 6.0, toeflIbt: 80, noteAr: 'تحقق من متطلبات المختبر والمواد' },
    relatedPortals: ['ucas', 'uni-assist', 'common-app'],
  },
  {
    id: 'health',
    labelAr: 'طب وصحة',
    labelEn: 'Health & medicine',
    isced: '09',
    secondarySubjectsAr: ['أحياء', 'كيمياء', 'رياضيات أو فيزياء', 'لغة البرنامج'],
    secondarySubjectsEn: ['Biology', 'Chemistry', 'Math or physics', 'Programme language'],
    competitiveNoteAr:
      'الطب والتمريض والصيدلة شديدة التنافس: حدود معدل أعلى، مقابلات، وأحياناً اختبارات وطنية (مثل NEET/UCAT) أو NC في ألمانيا.',
    typicalLanguage: { ielts: 6.5, toeflIbt: 90, noteAr: 'التمريض والطب غالباً أعلى من الحد العام' },
    relatedPortals: ['ucas', 'hochschulstart', 'uni-assist', 'study-in-t-rkiye'],
  },
  {
    id: 'arts',
    labelAr: 'آداب',
    labelEn: 'Arts & humanities',
    isced: '02',
    secondarySubjectsAr: ['لغة أدبية قوية', 'تاريخ أو فلسفة حسب البرنامج', 'ملف إبداعي إن لزم'],
    secondarySubjectsEn: ['Strong language arts', 'History/philosophy by programme', 'Portfolio if required'],
    competitiveNoteAr:
      'الفنون الجميلة والتصميم والموسيقى غالباً تحتاج portfolio أو audition بالإضافة للمعدل.',
    typicalLanguage: { ielts: 6.0, toeflIbt: 79, noteAr: 'برامج الأدب الإنجليزي قد ترفع الحد' },
    relatedPortals: ['ucas', 'common-app', 'parcoursup'],
  },
  {
    id: 'economics',
    labelAr: 'اقتصاد',
    labelEn: 'Economics',
    isced: '03',
    secondarySubjectsAr: ['رياضيات', 'لغة إنجليزية', 'اقتصاد إن وجد'],
    secondarySubjectsEn: ['Mathematics', 'English', 'Economics if available'],
    competitiveNoteAr: 'الاقتصاد الكمي يشترط رياضيات أقوى من المسارات النظرية.',
    typicalLanguage: { ielts: 6.5, toeflIbt: 80, noteAr: 'برامج LSE/Oxbridge أعلى بكثير' },
    relatedPortals: ['ucas', 'common-app', 'ouac'],
  },
]);

/** Typical English proficiency bands for international undergraduate entry (indicative). */
export const LANGUAGE_BENCHMARKS = Object.freeze([
  {
    id: 'ielts',
    name: 'IELTS Academic',
    typicalMin: '6.0–6.5',
    competitive: '6.5–7.5',
    noteAr: 'الأكثر قبولاً عالمياً؛ تحقق من الحد الأدنى لكل بند (band) وليس المجموع فقط.',
    url: 'https://www.ielts.org/',
  },
  {
    id: 'toefl',
    name: 'TOEFL iBT',
    typicalMin: '79–80',
    competitive: '90–100+',
    noteAr: 'شائع في أمريكا الشمالية؛ اعتباراً من 2026 قد تظهر مقاييس درجات محدّثة لدى بعض الجامعات.',
    url: 'https://www.ets.org/toefl.html',
  },
  {
    id: 'duolingo',
    name: 'Duolingo English Test',
    typicalMin: '105–120',
    competitive: '120–130+',
    noteAr: 'مقبول في كثير من الجامعات الأمريكية والأونلاين؛ ليس بديلاً عالمياً لكل الدول.',
    url: 'https://englishtest.duolingo.com/',
  },
  {
    id: 'pte',
    name: 'PTE Academic',
    typicalMin: '50–58',
    competitive: '58–65+',
    noteAr: 'بديل شائع في أستراليا والمملكة المتحدة وبعض الجامعات الأمريكية.',
    url: 'https://www.pearsonpte.com/',
  },
  {
    id: 'german',
    name: 'TestDaF / DSH / Goethe',
    typicalMin: 'B2–C1',
    competitive: 'C1+',
    noteAr: 'لبرامج ألمانية اللغة؛ البرامج الإنجليزية في ألمانيا تعتمد IELTS/TOEFL بدل ذلك.',
    url: 'https://www.daad.de/en/',
  },
  {
    id: 'french',
    name: 'DELF / DALF / TCF',
    typicalMin: 'B2',
    competitive: 'C1',
    noteAr: 'لبرامج فرنسية اللغة عبر Parcoursup أو Campus France؛ البرامج الإنجليزية منفصلة.',
    url: 'https://www.campusfrance.org/en',
  },
]);

/** Document packs by applicant type — generic international checklist. */
export const ADMISSION_DOC_PACKS = Object.freeze({
  local: {
    titleAr: 'حزمة الطالب المحلي (عامة)',
    items: [
      'شهادة الثانوية الوطنية أو ما يعادلها',
      'كشف علامات بالمواد المطلوبة للتخصص',
      'طلب عبر البوابة المركزية أو الجامعة',
      'اختبار قبول وطني إن وُجد (YKS، تنسيق، ATAR…)',
      'مستندات إضافية للتخصصات التنافسية (مقابلة، ملف، قدرات)',
    ],
  },
  international: {
    titleAr: 'حزمة الطالب الدولي (عامة)',
    items: [
      'جواز سفر ساري',
      'شهادة وكشف علامات رسميان + ترجمة معتمدة عند الحاجة',
      'إثبات لغة (IELTS/TOEFL/Duolingo/PTE أو لغة البرنامج)',
      'إثبات تمويل / كشف حساب حسب الدولة',
      'خطاب قبول مشروط أو نهائي ثم طلب التأشيرة / تصريح الدراسة',
      'معادلة الشهادة لدى جهة الدولة المستقبِلة عند الطلب (anabin، وزارة…)',
    ],
  },
});

/** Region application playbooks distilled from official portals (2026 research). */
export const REGION_PLAYBOOKS = Object.freeze([
  {
    id: 'americas',
    titleAr: 'الأمريكتان — مسار التقديم',
    stepsAr: [
      'الولايات المتحدة: Common App أو Coalition أو تطبيق الولاية (ApplyTexas / Cal State / UC).',
      'كندا: OUAC لجامعات أونتاريو؛ Ontario Colleges للكليات؛ باقي المقاطعات غالباً مباشرة للجامعة.',
      'الطالب الدولي: إثبات إنجليزي + تمويل + I-20/F-1 (أمريكا) أو Study Permit + PAL عند اللزوم (كندا 2026).',
    ],
    portals: ['common-app', 'ouac', 'ontario-colleges', 'educanada', 'fulbright-foreign-student-program'],
  },
  {
    id: 'europe',
    titleAr: 'أوروبا — مسار التقديم',
    stepsAr: [
      'المملكة المتحدة: UCAS إلزامي للبكالوريوس (حتى 5 اختيارات غالباً).',
      'ألمانيا: تحقق من المسار — مباشر / uni-assist (أو VPD) / Hochschulstart للبرامج المقيدة NC.',
      'هولندا: Studielink للبكالوريوس العام؛ numerus fixus لبرامج محدودة المقاعد.',
      'فرنسا: Parcoursup للمحلي؛ Campus France / Études en France للدولي حسب الجنسية.',
      'منح: Chevening (ماجستير UK)، Erasmus Mundus (برامج مشتركة أوروبية).',
    ],
    portals: ['ucas', 'uni-assist', 'hochschulstart', 'studielink', 'parcoursup', 'campus-france', 'daad-study-in-germany', 'chevening-scholarships', 'erasmus-mundus-catalogue'],
  },
  {
    id: 'mena',
    titleAr: 'الشرق الأوسط — مسار التقديم',
    stepsAr: [
      'السعودية: Study in Saudi للطلاب الدوليين والمنح؛ القبول الموحد الوطني للطلاب المحليين في الجامعات الحكومية.',
      'تركيا: Study in Türkiye + TR-YÖS/YÖS للمسار الدولي؛ Türkiye Scholarships عبر TBBS؛ المحلي عبر YKS.',
      'قطر: مسارات الجامعات + Qatar Scholarships للبرامج الشريكة.',
      'الأردن/مصر/الخليج: قبول موحد أو تنسيق محلي؛ دولي عبر الموازي/الوافدين + معادلة.',
    ],
    portals: ['study-in-saudi-arabia', 'study-in-t-rkiye', 't-rkiye-scholarships', 'qatar-scholarships'],
  },
  {
    id: 'asia',
    titleAr: 'آسيا — مسار التقديم',
    stepsAr: [
      'الهند: Study in India للطلاب الدوليين؛ المحلي JEE/NEET حسب التخصص.',
      'اليابان/كوريا/الصين: بوابات حكومية + اختبارات لغة وطنية أو مسارات إنجليزية منفصلة.',
      'سنغافورة/ماليزيا: تقديم مباشر للجامعة مع تحقق من سجل المؤهلات الوطني.',
    ],
    portals: ['study-in-india-portal', 'study-in-japan-portal', 'applyboard'],
  },
  {
    id: 'oceania',
    titleAr: 'أوقيانوسيا — مسار التقديم',
    stepsAr: [
      'أستراليا: بوابات الولايات (UAC/VTAC/QTAC/SATAC/TISC) للمحلي؛ الدولي عبر الجامعة + CRICOS.',
      'نيوزيلندا: تقديم مؤسسي + تحقق NZQA للمؤهلات الأجنبية.',
    ],
    portals: ['uac', 'vtac', 'qtac', 'satac', 'tisc'],
  },
]);

export function clusterForField(fieldLabel) {
  if (!fieldLabel || fieldLabel === 'الكل') return null;
  const key = String(fieldLabel).trim();
  const direct =
    MAJOR_CLUSTERS.find((c) => c.labelAr === key || c.labelEn === key) ||
    MAJOR_CLUSTERS.find((c) => key.includes(c.labelAr) || c.labelAr.includes(key));
  if (direct) return direct;
  const isced = ISCED_FIELDS.find(
    (f) => f.labelAr === key || f.aliases?.some((a) => key.includes(a)),
  );
  if (!isced) return null;
  return MAJOR_CLUSTERS.find((c) => c.isced === isced.code) || null;
}

export function playbookForRegion(regionId) {
  return REGION_PLAYBOOKS.find((p) => p.id === regionId) || null;
}

export function knowledgeSummary() {
  return {
    fields: ISCED_FIELDS.length,
    clusters: MAJOR_CLUSTERS.length,
    languageTests: LANGUAGE_BENCHMARKS.length,
    playbooks: REGION_PLAYBOOKS.length,
    researchedAt: '2026-07-25',
    sources: [
      'UNESCO UIS ISCED-F 2013',
      'uni-assist / DAAD / Hochschulstart',
      'UCAS / Common App / OUAC / Studielink / Parcoursup',
      'Study in Saudi / Study in Türkiye / Türkiye Scholarships',
      'Ontario Colleges / EduCanada',
      'Chevening / Erasmus Mundus / Fulbright / Qatar Scholarships',
    ],
  };
}
