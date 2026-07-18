/**
 * SUCCESS OS Universal Book Template — Phase 6
 * Canonical structure for every Success OS Digital Book.
 * Template + validation only. Does not generate library content.
 */

export const PHASE = 'PHASE_6_DIGITAL_BOOK_FACTORY';
export const TEMPLATE_SCHEMA = 'success-os.universal-book-template.v1';
export const TEMPLATE_VERSION = '1.0.0';
export const BOOK_SCHEMA = 'success-os.digital-book.v2';

/** Book-level sections required by Phase 6. */
export const UNIVERSAL_BOOK_SECTIONS = [
  'Cover',
  'Book Information',
  'Learning Objectives',
  'Prerequisite Knowledge',
  'Skills to Master',
  'Table of Contents',
  'Units',
  'Lessons',
  'Lesson Summary',
  'Full Lesson',
  'Key Concepts',
  'Definitions',
  'Real-Life Applications',
  'Worked Examples',
  'Practice Activities',
  'Laboratory Activities',
  'Projects',
  'Common Mistakes',
  'Tips for Success',
  'AI Study Notes',
  'Glossary',
  'References',
];

/** Per-lesson fields required by Phase 6. */
export const UNIVERSAL_LESSON_FIELDS = [
  'learningObjectives',
  'estimatedStudyTime',
  'difficultyLevel',
  'requiredBackgroundKnowledge',
  'vocabulary',
  'mainConcepts',
  'stepByStepExplanation',
  'visualRecommendations',
  'practicalExamples',
  'realLifeConnections',
  'keyTakeaways',
  'aiSummary',
];

export const SUPPORTED_PROGRAM_TYPES = [
  'school-education',
  'international-curricula',
  'universities',
  'colleges',
  'technical-institutes',
  'professional-programs',
  'professional-certifications',
];

export const CONTENT_POLICY = {
  originalContentOnly: true,
  neverCopyCopyrightedTextbooks: true,
  allowedInputs: [
    'official-curriculum-learning-objectives',
    'official-subject-specifications',
    'open-educational-resources',
    'verified-academic-references',
  ],
  adaptation: [
    'language',
    'academic-level',
    'subject-complexity',
    'national-curriculum-requirements',
  ],
};

function emptyLessonShell(overrides = {}) {
  return {
    id: null,
    title: null,
    learningObjectives: [],
    estimatedStudyTime: null,
    difficultyLevel: null,
    requiredBackgroundKnowledge: [],
    vocabulary: [],
    mainConcepts: [],
    stepByStepExplanation: null,
    visualRecommendations: [],
    practicalExamples: [],
    realLifeConnections: [],
    keyTakeaways: [],
    aiSummary: null,
    lessonSummary: null,
    fullLesson: null,
    keyConcepts: [],
    definitions: [],
    realLifeApplications: [],
    workedExamples: [],
    practiceActivities: [],
    laboratoryActivities: [],
    projects: [],
    commonMistakes: [],
    tipsForSuccess: [],
    aiStudyNotes: null,
    glossary: [],
    references: [],
    readingProgress: { supported: true, status: 'not-started', percent: 0 },
    ...overrides,
  };
}

/**
 * Production Universal Book Template (empty shell + contracts).
 */
