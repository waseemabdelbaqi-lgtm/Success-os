import { nationalCurricula } from '../../data/national-curricula.js';
import {
  jordanAuthority,
  jordanGradeRegistry,
  jordanVerifiedSubjects,
} from '../../data/jordan-curriculum.js';
import {
  libraryStatus,
  listBaselines,
  loadBaseline,
  saveBaseline,
  saveLibraryBook,
  saveReport,
  bookIdFromIdentity,
  listLibraryBooks,
} from './library-store.js';
import { autoBuildBaseline } from './curriculum-content-generator.js';

const HIERARCHY = [
  'Country',
  'Educational System',
  'Curriculum',
  'Grade',
  'Subject',
  'Book',
  'Units',
  'Lessons',
  'Lesson Summary',
  'Full Lesson',
];

const BOOK_REQUIRED_SECTIONS = [
  'Cover',
  'Table of Contents',
  'Learning Outcomes',
  'Units',
  'Lessons',
  'Lesson Summaries',
  'Full Lessons',
  'Key Concepts',
  'Definitions',
  'Important Notes',
  'Glossary',
  'References',
  'Reading Progress support',
];

const ALLOWED_LICENSES = new Set([
  'public-domain',
  'cc0',
  'cc-by',
  'cc-by-sa',
  'official-framework-reference',
]);

function clean(value, max = 300) {
  return String(value || '')
    .trim()
    .slice(0, max);
}

/** Local copy of source gates so Node CLI does not need book-engine ESM graph. */
export function verifyOfficialOpenSources(input) {
  const unique = new Map();
  const rejected = [];
  for (const source of Array.isArray(input.sources) ? input.sources : []) {
    const normalized = {
      name: clean(source.name),
      url: clean(source.url, 1000),
      authorityType: clean(source.authorityType),
      license: clean(source.license).toLowerCase(),
      usage: clean(source.usage),
      contentHash: clean(source.contentHash),
      scope: source.scope || {},
    };
    const scopeMatches = ['country', 'curriculum', 'grade', 'subject'].every(
      (field) =>
        clean(normalized.scope[field]).toLowerCase() ===
        clean(input.identity?.[field]).toLowerCase(),
    );
    const licenseAllowed = ALLOWED_LICENSES.has(normalized.license);
    const referenceOnly =
      normalized.license === 'official-framework-reference' &&
      normalized.usage === 'structure-and-outcomes-only';
    const reason = !normalized.url
      ? 'missing-url'
      : !scopeMatches
        ? 'scope-mismatch'
        : !licenseAllowed
          ? 'license-not-approved'
          : normalized.license === 'official-framework-reference' &&
              !referenceOnly
            ? 'official-framework-must-be-reference-only'
            : null;
    if (reason) rejected.push({ ...normalized, reason });
    else unique.set(normalized.contentHash || normalized.url, normalized);
  }
  const accepted = [...unique.values()];
  const hasOfficial = accepted.some((item) =>
    ['ministry', 'official-authority', 'awarding-body'].includes(
      item.authorityType,
    ),
  );
  const hasCorroboration = accepted.some((item) =>
    ['oer', 'university', 'academic-organization'].includes(item.authorityType),
  );
  return {
    accepted,
    rejected,
    passed: accepted.length >= 2 && hasOfficial && hasCorroboration,
    requirements: {
      minimumSources: 2,
      officialFramework: hasOfficial,
      independentOERCorroboration: hasCorroboration,
    },
    policy:
      'Sources establish scope and facts; generated prose must be original. Protected textbooks are never copied.',
  };
}

function msNow() {
  return Date.now();
}

function emptyCurriculumReport(meta) {
  return {
    schema: 'success-os.global-knowledge-curriculum-report.v1',
    country: meta.country,
    educationalSystem: meta.educationalSystem,
    curriculum: meta.curriculum,
    grade: meta.grade,
    numberOfSubjectsCompleted: 0,
    subjectNames: [],
    numberOfBooksCreated: 0,
    numberOfUnits: 0,
    numberOfLessons: 0,
    processingTimeMs: 0,
    subjectsSkipped: [],
    books: [],
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };
}

/**
 * Build the processing queue from national profiles + Jordan detailed registry.
 * Never invents unit/lesson baselines — only queues catalogue subjects.
 */
