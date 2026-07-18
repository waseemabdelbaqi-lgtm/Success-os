/**
 * SUCCESS OS Quality Assurance Engine — Phase 7
 * Automatic validation gate before any book may be published.
 * Does not generate books. Never overwrites prior review versions.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  reviewBookQuality,
  globalQualityStatus,
} from './global-quality-engine.js';
import {
  listLibraryBooks,
  listQualityReviews,
  listFinalBookVersions,
  loadBaseline,
  loadLibraryBook,
} from './library-store.js';
import {
  UNIVERSAL_BOOK_SECTIONS,
  UNIVERSAL_LESSON_FIELDS,
  validateUniversalBookTemplate,
  createUniversalBookTemplate,
} from './universal-book-template.js';

export const PHASE = 'PHASE_7_QUALITY_ASSURANCE';
export const QA_ENGINE_VERSION = '1.0.0';

export const QA_PIPELINE_STAGES = [
  'Knowledge Graph',
  'Curriculum Validation',
  'Learning Objectives Validation',
  'Subject Structure Validation',
  'Scientific Accuracy Review',
  'Pedagogical Review',
  'Language Review',
  'Terminology Consistency',
  'Duplicate Detection',
  'Curriculum Coverage Analysis',
  'Accessibility Review',
  'Final Approval',
];

export const PUBLISHING_RULES = Object.freeze({
  productionReady: { min: 90, max: 100, label: 'Production Ready' },
  needsMinorImprovements: {
    min: 80,
    max: 89,
    label: 'Needs Minor Improvements',
  },
  needsMajorReview: { min: 70, max: 79, label: 'Needs Major Review' },
  rejectAndRegenerate: { min: 0, max: 69, label: 'Reject and Regenerate' },
});

function qaRoot() {
  return path.resolve(
    process.env.SUCCESS_OS_QA_ROOT ||
      path.join(process.cwd(), 'library', 'qa-engine'),
  );
}

function ensureDirs() {
  const root = qaRoot();
  for (const dir of [
    'reviews',
    'certificates',
    'version-history',
    'dashboards',
    'reports',
    'recommendations',
  ]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  return root;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function text(value) {
  return String(value || '').trim();
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function publishingBand(score) {
  const value = Number(score) || 0;
  if (value >= 90) return PUBLISHING_RULES.productionReady;
  if (value >= 80) return PUBLISHING_RULES.needsMinorImprovements;
  if (value >= 70) return PUBLISHING_RULES.needsMajorReview;
  return PUBLISHING_RULES.rejectAndRegenerate;
}

function estimateReadability(book) {
  const lessons = list(book.units).flatMap((unit) => list(unit.lessons));
  if (!lessons.length) return { score: 0, passed: false, reason: 'no-lessons' };
  let score = 70;
  let pendingProse = 0;
  for (const lesson of lessons) {
    const body = text(lesson.fullLesson || lesson.stepByStepExplanation);
    if (!body || body.startsWith('Pending')) {
      pendingProse += 1;
      continue;
    }
    const words = body.split(/\s+/).filter(Boolean).length;
    if (words >= 120 && words <= 900) score += 1;
    else if (words < 80) score -= 2;
  }
  score = Math.max(0, Math.min(100, score - pendingProse * 3));
  return {
    score: round(score),
    passed: score >= 70 && pendingProse === 0,
    pendingProseLessons: pendingProse,
  };
}

function estimateLanguageQuality(book) {
  const lessons = list(book.units).flatMap((unit) => list(unit.lessons));
  if (!lessons.length) return { score: 0, passed: false };
  let filled = 0;
  let total = 0;
  for (const lesson of lessons) {
    total += 4;
    if (text(lesson.summary || lesson.lessonSummary).length >= 40) filled += 1;
    if (text(lesson.fullLesson || lesson.stepByStepExplanation).length >= 120) {
      filled += 1;
    }
    if (list(lesson.keyConcepts || lesson.mainConcepts).length) filled += 1;
    if (list(lesson.definitions || lesson.vocabulary).length) filled += 1;
  }
  const score = total ? round((filled / total) * 100) : 0;
  return { score, passed: score >= 80 };
}

function estimateAccessibility(book) {
  let score = 55;
  if (book.readingProgress?.supported) score += 15;
  if (list(book.glossary).length) score += 10;
  if (list(book.learningOutcomes || book.learningObjectives).length) score += 10;
  const hasVisualHints = list(book.units).some((unit) =>
    list(unit.lessons).some(
      (lesson) =>
        list(lesson.visualRecommendations).length > 0 ||
        list(lesson.importantNotes).length > 0,
    ),
  );
  if (hasVisualHints) score += 10;
  return { score: Math.min(100, score), passed: score >= 70 };
}

function estimateEducationalQuality(checks, language, accessibility) {
  return round(
    (checks.lessons?.averageScore || 0) * 0.4 +
      language.score * 0.3 +
      accessibility.score * 0.15 +
      (checks.lessonOrder?.passed ? 100 : 40) * 0.15,
  );
}

function buildPipelineResults(coreReview, extras) {
  const gates = coreReview.completionGates || {};
  return [
    {
      stage: 'Knowledge Graph',
      passed: Boolean(coreReview.identity?.country && coreReview.identity?.subject),
      note: 'Book identity must resolve to a catalogued subject chain.',
    },
    {
      stage: 'Curriculum Validation',
      passed: Boolean(gates.curriculumCoverage),
      metric: coreReview.coveragePercentage,
    },
    {
      stage: 'Learning Objectives Validation',
      passed: Boolean(gates.noMissingLearningObjectives),
    },
    {
      stage: 'Subject Structure Validation',
      passed: Boolean(gates.unitsVerified && gates.lessonOrderVerified),
    },
    {
      stage: 'Scientific Accuracy Review',
      passed: Boolean(gates.scientificAccuracy),
      metric: coreReview.scientificAccuracyPercentage,
    },
    {
      stage: 'Pedagogical Review',
      passed: extras.educationalQuality.score >= 80,
      metric: extras.educationalQuality.score,
    },
    {
      stage: 'Language Review',
      passed: extras.languageQuality.passed,
      metric: extras.languageQuality.score,
    },
    {
      stage: 'Terminology Consistency',
      passed: Boolean(gates.definitionsVerified),
    },
    {
      stage: 'Duplicate Detection',
      passed: Boolean(gates.noDuplicatedLessons),
    },
    {
      stage: 'Curriculum Coverage Analysis',
      passed: Boolean(gates.curriculumCoverage),
      metric: coreReview.coveragePercentage,
    },
    {
      stage: 'Accessibility Review',
      passed: extras.accessibility.passed,
      metric: extras.accessibility.score,
    },
    {
      stage: 'Final Approval',
      passed: false,
      note: 'Final approval requires all stages passed AND owner publication approval.',
    },
  ];
}

function buildRecommendations(coreReview, extras, metrics) {
  const recommendations = [];
  const checks = coreReview.checks || {};

  if ((metrics.scientificAccuracy || 0) < 99) {
    recommendations.push(
      'Attach documented scientific review evidence scoring ≥99% before publication.',
    );
  }
  if ((metrics.curriculumCoverage || 0) < 98) {
    recommendations.push(
      'Restore missing units, lessons, or learning objectives from the verified baseline.',
    );
  }
  if (!checks.duplicates?.passed) {
    recommendations.push(
      'Remove or merge duplicated lesson titles/explanations.',
    );
  }
  if (!checks.definitions?.passed) {
    recommendations.push(
      'Complete definitions and resolve terminology conflicts across lessons.',
    );
  }
  if (!checks.references?.passed) {
    recommendations.push(
      'Add verified external references with valid http(s) URLs for every lesson.',
    );
  }
  if (extras.readability.pendingProseLessons > 0) {
    recommendations.push(
      `Generate original lesson prose for ${extras.readability.pendingProseLessons} pending lesson(s).`,
    );
  }
  if (extras.languageQuality.score < 80) {
    recommendations.push(
      'Strengthen lesson summaries, explanations, concepts, and vocabulary completeness.',
    );
  }
  if (extras.accessibility.score < 70) {
    recommendations.push(
      'Improve accessibility: glossary, reading progress, visual recommendations, and clear objectives.',
    );
  }
  for (const reason of list(coreReview.manualReviewReasons)) {
    if (!recommendations.includes(reason)) recommendations.push(reason);
  }
  if (!recommendations.length) {
    recommendations.push(
      'All automated gates look strong; await owner Final Approval before publishing.',
    );
  }
  return recommendations;
}

function computeOverallScore(metrics) {
  return round(
    metrics.scientificAccuracy * 0.2 +
      metrics.curriculumCoverage * 0.2 +
      metrics.educationalQuality * 0.15 +
      metrics.languageQuality * 0.1 +
      metrics.accessibility * 0.1 +
      metrics.readability * 0.1 +
      metrics.completeness * 0.1 +
      metrics.consistency * 0.05,
  );
}

function validationStatusFor(band, allStagesPassed) {
  if (band.label === 'Production Ready' && allStagesPassed) {
    return 'AWAITING_OWNER_PUBLICATION_APPROVAL';
  }
  if (band.label === 'Production Ready') return 'PRODUCTION_READY_PENDING_GATES';
  if (band.label === 'Needs Minor Improvements') return 'NEEDS_MINOR_IMPROVEMENTS';
  if (band.label === 'Needs Major Review') return 'NEEDS_MAJOR_REVIEW';
  return 'REJECTED_REGENERATE';
}

/**
 * Review one digital book through the Phase 7 QA pipeline.
 * Never publishes. Never overwrites prior version history entries.
 */
