/**
 * PHASE JO-06 — Jordan Curriculum Update Engine
 *
 * Adapter over the portable curriculum-update-engine-core.
 * Do NOT create new books. Monitor → detect → impact → safe drafts → Admin.
 *
 * This same core will later power SA, UAE, EG, US, UK without redesign.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createCurriculumUpdateEngine } from './curriculum-update-engine-core.js';
import {
  assertJordanReferenceLibraryReady,
  readJordanReferenceLibrary,
} from './jordan-educational-reference-library-engine.js';
import {
  knowledgeRoot,
  readJordanKnowledgeDatabase,
} from './jordan-national-knowledge-engine.js';
import {
  isJordanNationalBookId,
} from '../../data/jordan-national-knowledge-sources.js';
import {
  listLibraryBooks,
  loadLibraryBook,
  saveLibraryBook,
} from './library-store.js';

export const PHASE = 'JO-06_JORDAN_CURRICULUM_UPDATE_ENGINE';
export const ENGINE_VERSION = '6.0.0';

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

function list(v) {
  return Array.isArray(v) ? v : [];
}

function text(v) {
  return String(v || '').trim();
}

function updateRoot() {
  return path.join(process.cwd(), 'library', 'jordan-curriculum-updates');
}

function loadKnowledgeSubject(subjectFile) {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), subjectFile), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Monitor snapshot from JO-05 reference library + JO-01 knowledge fingerprints.
 */
export function buildJordanMonitorSnapshot() {
  const refLib = readJordanReferenceLibrary();
  const knowledgeDb = readJordanKnowledgeDatabase();

  const sources = list(refLib?.sources).map((s) => ({
    sourceId: s.sourceId,
    title: s.title,
    category: s.category,
    grade: s.grade,
    subject: s.subject,
    version: s.version,
    status: s.status,
    officialUrl: s.officialUrl,
    unavailable: s.status === 'broken',
    fingerprint: hash({
      version: s.version,
      url: s.officialUrl,
      status: s.status,
      reliability: s.reliabilityScore,
      verificationDate: s.verificationDate,
      historyLen: list(s.history).length,
    }),
  }));

  const lessons = [];
  for (const row of list(knowledgeDb?.subjects)) {
    const node = loadKnowledgeSubject(row.subjectFile);
    if (!node) continue;
    for (const unit of list(node.units)) {
      for (const lesson of list(unit.lessons)) {
        const key = `${row.stage}::${row.grade}::${row.subject}::${unit.unitId}::${lesson.lessonId}`;
        lessons.push({
          key,
          grade: row.grade,
          subject: row.subject,
          stage: row.stage,
          unitId: unit.unitId,
          lessonId: lesson.lessonId,
          title: lesson.titleAr || lesson.title,
          bookIdHint: null,
          outcomesHash: hash(list(lesson.learningOutcomes)),
          termsHash: hash(list(lesson.definitions).concat(list(lesson.scientificConcepts))),
          scienceHash: hash(list(lesson.scientificConcepts).concat(list(lesson.examples))),
        });
      }
    }
  }

  return {
    curriculumVersion: refLib?.version?.curriculumEdition || '2025-2026',
    libraryVersion: refLib?.version?.libraryVersion || null,
    knowledgeBuiltAt: knowledgeDb?.builtAt || null,
    primaryOfficialSource: 'https://www.nccd.gov.jo/Ar/Pages/textbooks',
    sources,
    lessons,
    knowledgeRoot: knowledgeRoot(),
  };
}

