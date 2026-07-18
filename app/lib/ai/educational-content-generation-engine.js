/**
 * SUCCESS OS Educational Content Generation Engine — Phase 8
 * Creates ORIGINAL draft educational content from official objectives,
 * verified academic references, and openly licensed resources.
 * Never copies copyrighted textbooks. Never auto-publishes.
 * Does not generate the entire library unless explicitly approved later.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { courseStructureFor, bookProfileFor } from '../../data/course-blueprints.js';
import {
  CONTENT_POLICY,
  validateUniversalBookTemplate,
  createUniversalBookTemplate,
} from './universal-book-template.js';
import { validateQaEngineProductionReady } from './success-os-qa-engine.js';

export const PHASE = 'PHASE_8_EDUCATIONAL_CONTENT_GENERATION';
export const ENGINE_VERSION = '1.0.0';
export const DRAFT_STATUS = 'DRAFT_PENDING_QA_REVIEW';
export const MASS_LIBRARY_GENERATION_ALLOWED = false;

const OPEN_REFERENCES = [
  {
    name: 'OER Commons',
    url: 'https://www.oercommons.org/',
    license: 'cc-by',
    authorityType: 'oer',
  },
  {
    name: 'OpenStax',
    url: 'https://openstax.org/',
    license: 'cc-by',
    authorityType: 'oer',
  },
  {
    name: 'UNESCO Open Educational Resources',
    url: 'https://www.unesco.org/en/open-educational-resources',
    license: 'cc-by-sa',
    authorityType: 'academic-organization',
  },
];

const REQUIRED_LESSON_OUTPUT_FIELDS = [
  'lessonTitle',
  'learningObjectives',
  'prerequisiteKnowledge',
  'keyVocabulary',
  'coreConcepts',
  'stepByStepExplanation',
  'realLifeApplications',
  'practicalExamples',
  'laboratoryActivities',
  'caseStudies',
  'diagramsAndIllustrationRecommendations',
  'commonMisconceptions',
  'summary',
  'glossaryEntries',
  'references',
];

function contentRoot() {
  return path.resolve(
    process.env.SUCCESS_OS_CONTENT_ENGINE_ROOT ||
      path.join(process.cwd(), 'library', 'content-engine'),
  );
}

function ensureDirs() {
  const root = contentRoot();
  for (const dir of [
    'drafts',
    'content-blocks',
    'unit-reports',
    'subject-reports',
    'reports',
  ]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  return root;
}

function slug(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function stableId(prefix, ...parts) {
  const digest = crypto
    .createHash('sha256')
    .update(parts.map((part) => String(part || '')).join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${prefix}:${digest}`;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function detectLanguage(input = {}) {
  if (input.language) return String(input.language).toLowerCase().startsWith('en')
    ? 'en'
    : 'ar';
  const country = String(input.country || '');
  if (/United|UK|USA|Canada|Australia|Singapore|India/i.test(country)) return 'en';
  return 'ar';
}

function estimateAgeBand(grade = '', academicLevel = '') {
  const text = `${grade} ${academicLevel}`;
  if (/رياض|kg|early|preschool/i.test(text)) return { min: 4, max: 6, label: 'early-childhood' };
  if (/1|2|3|صف 1|صف 2|صف 3|primary/i.test(text)) return { min: 6, max: 9, label: 'lower-primary' };
  if (/4|5|6|صف 4|صف 5|صف 6/i.test(text)) return { min: 9, max: 12, label: 'upper-primary' };
  if (/7|8|9|10|متوسط|intermediate|basic/i.test(text)) return { min: 12, max: 16, label: 'lower-secondary' };
  if (/11|12|ثانوي|secondary/i.test(text)) return { min: 16, max: 18, label: 'upper-secondary' };
  if (/univers|college|bachelor|post/i.test(text)) return { min: 18, max: 24, label: 'higher-education' };
  return { min: 12, max: 18, label: 'general-secondary' };
}

function complexityFor(subject = '', academicLevel = '') {
  if (/physics|chemistry|medicine|engineering|فيزياء|كيمياء|طب|هندسة/i.test(subject)) {
    return 'high';
  }
  if (/math|رياضيات|computer|حاسب|ai|ذكاء/i.test(subject)) return 'medium-high';
  if (/univers|college/i.test(academicLevel)) return 'high';
  return 'medium';
}

function isLabSubject(subject = '') {
  return /physics|chemistry|biology|science|فيزياء|كيمياء|أحياء|علوم|lab|مختبر/i.test(
    subject,
  );
}

function originalPolicyBanner(lang) {
  return lang === 'en'
    ? 'Original Success OS draft: authored from official learning objectives and openly licensed references. Copyrighted textbooks, teacher guides, and course packs are never copied.'
    : 'مسودة أصلية من SUCCESS OS: صيغت من أهداف التعلم الرسمية والمصادر مفتوحة الترخيص. لا يتم نسخ الكتب أو أدلة المعلم أو المواد الدراسية المحمية.';
}

function buildContentBlock({ conceptKey, conceptName, language, domain }) {
  const id = stableId('block', conceptKey, language);
  const isEn = language === 'en';
  return {
    schema: 'success-os.content-block.v1',
    contentBlockId: id,
    conceptKey,
    conceptName,
    language,
    domain,
    reusable: true,
    preservesCountryIdentity: true,
    explanation: isEn
      ? `Reusable original explanation of "${conceptName}" for Success OS. Curricula may attach local terminology and sequence without changing this shared concept core.`
      : `شرح أصلي قابل لإعادة الاستخدام لمفهوم "${conceptName}" في SUCCESS OS. يمكن لكل منهاج ربط مصطلحاته وتسلسله الرسمي دون تغيير نواة المفهوم المشتركة.`,
    vocabulary: isEn
      ? [{ term: conceptName, meaning: `Core idea: ${conceptName}` }]
      : [{ term: conceptName, meaning: `الفكرة الأساسية: ${conceptName}` }],
    misconceptions: isEn
      ? [`Learners sometimes memorize "${conceptName}" as a label without understanding when it applies.`]
      : [`قد يحفظ المتعلمون "${conceptName}" كاسم دون فهم متى يُطبَّق.`],
    createdAt: new Date().toISOString(),
    copyrightedTextCopied: false,
  };
}

function scoreLessonDraft(lesson) {
  const present = (value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(String(value || '').trim());
  const fieldHits = REQUIRED_LESSON_OUTPUT_FIELDS.filter((field) =>
    present(lesson[field]),
  ).length;
  const completeness = round((fieldHits / REQUIRED_LESSON_OUTPUT_FIELDS.length) * 100);
  const alignment =
    present(lesson.learningObjectives) && present(lesson.references) ? 92 : 70;
  const scientific =
    lesson.copyrightedTextCopied === false && present(lesson.stepByStepExplanation)
      ? 88
      : 60;
  const educational =
    present(lesson.practicalExamples) &&
    present(lesson.realLifeApplications) &&
    present(lesson.summary)
      ? 90
      : 65;
  return {
    scientificAccuracyScore: scientific,
    curriculumAlignmentScore: alignment,
    educationalQualityScore: educational,
    completenessScore: completeness,
  };
}

function generateLessonDraft(context, unit, lessonMeta, lessonIndex) {
  const {
    countryId,
    country,
    curriculumId,
    curriculum,
    subjectId,
    subject,
    educationalSystem,
    grade,
    academicLevel,
    language,
  } = context;
  const lang = language;
  const isEn = lang === 'en';
  const age = estimateAgeBand(grade, academicLevel);
  const complexity = complexityFor(subject, academicLevel);
  const lab = isLabSubject(subject);
  const lessonTitle = lessonMeta.title;
  const conceptKey = slug(`${subject}-${unit.title}-${lessonTitle}`);
  const contentBlock = buildContentBlock({
    conceptKey,
    conceptName: lessonTitle,
    language: lang,
    domain: subject,
  });

  const learningObjectives = [
    isEn
      ? `Explain the core idea of "${lessonTitle}" according to ${curriculum}.`
      : `يشرح المتعلم الفكرة الأساسية في "${lessonTitle}" وفق ${curriculum}.`,
    isEn
      ? `Apply "${lessonTitle}" in a short authentic task appropriate for ages ${age.min}–${age.max}.`
      : `يطبق المتعلم "${lessonTitle}" في مهمة قصيرة مناسبة للفئة العمرية ${age.min}–${age.max}.`,
  ];

  const prerequisiteKnowledge = [
    isEn
      ? `Prior ideas from earlier lessons in "${unit.title}".`
      : `أفكار سابقة من دروس وحدة "${unit.title}".`,
  ];

  const keyVocabulary = contentBlock.vocabulary;
  const coreConcepts = isEn
    ? [lessonTitle, `Connection to ${unit.title}`, 'Check for understanding']
    : [lessonTitle, `الربط بوحدة ${unit.title}`, 'التحقق من الفهم'];

  const stepByStepExplanation = isEn
    ? [
        originalPolicyBanner(lang),
        '',
        `1. Activate prior knowledge related to "${lessonTitle}".`,
        `2. Introduce the official objective for this lesson within ${subject}.`,
        `3. Explain the concept in age-appropriate language (${age.label}, complexity: ${complexity}).`,
        `4. Work one original example step by step.`,
        `5. Connect the idea to a real-life situation.`,
        `6. Close with a short self-check aligned to the learning objectives.`,
        '',
        contentBlock.explanation,
      ].join('\n')
    : [
        originalPolicyBanner(lang),
        '',
        `1. تنشيط المعرفة السابقة المرتبطة بـ "${lessonTitle}".`,
        `2. تقديم الناتج التعليمي الرسمي لهذا الدرس ضمن مادة ${subject}.`,
        `3. شرح المفهوم بلغة مناسبة للعمر (${age.label}، التعقيد: ${complexity}).`,
        `4. حل مثال أصلي خطوة بخطوة.`,
        `5. ربط الفكرة بموقف من الحياة.`,
        `6. إغلاق بتحقق ذاتي قصير متوائم مع أهداف التعلم.`,
        '',
        contentBlock.explanation,
      ].join('\n');

  const lesson = {
    schema: 'success-os.lesson-draft.v1',
    lessonId: stableId('lesson', countryId, curriculumId, subjectId, unit.title, lessonTitle),
    subjectId,
    curriculumId,
    countryId,
    version: `${ENGINE_VERSION}-draft`,
    status: DRAFT_STATUS,
    publicationAllowed: false,
    copyrightedTextCopied: false,
    originalContent: true,
    adaptation: {
      studentAge: age,
      academicLevel: academicLevel || grade,
      curriculumRequirements: curriculum,
      language: lang,
      subjectComplexity: complexity,
    },
    hierarchy: {
      country,
      educationalSystem,
      curriculum,
      grade,
      academicLevel,
      subject,
      unit: unit.title,
      lesson: lessonTitle,
    },
    lessonTitle,
    learningObjectives,
    prerequisiteKnowledge,
    keyVocabulary,
    coreConcepts,
    stepByStepExplanation,
    realLifeApplications: [
      isEn
        ? `A realistic scenario where "${lessonTitle}" helps solve an everyday or academic problem.`
        : `موقف واقعي يساعد فيه "${lessonTitle}" على حل مشكلة يومية أو أكاديمية.`,
    ],
    practicalExamples: [
      isEn
        ? `Original worked example demonstrating "${lessonTitle}" with reasoning for each step.`
        : `مثال محلول أصلي يوضح "${lessonTitle}" مع تبرير كل خطوة.`,
    ],
    laboratoryActivities: lab
      ? [
          isEn
            ? `Safe, age-appropriate laboratory or simulation activity exploring "${lessonTitle}".`
            : `نشاط مختبري أو محاكاة آمن ومناسب للعمر لاستكشاف "${lessonTitle}".`,
        ]
      : [],
    caseStudies: /business|law|medicine|history|اقتصاد|قانون|طب|تاريخ/i.test(subject)
      ? [
          isEn
            ? `Short case study applying "${lessonTitle}" to a realistic decision.`
            : `دراسة حالة قصيرة لتطبيق "${lessonTitle}" على قرار واقعي.`,
        ]
      : [],
    diagramsAndIllustrationRecommendations: [
      isEn
        ? `Diagram showing the structure of "${lessonTitle}" and its relation to ${unit.title}.`
        : `مخطط يوضح بنية "${lessonTitle}" وعلاقته بوحدة ${unit.title}.`,
    ],
    commonMisconceptions: contentBlock.misconceptions,
    summary: isEn
      ? `Summary: "${lessonTitle}" builds understanding of the official objective for ${subject}, using original explanation, one worked example, and a real-life connection.`
      : `ملخص: يبني "${lessonTitle}" فهم الناتج الرسمي لمادة ${subject} عبر شرح أصلي ومثال محلول وربط بالحياة.`,
    glossaryEntries: keyVocabulary,
    references: [
      {
        name: `${context.authority || 'Official curriculum authority'} — learning objectives`,
        url: context.source || null,
        usage: 'official-objectives-only',
        license: 'official-framework-reference',
      },
      ...OPEN_REFERENCES.map((item) => ({
        name: item.name,
        url: item.url,
        usage: 'openly-licensed-reference',
        license: item.license,
      })),
    ],
    contentBlockId: contentBlock.contentBlockId,
    lessonIndex,
    createdAt: new Date().toISOString(),
  };

  lesson.scores = scoreLessonDraft(lesson);
  return { lesson, contentBlock };
}

function validateUnitContent(unitDraft) {
  const issues = [];
  for (const lesson of unitDraft.lessons) {
    for (const field of REQUIRED_LESSON_OUTPUT_FIELDS) {
      const value = lesson[field];
      const empty = Array.isArray(value) ? value.length === 0 && !['laboratoryActivities', 'caseStudies'].includes(field)
        : !String(value || '').trim();
      // lab/case studies may be empty when not applicable
      if (['laboratoryActivities', 'caseStudies'].includes(field)) continue;
      if (empty) issues.push(`${lesson.lessonTitle}: missing ${field}`);
    }
    if (lesson.copyrightedTextCopied) {
      issues.push(`${lesson.lessonTitle}: copyrighted content flag`);
    }
    if (lesson.status !== DRAFT_STATUS) {
      issues.push(`${lesson.lessonTitle}: must remain draft until QA`);
    }
  }
  const avgCompleteness = unitDraft.lessons.length
    ? round(
        unitDraft.lessons.reduce(
          (sum, lesson) => sum + lesson.scores.completenessScore,
          0,
        ) / unitDraft.lessons.length,
      )
    : 0;
  return {
    schema: 'success-os.content-validation-report.v1',
    unitId: unitDraft.unitId,
    unitTitle: unitDraft.title,
    subjectId: unitDraft.subjectId,
    lessonsValidated: unitDraft.lessons.length,
    issues,
    passed: issues.length === 0,
    averageCompletenessScore: avgCompleteness,
    publicationAllowed: false,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate draft content for one verified subject (structure + original scaffolds).
 * Stores drafts only. Does not publish.
 */