export function createUniversalBookTemplate() {
  return {
    schema: TEMPLATE_SCHEMA,
    phase: PHASE,
    templateVersion: TEMPLATE_VERSION,
    bookSchema: BOOK_SCHEMA,
    designation: 'Success OS Digital Book',
    massGenerationAllowed: false,
    contentPolicy: CONTENT_POLICY,
    supportedProgramTypes: SUPPORTED_PROGRAM_TYPES,
    requiredBookSections: UNIVERSAL_BOOK_SECTIONS,
    requiredLessonFields: UNIVERSAL_LESSON_FIELDS,
    identityContract: {
      bookId: 'required',
      versionNumber: 'required',
      curriculumId: 'required',
      subjectId: 'required',
      countryId: 'required',
      qualityScore: 'required-after-quality-review',
      completenessScore: 'required-after-completeness-check',
      scientificAccuracyScore: 'required-after-scientific-review',
    },
    shell: {
      cover: {
        title: null,
        subtitle: null,
        country: null,
        educationalSystem: null,
        curriculum: null,
        grade: null,
        subject: null,
        badge: 'Success OS Digital Book',
      },
      bookInformation: {
        bookId: null,
        versionNumber: TEMPLATE_VERSION,
        curriculumId: null,
        subjectId: null,
        countryId: null,
        language: null,
        academicLevel: null,
        programType: null,
        qualityScore: null,
        completenessScore: null,
        scientificAccuracyScore: null,
      },
      learningObjectives: [],
      prerequisiteKnowledge: [],
      skillsToMaster: [],
      tableOfContents: [],
      units: [
        {
          id: 'u1',
          title: null,
          learningObjectives: [],
          lessons: [emptyLessonShell({ id: 'u1l1' })],
        },
      ],
      glossary: [],
      references: [],
      scores: {
        qualityScore: null,
        completenessScore: null,
        scientificAccuracyScore: null,
      },
      publication: {
        libraryPermanent: false,
        studentPortalVisible: false,
        massLibraryGeneration: false,
        reason: 'Template only — mass generation requires owner approval',
      },
      verification: {
        inventedContent: false,
        neverCopyCopyrightedTextbooks: true,
        originalEducationalContentRequired: true,
      },
    },
    createdAt: new Date().toISOString(),
  };
}

function present(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== undefined && value !== null && value !== '';
}

/**
 * Validate that the Universal Book Template is production-ready.
 * Does not require filled content — validates contracts and structure.
 */
export function validateUniversalBookTemplate(template = createUniversalBookTemplate()) {
  const checks = {
    schemaPresent: template.schema === TEMPLATE_SCHEMA,
    bookSchemaPresent: template.bookSchema === BOOK_SCHEMA,
    versionPresent: Boolean(template.templateVersion),
    massGenerationBlocked: template.massGenerationAllowed === false,
    allBookSectionsDefined:
      Array.isArray(template.requiredBookSections) &&
      UNIVERSAL_BOOK_SECTIONS.every((section) =>
        template.requiredBookSections.includes(section),
      ) &&
      template.requiredBookSections.length === UNIVERSAL_BOOK_SECTIONS.length,
    allLessonFieldsDefined:
      Array.isArray(template.requiredLessonFields) &&
      UNIVERSAL_LESSON_FIELDS.every((field) =>
        template.requiredLessonFields.includes(field),
      ) &&
      template.requiredLessonFields.length === UNIVERSAL_LESSON_FIELDS.length,
    identityContractComplete: [
      'bookId',
      'versionNumber',
      'curriculumId',
      'subjectId',
      'countryId',
      'qualityScore',
      'completenessScore',
      'scientificAccuracyScore',
    ].every((key) => present(template.identityContract?.[key])),
    programTypesSupported:
      Array.isArray(template.supportedProgramTypes) &&
      SUPPORTED_PROGRAM_TYPES.every((type) =>
        template.supportedProgramTypes.includes(type),
      ),
    contentPolicySafe:
      template.contentPolicy?.originalContentOnly === true &&
      template.contentPolicy?.neverCopyCopyrightedTextbooks === true,
    shellHasCover: present(template.shell?.cover),
    shellHasBookInformation: present(template.shell?.bookInformation),
    shellHasUnitsArray: Array.isArray(template.shell?.units),
    shellLessonHasAllFields: UNIVERSAL_LESSON_FIELDS.every(
      (field) =>
        template.shell?.units?.[0]?.lessons?.[0] &&
        Object.prototype.hasOwnProperty.call(
          template.shell.units[0].lessons[0],
          field,
        ),
    ),
    publicationNotStudentVisible:
      template.shell?.publication?.studentPortalVisible === false,
    verificationFlagsSet:
      template.shell?.verification?.inventedContent === false &&
      template.shell?.verification?.neverCopyCopyrightedTextbooks === true,
  };

  const failed = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
  const passed = failed.length === 0;
  const score = Math.round(
    (Object.values(checks).filter(Boolean).length /
      Object.keys(checks).length) *
      1000,
  ) / 10;

  return {
    schema: 'success-os.universal-book-template-validation.v1',
    phase: PHASE,
    templateVersion: template.templateVersion || TEMPLATE_VERSION,
    productionReady: passed,
    scorePercent: score,
    checks,
    failed,
    massGenerationAllowed: false,
    generatedAt: new Date().toISOString(),
    summary: passed
      ? 'Universal Book Template is production-ready. Mass library generation remains blocked pending owner approval.'
      : `Universal Book Template failed ${failed.length} check(s): ${failed.join(', ')}`,
  };
}