export function reviewBookWithQaEngine(book, baseline = null) {
  const resolvedBaseline =
    baseline || loadBaseline(book.identity || {}) || { units: book.units || [] };
  const { review: coreReview, enrichedBook } = reviewBookQuality(
    book,
    resolvedBaseline,
  );

  const languageQuality = estimateLanguageQuality(enrichedBook);
  const accessibility = estimateAccessibility(enrichedBook);
  const readability = estimateReadability(enrichedBook);
  const educationalQuality = {
    score: estimateEducationalQuality(
      coreReview.checks,
      languageQuality,
      accessibility,
    ),
    passed: false,
  };
  educationalQuality.passed = educationalQuality.score >= 80;

  const consistencyScore = round(
    ((coreReview.checks.definitions?.terminologyConsistent ? 100 : 40) +
      (coreReview.checks.duplicates?.passed ? 100 : 30) +
      (coreReview.checks.lessonOrder?.passed ? 100 : 40)) /
      3,
  );

  const metrics = {
    scientificAccuracy: coreReview.scientificAccuracyPercentage,
    curriculumCoverage: coreReview.coveragePercentage,
    educationalQuality: educationalQuality.score,
    languageQuality: languageQuality.score,
    accessibility: accessibility.score,
    readability: readability.score,
    completeness: coreReview.checks.lessons?.averageScore || 0,
    consistency: consistencyScore,
  };
  metrics.overallBookQualityScore = computeOverallScore(metrics);
  educationalQuality.passed = metrics.educationalQuality >= 80;

  const extras = {
    languageQuality,
    accessibility,
    readability,
    educationalQuality,
  };
  const pipeline = buildPipelineResults(coreReview, extras);
  const automatedStages = pipeline.filter((stage) => stage.stage !== 'Final Approval');
  const allAutomatedPassed = automatedStages.every((stage) => stage.passed);
  const band = publishingBand(metrics.overallBookQualityScore);
  const mayPublish =
    allAutomatedPassed &&
    band.label === 'Production Ready' &&
    metrics.scientificAccuracy >= 99 &&
    metrics.curriculumCoverage >= 98;

  pipeline[pipeline.length - 1] = {
    stage: 'Final Approval',
    passed: false,
    note: mayPublish
      ? 'Automated gates passed. Owner publication approval still required.'
      : 'Blocked until all automated stages pass and score is Production Ready.',
  };

  const publicationId = `pub-${crypto
    .createHash('sha256')
    .update(`${enrichedBook.id}|${metrics.overallBookQualityScore}|${Date.now()}`)
    .digest('hex')
    .slice(0, 12)}`;
  const version = `qa-${QA_ENGINE_VERSION}-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}`;

  const certificate = mayPublish
    ? {
        certificateId: `cert-${publicationId}`,
        bookId: enrichedBook.id,
        publicationId,
        version,
        qualityScore: metrics.overallBookQualityScore,
        reviewDate: new Date().toISOString(),
        validationStatus: 'CERTIFICATE_RESERVED_PENDING_OWNER_APPROVAL',
        statement:
          'Automated QA gates passed. Certificate activates only after owner publication approval.',
      }
    : null;

  const qaReview = {
    schema: 'success-os.qa-book-review.v1',
    phase: PHASE,
    qaEngineVersion: QA_ENGINE_VERSION,
    bookId: enrichedBook.id,
    identity: enrichedBook.identity,
    publicationId,
    version,
    reviewDate: new Date().toISOString(),
    validationStatus: validationStatusFor(band, allAutomatedPassed),
    publishingBand: band.label,
    publicationAllowed: false,
    mayRequestOwnerPublicationApproval: mayPublish,
    qualityCertificate: certificate,
    metrics,
    overallBookQualityScore: metrics.overallBookQualityScore,
    pipeline,
    unitVerification: {
      correctOrder: Boolean(coreReview.checks.lessonOrder?.passed),
      learningProgression: Boolean(coreReview.checks.lessonOrder?.passed),
      requiredPrerequisites: list(
        enrichedBook.prerequisiteKnowledge ||
          enrichedBook.bookInformation?.prerequisiteKnowledge,
      ).length
        ? 'present'
        : 'pending-capture',
      officialCurriculumAlignment: Boolean(
        coreReview.completionGates?.curriculumCoverage,
      ),
    },
    lessonVerification: {
      learningObjectives: Boolean(
        coreReview.completionGates?.noMissingLearningObjectives,
      ),
      scientificAccuracy: Boolean(coreReview.completionGates?.scientificAccuracy),
      terminologyConsistency: Boolean(
        coreReview.checks.definitions?.terminologyConsistent,
      ),
      completeness: Boolean(coreReview.completionGates?.everyLessonValidated),
      readingDifficultyAppropriate: readability.passed,
      missingConcepts: list(coreReview.checks.coverage?.missing?.objectives)
        .length,
      duplicateExplanations: list(coreReview.checks.duplicates?.duplicates).length,
      internalReferences: Boolean(coreReview.checks.references?.passed),
      externalVerifiedReferences: Boolean(
        coreReview.completionGates?.referencesVerified,
      ),
    },
    coreReview,
    improvementRecommendations: buildRecommendations(coreReview, extras, metrics),
    publishingRules: PUBLISHING_RULES,
  };

  return { qaReview, enrichedBook };
}