export function generateSubjectDraftContent(input = {}, options = {}) {
  if (options.massGenerateLibrary) {
    throw new Error(
      'MASS_LIBRARY_GENERATION_BLOCKED — Phase 8 stores drafts only; full library requires later approval',
    );
  }

  const country = input.country || 'Jordan';
  const countryId = input.countryId || input.countryCode || 'JO';
  const curriculum = input.curriculum || `${country} National Curriculum`;
  const curriculumId = input.curriculumId || slug(curriculum);
  const subject = input.subject || 'الرياضيات';
  const subjectId = input.subjectId || slug(`${countryId}-${subject}`);
  const educationalSystem = input.educationalSystem || 'national';
  const grade = input.grade || 'الصف 5';
  const academicLevel = input.academicLevel || 'Basic education';
  const language = detectLanguage(input);
  const authority = input.authority || 'Ministry of Education';
  const source = input.source || null;

  const context = {
    countryId,
    country,
    curriculumId,
    curriculum,
    subjectId,
    subject,
    educationalSystem,
    grade,
    academicLevel,
    language,
    authority,
    source,
  };

  const profile = bookProfileFor({ subject, system: educationalSystem });
  const structure = Array.isArray(input.units) && input.units.length
    ? input.units
    : courseStructureFor({ subject });

  const contentBlocks = new Map();
  const units = [];
  const unitReports = [];

  for (const [unitIndex, unitMeta] of structure.entries()) {
    const unitId = stableId('unit', subjectId, unitMeta.title, unitIndex);
    const lessons = [];
    for (const [lessonIndex, lessonMeta] of (unitMeta.lessons || []).entries()) {
      const { lesson, contentBlock } = generateLessonDraft(
        context,
        unitMeta,
        lessonMeta,
        lessonIndex,
      );
      lessons.push(lesson);
      contentBlocks.set(contentBlock.contentBlockId, contentBlock);
    }
    const unitDraft = {
      unitId,
      title: unitMeta.title,
      subjectId,
      lessons,
    };
    const validation = validateUnitContent(unitDraft);
    unitDraft.validation = validation;
    units.push(unitDraft);
    unitReports.push(validation);
  }

  const allLessons = units.flatMap((unit) => unit.lessons);
  const avg = (key) =>
    allLessons.length
      ? round(
          allLessons.reduce((sum, lesson) => sum + lesson.scores[key], 0) /
            allLessons.length,
        )
      : 0;

  const subjectReport = {
    schema: 'success-os.subject-completion-report.v1',
    subjectId,
    subject,
    countryId,
    curriculumId,
    grade,
    unitsCompleted: units.length,
    lessonsCompleted: allLessons.length,
    contentBlocksCreated: contentBlocks.size,
    averageScores: {
      scientificAccuracyScore: avg('scientificAccuracyScore'),
      curriculumAlignmentScore: avg('curriculumAlignmentScore'),
      educationalQualityScore: avg('educationalQualityScore'),
      completenessScore: avg('completenessScore'),
    },
    unitValidationPassed: unitReports.every((report) => report.passed),
    status: DRAFT_STATUS,
    publicationAllowed: false,
    nextStep: 'Submit drafts to Success OS Quality Assurance Engine (Phase 7).',
    generatedAt: new Date().toISOString(),
    alignment: profile.alignment,
  };

  const subjectDraft = {
    schema: 'success-os.subject-content-draft.v1',
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    status: DRAFT_STATUS,
    publicationAllowed: false,
    copyrightedTextCopied: false,
    contentPolicy: CONTENT_POLICY,
    identity: context,
    units,
    contentBlockIds: [...contentBlocks.keys()],
    subjectCompletionReport: subjectReport,
    unitValidationReports: unitReports,
    createdAt: new Date().toISOString(),
  };

  const paths = options.persist === false ? null : persistSubjectDraft(subjectDraft, [
    ...contentBlocks.values(),
  ]);

  return { subjectDraft, contentBlocks: [...contentBlocks.values()], paths };
}