function lightweightDraftCheck(book) {
  const lessons = list(book.units).flatMap((u) => list(u.lessons));
  const issues = [];
  if (!book.identity?.country || book.identity.country !== 'Jordan') {
    issues.push('COUNTRY');
  }
  if (book.identity?.curriculum !== 'Jordan National Curriculum') {
    issues.push('CURRICULUM');
  }
  if (!lessons.length) issues.push('NO_LESSONS');
  for (const lesson of lessons) {
    if (lesson.approvalStatus === 'draft-pending-admin' || lesson.jo06?.approvalStatus === 'draft-pending-admin') {
      if (!text(lesson.versionNumber || lesson.jo06?.versionNumber)) issues.push('MISSING_VERSION');
      if (!text(lesson.reasonForUpdate || lesson.jo06?.reasonForUpdate)) issues.push('MISSING_REASON');
      if (!list(lesson.references).length && !list(lesson.referenceSourceIds).length) {
        issues.push('MISSING_REFS');
      }
    }
  }
  return {
    ok: issues.length === 0,
    verificationPassed: issues.length === 0,
    issues,
    qualityScore: issues.length === 0 ? 98 : 70,
  };
}

let engineSingleton = null;

export function getJordanCurriculumUpdateEngine() {
  if (engineSingleton) return engineSingleton;
  engineSingleton = createCurriculumUpdateEngine({
    countryCode: 'JO',
    country: 'Jordan',
    educationalSystem: 'Jordan National Curriculum',
    rootDir: updateRoot(),
    buildMonitorSnapshot: buildJordanMonitorSnapshot,
    listNationalBooks: () =>
      listLibraryBooks().filter((b) => isJordanNationalBookId(b.id) && b.jo02?.producedAt),
    loadBook: loadLibraryBook,
    saveBook: saveLibraryBook,
    assertReferenceLibraryReady: () =>
      assertJordanReferenceLibraryReady({ action: 'jo06-monitor' }),
    verifyBook: (bookId, options = {}) => {
      const book = options.draftBook || loadLibraryBook(bookId);
      if (!book) return { ok: false, verificationPassed: false, error: 'BOOK_NOT_FOUND' };
      return lightweightDraftCheck(book);
    },
  });
  return engineSingleton;
}

export function runJordanCurriculumUpdateMonitor(options = {}) {
  const engine = getJordanCurriculumUpdateEngine();
  return engine.runMonitorCycle(options);
}

export function buildJordanUpdateDashboard() {
  return getJordanCurriculumUpdateEngine().buildDashboard();
}

export function approveJordanUpdateDraft(draftId, options = {}) {
  return getJordanCurriculumUpdateEngine().adminApproveDraft(draftId, options);
}

export function rejectJordanUpdateDraft(draftId, options = {}) {
  return getJordanCurriculumUpdateEngine().adminRejectDraft(draftId, options);
}

export function listJordanUpdateNotifications(options = {}) {
  return getJordanCurriculumUpdateEngine().listNotifications(options);
}

/**
 * Manual MoE notice injection — still creates drafts only for affected content.
 */
export function registerJordanCurriculumNotice(notice = {}) {
  const engine = getJordanCurriculumUpdateEngine();
  const change = {
    changeId: `manual-${Date.now()}`,
    country: 'Jordan',
    educationalSystem: 'Jordan National Curriculum',
    grade: notice.grade || 'all',
    subject: notice.subject || 'all',
    book: null,
    unit: notice.unit || null,
    lesson: notice.lesson || null,
    changeType: notice.changeType || 'new-curriculum-version',
    changeSeverity: notice.severity || 'high',
    officialSource: notice.officialSource || 'https://moe.gov.jo/',
    publicationDate: notice.publicationDate || new Date().toISOString(),
    detail: { title: notice.title || 'Manual MoE/NCCD curriculum notice', notes: notice.notes || '' },
  };
  return engine.runMonitorCycle({
    injectChanges: [change],
    updatedBy: notice.updatedBy || 'admin-manual-notice',
  });
}

export function runJordanCurriculumUpdateEngine(options = {}) {
  if (options.dashboardOnly) {
    return { dashboard: buildJordanUpdateDashboard() };
  }
  if (options.approveDraftId) {
    return approveJordanUpdateDraft(options.approveDraftId, options);
  }
  if (options.rejectDraftId) {
    return rejectJordanUpdateDraft(options.rejectDraftId, options);
  }
  if (options.notice) {
    return registerJordanCurriculumNotice(options.notice);
  }
  return runJordanCurriculumUpdateMonitor(options);
}