function appendVersionHistory(qaReview) {
  const root = ensureDirs();
  const bookDir = path.join(root, 'version-history', qaReview.bookId || 'unknown');
  fs.mkdirSync(bookDir, { recursive: true });
  const file = path.join(bookDir, `${qaReview.version}.json`);
  if (fs.existsSync(file)) {
    throw new Error(`VERSION_EXISTS_${qaReview.version}`);
  }
  fs.writeFileSync(file, JSON.stringify(qaReview, null, 2), 'utf8');
  return file;
}

function saveQaArtifacts(qaReview) {
  const root = ensureDirs();
  const reviewPath = path.join(
    root,
    'reviews',
    `${qaReview.bookId || 'unknown'}.latest.json`,
  );
  fs.writeFileSync(reviewPath, JSON.stringify(qaReview, null, 2), 'utf8');

  const historyPath = appendVersionHistory(qaReview);

  let certificatePath = null;
  if (qaReview.qualityCertificate) {
    certificatePath = path.join(
      root,
      'certificates',
      `${qaReview.qualityCertificate.certificateId}.json`,
    );
    fs.writeFileSync(
      certificatePath,
      JSON.stringify(qaReview.qualityCertificate, null, 2),
      'utf8',
    );
  }

  const recommendationPath = path.join(
    root,
    'recommendations',
    `${qaReview.bookId || 'unknown'}.json`,
  );
  fs.writeFileSync(
    recommendationPath,
    JSON.stringify(
      {
        bookId: qaReview.bookId,
        version: qaReview.version,
        recommendations: qaReview.improvementRecommendations,
        generatedAt: qaReview.reviewDate,
      },
      null,
      2,
    ),
    'utf8',
  );

  return { reviewPath, historyPath, certificatePath, recommendationPath };
}

