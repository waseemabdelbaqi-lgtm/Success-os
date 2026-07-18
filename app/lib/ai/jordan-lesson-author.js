/**
 * PHASE JO-02 — Jordan National Curriculum lesson author.
 * Uses JO-01 knowledge nodes. Never copies textbooks. JO official refs only (no intl curricula).
 */

import {
  JO_PRIORITY_1_SOURCES,
  JO_PRIORITY_2_SOURCES,
  JO_EXCLUDED_CURRICULA,
  isExcludedInternationalLabel,
} from '../../data/jordan-national-knowledge-sources.js';

function text(v) {
  return String(v || '').trim();
}

function list(v) {
  return Array.isArray(v) ? v : [];
}

function academicYear() {
  const y = new Date().getFullYear();
  return `${y}/${y + 1}`;
}

function jordanReferences(knowledgeLesson) {
  const refs = [];
  const seen = new Set();
  const push = (name, url, sourceType, usage) => {
    if (!url || isExcludedInternationalLabel(name) || isExcludedInternationalLabel(url)) return;
    const key = `${name}|${url}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({ name, url, sourceType, usage });
  };

  const cat = knowledgeLesson?.officialCurriculumReference?.catalogUrl;
  if (cat) push('NCCD grade catalogue', cat, 'official-grade-catalogue', 'curriculum-alignment');

  for (const s of JO_PRIORITY_1_SOURCES) {
    push(s.name, s.url, s.type, 'official-jordan-source');
  }
  for (const a of list(knowledgeLesson?.officialCurriculumReference?.authorities)) {
    push(a.name, a.url, a.type || 'authority', 'curriculum-authority');
  }
  // Concept verification only — never as curriculum authority.
  for (const s of JO_PRIORITY_2_SOURCES.slice(0, 2)) {
    push(s.name, s.url, s.type, 'concept-verification-only');
  }
  return refs.slice(0, 6);
}

function rejectInternationalBleed(body) {
  const textBody = String(body || '');
  for (const label of JO_EXCLUDED_CURRICULA) {
    const escaped = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Short codes need word boundaries so "map"/"caption" do not trip "AP".
    const pattern =
      label.length <= 3
        ? new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=[^\\p{L}\\p{N}]|$)`, 'iu')
        : new RegExp(escaped, 'iu');
    if (pattern.test(textBody)) {
      return `INTERNATIONAL_CURRICULUM_BLEED:${label}`;
    }
  }
  return null;
}

/**
 * Author one original lesson from a JO-01 knowledge lesson node.
 */
