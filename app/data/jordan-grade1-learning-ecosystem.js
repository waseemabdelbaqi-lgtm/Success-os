/**
 * PHASE JO-01.2 — Jordan Grade 1 Complete Learning Ecosystem
 *
 * A lesson is complete only when every required resource is generated,
 * verified, linked, and integrated. Never advance until 100%.
 * Never advance to Grade 2 until every Grade 1 lesson is complete.
 *
 * Official source: https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68
 * Original Success OS content only — never copy textbooks.
 */

export const G1_ECOSYSTEM_SCHEMA = 'success-os.jordan-g1-learning-ecosystem.v1';
export const G1_ECOSYSTEM_VERSION = '1.2.0';
export const G1_OFFICIAL_CATALOG_URL =
  'https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68';

export const G1_GRADE = 'الصف 1';
export const G1_GRADE_CODE = 'G01';

/** Official NCCD-verified Grade 1 subjects (TextBooksGrade/68). */
export const G1_OFFICIAL_SUBJECTS = Object.freeze([
  'الرياضيات',
  'العلوم',
  'التربية الإسلامية',
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الدراسات الاجتماعية',
  'المهارات الرقمية',
  'التربية الرياضية',
  'التربية الفنية والموسيقية والمسرحية',
]);

/**
 * Core lesson resources (20) — every lesson must include all.
 */
export const G1_LESSON_RESOURCES = Object.freeze([
  'lessonSummary',
  'fullLesson',
  'aiTeacherScript',
  'aiVideoLessonScript',
  'interactivePresentation',
  'practiceActivities',
  'classActivities',
  'homework',
  'enrichmentActivities',
  'differentiatedActivities',
  'criticalThinkingQuestions',
  'realLifeApplications',
  'educationalGames',
  'flashcards',
  'vocabularyCards',
  'conceptMaps',
  'mindMaps',
  'scientificDiagrams',
  'originalIllustrations',
  'interactiveSimulations',
]);

/** Question bank requirements. */
export const G1_QUESTION_DIFFICULTIES = Object.freeze([
  'easy',
  'medium',
  'advanced',
  'challenge',
]);

export const G1_QUESTION_TYPES = Object.freeze([
  'multipleChoice',
  'trueFalse',
  'matching',
  'fillInTheBlank',
  'shortAnswer',
  'longAnswer',
  'sequencing',
  'classification',
  'dragAndDrop',
  'interactive',
]);

/** Assessment packages. */
export const G1_ASSESSMENTS = Object.freeze([
  'lessonQuiz',
  'unitQuiz',
  'midUnitAssessment',
  'endOfUnitExam',
  'subjectFinalExam',
  'adaptiveAiPracticeExam',
]);

/** AI feature packages. */
export const G1_AI_FEATURES = Object.freeze([
  'aiTutorExplanation',
  'aiParentExplanation',
  'aiTeacherNotes',
  'commonStudentMistakes',
  'misconceptions',
  'revisionPlan',
  'personalizedStudyPlan',
]);

/** Multimedia packages (original specs / assets). */
export const G1_MULTIMEDIA = Object.freeze([
  'animations',
  'educationalImages',
  'icons',
  'audioNarration',
  'pronunciationFiles',
  'videoStoryboards',
  'interactiveExercises',
  'whiteboardLessonVersion',
]);

/** Student experience metadata fields. */
export const G1_STUDENT_EXPERIENCE = Object.freeze([
  'learningObjectives',
  'estimatedStudyTime',
  'difficultyLevel',
  'requiredPreviousLessons',
  'requiredSkills',
  'achievementBadge',
  'completionCertificateEligibility',
]);

/** Quality control flags — all must pass. */
export const G1_QUALITY_FLAGS = Object.freeze([
  'original',
  'scientificallyAccurate',
  'curriculumAligned',
  'ageAppropriate',
  'accessible',
  'multilingualReady',
  'verified',
]);

/** Flat checklist of every required top-level package key. */
export const G1_COMPLETION_CHECKLIST = Object.freeze([
  ...G1_LESSON_RESOURCES,
  'questionBank',
  ...G1_ASSESSMENTS,
  ...G1_AI_FEATURES,
  ...G1_MULTIMEDIA,
  'studentExperience',
  'qualityControl',
  'registryLinks',
  'contentFactoryEnrollment',
]);

export function g1CompletionPercent(packageDoc) {
  const present = G1_COMPLETION_CHECKLIST.filter((key) => {
    const value = packageDoc?.resources?.[key] ?? packageDoc?.[key];
    if (value == null) return false;
    if (typeof value === 'object' && value.status === 'missing') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
  });
  return Math.round((present.length / G1_COMPLETION_CHECKLIST.length) * 1000) / 10;
}

export function g1IsLessonComplete(packageDoc) {
  const pct = g1CompletionPercent(packageDoc);
  const qc = packageDoc?.qualityControl || packageDoc?.resources?.qualityControl;
  const allFlags = G1_QUALITY_FLAGS.every((f) => qc?.[f] === true);
  return pct >= 100 && allFlags && packageDoc?.status === 'complete';
}
