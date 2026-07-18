/**
 * Success OS Content Factory — portable production core.
 *
 * Automated educational production pipeline.
 * Does NOT publish educational content directly.
 * No lesson may skip any production stage.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  CONTENT_FACTORY_SCHEMA,
  CONTENT_FACTORY_VERSION,
  PIPELINE_STAGES,
  CONTENT_STATUSES,
  LESSON_TEMPLATE_SECTIONS,
  VALIDATION_CHECKS,
  ADMIN_ACTIONS,
  FACTORY_METRICS,
  canRunStage,
  canPublish,
  nextStage,
  statusAfterStages,
  stageIndex,
} from '../../data/success-os-content-factory.js';

function list(v) {
  return Array.isArray(v) ? v : [];
}

function text(v) {
  return String(v || '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function ensureDirs(root) {
  for (const dir of [
    root,
    path.join(root, 'lessons'),
    path.join(root, 'queues'),
    path.join(root, 'reviews'),
    path.join(root, 'validation'),
    path.join(root, 'dashboards'),
    path.join(root, 'reports'),
    path.join(root, 'metrics'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function hasContent(value) {
  if (value == null) return false;
  if (typeof value === 'string') return text(value).length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

function fieldPresent(lesson, fields) {
  return fields.some((f) => hasContent(lesson?.[f]));
}

function lessonRecordId(bookId, lessonId) {
  return `${bookId}::${lessonId}`;
}

function safeFileId(id) {
  return String(id || '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .slice(0, 180);
}

/**
 * @param {object} config
 * @param {string} config.countryCode
 * @param {string} config.country
 * @param {string} config.educationalSystem
 * @param {string} config.rootDir
 * @param {() => object[]} config.listSourceBooks — books with units/lessons
 */