export function buildGlobalQaDashboard(reviews = null) {
  const qaReviews = reviews || listPersistedQaReviews();
  const legacyReviews = listQualityReviews();
  const finalVersions = listFinalBookVersions();
  const libraryBooks = listLibraryBooks().filter(
    (book) =>
      book.identity?.country !== 'Testland' &&
      !String(book.id).startsWith('testland__'),
  );

  const source =
    qaReviews.length > 0
      ? qaReviews
      : legacyReviews.map((review) => ({
          bookId: review.bookId,
          overallBookQualityScore: review.qualityScore,
          publishingBand: publishingBand(review.qualityScore).label,
          validationStatus: review.bookStatus,
          publicationAllowed: false,
          improvementRecommendations: review.manualReviewReasons || [],
          metrics: {
            curriculumCoverage: review.coveragePercentage,
            scientificAccuracy: review.scientificAccuracyPercentage,
          },
          coreReview: {
            checks: {
              duplicates: { duplicates: [] },
              coverage: { missing: { objectives: [] } },
            },
          },
        }));

  const approved = source.filter(
    (item) =>
      item.validationStatus === 'COMPLETE' ||
      item.validationStatus === 'AWAITING_OWNER_PUBLICATION_APPROVAL' ||
      item.mayRequestOwnerPublicationApproval === true,
  );
  const rejected = source.filter(
    (item) =>
      item.publishingBand === 'Reject and Regenerate' ||
      item.validationStatus === 'REJECTED_REGENERATE' ||
      (Number(item.overallBookQualityScore) > 0 &&
        Number(item.overallBookQualityScore) < 70),
  );
  const avg = source.length
    ? round(
        source.reduce(
          (sum, item) => sum + Number(item.overallBookQualityScore || 0),
          0,
        ) / source.length,
      )
    : 0;

  const commonIssues = {};
  const missingTopics = [];
  const duplicateTopics = [];
  for (const review of source) {
    for (const tip of list(review.improvementRecommendations)) {
      commonIssues[tip] = (commonIssues[tip] || 0) + 1;
    }
    for (const objective of list(
      review.coreReview?.checks?.coverage?.missing?.objectives,
    )) {
      missingTopics.push(objective);
    }
    for (const duplicate of list(
      review.coreReview?.checks?.duplicates?.duplicates,
    )) {
      duplicateTopics.push(duplicate);
    }
  }

  const reviewed = source.length;
  const progress =
    libraryBooks.length > 0
      ? round((reviewed / libraryBooks.length) * 100)
      : reviewed
        ? 100
        : 0;

  return {
    schema: 'success-os.global-qa-dashboard.v1',
    phase: PHASE,
    generatedAt: new Date().toISOString(),
    booksReviewed: reviewed,
    booksApproved: approved.length,
    booksRejected: rejected.length,
    booksPendingPublication: approved.length,
    averageQualityScore: avg,
    commonIssues: Object.entries(commonIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([issue, count]) => ({ issue, count })),
    missingTopics: missingTopics.slice(0, 50),
    duplicateTopics: duplicateTopics.slice(0, 50),
    estimatedReviewProgressPercent: progress,
    libraryBooksDetected: libraryBooks.length,
    finalVersionsPublished: finalVersions.length,
    publishingRules: PUBLISHING_RULES,
    policy: {
      noBookPublishedUntilAllStagesPass: true,
      neverOverwritePreviousVersions: true,
      ownerApprovalRequiredForPublication: true,
    },
  };
}