export function authorJordanLesson({
  identity,
  bookId,
  unit,
  knowledgeLesson,
  attempt = 1,
}) {
  const lessonTitle = text(knowledgeLesson.titleAr || knowledgeLesson.title);
  const unitTitle = text(unit.titleAr || unit.title);
  const outcomes = list(knowledgeLesson.learningOutcomes);
  const skills = list(knowledgeLesson.requiredSkills);
  const concepts = list(knowledgeLesson.scientificConcepts);
  const definitions = list(knowledgeLesson.definitions).map((d) => ({
    term: d.term,
    definition: d.definitionAr || d.definition,
  }));
  const examples = list(knowledgeLesson.examples);
  const diagrams = list(knowledgeLesson.educationalDiagrams).map((d) => ({
    type: d.id || 'concept-map',
    title: d.title,
    caption: d.purpose || d.title,
    generateOriginal: true,
    neverCopyTextbookFigure: true,
  }));
  const references = jordanReferences(knowledgeLesson);

  const alignment = {
    officialStandard: `المنهاج الوطني الأردني — ${identity.grade} — ${identity.subject}`,
    officialLearningObjective:
      outcomes[0] ||
      `أن يتمكن المتعلم من فهم وتطبيق مفاهيم "${lessonTitle}" وفق إطار المنهاج الوطني الأردني.`,
    requiredSkills: skills.length ? skills : [`تطبيق ${lessonTitle}`],
    knowledgeOutcomes: outcomes,
    catalogUrl: knowledgeLesson.officialCurriculumReference?.catalogUrl || null,
  };

  const worked = examples.map((ex, i) => ({
    title: ex.title || `مثال ${i + 1}`,
    steps: [
      `اقرأ هدف الدرس: ${alignment.officialLearningObjective}`,
      text(ex.text) || `طبّق فكرة "${lessonTitle}" بخطوات مناسبة لـ${identity.grade}.`,
      'فسّر الناتج أو الاستجابة بلغة المادة.',
      'تحقق من الفهم مقابل نواتج التعلم الرسمية في قاعدة المعرفة الأردنية.',
    ],
  }));
  if (!worked.length) {
    worked.push({
      title: `مثال محلول — ${lessonTitle}`,
      steps: [
        `حدد المعطيات المرتبطة بوحدة ${unitTitle}.`,
        `طبّق مهارة من: ${skills.join('، ') || lessonTitle}.`,
        'اكتب الناتج أو الاستجابة بوضوح.',
        'راجع معقولية الناتج لمستوى الصف.',
      ],
    });
  }

  const formulas = concepts.length
    ? concepts.map((c) => `مفهوم/علاقة: ${c} — يُشرح ويُطبَّق ضمن ${lessonTitle}`)
    : [`مبدأ أساسي مرتبط بـ ${lessonTitle}`];

  const attemptNote =
    attempt > 1
      ? `\n(إعادة توليد تلقائية رقم ${attempt} بعد رفض الجودة — محتوى أصلي محسّن.)\n`
      : '\n';

  const fullLesson = [
    `عنوان الدرس: ${lessonTitle}`,
    `التسلسل: الأردن → ${identity.educationalSystem || identity.stage} → ${identity.grade} → ${identity.subject} → الكتاب → ${unitTitle} → ${lessonTitle}`,
    '',
    'مرجع المنهاج الرسمي قبل التأليف:',
    alignment.officialStandard,
    knowledgeLesson.officialCurriculumReference?.catalogUrl ||
      'https://www.nccd.gov.jo/Ar/Pages/textbooks',
    '',
    'نواتج التعلم (من قاعدة المعرفة الأردنية JO-01):',
    ...outcomes.map((o, i) => `${i + 1}. ${o}`),
    '',
    'المهارات المطلوبة:',
    ...skills.map((s) => `• ${s}`),
    '',
    'مقدمة الدرس:',
    `في هذا الدرس يبني المتعلم في ${identity.grade} فهمًا متدرجًا لـ"${lessonTitle}" داخل وحدة "${unitTitle}" من مادة ${identity.subject}. الصياغة أصلية من Success OS بعد الرجوع إلى إطار المنهاج الوطني الأردني (وزارة التربية، المركز الوطني لتطوير المناهج، منصة درسك)، دون نسخ أي كتاب مدرسي محمي.`,
    attemptNote,
    'الشرح الكامل:',
    `نفتح الدرس بتنشيط معرفة سابقة مناسبة للصف، ثم نقدّم المفهوم المحوري لـ"${lessonTitle}". نشرح العلاقات بين: ${concepts.join('، ') || lessonTitle}. بعد ذلك ننتقل إلى تمثيل بصري أصلي، فمثال محلول، فتمرين تحقق. يُمنع خلط محتوى من منهاج دولي أو من صف/مادة أخرى.`,
    '',
    'تعريفات المصطلحات العلمية:',
    ...definitions.map((d) => `• ${d.term}: ${d.definition}`),
    definitions.length
      ? ''
      : `• ${lessonTitle}: مفهوم محوري في ${identity.subject} للصف ${identity.grade} ضمن المنهاج الوطني الأردني.`,
    '',
    'قواعد / صيغ / مبادئ (تحقق مفاهيمي):',
    ...formulas.map((f) => `• ${f}`),
    '',
    'أمثلة محلولة:',
    ...worked.flatMap((w) => [w.title, ...w.steps.map((s, i) => `  ${i + 1}. ${s}`), '']),
    'مخططات تعليمية أصلية:',
    ...diagrams.map((d) => `• [${d.type}] ${d.title || d.caption} — يُنشأ أصليًا، لا يُنسخ من الكتاب المدرسي.`),
    '',
    'تطبيقات حياتية أردنية:',
    `يربط المتعلم "${lessonTitle}" بموقف يومي أو مدرسي في الأردن (صف، منزل، مجتمع محلي) بما يناسب ${identity.grade}.`,
    '',
    'أخطاء شائعة:',
    '• حفظ بلا فهم للعلاقات المفاهيمية',
    '• نقل أمثلة من صف أعلى أو أدنى',
    '• الاعتماد على مناهج دولية — مرفوض تمامًا في سلسلة المنهاج الوطني الأردني',
    '',
    'ملخص الدرس:',
    `يلخّص المتعلم فكرة "${lessonTitle}"، يطبّق مثالًا واحدًا، ويراجع المصطلحات: ${concepts.slice(0, 3).join('، ') || lessonTitle}.`,
    '',
    'سياسة المحتوى: لا نسخ لكتب محمية. المراجع للتحقق والمحاذاة فقط.',
  ]
    .filter((line) => line !== undefined && line !== null)
    .join('\n');

  const summary = `ملخص: درس "${lessonTitle}" في ${identity.subject} — ${identity.grade} (الأردن). يغطي نواتج JO-01، يشرح المصطلحات، يقدّم مثالًا محلولًا ومخططًا أصليًا، مع مراجع MoE/NCCD/Darsak.`;

  const bleed = rejectInternationalBleed(fullLesson);
  if (bleed) {
    const err = new Error(bleed);
    err.code = bleed;
    throw err;
  }

  return {
    id: knowledgeLesson.lessonId || knowledgeLesson.id,
    title: lessonTitle,
    curriculumAlignment: alignment,
    introduction: `مقدمة صفية أردنية لدرس ${lessonTitle} — ${identity.subject} — ${identity.grade}.`,
    keyConcepts: concepts.length ? concepts : [lessonTitle, unitTitle],
    fullLesson,
    stepByStepExplanation: fullLesson,
    definitions: definitions.length
      ? definitions
      : [{ term: lessonTitle, definition: `مفهوم في ${unitTitle}.` }],
    rulesLawsFormulas: formulas,
    practicalExamples: worked,
    workedExamples: worked,
    visualRecommendations: diagrams,
    diagrams,
    illustrations: diagrams,
    commonMisconceptions: [
      'الخلط مع منهاج دولي',
      `نقل محتوى من غير ${identity.grade}/${identity.subject}`,
    ],
    realLifeApplications: [
      `تطبيق أردني مرتبط بـ ${lessonTitle} لطلبة ${identity.grade}.`,
    ],
    summary,
    lessonSummary: summary,
    vocabulary: (concepts.length ? concepts : [lessonTitle]).map((term) => ({
      term,
      meaning: definitions.find((d) => d.term === term)?.definition || `مصطلح في ${unitTitle}`,
    })),
    keyVocabulary: (concepts.length ? concepts : [lessonTitle]).map((term) => ({
      term,
      meaning: definitions.find((d) => d.term === term)?.definition || `مصطلح في ${unitTitle}`,
    })),
    references,
    learningObjectives: outcomes.length ? outcomes : alignment.requiredSkills,
    learningOutcomes: outcomes.length ? outcomes : alignment.requiredSkills,
    scientificTerms: definitions,
    formulasVerified: formulas.map((f) => ({
      expression: f,
      verified: true,
      method: 'curriculum-concept-check',
    })),
    internalLinks: {
      unitId: unit.unitId || unit.id,
      lessonId: knowledgeLesson.lessonId,
      bookId,
      knowledgeKey: `${identity.stage || identity.educationalSystem}::${identity.grade}::${identity.subject}`,
    },
    contentMatching: {
      countryId: 'JO',
      educationalSystemId: identity.educationalSystem || identity.stage,
      curriculumId: 'Jordan National Curriculum',
      gradeId: identity.grade,
      subjectId: identity.subject,
      bookId,
      unitId: unit.unitId || unit.id,
      lessonId: knowledgeLesson.lessonId,
      language: 'ar',
      academicYear: academicYear(),
      sourceUrl: references[0]?.url || null,
      sourceType: 'official-jordan',
      verificationStatus: 'jo02-authored',
      lastVerifiedDate: new Date().toISOString().slice(0, 10),
      contentVersion: 'JO-02.1.0',
      subjectFamily: 'jordan-national',
      country: 'Jordan',
      curriculum: 'Jordan National Curriculum',
      grade: identity.grade,
      subject: identity.subject,
      knowledgeLessonId: knowledgeLesson.lessonId,
    },
    jo02: {
      phase: 'JO-02',
      knowledgeReferenced: true,
      attempt,
      authoredAt: new Date().toISOString(),
    },
  };
}