/**
 * Instantiate an empty book shell from the template for a verified subject.
 * Does not invent curriculum units/lessons or write teaching prose.
 */
export function instantiateBookShellFromTemplate({
  countryId,
  country,
  curriculumId,
  curriculum,
  subjectId,
  subject,
  educationalSystem,
  academicLevel,
  grade,
  language = 'ar',
  programType = 'school-education',
  versionNumber = '0.1.0-draft',
  bookId,
} = {}) {
  const template = createUniversalBookTemplate();
  const shell = structuredClone(template.shell);
  const resolvedBookId =
    bookId ||
    `sos-book:${countryId || 'xx'}:${curriculumId || 'curriculum'}:${subjectId || 'subject'}`;

  shell.cover = {
    ...shell.cover,
    title: subject ? `Success OS — ${subject}` : null,
    subtitle:
      curriculum && (grade || academicLevel)
        ? `${curriculum} · ${grade || academicLevel}`
        : null,
    country: country || null,
    educationalSystem: educationalSystem || null,
    curriculum: curriculum || null,
    grade: grade || academicLevel || null,
    subject: subject || null,
    badge: 'Template shell — original prose pending approval',
  };

  shell.bookInformation = {
    bookId: resolvedBookId,
    versionNumber,
    curriculumId: curriculumId || null,
    subjectId: subjectId || null,
    countryId: countryId || null,
    language,
    academicLevel: academicLevel || grade || null,
    programType,
    qualityScore: null,
    completenessScore: null,
    scientificAccuracyScore: null,
  };

  shell.units = [];
  shell.tableOfContents = [];
  shell.learningObjectives = [];
  shell.prerequisiteKnowledge = [];
  shell.skillsToMaster = [];
  shell.glossary = [];
  shell.references = [];
  shell.publication = {
    libraryPermanent: false,
    studentPortalVisible: false,
    massLibraryGeneration: false,
    reason:
      'Shell only. Full library generation requires owner approval after template validation.',
  };

  return {
    schema: BOOK_SCHEMA,
    phase: PHASE,
    templateVersion: TEMPLATE_VERSION,
    designation: 'Success OS Digital Book',
    governmentApprovalClaim: false,
    massGenerationAllowed: false,
    identity: {
      countryId: countryId || null,
      country: country || null,
      curriculumId: curriculumId || null,
      curriculum: curriculum || null,
      subjectId: subjectId || null,
      subject: subject || null,
      educationalSystem: educationalSystem || null,
      academicLevel: academicLevel || grade || null,
      grade: grade || null,
      language,
      programType,
    },
    ...shell,
    requiredBookSections: UNIVERSAL_BOOK_SECTIONS,
    requiredLessonFields: UNIVERSAL_LESSON_FIELDS,
    contentPolicy: CONTENT_POLICY,
    createdAt: new Date().toISOString(),
  };
}