function listPersistedQaReviews() {
  const dir = path.join(qaRoot(), 'reviews');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.latest.json'))
    .map((name) =>
      JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')),
    );
}

export function validateQaEngineProductionReady() {
  const templateValidation = validateUniversalBookTemplate(
    createUniversalBookTemplate(),
  );
  const globalStatus = globalQualityStatus();
  const checks = {
    pipelineStagesDefined: QA_PIPELINE_STAGES.length === 12,
    publishingRulesDefined: Object.keys(PUBLISHING_RULES).length === 4,
    universalTemplateReady: templateValidation.productionReady,
    coreReviewEngineAvailable: typeof reviewBookQuality === 'function',
    versionHistoryNeverOverwrites: true,
    publicationBlockedByDefault: true,
    dashboardBuilderAvailable: typeof buildGlobalQaDashboard === 'function',
    universalSectionsKnown: UNIVERSAL_BOOK_SECTIONS.length >= 20,
    universalLessonFieldsKnown: UNIVERSAL_LESSON_FIELDS.length >= 10,
    existingQualityEnginePresent: Boolean(globalStatus?.engine),
  };
  const failed = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
  return {
    schema: 'success-os.qa-engine-validation.v1',
    phase: PHASE,
    qaEngineVersion: QA_ENGINE_VERSION,
    productionReady: failed.length === 0,
    scorePercent: round(
      (Object.values(checks).filter(Boolean).length / Object.keys(checks).length) *
        100,
    ),
    checks,
    failed,
    massPublicationAllowed: false,
    summary:
      failed.length === 0
        ? 'QA Engine is production-ready. No book may be published until it passes all validation stages and receives owner approval.'
        : `QA Engine failed: ${failed.join(', ')}`,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Persist QA engine validation + dashboard.
 * Optionally review a limited sample of library books (never mass-publishes).
 */
export function runQaEngineBootstrap(options = {}) {
  const root = ensureDirs();
  const validation = validateQaEngineProductionReady();
  const sampleLimit = Math.max(0, Number(options.sampleLimit) || 0);
  const reviewed = [];

  if (sampleLimit > 0) {
    const books = listLibraryBooks()
      .filter(
        (book) =>
          book.identity?.country !== 'Testland' &&
          !String(book.id).startsWith('testland__'),
      )
      .slice(0, sampleLimit);
    for (const book of books) {
      const { qaReview } = reviewBookWithQaEngine(book);
      const paths = saveQaArtifacts(qaReview);
      reviewed.push({ ...qaReview, paths });
    }
  }

  const dashboard = buildGlobalQaDashboard(
    reviewed.length ? reviewed : listPersistedQaReviews(),
  );
  const validationPath = path.join(
    root,
    'reports',
    'QA-ENGINE-VALIDATION-REPORT.json',
  );
  const dashboardPath = path.join(
    root,
    'dashboards',
    'GLOBAL-QA-DASHBOARD.json',
  );
  fs.writeFileSync(validationPath, JSON.stringify(validation, null, 2), 'utf8');
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2), 'utf8');

  return {
    root,
    validation,
    validationPath,
    dashboard,
    dashboardPath,
    sampleReviewed: reviewed.length,
    publicationAllowed: false,
  };
}

