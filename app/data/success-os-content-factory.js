/**
 * Success OS Content Factory — permanent production architecture.
 *
 * Every lesson, every country, every curriculum must pass through this pipeline.
 * No lesson may skip a stage. No direct publication outside the factory.
 *
 * PHASE JO-09 establishes Jordan as the first implementation.
 */

export const CONTENT_FACTORY_SCHEMA = 'success-os.content-factory.v1';
export const CONTENT_FACTORY_VERSION = '1.0.0';

/**
 * Mandatory production stages — order is permanent.
 * Skipping any stage is forbidden.
 */
export const PIPELINE_STAGES = Object.freeze([
  'Research',
  'Curriculum Verification',
  'Knowledge Extraction',
  'Concept Mapping',
  'Lesson Structure',
  'Educational Writing',
  'Scientific Verification',
  'Terminology Verification',
  'Diagram Generation',
  'Reference Linking',
  'Quality Assurance',
  'Admin Review',
  'Publication',
]);

/**
 * Single status per lesson at any time.
 */
export const CONTENT_STATUSES = Object.freeze([
  'Researching',
  'Draft',
  'Scientific Review',
  'Educational Review',
  'QA Review',
  'Admin Review',
  'Approved',
  'Published',
  'Archived',
]);

/**
 * Required lesson template sections (Success OS standard).
 */
export const LESSON_TEMPLATE_SECTIONS = Object.freeze([
  { key: 'lessonInformation', label: 'Lesson Information', fields: ['id', 'title'] },
  { key: 'learningObjectives', label: 'Learning Objectives', fields: ['learningObjectives', 'learningOutcomes'] },
  { key: 'introduction', label: 'Introduction', fields: ['introduction'] },
  { key: 'coreConcepts', label: 'Core Concepts', fields: ['keyConcepts', 'scientificConcepts'] },
  { key: 'detailedExplanation', label: 'Detailed Explanation', fields: ['fullLesson', 'stepByStepExplanation'] },
  { key: 'scientificTerminology', label: 'Scientific Terminology', fields: ['scientificTerms', 'definitions'] },
  { key: 'rulesLawsFormulas', label: 'Rules / Laws / Formulas', fields: ['rulesLawsFormulas', 'formulasVerified'] },
  { key: 'workedExamples', label: 'Worked Examples', fields: ['workedExamples', 'practicalExamples'] },
  { key: 'illustrations', label: 'Illustrations', fields: ['diagrams', 'illustrations', 'visualRecommendations'] },
  { key: 'realLifeApplications', label: 'Real-Life Applications', fields: ['realLifeApplications'] },
  { key: 'summary', label: 'Summary', fields: ['summary', 'lessonSummary'] },
  { key: 'glossary', label: 'Glossary', fields: ['vocabulary', 'keyVocabulary', 'definitions'] },
  { key: 'references', label: 'References', fields: ['references', 'referenceSourceIds'] },
]);

/**
 * Automatic validation checks run by the factory.
 */
export const VALIDATION_CHECKS = Object.freeze([
  'curriculumAlignment',
  'scientificAccuracy',
  'grammar',
  'languageConsistency',
  'readingLevel',
  'duplicateDetection',
  'referenceValidation',
  'metadataValidation',
  'brokenInternalLinks',
]);

/**
 * Admin workflow actions.
 */
export const ADMIN_ACTIONS = Object.freeze([
  'preview',
  'edit',
  'comment',
  'requestRevision',
  'approve',
  'reject',
  'republish',
  'archive',
]);

/** Map completed stage → content status (before Admin / Publication). */
export const STAGE_TO_STATUS = Object.freeze({
  Research: 'Researching',
  'Curriculum Verification': 'Draft',
  'Knowledge Extraction': 'Draft',
  'Concept Mapping': 'Draft',
  'Lesson Structure': 'Draft',
  'Educational Writing': 'Draft',
  'Scientific Verification': 'Scientific Review',
  'Terminology Verification': 'Educational Review',
  'Diagram Generation': 'Educational Review',
  'Reference Linking': 'QA Review',
  'Quality Assurance': 'QA Review',
  'Admin Review': 'Admin Review',
  Publication: 'Published',
});

export const FACTORY_METRICS = Object.freeze([
  'lessonsCreated',
  'lessonsUnderReview',
  'approvedLessons',
  'rejectedLessons',
  'averageReviewTime',
  'averageQualityScore',
  'missingReferences',
  'brokenLinks',
]);

export function stageIndex(stage) {
  return PIPELINE_STAGES.indexOf(stage);
}

export function nextStage(currentStage) {
  const i = stageIndex(currentStage);
  if (i < 0 || i >= PIPELINE_STAGES.length - 1) return null;
  return PIPELINE_STAGES[i + 1];
}

export function statusAfterStages(completedStages, overrides = {}) {
  if (overrides.status) return overrides.status;
  if (!completedStages?.length) return 'Researching';
  const last = completedStages[completedStages.length - 1];
  return STAGE_TO_STATUS[last] || 'Draft';
}

/**
 * Hard rule: stage may only run if every prior stage is completed.
 */
export function canRunStage(completedStages, stage) {
  const target = stageIndex(stage);
  if (target < 0) return { ok: false, reason: 'UNKNOWN_STAGE' };
  for (let i = 0; i < target; i += 1) {
    if (!completedStages.includes(PIPELINE_STAGES[i])) {
      return {
        ok: false,
        reason: 'STAGE_SKIP_FORBIDDEN',
        missing: PIPELINE_STAGES[i],
        attempted: stage,
      };
    }
  }
  return { ok: true };
}

/**
 * Publication is forbidden unless every prior stage including Admin Review is done
 * AND Admin has approved.
 */
export function canPublish(record) {
  if (record.status === 'Archived') {
    return { ok: false, reason: 'ARCHIVED' };
  }
  const completed = record.completedStages || [];
  for (const stage of PIPELINE_STAGES.slice(0, -1)) {
    if (!completed.includes(stage)) {
      return { ok: false, reason: 'INCOMPLETE_PIPELINE', missing: stage };
    }
  }
  if (!record.admin?.approved) {
    return { ok: false, reason: 'ADMIN_APPROVAL_REQUIRED' };
  }
  if (record.admin?.rejected) {
    return { ok: false, reason: 'ADMIN_REJECTED' };
  }
  return { ok: true };
}