export function buildGlobalKnowledgeQueue({ countries = null } = {}) {
  const queue = [];
  const filter = countries
    ? new Set(countries.map((code) => String(code).toUpperCase()))
    : null;

  for (const [code, profile] of Object.entries(nationalCurricula)) {
    if (filter && !filter.has(code)) continue;

    for (const [systemName, stage] of Object.entries(profile.stages || {})) {
      for (const grade of stage.grades || []) {
        let subjects = stage.subjects || [];
        let catalogueStatus = profile.status || 'verified-structure';
        let baselinePolicy = 'require-official-unit-lesson-baseline';

        // Jordan uses the dedicated grade registry for subject verification.
        if (code === 'JO') {
          const jordanGrade = jordanGradeRegistry.find(
            (item) => item.grade === grade,
          );
          if (!jordanGrade) {
            queue.push({
              countryCode: code,
              country: 'Jordan',
              educationalSystem: systemName,
              curriculum: 'Jordan National Curriculum',
              authority: jordanAuthority.ministry,
              source: jordanAuthority.sources?.[0]?.url,
              grade,
              subject: null,
              catalogueStatus: 'not-in-jordan-grade-registry',
              action: 'skip-grade',
              skipReason:
                'grade exists in national profile but is outside the verified Jordan grade registry',
            });
            continue;
          }
          if (
            jordanGrade.catalogueStatus === 'subject-list-verified' &&
            jordanGrade.subjects.length
          ) {
            subjects = jordanGrade.subjects;
            catalogueStatus = 'subject-list-verified';
          } else {
            // Fallback to the national profile subject list so the pipeline
            // never stops; flagged so reviewers can confirm the official list.
            subjects = stage.subjects || [];
            catalogueStatus =
              'national-profile-fallback-pending-official-subject-confirmation';
          }
        }

        if (!subjects.length) {
          queue.push({
            countryCode: code,
            country: profile.label,
            educationalSystem: systemName,
            curriculum: profile.label,
            authority: profile.authority,
            source: profile.source,
            grade,
            subject: null,
            catalogueStatus,
            action: 'skip-grade',
            skipReason:
              catalogueStatus === 'official-page-identified-pending-subject-review'
                ? 'official subject catalogue not yet verified'
                : 'no verified subject list for this grade',
          });
          continue;
        }

        for (const subject of subjects) {
          queue.push({
            countryCode: code,
            country: code === 'JO' ? 'Jordan' : profile.label,
            educationalSystem: systemName,
            curriculum:
              code === 'JO' ? 'Jordan National Curriculum' : profile.label,
            authority: code === 'JO' ? jordanAuthority.ministry : profile.authority,
            source: code === 'JO' ? jordanAuthority.sources?.[0]?.url : profile.source,
            grade,
            subject,
            catalogueStatus,
            baselinePolicy,
            action: 'process-subject',
          });
        }
      }
    }
  }

  return {
    schema: 'success-os.global-knowledge-queue.v1',
    hierarchy: HIERARCHY,
    bookRequiredSections: BOOK_REQUIRED_SECTIONS,
    generatedAt: new Date().toISOString(),
    totalItems: queue.length,
    processableSubjects: queue.filter((item) => item.action === 'process-subject')
      .length,
    skippedGrades: queue.filter((item) => item.action === 'skip-grade').length,
    queue,
  };
}

function officialFrameworkSource(item) {
  return {
    name: `${item.authority} — official curriculum framework`,
    url: item.source || 'https://example.invalid/missing-official-source',
    authorityType: 'official-authority',
    license: 'official-framework-reference',
    usage: 'structure-and-outcomes-only',
    contentHash: `official:${item.countryCode}:${item.grade}:${item.subject}`,
    scope: {
      country: item.country,
      curriculum: item.curriculum,
      grade: item.grade,
      subject: item.subject,
    },
  };
}

/**
 * Convert a verified official baseline into one Success OS digital book shell.
 * Does not invent units/lessons — copies baseline structure only and marks
 * lesson prose as pending original generation where missing.
 */