export function createContentFactory(config) {
  const {
    countryCode,
    country,
    educationalSystem,
    rootDir,
    listSourceBooks,
  } = config;
  const phase = `${countryCode}-CONTENT-FACTORY`;

  function root() {
    return rootDir;
  }

  function registryPath() {
    return path.join(root(), 'content-factory-registry.json');
  }

  function lessonPath(recordId) {
    return path.join(root(), 'lessons', `${safeFileId(recordId)}.json`);
  }

  function readRegistry() {
    return readJson(registryPath());
  }

  function readLesson(recordId) {
    return readJson(lessonPath(recordId));
  }

  function writeLesson(record) {
    writeJson(lessonPath(record.recordId), record);
    return record;
  }

  function emptyRegistry() {
    return {
      schema: CONTENT_FACTORY_SCHEMA,
      factoryVersion: CONTENT_FACTORY_VERSION,
      phase,
      countryCode,
      country,
      educationalSystem,
      pipelineStages: [...PIPELINE_STAGES],
      contentStatuses: [...CONTENT_STATUSES],
      lessonTemplate: LESSON_TEMPLATE_SECTIONS.map((s) => s.label),
      validationChecks: [...VALIDATION_CHECKS],
      adminActions: [...ADMIN_ACTIONS],
      lessons: {},
      metrics: emptyMetrics(),
      builtAt: null,
      note: 'No lesson may skip any production stage. No direct publication.',
    };
  }

  function emptyMetrics() {
    return {
      lessonsCreated: 0,
      lessonsUnderReview: 0,
      approvedLessons: 0,
      rejectedLessons: 0,
      publishedLessons: 0,
      archivedLessons: 0,
      averageReviewTimeHours: null,
      averageQualityScore: null,
      missingReferences: 0,
      brokenLinks: 0,
      byStatus: Object.fromEntries(CONTENT_STATUSES.map((s) => [s, 0])),
      byStage: Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0])),
    };
  }

  /**
   * Validate lesson against template + automatic checks.
   * Does not generate content — scores existing structure only.
   */
  function validateLesson(lesson, book, context = {}) {
    const checks = {};
    const issues = [];
    let scoreSum = 0;
    let scoreCount = 0;

    const template = LESSON_TEMPLATE_SECTIONS.map((section) => {
      const present = fieldPresent(lesson, section.fields);
      if (!present) {
        issues.push({ code: 'MISSING_TEMPLATE_SECTION', section: section.label });
      }
      return { key: section.key, label: section.label, present };
    });
    const templateCoverage =
      template.filter((t) => t.present).length / Math.max(1, template.length);
    checks.templateCoverage = {
      ok: templateCoverage >= 0.85,
      coverage: Math.round(templateCoverage * 1000) / 10,
    };
    scoreSum += templateCoverage * 100;
    scoreCount += 1;

    // Curriculum alignment
    const aligned = Boolean(
      lesson.curriculumAlignment?.officialStandard ||
        lesson.curriculumAlignment?.officialLearningObjective ||
        lesson.contentMatching?.curriculumAligned,
    );
    checks.curriculumAlignment = { ok: aligned };
    if (!aligned) issues.push({ code: 'CURRICULUM_ALIGNMENT_WEAK' });
    scoreSum += aligned ? 100 : 40;
    scoreCount += 1;

    // Scientific accuracy heuristics (structure present, no empty formulas when claimed)
    const hasScience =
      fieldPresent(lesson, ['keyConcepts', 'scientificConcepts', 'definitions']) &&
      fieldPresent(lesson, ['fullLesson', 'stepByStepExplanation']);
    checks.scientificAccuracy = { ok: hasScience };
    if (!hasScience) issues.push({ code: 'SCIENTIFIC_STRUCTURE_INCOMPLETE' });
    scoreSum += hasScience ? 95 : 50;
    scoreCount += 1;

    // Grammar / language — presence + language consistency with book
    const body = [
      lesson.introduction,
      lesson.fullLesson,
      lesson.summary,
      lesson.lessonSummary,
    ]
      .map(text)
      .join(' ');
    const grammarOk = body.length >= 80;
    checks.grammar = { ok: grammarOk, chars: body.length };
    if (!grammarOk) issues.push({ code: 'CONTENT_TOO_SHORT' });
    scoreSum += grammarOk ? 90 : 45;
    scoreCount += 1;

    const bookLang = book?.identity?.language || book?.language || 'ar';
    const lessonLang = lesson.language || bookLang;
    const langOk = lessonLang === bookLang;
    checks.languageConsistency = { ok: langOk, language: lessonLang };
    if (!langOk) issues.push({ code: 'LANGUAGE_MISMATCH' });
    scoreSum += langOk ? 100 : 60;
    scoreCount += 1;

    // Reading level — rough length bands by grade keyword
    const grade = text(book?.identity?.grade || '');
    const words = body.split(/\s+/).filter(Boolean).length;
    const readingOk = words >= 40 && words <= 4000;
    checks.readingLevel = { ok: readingOk, approxWords: words, grade };
    if (!readingOk) issues.push({ code: 'READING_LEVEL_OUT_OF_BAND' });
    scoreSum += readingOk ? 88 : 55;
    scoreCount += 1;

    // Duplicate detection within the same book
    const fingerprint = `${book?.id || ''}::${text(lesson.title).toLowerCase()}`;
    const dup = Boolean(context.seenTitles?.has(fingerprint) && text(lesson.title));
    checks.duplicateDetection = { ok: !dup };
    if (dup) issues.push({ code: 'DUPLICATE_LESSON_TITLE', title: lesson.title });
    scoreSum += dup ? 20 : 100;
    scoreCount += 1;
    if (text(lesson.title)) context.seenTitles?.add(fingerprint);

    // References
    const refs = list(lesson.references).concat(list(lesson.referenceSourceIds));
    const missingRefs = refs.length === 0;
    checks.referenceValidation = {
      ok: !missingRefs,
      count: refs.length,
    };
    if (missingRefs) issues.push({ code: 'MISSING_REFERENCES' });
    scoreSum += missingRefs ? 35 : 95;
    scoreCount += 1;

    // Metadata
    const metaOk = Boolean(lesson.id && lesson.title);
    checks.metadataValidation = { ok: metaOk };
    if (!metaOk) issues.push({ code: 'MISSING_METADATA' });
    scoreSum += metaOk ? 100 : 0;
    scoreCount += 1;

    // Broken internal links
    const links = list(lesson.internalLinks);
    const broken = links.filter((l) => {
      const target = l?.targetLessonId || l?.href || l?.url;
      return !target || String(target).includes('broken') || String(target) === '#';
    });
    checks.brokenInternalLinks = {
      ok: broken.length === 0,
      broken: broken.length,
      total: links.length,
    };
    if (broken.length) issues.push({ code: 'BROKEN_INTERNAL_LINKS', count: broken.length });
    scoreSum += broken.length ? 40 : 100;
    scoreCount += 1;

    // QA reject flag from prior production
    if (lesson.adminReview?.status === 'REJECTED') {
      issues.push({ code: 'PRIOR_QA_REJECTED' });
      scoreSum += 0;
      scoreCount += 1;
    }

    const qualityScore = Math.round((scoreSum / Math.max(1, scoreCount)) * 10) / 10;
    const ok =
      checks.templateCoverage.ok &&
      checks.curriculumAlignment.ok &&
      checks.metadataValidation.ok &&
      checks.brokenInternalLinks.ok &&
      !dup;

    return {
      ok,
      qualityScore,
      checks,
      template,
      issues,
      missingReferences: missingRefs ? 1 : 0,
      brokenLinks: broken.length,
      validatedAt: nowIso(),
    };
  }

  /**
   * Infer which automated stages can be credited from existing lesson evidence.
   * Never credits Admin Review or Publication automatically.
   */
  function inferCompletableStages(lesson, book, validation) {
    const credit = [];
    const jo02 = Boolean(lesson.jo02?.authoredAt || book.jo02?.producedAt);
    const jo03 =
      book.jo03?.verificationStatus === 'VERIFIED_PENDING_ADMIN' ||
      book.jo03?.verificationStatus === 'ADMIN_APPROVED_PUBLISHED' ||
      book.jo03?.verificationStatus === 'FAILED_VERIFICATION';
    const hasRefs =
      list(lesson.references).length > 0 || list(lesson.referenceSourceIds).length > 0;
    const hasConcepts = fieldPresent(lesson, ['keyConcepts', 'scientificConcepts']);
    const hasStructure = fieldPresent(lesson, ['introduction', 'fullLesson', 'summary', 'lessonSummary']);
    const hasWriting = text(lesson.fullLesson || lesson.stepByStepExplanation).length >= 80;
    const hasTerms = fieldPresent(lesson, ['definitions', 'scientificTerms', 'vocabulary']);
    const hasDiagrams = fieldPresent(lesson, [
      'diagrams',
      'illustrations',
      'visualRecommendations',
    ]);
    const qaOk = lesson.adminReview?.status === 'APPROVED_BY_QA';

    // Research through Reference Linking / QA can be auto-advanced when evidence exists.
    // Admin Review + Publication always require human Admin actions.
    if (jo02 || jo03) credit.push('Research');
    if (jo03 || lesson.curriculumAlignment) credit.push('Curriculum Verification');
    if (jo02 || hasConcepts) credit.push('Knowledge Extraction');
    if (hasConcepts) credit.push('Concept Mapping');
    if (hasStructure) credit.push('Lesson Structure');
    if (hasWriting) credit.push('Educational Writing');
    if (hasConcepts && hasWriting) credit.push('Scientific Verification');
    if (hasTerms) credit.push('Terminology Verification');
    if (hasDiagrams) credit.push('Diagram Generation');
    if (hasRefs) credit.push('Reference Linking');
    if (qaOk && validation.ok) credit.push('Quality Assurance');

    // Preserve order and only include stages that form a contiguous prefix
    const ordered = [];
    for (const stage of PIPELINE_STAGES) {
      if (stage === 'Admin Review' || stage === 'Publication') break;
      if (credit.includes(stage)) ordered.push(stage);
      else break;
    }
    return ordered;
  }

  function createRecord({ book, unit, lesson }) {
    const recordId = lessonRecordId(book.id, lesson.id);
    const existing = readLesson(recordId);
    const createdAt = existing?.createdAt || nowIso();
    return {
      schema: CONTENT_FACTORY_SCHEMA,
      factoryVersion: CONTENT_FACTORY_VERSION,
      recordId,
      countryCode,
      country,
      educationalSystem,
      bookId: book.id,
      unitId: unit.id || unit.unitId,
      unitTitle: unit.title || unit.titleAr,
      lessonId: lesson.id,
      title: lesson.title,
      grade: book.identity?.grade,
      subject: book.identity?.subject,
      language: book.identity?.language || 'ar',
      status: existing?.status === 'Published' || existing?.status === 'Archived'
        ? existing.status
        : 'Researching',
      currentStage: existing?.currentStage || PIPELINE_STAGES[0],
      completedStages: existing?.completedStages || [],
      stageHistory: existing?.stageHistory || [],
      validation: null,
      admin: existing?.admin || {
        approved: false,
        rejected: false,
        comments: [],
        revisionRequests: [],
        previewedAt: null,
        editedAt: null,
        approvedAt: null,
        rejectedAt: null,
        publishedAt: null,
        archivedAt: null,
      },
      qualityScore: null,
      publication: {
        factoryPublished: existing?.publication?.factoryPublished || false,
        studentPortalVisible: false,
        note: 'Factory Publication never sets student portal visibility directly.',
      },
      createdAt,
      updatedAt: nowIso(),
      jo09: {
        phase: 'JO-09',
        enrolledAt: existing?.jo09?.enrolledAt || nowIso(),
        lastPipelineRunAt: null,
      },
    };
  }

  function appendHistory(record, entry) {
    record.stageHistory = [
      ...list(record.stageHistory),
      { ...entry, at: entry.at || nowIso() },
    ].slice(-80);
  }

  function completeStage(record, stage, meta = {}) {
    const gate = canRunStage(record.completedStages, stage);
    if (!gate.ok) {
      return { ok: false, ...gate, record };
    }
    if (record.completedStages.includes(stage)) {
      return { ok: true, alreadyDone: true, record };
    }
    if (stage === 'Publication') {
      const pub = canPublish(record);
      if (!pub.ok) return { ok: false, ...pub, record };
    }
    if (stage === 'Admin Review' && !meta.adminAction) {
      return {
        ok: false,
        reason: 'ADMIN_ACTION_REQUIRED',
        message: 'Admin Review cannot be auto-completed.',
        record,
      };
    }

    record.completedStages = [...record.completedStages, stage];
    record.currentStage = nextStage(stage) || stage;
    if (stage === 'Publication') {
      record.status = 'Published';
      record.publication.factoryPublished = true;
      record.admin.publishedAt = nowIso();
    } else if (stage === 'Admin Review' && record.admin.approved) {
      record.status = 'Approved';
    } else {
      record.status = statusAfterStages(record.completedStages);
    }
    appendHistory(record, {
      type: 'stage-complete',
      stage,
      status: record.status,
      qualityScore: meta.qualityScore ?? record.qualityScore,
      note: meta.note || null,
      by: meta.by || 'factory',
    });
    record.updatedAt = nowIso();
    return { ok: true, record };
  }

  function runAutomatedPipeline(record, lesson, book, options = {}) {
    const context = options.context || { seenTitles: new Set() };
    const validation = validateLesson(lesson, book, context);
    record.validation = validation;
    record.qualityScore = validation.qualityScore;

    const toComplete = options.forceStages
      ? options.forceStages
      : inferCompletableStages(lesson, book, validation);

    const results = [];
    for (const stage of toComplete) {
      if (record.completedStages.includes(stage)) continue;
      // Stop automated run before Admin Review
      if (stage === 'Admin Review' || stage === 'Publication') break;
      if (!validation.ok && stageIndex(stage) >= stageIndex('Quality Assurance')) {
        results.push({
          stage,
          ok: false,
          reason: 'VALIDATION_FAILED',
          issues: validation.issues.slice(0, 8),
        });
        break;
      }
      const done = completeStage(record, stage, {
        qualityScore: validation.qualityScore,
        note: 'auto-advanced from existing evidence',
        by: 'content-factory-auto',
      });
      results.push({ stage, ...done });
      if (!done.ok) break;
    }

    // After QA stages: park at Admin Review status if QA complete
    if (
      record.completedStages.includes('Quality Assurance') &&
      !record.completedStages.includes('Admin Review') &&
      record.status !== 'Archived' &&
      record.status !== 'Published'
    ) {
      record.status = 'Admin Review';
      record.currentStage = 'Admin Review';
    }

    record.jo09.lastPipelineRunAt = nowIso();
    record.updatedAt = nowIso();
    return { record, validation, results };
  }

  /**
   * Enroll all source lessons into the factory and run automated stages.
   * Never publishes. Never skips Admin Review.
   */
  function enrollAndProcess(options = {}) {
    ensureDirs(root());
    const books = list(listSourceBooks());
    const registry = emptyRegistry();
    const context = { seenTitles: new Set() };
    const records = [];

    for (const book of books) {
      for (const unit of list(book.units)) {
        for (const lesson of list(unit.lessons)) {
          if (!lesson?.id) continue;
          let record = createRecord({ book, unit, lesson });
          // Preserve terminal human states across re-enroll
          if (options.reset !== true) {
            const prior = readLesson(record.recordId);
            if (prior?.status === 'Published' || prior?.status === 'Archived') {
              writeLesson(prior);
              registry.lessons[prior.recordId] = summarize(prior);
              records.push(prior);
              continue;
            }
            if (prior?.admin?.approved || prior?.admin?.rejected) {
              record.admin = prior.admin;
              record.completedStages = prior.completedStages || [];
              record.stageHistory = prior.stageHistory || [];
              record.status = prior.status;
              record.currentStage = prior.currentStage;
            }
          }
          const run = runAutomatedPipeline(record, lesson, book, { context });
          record = run.record;
          writeLesson(record);
          registry.lessons[record.recordId] = summarize(record);
          records.push(record);
        }
      }
    }

    registry.metrics = computeMetrics(records);
    registry.builtAt = nowIso();
    writeJson(registryPath(), registry);
    writeJson(path.join(root(), 'queues', 'admin-review.json'), {
      updatedAt: nowIso(),
      items: records
        .filter((r) => r.status === 'Admin Review' || r.currentStage === 'Admin Review')
        .map(summarize),
    });
    writeJson(path.join(root(), 'validation', 'latest.json'), {
      updatedAt: nowIso(),
      checked: records.length,
      passed: records.filter((r) => r.validation?.ok).length,
      failed: records.filter((r) => r.validation && !r.validation.ok).length,
    });
    const dashboard = buildDashboard(registry, records);
    writeJson(path.join(root(), 'dashboards', 'latest.json'), dashboard);
    writeJson(path.join(root(), 'metrics', 'latest.json'), registry.metrics);
    writeJson(path.join(root(), 'reports', `factory-${countryCode}-${Date.now()}.json`), {
      enrolled: records.length,
      metrics: registry.metrics,
      note: 'No direct publication. Admin Review required.',
    });

    return { registry, records, dashboard };
  }

  function summarize(record) {
    return {
      recordId: record.recordId,
      bookId: record.bookId,
      lessonId: record.lessonId,
      title: record.title,
      grade: record.grade,
      subject: record.subject,
      status: record.status,
      currentStage: record.currentStage,
      completedStages: record.completedStages,
      qualityScore: record.qualityScore,
      adminApproved: Boolean(record.admin?.approved),
      adminRejected: Boolean(record.admin?.rejected),
      factoryPublished: Boolean(record.publication?.factoryPublished),
      missingReferences: record.validation?.missingReferences || 0,
      brokenLinks: record.validation?.brokenLinks || 0,
      updatedAt: record.updatedAt,
    };
  }

  function computeMetrics(records) {
    const metrics = emptyMetrics();
    metrics.lessonsCreated = records.length;
    let qualitySum = 0;
    let qualityN = 0;
    let reviewHoursSum = 0;
    let reviewN = 0;
    let missingRefs = 0;
    let broken = 0;

    const underReview = new Set([
      'Researching',
      'Draft',
      'Scientific Review',
      'Educational Review',
      'QA Review',
      'Admin Review',
    ]);

    for (const r of records) {
      metrics.byStatus[r.status] = (metrics.byStatus[r.status] || 0) + 1;
      if (underReview.has(r.status)) metrics.lessonsUnderReview += 1;
      if (r.status === 'Approved' || r.admin?.approved) metrics.approvedLessons += 1;
      if (r.admin?.rejected || r.status === 'Archived' && r.admin?.rejected) {
        metrics.rejectedLessons += 1;
      }
      if (r.status === 'Published') metrics.publishedLessons += 1;
      if (r.status === 'Archived') metrics.archivedLessons += 1;
      if (typeof r.qualityScore === 'number') {
        qualitySum += r.qualityScore;
        qualityN += 1;
      }
      missingRefs += r.validation?.missingReferences || 0;
      broken += r.validation?.brokenLinks || 0;

      const enrolled = Date.parse(r.jo09?.enrolledAt || r.createdAt || '');
      const decided = Date.parse(r.admin?.approvedAt || r.admin?.rejectedAt || '');
      if (enrolled && decided && decided >= enrolled) {
        reviewHoursSum += (decided - enrolled) / 3600000;
        reviewN += 1;
      }

      const next = r.currentStage;
      if (next) metrics.byStage[next] = (metrics.byStage[next] || 0) + 1;
    }

    metrics.averageQualityScore =
      qualityN > 0 ? Math.round((qualitySum / qualityN) * 10) / 10 : null;
    metrics.averageReviewTimeHours =
      reviewN > 0 ? Math.round((reviewHoursSum / reviewN) * 10) / 10 : null;
    metrics.missingReferences = missingRefs;
    metrics.brokenLinks = broken;
    return metrics;
  }

  function findLessonInBooks(bookId, lessonId) {
    const book = list(listSourceBooks()).find((b) => b.id === bookId);
    if (!book) return null;
    for (const unit of list(book.units)) {
      const lesson = list(unit.lessons).find((l) => l.id === lessonId);
      if (lesson) return { book, unit, lesson };
    }
    return null;
  }

  function listRecords() {
    const dir = path.join(root(), 'lessons');
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => readJson(path.join(dir, f)))
      .filter(Boolean);
  }

  /**
   * Admin workflow — never skips pipeline rules.
   */
  function adminAction(recordId, action, payload = {}) {
    // 'publish' is the first-time Publication step; 'republish' is the Admin action name.
    const normalizedAction = action === 'publish' ? 'republish' : action;
    if (!ADMIN_ACTIONS.includes(normalizedAction)) {
      return { ok: false, error: 'UNKNOWN_ADMIN_ACTION', action };
    }
    const record = readLesson(recordId);
    if (!record) return { ok: false, error: 'LESSON_NOT_FOUND', recordId };

    const by = payload.by || 'admin';
    const comment = text(payload.comment);

    if (normalizedAction === 'preview') {
      record.admin.previewedAt = nowIso();
      appendHistory(record, { type: 'admin-preview', by });
      writeLesson(record);
      const source = findLessonInBooks(record.bookId, record.lessonId);
      return {
        ok: true,
        action,
        record: summarize(record),
        preview: source
          ? {
              title: source.lesson.title,
              learningObjectives: source.lesson.learningObjectives || source.lesson.learningOutcomes,
              introduction: source.lesson.introduction,
              keyConcepts: source.lesson.keyConcepts,
              summary: source.lesson.summary || source.lesson.lessonSummary,
              references: source.lesson.references,
              template: record.validation?.template,
            }
          : null,
      };
    }

    if (normalizedAction === 'comment') {
      if (!comment) return { ok: false, error: 'COMMENT_REQUIRED' };
      record.admin.comments = [
        ...list(record.admin.comments),
        { text: comment, by, at: nowIso() },
      ];
      appendHistory(record, { type: 'admin-comment', by, note: comment });
      writeLesson(record);
      return { ok: true, action, record: summarize(record) };
    }

    if (normalizedAction === 'edit') {
      record.admin.editedAt = nowIso();
      appendHistory(record, {
        type: 'admin-edit',
        by,
        note: comment || 'edit recorded (source book unchanged by factory)',
      });
      // Factory does not rewrite educational content; records the edit intent only.
      writeLesson(record);
      return {
        ok: true,
        action,
        record: summarize(record),
        note: 'Edit intent logged. Content changes must go through Educational Writing stage on revision.',
      };
    }

    if (normalizedAction === 'requestRevision') {
      record.admin.rejected = false;
      record.admin.approved = false;
      record.admin.revisionRequests = [
        ...list(record.admin.revisionRequests),
        { text: comment || 'Revision requested', by, at: nowIso() },
      ];
      // Roll back to Educational Writing for revision — keep prior stage evidence except Admin/Publication
      record.completedStages = record.completedStages.filter(
        (s) => s !== 'Admin Review' && s !== 'Publication' && s !== 'Quality Assurance',
      );
      record.status = 'Draft';
      record.currentStage = 'Educational Writing';
      record.publication.factoryPublished = false;
      appendHistory(record, {
        type: 'request-revision',
        by,
        note: comment || 'Revision requested',
      });
      writeLesson(record);
      refreshRegistry();
      return { ok: true, action, record: summarize(record) };
    }

    if (normalizedAction === 'reject') {
      record.admin.rejected = true;
      record.admin.approved = false;
      record.admin.rejectedAt = nowIso();
      record.status = 'Archived';
      record.publication.factoryPublished = false;
      appendHistory(record, {
        type: 'admin-reject',
        by,
        note: comment || 'Rejected',
      });
      writeLesson(record);
      refreshRegistry();
      return { ok: true, action, record: summarize(record) };
    }

    if (normalizedAction === 'approve') {
      // Must have completed all stages before Admin Review
      const gate = canRunStage(record.completedStages, 'Admin Review');
      if (!gate.ok) return { ok: false, ...gate };

      record.admin.approved = true;
      record.admin.rejected = false;
      record.admin.approvedAt = nowIso();
      const done = completeStage(record, 'Admin Review', {
        adminAction: true,
        by,
        note: comment || 'Admin approved',
        qualityScore: record.qualityScore,
      });
      if (!done.ok) return done;
      record.status = 'Approved';
      writeLesson(record);
      refreshRegistry();
      return {
        ok: true,
        action,
        record: summarize(record),
        note: 'Approved. Call publish to complete Publication stage. Student portal not opened automatically.',
      };
    }

    if (normalizedAction === 'republish') {
      if (record.status === 'Published') {
        appendHistory(record, { type: 'republish', by, note: comment || 'Republish confirmed' });
        record.admin.publishedAt = nowIso();
        writeLesson(record);
        refreshRegistry();
        return { ok: true, action: 'republish', record: summarize(record) };
      }

      if (!record.admin.approved) {
        return { ok: false, error: 'APPROVE_BEFORE_PUBLISH' };
      }
      if (!record.completedStages.includes('Admin Review')) {
        const adm = completeStage(record, 'Admin Review', {
          adminAction: true,
          by,
          note: 'Admin Review completed at publish',
        });
        if (!adm.ok) return adm;
      }
      const pubGate = canPublish(record);
      if (!pubGate.ok) return { ok: false, ...pubGate };

      const done = completeStage(record, 'Publication', {
        adminAction: true,
        by,
        note: comment || 'Factory publication recorded (no direct student publish)',
      });
      if (!done.ok) return done;
      record.publication.studentPortalVisible = false;
      writeLesson(record);
      refreshRegistry();
      return {
        ok: true,
        action: action === 'publish' ? 'publish' : 'republish',
        record: summarize(record),
        note: 'Factory Publication complete. Student portal visibility remains false (no direct publish).',
      };
    }

    if (normalizedAction === 'archive') {
      record.status = 'Archived';
      record.admin.archivedAt = nowIso();
      record.publication.factoryPublished = false;
      appendHistory(record, { type: 'archive', by, note: comment || 'Archived' });
      writeLesson(record);
      refreshRegistry();
      return { ok: true, action: normalizedAction, record: summarize(record) };
    }

    return { ok: false, error: 'UNHANDLED_ACTION', action };
  }

  function refreshRegistry() {
    const records = listRecords();
    const registry = readRegistry() || emptyRegistry();
    registry.lessons = Object.fromEntries(records.map((r) => [r.recordId, summarize(r)]));
    registry.metrics = computeMetrics(records);
    registry.builtAt = nowIso();
    writeJson(registryPath(), registry);
    writeJson(path.join(root(), 'dashboards', 'latest.json'), buildDashboard(registry, records));
    writeJson(path.join(root(), 'metrics', 'latest.json'), registry.metrics);
    writeJson(path.join(root(), 'queues', 'admin-review.json'), {
      updatedAt: nowIso(),
      items: records
        .filter((r) => r.status === 'Admin Review')
        .map(summarize),
    });
    return registry;
  }

  function buildDashboard(registry = null, records = null) {
    const reg = registry || readRegistry() || emptyRegistry();
    const recs = records || listRecords();
    const metrics = reg.metrics || computeMetrics(recs);
    return {
      schema: 'success-os.content-factory-dashboard.v1',
      factoryVersion: CONTENT_FACTORY_VERSION,
      phase,
      countryCode,
      country,
      pipelineStages: PIPELINE_STAGES,
      contentStatuses: CONTENT_STATUSES,
      lessonsCreated: metrics.lessonsCreated,
      lessonsUnderReview: metrics.lessonsUnderReview,
      approvedLessons: metrics.approvedLessons,
      rejectedLessons: metrics.rejectedLessons,
      publishedLessons: metrics.publishedLessons,
      averageReviewTime: metrics.averageReviewTimeHours,
      averageQualityScore: metrics.averageQualityScore,
      missingReferences: metrics.missingReferences,
      brokenLinks: metrics.brokenLinks,
      byStatus: metrics.byStatus,
      byStage: metrics.byStage,
      adminQueue: recs.filter((r) => r.status === 'Admin Review').length,
      factoryRule: 'No lesson may skip any production stage. No direct publication.',
      updatedAt: nowIso(),
    };
  }

  function runFactory(options = {}) {
    if (options.dashboardOnly) {
      return { dashboard: buildDashboard() };
    }
    return enrollAndProcess(options);
  }

  return {
    countryCode,
    country,
    phase,
    root,
    PIPELINE_STAGES,
    CONTENT_STATUSES,
    LESSON_TEMPLATE_SECTIONS,
    VALIDATION_CHECKS,
    ADMIN_ACTIONS,
    FACTORY_METRICS,
    readRegistry,
    readLesson,
    listRecords,
    validateLesson,
    enrollAndProcess,
    runFactory,
    adminAction,
    buildDashboard,
    refreshRegistry,
    canPublish,
    canRunStage,
  };
}