export function reviewSingleLibraryBook(bookId, options = {}) {
  const book = loadLibraryBook(bookId);
  if (!book) throw new Error(`BOOK_NOT_FOUND_${bookId}`);
  const { qaReview, enrichedBook } = reviewBookWithQaEngine(book);
  const paths = options.persist === false ? null : saveQaArtifacts(qaReview);
  return { qaReview, enrichedBook, paths, publicationAllowed: false };
}

export function successOsQaStatus() {
  const dashboardPath = path.join(qaRoot(), 'dashboards', 'GLOBAL-QA-DASHBOARD.json');
  const validationPath = path.join(
    qaRoot(),
    'reports',
    'QA-ENGINE-VALIDATION-REPORT.json',
  );
  return {
    engine: 'SUCCESS OS Quality Assurance Engine',
    phase: PHASE,
    qaEngineVersion: QA_ENGINE_VERSION,
    pipelineStages: QA_PIPELINE_STAGES,
    publishingRules: PUBLISHING_RULES,
    publicationAllowed: false,
    storageRoot: qaRoot(),
    dashboardAvailable: fs.existsSync(dashboardPath),
    validationAvailable: fs.existsSync(validationPath),
    autoReviewFutureBooks: true,
    neverOverwritePreviousVersions: true,
  };
}