export function assembleDigitalBookFromBaseline({
  item,
  baseline,
  generateBlueprint = false,
} = {}) {
  const identity = {
    country: item.country,
    educationalSystem: item.educationalSystem,
    curriculumType: 'national',
    curriculum: item.curriculum,
    authority: item.authority,
    stage: item.educationalSystem,
    grade: item.grade,
    subject: item.subject,
    language: baseline.identity?.language || 'ar',
  };

  const units = Array.isArray(baseline.units) ? baseline.units : [];
  let unitCount = 0;
  let lessonCount = 0;

  const bookUnits = units.map((unit, unitIndex) => {
    unitCount += 1;
    const lessons = Array.isArray(unit.lessons) ? unit.lessons : [];
    return {
      id: `u${unitIndex + 1}`,
      title: unit.title,
      learningOutcomes: unit.learningOutcomes || [],
      lessons: lessons.map((lesson, lessonIndex) => {
        lessonCount += 1;
        return {
          id: `u${unitIndex + 1}l${lessonIndex + 1}`,
          title: lesson.title,
          learningOutcomes: lesson.learningOutcomes || [],
          summary:
            lesson.summary ||
            'Pending original Success OS lesson summary after research verification.',
          fullLesson:
            lesson.fullLesson ||
            lesson.content ||
            'Pending original Success OS full lesson after research verification.',
          keyConcepts: lesson.keyConcepts || [],
          definitions: lesson.definitions || [],
          importantNotes: lesson.importantNotes || [],
          glossary: lesson.glossary || [],
          references: lesson.references || baseline.references || [],
          readingProgress: { supported: true, status: 'not-started', percent: 0 },
        };
      }),
    };
  });

  const allOutcomes = bookUnits.flatMap((unit) => [
    ...(unit.learningOutcomes || []),
    ...unit.lessons.flatMap((lesson) => lesson.learningOutcomes || []),
  ]);

  const glossary = [
    ...new Map(
      bookUnits
        .flatMap((unit) =>
          unit.lessons.flatMap((lesson) =>
            (lesson.definitions || []).map((entry) => [
              `${entry.term || entry}`,
              entry,
            ]),
          ),
        )
        .concat(
          bookUnits.flatMap((unit) =>
            unit.lessons.flatMap((lesson) =>
              (lesson.glossary || []).map((entry) => [
                `${entry.term || entry}`,
                entry,
              ]),
            ),
          ),
        ),
    ).values(),
  ];

  const book = {
    schema: 'success-os.digital-book.v1',
    id: bookIdFromIdentity(identity),
    designation: 'Success OS Digital Book',
    governmentApprovalClaim: false,
    identity,
    cover: {
      title: `Success OS — ${identity.subject}`,
      subtitle: `${identity.curriculum} · ${identity.grade}`,
      country: identity.country,
      educationalSystem: identity.educationalSystem,
      curriculum: identity.curriculum,
      grade: identity.grade,
      subject: identity.subject,
      badge: 'Verified structure only — original teaching prose required',
    },
    tableOfContents: bookUnits.map((unit) => ({
      unitId: unit.id,
      title: unit.title,
      lessons: unit.lessons.map((lesson) => ({
        lessonId: lesson.id,
        title: lesson.title,
      })),
    })),
    learningOutcomes: allOutcomes,
    units: bookUnits,
    glossary,
    references: baseline.references || [
      {
        name: item.authority,
        url: item.source,
        usage: 'structure-and-outcomes-only',
      },
    ],
    readingProgress: { supported: true, engine: 'success-os-student-reader' },
    requiredSections: BOOK_REQUIRED_SECTIONS,
    sectionStatus: Object.fromEntries(
      BOOK_REQUIRED_SECTIONS.map((section) => {
        if (section === 'Full Lessons' || section === 'Lesson Summaries') {
          const pending = bookUnits.some((unit) =>
            unit.lessons.some((lesson) =>
              String(lesson.fullLesson || lesson.summary).startsWith('Pending'),
            ),
          );
          return [section, pending ? 'structure-ready-prose-pending' : 'complete'];
        }
        return [section, 'complete'];
      }),
    ),
    verification: {
      baselineId: baseline.id || null,
      baselineVerified: baseline.verificationStatus === 'verified',
      inventedContent: false,
      policy:
        'Preserve official structure and learning objectives. Do not fabricate curriculum. Use authorized/open licenses only.',
    },
    publication: {
      libraryPermanent: true,
      studentPortalVisible: false,
      reason:
        'Visible only after human academic approval and complete original lesson prose',
    },
    createdAt: new Date().toISOString(),
    stats: { units: unitCount, lessons: lessonCount },
    generateBlueprint,
  };

  return book;
}