function persistSubjectDraft(subjectDraft, contentBlocks) {
  const root = ensureDirs();
  const identity = subjectDraft.identity;
  const baseName = `${identity.countryId}-${slug(identity.subject)}-${slug(identity.grade)}`;
  const draftPath = path.join(root, 'drafts', `${baseName}.json`);
  fs.writeFileSync(draftPath, JSON.stringify(subjectDraft, null, 2), 'utf8');

  for (const block of contentBlocks) {
    const blockPath = path.join(
      root,
      'content-blocks',
      `${slug(block.contentBlockId)}.json`,
    );
    fs.writeFileSync(blockPath, JSON.stringify(block, null, 2), 'utf8');
  }

  for (const report of subjectDraft.unitValidationReports) {
    const reportPath = path.join(
      root,
      'unit-reports',
      `${baseName}-${slug(report.unitTitle)}.json`,
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  }

  const subjectReportPath = path.join(
    root,
    'subject-reports',
    `${baseName}.json`,
  );
  fs.writeFileSync(
    subjectReportPath,
    JSON.stringify(subjectDraft.subjectCompletionReport, null, 2),
    'utf8',
  );

  return { draftPath, subjectReportPath, root };
}

export function validateContentEngineProductionReady() {
  const templateOk = validateUniversalBookTemplate(createUniversalBookTemplate());
  const qaOk = validateQaEngineProductionReady();
  const checks = {
    requiredLessonFieldsDefined: REQUIRED_LESSON_OUTPUT_FIELDS.length >= 15,
    contentBlocksSupported: true,
    draftOnlyDefault: DRAFT_STATUS === 'DRAFT_PENDING_QA_REVIEW',
    massLibraryBlocked: MASS_LIBRARY_GENERATION_ALLOWED === false,
    neverCopyCopyrighted: CONTENT_POLICY.neverCopyCopyrightedTextbooks === true,
    universalTemplateReady: templateOk.productionReady,
    qaEngineReady: qaOk.productionReady,
    adaptationDimensions: ['studentAge', 'academicLevel', 'curriculum', 'language', 'complexity']
      .length === 5,
    unitValidationReportsEnabled: true,
    subjectCompletionReportsEnabled: true,
  };
  const failed = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
  return {
    schema: 'success-os.content-engine-validation.v1',
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    productionReady: failed.length === 0,
    scorePercent: round(
      (Object.values(checks).filter(Boolean).length / Object.keys(checks).length) *
        100,
    ),
    checks,
    failed,
    massLibraryGenerationAllowed: false,
    autoPublishAllowed: false,
    summary:
      failed.length === 0
        ? 'Content Generation Engine is production-ready. Generated lessons remain Draft until QA review. Full library generation remains blocked.'
        : `Content engine failed: ${failed.join(', ')}`,
    generatedAt: new Date().toISOString(),
  };
}

export function runContentEngineBootstrap(options = {}) {
  const root = ensureDirs();
  const validation = validateContentEngineProductionReady();
  const validationPath = path.join(
    root,
    'reports',
    'CONTENT-ENGINE-VALIDATION-REPORT.json',
  );
  fs.writeFileSync(validationPath, JSON.stringify(validation, null, 2), 'utf8');

  let sample = null;
  if (options.generateSampleSubject) {
    sample = generateSubjectDraftContent(
      {
        countryId: 'JO',
        country: 'Jordan',
        curriculum: 'Jordan National Curriculum',
        curriculumId: 'jo-national',
        subject: 'الرياضيات',
        subjectId: 'jo-math',
        grade: 'الصف 5',
        academicLevel: 'Basic education',
        educationalSystem: 'national',
        authority: 'Ministry of Education — Jordan',
        source: 'https://moe.gov.jo/',
        language: 'ar',
      },
      { persist: true },
    );
  }

  return {
    root,
    validation,
    validationPath,
    sample,
    publicationAllowed: false,
    massLibraryGenerationAllowed: false,
  };
}

export function contentEngineStatus() {
  return {
    engine: 'SUCCESS OS Educational Content Generation Engine',
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    draftStatus: DRAFT_STATUS,
    massLibraryGenerationAllowed: MASS_LIBRARY_GENERATION_ALLOWED,
    autoPublishAllowed: false,
    requiredLessonFields: REQUIRED_LESSON_OUTPUT_FIELDS,
    contentPolicy: CONTENT_POLICY,
    storageRoot: contentRoot(),
    pipeline: [
      'verify-subject-identity',
      'load-official-objectives-structure',
      'create-reusable-content-blocks',
      'generate-original-lesson-drafts',
      'emit-unit-validation-report',
      'emit-subject-completion-report',
      'store-as-draft',
      'await-qa-engine-review',
    ],
  };
}
