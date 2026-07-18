import {
  listLibraryBooks,
  loadBaseline,
  saveLibraryBook,
  saveQualityReview,
  saveFinalBookVersion,
  saveReport,
  listQualityReviews,
  listFinalBookVersions,
  libraryStatus,
} from './library-store.js';

const COMPLETE_GATES = Object.freeze({
  curriculumCoverage: 98,
  scientificAccuracy: 99,
  lessonOrderVerified: true,
  unitsVerified: true,
  definitionsVerified: true,
  referencesVerified: true,
  noDuplicatedLessons: true,
  noMissingLearningObjectives: true,
});

const text = (value) => String(value || '').trim();
const key = (value) =>
  text(value)
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/\s+/g, ' ');
const list = (value) => (Array.isArray(value) ? value : []);

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function lessonKey(unitTitle, lessonTitle) {
  return `${key(unitTitle)}::${key(lessonTitle)}`;
}

function contentFingerprint(lesson) {
  return key(`${lesson.summary || ''}\n${lesson.fullLesson || ''}`)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function verifyCoverage(baseline, book) {
  const expectedUnits = list(baseline?.units);
  const actualUnits = list(book?.units);
  const actualUnitMap = new Map(actualUnits.map((unit) => [key(unit.title), unit]));
  const missing = { units: [], lessons: [], objectives: [] };
  let total = 0;
  let covered = 0;

  for (const expectedUnit of expectedUnits) {
    total += 1;
    const actualUnit = actualUnitMap.get(key(expectedUnit.title));
    if (!actualUnit) {
      missing.units.push(expectedUnit.title);
      for (const lesson of list(expectedUnit.lessons)) {
        total += 1 + list(lesson.learningOutcomes).length;
        missing.lessons.push({
          unit: expectedUnit.title,
          lesson: lesson.title,
        });
        for (const objective of list(lesson.learningOutcomes)) {
          missing.objectives.push({
            unit: expectedUnit.title,
            lesson: lesson.title,
            objective,
          });
        }
      }
      continue;
    }

    covered += 1;
    const actualLessons = new Map(
      list(actualUnit.lessons).map((lesson) => [
        lessonKey(expectedUnit.title, lesson.title),
        lesson,
      ]),
    );

    for (const expectedLesson of list(expectedUnit.lessons)) {
      total += 1;
      const actualLesson = actualLessons.get(
        lessonKey(expectedUnit.title, expectedLesson.title),
      );
      if (!actualLesson) {
        missing.lessons.push({
          unit: expectedUnit.title,
          lesson: expectedLesson.title,
        });
      } else {
        covered += 1;
      }

      const actualObjectives = new Set(
        list(actualLesson?.learningOutcomes).map(key),
      );
      for (const objective of list(expectedLesson.learningOutcomes)) {
        total += 1;
        if (actualObjectives.has(key(objective))) {
          covered += 1;
        } else {
          missing.objectives.push({
            unit: expectedUnit.title,
            lesson: expectedLesson.title,
            objective,
          });
        }
      }
    }
  }

  const percentage = total ? round((covered / total) * 100) : 0;
  return {
    percentage,
    expectedItems: total,
    coveredItems: covered,
    missing,
    passed: percentage >= COMPLETE_GATES.curriculumCoverage,
  };
}

function verifyLessonOrder(book) {
  const issues = [];
  const unitIds = new Set();
  for (const [unitIndex, unit] of list(book.units).entries()) {
    if (!text(unit.id) || unitIds.has(unit.id)) {
      issues.push(`unit ${unitIndex + 1}: missing or duplicate id`);
    }
    unitIds.add(unit.id);

    const lessonIds = new Set();
    for (const [lessonIndex, lesson] of list(unit.lessons).entries()) {
      if (!text(lesson.id) || lessonIds.has(lesson.id)) {
        issues.push(
          `${unit.title}: lesson ${lessonIndex + 1} missing or duplicate id`,
        );
      }
      lessonIds.add(lesson.id);
      const expectedId = `u${unitIndex + 1}l${lessonIndex + 1}`;
      if (lesson.id !== expectedId) {
        issues.push(
          `${unit.title}: ${lesson.title} expected id ${expectedId}, got ${lesson.id}`,
        );
      }
    }
  }
  return { passed: issues.length === 0, issues };
}

function validateLessons(book) {
  const results = [];
  for (const unit of list(book.units)) {
    for (const lesson of list(unit.lessons)) {
      const checks = {
        title: text(lesson.title).length > 0,
        learningObjectives: list(lesson.learningOutcomes).length > 0,
        summary: text(lesson.summary).length >= 80,
        fullLesson: text(lesson.fullLesson).length >= 300,
        keyConcepts: list(lesson.keyConcepts).length > 0,
        definitions: list(lesson.definitions).length > 0,
        importantNotes: list(lesson.importantNotes).length > 0,
        references: list(lesson.references).length > 0,
      };
      results.push({
        unit: unit.title,
        lesson: lesson.title,
        passed: Object.values(checks).every(Boolean),
        score: round(
          (Object.values(checks).filter(Boolean).length /
            Object.keys(checks).length) *
            100,
        ),
        checks,
      });
    }
  }
  return {
    passed: results.length > 0 && results.every((item) => item.passed),
    total: results.length,
    failed: results.filter((item) => !item.passed),
    averageScore: results.length
      ? round(
          results.reduce((sum, item) => sum + item.score, 0) / results.length,
        )
      : 0,
  };
}

function verifyDuplicates(book) {
  const seenTitles = new Map();
  const seenContent = new Map();
  const duplicates = [];
  for (const unit of list(book.units)) {
    for (const lesson of list(unit.lessons)) {
      const titleFingerprint = key(lesson.title);
      const bodyFingerprint = contentFingerprint(lesson);
      if (seenTitles.has(titleFingerprint)) {
        duplicates.push({
          type: 'title',
          lesson: lesson.title,
          duplicateOf: seenTitles.get(titleFingerprint),
        });
      } else {
        seenTitles.set(titleFingerprint, `${unit.title} / ${lesson.title}`);
      }
      if (bodyFingerprint && seenContent.has(bodyFingerprint)) {
        duplicates.push({
          type: 'content',
          lesson: lesson.title,
          duplicateOf: seenContent.get(bodyFingerprint),
        });
      } else if (bodyFingerprint) {
        seenContent.set(bodyFingerprint, `${unit.title} / ${lesson.title}`);
      }
    }
  }
  return { passed: duplicates.length === 0, duplicates };
}

function verifyDefinitionsAndTerminology(book) {
  const meanings = new Map();
  const missing = [];
  const conflicts = [];
  for (const unit of list(book.units)) {
    for (const lesson of list(unit.lessons)) {
      if (!list(lesson.definitions).length) {
        missing.push(`${unit.title} / ${lesson.title}`);
      }
      for (const definition of list(lesson.definitions)) {
        const term = key(definition?.term);
        const meaning = key(definition?.meaning);
        if (!term || !meaning) {
          missing.push(`${unit.title} / ${lesson.title}: invalid definition`);
          continue;
        }
        if (meanings.has(term) && meanings.get(term) !== meaning) {
          conflicts.push({
            term: definition.term,
            meanings: [meanings.get(term), meaning],
          });
        } else {
          meanings.set(term, meaning);
        }
      }
    }
  }
  return {
    passed: missing.length === 0 && conflicts.length === 0,
    missing,
    conflicts,
    terminologyConsistent: conflicts.length === 0,
  };
}

function verifyReferences(book) {
  const invalid = [];
  const bookReferences = list(book.references);
  for (const reference of bookReferences) {
    const url = typeof reference === 'string' ? reference : reference?.url;
    if (!text(url).startsWith('http')) invalid.push(reference);
  }
  for (const unit of list(book.units)) {
    for (const lesson of list(unit.lessons)) {
      if (!list(lesson.references).length) {
        invalid.push(`${unit.title} / ${lesson.title}: missing references`);
      }
    }
  }
  return {
    passed: bookReferences.length > 0 && invalid.length === 0,
    count: bookReferences.length,
    invalid,
  };
}

function generateGlossary(book) {
  const terms = new Map();
  for (const unit of list(book.units)) {
    for (const lesson of list(unit.lessons)) {
      for (const definition of [
        ...list(lesson.definitions),
        ...list(lesson.glossary),
      ]) {
        const termKey = key(definition?.term);
        if (termKey && !terms.has(termKey)) {
          terms.set(termKey, definition);
        }
      }
    }
  }
  return [...terms.values()];
}

function scientificAccuracy(book, checks) {
  const evidence = book.qualityEvidence?.scientificReview;
  if (
    evidence?.approved === true &&
    text(evidence.reviewer) &&
    Number(evidence.score) >= 99
  ) {
    return {
      score: Math.min(100, Number(evidence.score)),
      passed: true,
      method: 'documented-human-or-authoritative-scientific-review',
      evidence,
    };
  }

  let score = 55;
  if (checks.references.passed) score += 10;
  if (checks.definitions.passed) score += 10;
  if (checks.lessons.passed) score += 10;
  if (book.verification?.baselineVerified) score += 5;
  if (book.sourceVerification?.passed) score += 5;
  score = Math.min(score, 95);

  return {
    score,
    passed: false,
    method: 'automated-evidence-proxy-capped-at-95',
    reason:
      'A documented scientific reviewer or authoritative validation is required for the ≥99% completion gate.',
  };
}

function qualityScore(checks) {
  const binary = (value) => (value ? 100 : 0);
  return round(
    checks.coverage.percentage * 0.25 +
      checks.scientificAccuracy.score * 0.2 +
      binary(checks.lessonOrder.passed) * 0.08 +
      binary(checks.unitsVerified) * 0.07 +
      binary(checks.definitions.passed) * 0.08 +
      binary(checks.references.passed) * 0.08 +
      binary(checks.duplicates.passed) * 0.08 +
      binary(checks.objectivesComplete) * 0.08 +
      checks.lessons.averageScore * 0.08,
  );
}

export function reviewBookQuality(book, baseline) {
  const started = Date.now();
  const enrichedBook = {
    ...book,
    glossary: generateGlossary(book),
    references: list(book.references),
  };
  const coverage = verifyCoverage(baseline, enrichedBook);
  const lessons = validateLessons(enrichedBook);
  const lessonOrder = verifyLessonOrder(enrichedBook);
  const duplicates = verifyDuplicates(enrichedBook);
  const definitions = verifyDefinitionsAndTerminology(enrichedBook);
  const references = verifyReferences(enrichedBook);
  const unitsVerified =
    list(enrichedBook.units).length > 0 &&
    list(enrichedBook.units).every(
      (unit) => text(unit.title) && list(unit.lessons).length > 0,
    );
  const objectivesComplete = coverage.missing.objectives.length === 0;
  const checks = {
    coverage,
    lessons,
    lessonOrder,
    duplicates,
    definitions,
    references,
    unitsVerified,
    objectivesComplete,
  };
  checks.scientificAccuracy = scientificAccuracy(enrichedBook, checks);

  const completionGates = {
    curriculumCoverage:
      coverage.percentage >= COMPLETE_GATES.curriculumCoverage,
    scientificAccuracy:
      checks.scientificAccuracy.score >=
        COMPLETE_GATES.scientificAccuracy &&
      checks.scientificAccuracy.passed,
    lessonOrderVerified: lessonOrder.passed,
    unitsVerified,
    definitionsVerified: definitions.passed,
    referencesVerified: references.passed,
    noDuplicatedLessons: duplicates.passed,
    noMissingLearningObjectives: objectivesComplete,
    everyLessonValidated: lessons.passed,
  };
  const complete = Object.values(completionGates).every(Boolean);
  const manualReviewReasons = [];
  if (!completionGates.scientificAccuracy) {
    manualReviewReasons.push(
      'Scientific accuracy requires documented evidence scoring ≥99%.',
    );
  }
  if (!completionGates.curriculumCoverage) {
    manualReviewReasons.push(
      `Curriculum coverage ${coverage.percentage}% is below 98%.`,
    );
  }
  if (!completionGates.everyLessonValidated) {
    manualReviewReasons.push(
      `${lessons.failed.length} lesson(s) failed content validation.`,
    );
  }
  for (const [gate, passed] of Object.entries(completionGates)) {
    if (!passed && !['scientificAccuracy', 'curriculumCoverage', 'everyLessonValidated'].includes(gate)) {
      manualReviewReasons.push(`Completion gate failed: ${gate}.`);
    }
  }

  const review = {
    schema: 'success-os.book-quality-review.v1',
    bookId: enrichedBook.id,
    identity: enrichedBook.identity,
    bookStatus: complete ? 'COMPLETE' : 'UNDER_REVIEW',
    qualityScore: qualityScore(checks),
    units: list(enrichedBook.units).length,
    lessons: lessons.total,
    coveragePercentage: coverage.percentage,
    scientificAccuracyPercentage: checks.scientificAccuracy.score,
    completionTimeMs: Date.now() - started,
    checks,
    completionGates,
    manualReviewRequired: !complete,
    manualReviewReasons,
    reviewedAt: new Date().toISOString(),
  };

  return { review, enrichedBook };
}

function progressSnapshot({
  started,
  processed,
  total,
  completed,
  underReview,
  qualitySum,
  books,
  current,
}) {
  const completedCountries = new Set(
    books
      .filter((item) => item.review.bookStatus === 'COMPLETE')
      .map((item) => item.review.identity?.country),
  );
  const completedCurricula = new Set(
    books
      .filter((item) => item.review.bookStatus === 'COMPLETE')
      .map(
        (item) =>
          `${item.review.identity?.country}::${item.review.identity?.curriculum}`,
      ),
  );
  const elapsed = Date.now() - started;
  const remaining = Math.max(total - processed, 0);
  return {
    type: 'batch',
    booksCompleted: completed,
    booksUnderReview: underReview,
    averageQualityScore: processed ? round(qualitySum / processed) : 0,
    countriesCompleted: completedCountries.size,
    curriculaCompleted: completedCurricula.size,
    subjectsCompleted: completed,
    currentCountry: current?.identity?.country || null,
    estimatedRemainingTimeMs: processed
      ? Math.round((elapsed / processed) * remaining)
      : null,
  };
}

export async function runGlobalQualityEngine(options = {}) {
  const started = Date.now();
  const onProgress =
    typeof options.onProgress === 'function' ? options.onProgress : null;
  const allBooks = listLibraryBooks();
  const books = options.includeFixtures
    ? allBooks
    : allBooks.filter(
        (book) =>
          book.identity?.country !== 'Testland' &&
          !String(book.id).startsWith('testland__'),
      );
  const results = [];
  let completed = 0;
  let underReview = 0;
  let qualitySum = 0;

  for (const [index, book] of books.entries()) {
    const baseline = loadBaseline(book.identity || {});
    const { review, enrichedBook } = reviewBookQuality(book, baseline);
    const reviewedBook = saveLibraryBook({
      ...enrichedBook,
      quality: review,
      publication: {
        ...(enrichedBook.publication || {}),
        qualityApproved: review.bookStatus === 'COMPLETE',
        status: review.bookStatus,
      },
    });
    const savedReview = saveQualityReview(review);
    if (review.bookStatus === 'COMPLETE') {
      saveFinalBookVersion(reviewedBook, savedReview);
      completed += 1;
    } else {
      underReview += 1;
    }
    qualitySum += review.qualityScore;
    results.push({ review: savedReview });

    if (onProgress) {
      onProgress({
        type: 'subject',
        country: review.identity?.country,
        educationalSystem: review.identity?.educationalSystem,
        curriculum: review.identity?.curriculum,
        grade: review.identity?.grade,
        subject: review.identity?.subject,
        bookStatus: review.bookStatus,
        qualityScore: review.qualityScore,
        units: review.units,
        lessons: review.lessons,
        coveragePercentage: review.coveragePercentage,
        completionTimeMs: review.completionTimeMs,
      });
    }

    if ((index + 1) % 50 === 0 && onProgress) {
      onProgress(
        progressSnapshot({
          started,
          processed: index + 1,
          total: books.length,
          completed,
          underReview,
          qualitySum,
          books: results,
          current: review,
        }),
      );
    }
  }

  const finalVersions = listFinalBookVersions();
  const reviews = listQualityReviews().filter(
    (review) => review.identity?.country !== 'Testland',
  );
  const manualReviewSubjects = reviews
    .filter((review) => review.manualReviewRequired)
    .map((review) => ({
      country: review.identity?.country,
      educationalSystem: review.identity?.educationalSystem,
      curriculum: review.identity?.curriculum,
      grade: review.identity?.grade,
      subject: review.identity?.subject,
      bookId: review.bookId,
      qualityScore: review.qualityScore,
      coveragePercentage: review.coveragePercentage,
      scientificAccuracyPercentage: review.scientificAccuracyPercentage,
      reasons: review.manualReviewReasons,
    }));

  const report = {
    schema: 'success-os.final-quality-report.v1',
    completionThresholds: COMPLETE_GATES,
    totals: {
      booksProcessed: books.length,
      booksCompleted: completed,
      booksUnderReview: underReview,
      finalVersionsStored: finalVersions.filter(
        (book) => book.identity?.country !== 'Testland',
      ).length,
      averageQualityScore: books.length
        ? round(qualitySum / books.length)
        : 0,
      countriesCompleted: new Set(
        results
          .filter((item) => item.review.bookStatus === 'COMPLETE')
          .map((item) => item.review.identity?.country),
      ).size,
      curriculaCompleted: new Set(
        results
          .filter((item) => item.review.bookStatus === 'COMPLETE')
          .map(
            (item) =>
              `${item.review.identity?.country}::${item.review.identity?.curriculum}`,
          ),
      ).size,
      subjectsCompleted: completed,
      manualReviewRequired: manualReviewSubjects.length,
    },
    processingTimeMs: Date.now() - started,
    generatedAt: new Date().toISOString(),
    library: libraryStatus(),
    manualReviewSubjects,
    policy: {
      completionIsStructuralOnly: false,
      scientificAccuracyCannotBeSelfCertified: true,
      finalVersionStoredOnlyAfterAllGates: true,
    },
  };

  return saveReport('FINAL-QUALITY-REPORT', report);
}

export function globalQualityStatus() {
  const books = listLibraryBooks().filter(
    (book) => book.identity?.country !== 'Testland',
  );
  const reviews = listQualityReviews().filter(
    (review) => review.identity?.country !== 'Testland',
  );
  const complete = reviews.filter(
    (review) => review.bookStatus === 'COMPLETE',
  );
  return {
    engine: 'SUCCESS OS Global Quality Engine',
    pipeline: [
      'verify-source',
      'verify-curriculum-subject-grade-objectives',
      'validate-every-lesson',
      'duplicate-content-check',
      'scientific-accuracy-check',
      'curriculum-coverage-check',
      'lesson-order-check',
      'definitions-and-terminology-check',
      'glossary-and-references',
      'save-final-version',
    ],
    completionThresholds: COMPLETE_GATES,
    books: books.length,
    reviews: reviews.length,
    completed: complete.length,
    underReview: reviews.length - complete.length,
    finalVersions: listFinalBookVersions().filter(
      (book) => book.identity?.country !== 'Testland',
    ).length,
    averageQualityScore: reviews.length
      ? round(
          reviews.reduce((sum, review) => sum + review.qualityScore, 0) /
            reviews.length,
        )
      : 0,
    library: libraryStatus(),
  };
}