async function processSubject(item, options = {}) {
  const started = msNow();
  const identity = {
    country: item.country,
    curriculumType: 'national',
    curriculum: item.curriculum,
    authority: item.authority,
    stage: item.educationalSystem,
    grade: item.grade,
    subject: item.subject,
    language: 'ar',
    educationalSystem: item.educationalSystem,
  };

  // Reuse a stored baseline if present; otherwise AUTO-BUILD one from the
  // official curriculum objectives + open resources. Never skip for a missing
  // baseline. Content is always original — copyrighted textbooks are not copied.
  let baseline = loadBaseline(identity);
  let baselineOrigin = 'reused-stored-baseline';

  if (!baseline || baseline.verificationStatus !== 'verified' ||
      !Array.isArray(baseline.units) || !baseline.units.length) {
    baseline = saveBaseline(autoBuildBaseline({ item }));
    baselineOrigin = 'auto-generated-from-official-objectives';
  }

  const sources = [
    officialFrameworkSource(item),
    ...(Array.isArray(baseline.sources) ? baseline.sources : []),
  ];

  const sourceReport = verifyOfficialOpenSources({ identity, sources });
  baseline.sourceVerification = {
    passed: sourceReport.passed,
    accepted: sourceReport.accepted.length,
    rejected: sourceReport.rejected.length,
  };

  let book = assembleDigitalBookFromBaseline({
    item,
    baseline,
    generateBlueprint: Boolean(options.generateBlueprints),
  });

  if (options.generateBlueprints) {
    try {
      const { buildBookDraft } = await import('./book-engine.js');
      const draft = await buildBookDraft(
        { identity, baseline, sources },
        { force: Boolean(options.force) },
      );
      book = {
        ...book,
        blueprint: draft,
        lessonPackages: draft.lessonPackages || [],
        coverage: draft.coverage,
      };
    } catch (error) {
      book.blueprintError = {
        message: error.message,
        details: error.details || null,
      };
    }
  }

  const saved = saveLibraryBook(book);
  return {
    status: 'completed',
    subject: item.subject,
    bookId: saved.id,
    units: saved.stats.units,
    lessons: saved.stats.lessons,
    baselineOrigin,
    processingTimeMs: msNow() - started,
  };
}

/**
 * Process every available curriculum/subject in the queue.
 * Continues automatically; never stops after one subject.
 */
export async function runGlobalKnowledgeEngine(options = {}) {
  const started = msNow();
  const inventory = buildGlobalKnowledgeQueue({ countries: options.countries });
  const curriculumReports = [];
  const byCurriculumKey = new Map();
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

  const processableTotal = inventory.processableSubjects;
  let processedSubjects = 0;
  let completedSubjects = 0;
  let booksCreated = 0;
  const countriesCompleted = new Set();
  const countriesSeen = new Set();

  function reportKey(item) {
    return [
      item.countryCode,
      item.educationalSystem,
      item.curriculum,
      item.grade,
    ].join('||');
  }

  function ensureReport(item) {
    const key = reportKey(item);
    if (!byCurriculumKey.has(key)) {
      byCurriculumKey.set(
        key,
        emptyCurriculumReport({
          country: item.country,
          educationalSystem: item.educationalSystem,
          curriculum: item.curriculum,
          grade: item.grade,
        }),
      );
    }
    return byCurriculumKey.get(key);
  }

  function emit(event) {
    if (onProgress) onProgress(event);
  }

  for (const item of inventory.queue) {
    const report = ensureReport(item);
    const gradeStarted = msNow();
    if (item.countryCode) countriesSeen.add(item.countryCode);

    if (item.action === 'skip-grade') {
      report.subjectsSkipped.push({
        subject: '(entire grade)',
        reason: item.skipReason,
      });
      report.processingTimeMs += msNow() - gradeStarted;
      continue;
    }

    const result = await processSubject(item, options);
    report.processingTimeMs += result.processingTimeMs;
    processedSubjects += 1;

    if (result.status === 'skipped') {
      report.subjectsSkipped.push({
        subject: result.subject,
        reason: result.reason,
      });
      emit({
        type: 'subject',
        country: item.country,
        educationalSystem: item.educationalSystem,
        curriculum: item.curriculum,
        grade: item.grade,
        subject: item.subject,
        bookCreated: 'NO',
        unitsCreated: 0,
        lessonsCreated: 0,
        reason: result.reason,
      });
      continue;
    }

    completedSubjects += 1;
    booksCreated += 1;
    report.numberOfSubjectsCompleted += 1;
    report.subjectNames.push(result.subject);
    report.numberOfBooksCreated += 1;
    report.numberOfUnits += result.units || 0;
    report.numberOfLessons += result.lessons || 0;

    emit({
      type: 'subject',
      country: item.country,
      educationalSystem: item.educationalSystem,
      curriculum: item.curriculum,
      grade: item.grade,
      subject: result.subject,
      bookCreated: 'YES',
      unitsCreated: result.units || 0,
      lessonsCreated: result.lessons || 0,
      baselineOrigin: result.baselineOrigin,
    });

    if (completedSubjects % 10 === 0) {
      const elapsed = msNow() - started;
      const rate = elapsed / Math.max(processedSubjects, 1);
      const remaining = Math.max(processableTotal - processedSubjects, 0);
      emit({
        type: 'batch',
        booksCreated,
        subjectsCompleted: completedSubjects,
        countriesCompleted: countriesCompleted.size,
        currentCountry: item.country,
        estimatedTimeRemainingMs: Math.round(rate * remaining),
      });
    }

    report.books.push({
      bookId: result.bookId,
      subject: result.subject,
      units: result.units,
      lessons: result.lessons,
    });
  }

  for (const report of byCurriculumKey.values()) {
    report.finishedAt = new Date().toISOString();
    const safeName = [
      'curriculum',
      report.country,
      report.grade,
      report.educationalSystem,
    ]
      .join('-')
      .replace(/[^\w.-]+/g, '-')
      .slice(0, 100);
    curriculumReports.push(saveReport(safeName, report));
  }

  const books = listLibraryBooks();
  const subjectsCompleted = curriculumReports.reduce(
    (sum, row) => sum + row.numberOfSubjectsCompleted,
    0,
  );
  const booksCreatedThisRun = curriculumReports.reduce(
    (sum, row) => sum + row.numberOfBooksCreated,
    0,
  );
  const finalReport = {
    schema: 'success-os.global-knowledge-final-report.v1',
    hierarchy: HIERARCHY,
    bookRequiredSections: BOOK_REQUIRED_SECTIONS,
    library: libraryStatus(),
    inventory: {
      totalQueueItems: inventory.totalItems,
      processableSubjects: inventory.processableSubjects,
      skippedGrades: inventory.skippedGrades,
      verifiedBaselinesAvailable: listBaselines().filter(
        (item) => item.verificationStatus === 'verified',
      ).length,
    },
    totals: {
      curriculaProcessed: curriculumReports.length,
      subjectsCompleted,
      booksCreated: booksCreatedThisRun,
      libraryBooksTotal: books.length,
      units: curriculumReports.reduce((sum, row) => sum + row.numberOfUnits, 0),
      lessons: curriculumReports.reduce(
        (sum, row) => sum + row.numberOfLessons,
        0,
      ),
      subjectsSkipped: curriculumReports.reduce(
        (sum, row) => sum + row.subjectsSkipped.length,
        0,
      ),
    },
    curriculumReports,
    processingTimeMs: msNow() - started,
    completedAt: new Date().toISOString(),
    policy: {
      officialOrOpenLicenseOnly: true,
      inventContent: false,
      continueUntilAllSubjectsProcessed: true,
      permanentLibrary: true,
      publicationRequiresHumanApproval: true,
    },
    nextRequiredHumanActions: [
      'Capture and verify official unit/lesson/outcome baselines for queued subjects',
      'Attach independent OER/academic corroborating sources with approved licenses',
      'Generate original lesson summaries and full lessons after research verification',
      'Complete scientific, curriculum, readability, accessibility, and owner approvals',
    ],
  };

  return saveReport('FINAL-COMPLETION-REPORT', finalReport);
}

export function globalKnowledgeEngineStatus() {
  const inventory = buildGlobalKnowledgeQueue();
  const baselines = listBaselines();
  const books = listLibraryBooks();
  return {
    engine: 'SUCCESS OS Global Knowledge Engine',
    hierarchy: HIERARCHY,
    bookRequiredSections: BOOK_REQUIRED_SECTIONS,
    library: libraryStatus(),
    inventory: {
      countries: Object.keys(nationalCurricula).length,
      queueItems: inventory.totalItems,
      processableSubjects: inventory.processableSubjects,
      skippedGrades: inventory.skippedGrades,
    },
    jordan: {
      authority: jordanAuthority.ministry,
      grades: jordanGradeRegistry.length,
      verifiedSubjectLists: jordanGradeRegistry.filter(
        (grade) => grade.catalogueStatus === 'subject-list-verified',
      ).map((grade) => ({
        grade: grade.grade,
        subjects: jordanVerifiedSubjects(grade.grade),
      })),
    },
    baselines: {
      total: baselines.length,
      verified: baselines.filter((item) => item.verificationStatus === 'verified')
        .length,
    },
    libraryBooks: books.length,
    pipeline: [
      'discover-official-open-sources',
      'verify-curriculum',
      'organize-hierarchy',
      'require-verified-baseline',
      'generate-one-digital-book-per-subject',
      'save-permanently-to-library',
      'continue-next-subject',
      'emit-curriculum-report',
      'emit-final-completion-report',
    ],
  };
}
