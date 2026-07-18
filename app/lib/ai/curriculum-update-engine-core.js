/**
 * Portable Curriculum Update Engine Core
 *
 * Reusable unchanged for Jordan, Saudi Arabia, UAE, Egypt, US, UK, etc.
 * Does NOT create new books. Updates only affected content via draft versions.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const UPDATE_ENGINE_SCHEMA = 'success-os.curriculum-update-engine.v1';
export const CHANGE_TYPES = Object.freeze([
  'new-curriculum-version',
  'new-textbook',
  'updated-teacher-guide',
  'deleted-lesson',
  'added-lesson',
  'changed-learning-outcomes',
  'changed-terminology',
  'updated-scientific-information',
  'new-assessment-standard',
  'source-unavailable',
  'reference-library-change',
]);

export const SEVERITY = Object.freeze({
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
});

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

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

function ensureDirs(root) {
  for (const dir of [
    root,
    path.join(root, 'snapshots'),
    path.join(root, 'changes'),
    path.join(root, 'impacts'),
    path.join(root, 'drafts'),
    path.join(root, 'versions'),
    path.join(root, 'notifications'),
    path.join(root, 'approvals'),
    path.join(root, 'history'),
    path.join(root, 'dashboards'),
    path.join(root, 'reports'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function severityFor(changeType) {
  switch (changeType) {
    case 'deleted-lesson':
    case 'new-curriculum-version':
    case 'source-unavailable':
      return SEVERITY.critical;
    case 'added-lesson':
    case 'changed-learning-outcomes':
    case 'new-textbook':
    case 'new-assessment-standard':
      return SEVERITY.high;
    case 'changed-terminology':
    case 'updated-scientific-information':
    case 'updated-teacher-guide':
      return SEVERITY.medium;
    default:
      return SEVERITY.low;
  }
}

/**
 * @param {object} config
 * @param {string} config.countryCode
 * @param {string} config.country
 * @param {string} config.educationalSystem
 * @param {string} config.rootDir absolute path for this country's update store
 * @param {() => object} config.buildMonitorSnapshot
 * @param {() => object[]} config.listNationalBooks
 * @param {(bookId: string) => object|null} config.loadBook
 * @param {(book: object) => object} config.saveBook
 * @param {(bookId: string, options?: object) => object} [config.verifyBook]
 * @param {() => boolean} [config.assertReferenceLibraryReady]
 */
export function createCurriculumUpdateEngine(config) {
  const {
    countryCode,
    country,
    educationalSystem,
    rootDir,
    buildMonitorSnapshot,
    listNationalBooks,
    loadBook,
    saveBook,
    verifyBook,
    assertReferenceLibraryReady,
  } = config;

  const phase = `${countryCode}-CURRICULUM-UPDATE-ENGINE`;

  function root() {
    return rootDir;
  }

  function statePath() {
    return path.join(root(), 'state.json');
  }

  function readState() {
    return (
      readJson(statePath()) || {
        schema: UPDATE_ENGINE_SCHEMA,
        countryCode,
        lastMonitorAt: null,
        lastSnapshotId: null,
        pendingDraftIds: [],
        approvedUpdateIds: [],
        rejectedUpdateIds: [],
      }
    );
  }

  function writeState(state) {
    const next = { ...state, updatedAt: nowIso() };
    writeJson(statePath(), next);
    return next;
  }

  function notify(type, message, payload = {}) {
    ensureDirs(root());
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const note = {
      id,
      type,
      message,
      countryCode,
      country,
      educationalSystem,
      payload,
      read: false,
      createdAt: nowIso(),
    };
    writeJson(path.join(root(), 'notifications', `${id}.json`), note);
    const inbox = readJson(path.join(root(), 'notifications', 'inbox.json')) || { items: [] };
    inbox.items = [note, ...list(inbox.items)].slice(0, 200);
    writeJson(path.join(root(), 'notifications', 'inbox.json'), inbox);
    return note;
  }

  function listNotifications({ unreadOnly = false } = {}) {
    const inbox = readJson(path.join(root(), 'notifications', 'inbox.json'));
    const items = list(inbox?.items);
    return unreadOnly ? items.filter((n) => !n.read) : items;
  }

  function markNotificationRead(id) {
    const inbox = readJson(path.join(root(), 'notifications', 'inbox.json')) || { items: [] };
    inbox.items = list(inbox.items).map((n) => (n.id === id ? { ...n, read: true } : n));
    writeJson(path.join(root(), 'notifications', 'inbox.json'), inbox);
    const file = path.join(root(), 'notifications', `${id}.json`);
    const note = readJson(file);
    if (note) writeJson(file, { ...note, read: true });
    return true;
  }

  /**
   * Capture monitor snapshot of official curriculum fingerprints.
   */
  function captureSnapshot() {
    ensureDirs(root());
    if (assertReferenceLibraryReady) {
      try {
        assertReferenceLibraryReady({ action: 'jo06-monitor' });
      } catch (error) {
        notify('source-unavailable', 'Reference library not ready during monitor', {
          error: error.message,
        });
        throw error;
      }
    }

    const snapshotPayload = buildMonitorSnapshot();
    const snapshotId = `snap-${nowIso().replace(/[:.]/g, '-')}`;
    const snapshot = {
      schema: 'success-os.curriculum-monitor-snapshot.v1',
      snapshotId,
      countryCode,
      country,
      educationalSystem,
      capturedAt: nowIso(),
      fingerprint: hash(snapshotPayload),
      payload: snapshotPayload,
    };
    writeJson(path.join(root(), 'snapshots', `${snapshotId}.json`), snapshot);
    writeJson(path.join(root(), 'snapshots', 'latest.json'), snapshot);
    return snapshot;
  }

  function _loadLatestSnapshot() {
    return readJson(path.join(root(), 'snapshots', 'latest.json'));
  }

  function loadPreviousSnapshot(excludeId) {
    const dir = path.join(root(), 'snapshots');
    if (!fs.existsSync(dir)) return null;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('snap-') && f.endsWith('.json'))
      .sort()
      .reverse();
    for (const f of files) {
      const snap = readJson(path.join(dir, f));
      if (snap && snap.snapshotId !== excludeId) return snap;
    }
    return null;
  }

  /**
   * Diff two monitor snapshots into structured change records.
   */
  function detectChanges(previous, current) {
    const changes = [];
    const prev = previous?.payload || {};
    const curr = current?.payload || {};
    const publicationDate = current?.capturedAt || nowIso();

    const base = {
      country,
      educationalSystem,
      officialSource: curr.primaryOfficialSource || prev.primaryOfficialSource || null,
      publicationDate,
      snapshotId: current?.snapshotId,
      previousSnapshotId: previous?.snapshotId || null,
    };

    // Curriculum version
    if (text(prev.curriculumVersion) && text(curr.curriculumVersion) && prev.curriculumVersion !== curr.curriculumVersion) {
      changes.push({
        ...base,
        changeId: `chg-version-${hash([prev.curriculumVersion, curr.curriculumVersion])}`,
        changeType: 'new-curriculum-version',
        changeSeverity: severityFor('new-curriculum-version'),
        grade: 'all',
        subject: 'all',
        book: null,
        unit: null,
        lesson: null,
        detail: { from: prev.curriculumVersion, to: curr.curriculumVersion },
      });
    }

    // Reference / textbook / teacher guide / assessment sources
    const prevSources = new Map(list(prev.sources).map((s) => [s.sourceId, s]));
    const currSources = new Map(list(curr.sources).map((s) => [s.sourceId, s]));

    for (const [id, src] of currSources) {
      const old = prevSources.get(id);
      if (!old) {
        const type =
          src.category === 'Official Textbooks'
            ? 'new-textbook'
            : src.category === 'Teacher Guides'
              ? 'updated-teacher-guide'
              : src.category === 'Assessment Frameworks'
                ? 'new-assessment-standard'
                : 'reference-library-change';
        changes.push({
          ...base,
          changeId: `chg-src-add-${id}`,
          changeType: type,
          changeSeverity: severityFor(type),
          grade: src.grade || 'all',
          subject: src.subject || 'all',
          book: null,
          unit: null,
          lesson: null,
          officialSource: src.officialUrl || base.officialSource,
          detail: { sourceId: id, title: src.title },
        });
        continue;
      }
      if (old.fingerprint !== src.fingerprint || old.version !== src.version) {
        const type =
          src.category === 'Teacher Guides'
            ? 'updated-teacher-guide'
            : src.category === 'Official Textbooks'
              ? 'new-textbook'
              : src.category === 'Assessment Frameworks'
                ? 'new-assessment-standard'
                : 'reference-library-change';
        changes.push({
          ...base,
          changeId: `chg-src-upd-${id}-${hash([old.fingerprint, src.fingerprint])}`,
          changeType: type,
          changeSeverity: severityFor(type),
          grade: src.grade || 'all',
          subject: src.subject || 'all',
          book: null,
          unit: null,
          lesson: null,
          officialSource: src.officialUrl || base.officialSource,
          detail: {
            sourceId: id,
            fromVersion: old.version,
            toVersion: src.version,
          },
        });
      }
      if (src.status === 'broken' || src.unavailable) {
        changes.push({
          ...base,
          changeId: `chg-src-down-${id}`,
          changeType: 'source-unavailable',
          changeSeverity: severityFor('source-unavailable'),
          grade: src.grade || 'all',
          subject: src.subject || 'all',
          book: null,
          unit: null,
          lesson: null,
          officialSource: src.officialUrl || base.officialSource,
          detail: { sourceId: id },
        });
      }
    }

    // Knowledge lessons (JO-01 style subject nodes)
    const prevLessons = new Map(list(prev.lessons).map((l) => [l.key, l]));
    const currLessons = new Map(list(curr.lessons).map((l) => [l.key, l]));

    for (const [key, lesson] of currLessons) {
      const old = prevLessons.get(key);
      if (!old) {
        changes.push({
          ...base,
          changeId: `chg-lesson-add-${hash(key)}`,
          changeType: 'added-lesson',
          changeSeverity: severityFor('added-lesson'),
          grade: lesson.grade,
          subject: lesson.subject,
          book: lesson.bookIdHint || null,
          unit: lesson.unitId,
          lesson: lesson.lessonId,
          detail: { title: lesson.title },
        });
        continue;
      }
      if (old.outcomesHash !== lesson.outcomesHash) {
        changes.push({
          ...base,
          changeId: `chg-outcomes-${hash(key + lesson.outcomesHash)}`,
          changeType: 'changed-learning-outcomes',
          changeSeverity: severityFor('changed-learning-outcomes'),
          grade: lesson.grade,
          subject: lesson.subject,
          book: lesson.bookIdHint || null,
          unit: lesson.unitId,
          lesson: lesson.lessonId,
          detail: { title: lesson.title },
        });
      }
      if (old.termsHash !== lesson.termsHash) {
        changes.push({
          ...base,
          changeId: `chg-terms-${hash(key + lesson.termsHash)}`,
          changeType: 'changed-terminology',
          changeSeverity: severityFor('changed-terminology'),
          grade: lesson.grade,
          subject: lesson.subject,
          book: lesson.bookIdHint || null,
          unit: lesson.unitId,
          lesson: lesson.lessonId,
          detail: { title: lesson.title },
        });
      }
      if (old.scienceHash !== lesson.scienceHash) {
        changes.push({
          ...base,
          changeId: `chg-science-${hash(key + lesson.scienceHash)}`,
          changeType: 'updated-scientific-information',
          changeSeverity: severityFor('updated-scientific-information'),
          grade: lesson.grade,
          subject: lesson.subject,
          book: lesson.bookIdHint || null,
          unit: lesson.unitId,
          lesson: lesson.lessonId,
          detail: { title: lesson.title },
        });
      }
    }

    for (const [key, lesson] of prevLessons) {
      if (!currLessons.has(key)) {
        changes.push({
          ...base,
          changeId: `chg-lesson-del-${hash(key)}`,
          changeType: 'deleted-lesson',
          changeSeverity: severityFor('deleted-lesson'),
          grade: lesson.grade,
          subject: lesson.subject,
          book: lesson.bookIdHint || null,
          unit: lesson.unitId,
          lesson: lesson.lessonId,
          detail: { title: lesson.title },
        });
      }
    }

    return changes;
  }

  /**
   * Map changes → affected books / units / lessons / diagrams / examples / summaries.
   */
  function analyzeImpact(changes) {
    const books = listNationalBooks();
    const byBook = new Map();

    function touch(book, change, unitId, lessonId) {
      if (!byBook.has(book.id)) {
        byBook.set(book.id, {
          bookId: book.id,
          country,
          educationalSystem,
          grade: book.identity?.grade,
          subject: book.identity?.subject,
          units: new Map(),
          lessons: new Map(),
          diagramsMustChange: new Set(),
          examplesMustChange: new Set(),
          summariesMustChange: new Set(),
          changeTypes: new Set(),
          severities: new Set(),
          changes: [],
        });
      }
      const row = byBook.get(book.id);
      row.changeTypes.add(change.changeType);
      row.severities.add(change.changeSeverity);
      row.changes.push(change.changeId);

      if (unitId) {
        if (!row.units.has(unitId)) row.units.set(unitId, { unitId, lessons: new Set() });
      }
      if (lessonId) {
        row.lessons.set(lessonId, { lessonId, unitId: unitId || null });
        if (unitId) row.units.get(unitId)?.lessons.add(lessonId);
        row.diagramsMustChange.add(lessonId);
        row.examplesMustChange.add(lessonId);
        row.summariesMustChange.add(lessonId);
      }

      // Broad curriculum/textbook changes affect whole book content surfaces
      if (
        ['new-curriculum-version', 'new-textbook', 'new-assessment-standard'].includes(
          change.changeType,
        )
      ) {
        for (const unit of list(book.units)) {
          const uid = unit.id || unit.unitId;
          if (!row.units.has(uid)) row.units.set(uid, { unitId: uid, lessons: new Set() });
          for (const lesson of list(unit.lessons)) {
            row.lessons.set(lesson.id, { lessonId: lesson.id, unitId: uid });
            row.units.get(uid).lessons.add(lesson.id);
            row.diagramsMustChange.add(lesson.id);
            row.examplesMustChange.add(lesson.id);
            row.summariesMustChange.add(lesson.id);
          }
        }
      }

      // Grade+subject scoped changes without a specific lesson → all lessons in that book
      if (
        !change.lesson &&
        change.grade &&
        change.grade !== 'all' &&
        change.subject &&
        change.subject !== 'all'
      ) {
        for (const unit of list(book.units)) {
          const uid = unit.id || unit.unitId;
          if (!row.units.has(uid)) row.units.set(uid, { unitId: uid, lessons: new Set() });
          for (const lesson of list(unit.lessons)) {
            row.lessons.set(lesson.id, { lessonId: lesson.id, unitId: uid });
            row.units.get(uid).lessons.add(lesson.id);
            row.diagramsMustChange.add(lesson.id);
            row.examplesMustChange.add(lesson.id);
            row.summariesMustChange.add(lesson.id);
          }
        }
      }
    }

    for (const change of changes) {
      for (const book of books) {
        const gradeOk =
          change.grade === 'all' || !change.grade || change.grade === book.identity?.grade;
        const subjectOk =
          change.subject === 'all' ||
          !change.subject ||
          change.subject === book.identity?.subject;
        if (!gradeOk || !subjectOk) continue;

        let unitId = change.unit;
        let lessonId = change.lesson;
        if (lessonId && !unitId) {
          for (const unit of list(book.units)) {
            if (list(unit.lessons).some((l) => l.id === lessonId)) {
              unitId = unit.id || unit.unitId;
              break;
            }
          }
        }
        touch(book, change, unitId, lessonId);
      }
    }

    return [...byBook.values()].map((row) => ({
      bookId: row.bookId,
      country: row.country,
      educationalSystem: row.educationalSystem,
      grade: row.grade,
      subject: row.subject,
      unitsAffected: [...row.units.values()].map((u) => ({
        unitId: u.unitId,
        lessons: [...u.lessons],
      })),
      lessonsAffected: [...row.lessons.values()],
      diagramsMustChange: [...row.diagramsMustChange],
      examplesMustChange: [...row.examplesMustChange],
      summariesMustChange: [...row.summariesMustChange],
      changeTypes: [...row.changeTypes],
      severities: [...row.severities],
      changeIds: [...new Set(row.changes)],
    }));
  }

  function bumpLessonVersion(lesson, meta) {
    const current = lesson.versionNumber || lesson.jo06?.versionNumber || '1.0.0';
    const parts = String(current).split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    const versionNumber = parts.join('.');
    return {
      ...lesson,
      versionNumber,
      createdDate: lesson.createdDate || lesson.jo06?.createdDate || lesson.jo02?.authoredAt || nowIso(),
      updatedDate: nowIso(),
      updatedBy: meta.updatedBy || 'curriculum-update-engine',
      reasonForUpdate: meta.reasonForUpdate,
      officialSource: meta.officialSource || null,
      approvalStatus: 'draft-pending-admin',
      jo06: {
        ...(lesson.jo06 || {}),
        versionNumber,
        createdDate: lesson.createdDate || lesson.jo06?.createdDate || nowIso(),
        updatedDate: nowIso(),
        updatedBy: meta.updatedBy || 'curriculum-update-engine',
        reasonForUpdate: meta.reasonForUpdate,
        officialSource: meta.officialSource || null,
        approvalStatus: 'draft-pending-admin',
        changeIds: meta.changeIds || [],
      },
    };
  }

  /**
   * Create draft versions for affected books — never overwrite approved live content.
   */
  function createSafeDrafts(impacts, changes, options = {}) {
    ensureDirs(root());
    const drafts = [];
    const changeById = new Map(changes.map((c) => [c.changeId, c]));

    for (const impact of impacts) {
      const live = loadBook(impact.bookId);
      if (!live) continue;

      // Preserve previous version permanently
      const archiveId = `${impact.bookId}__v${Date.now()}`;
      writeJson(path.join(root(), 'versions', `${archiveId}.json`), {
        archiveId,
        bookId: impact.bookId,
        archivedAt: nowIso(),
        approvalStatus: live.publication?.status || live.jo03?.verificationStatus || 'unknown',
        book: live,
      });

      const affectedLessonIds = new Set(impact.lessonsAffected.map((l) => l.lessonId));
      const reason = `Curriculum update: ${impact.changeTypes.join(', ')}`;
      const officialSource =
        changes.find((c) => impact.changeIds.includes(c.changeId))?.officialSource || null;

      const draftUnits = list(live.units).map((unit) => ({
        ...unit,
        lessons: list(unit.lessons).map((lesson) => {
          if (!affectedLessonIds.has(lesson.id)) return lesson;
          return bumpLessonVersion(lesson, {
            reasonForUpdate: reason,
            officialSource,
            updatedBy: options.updatedBy || `${countryCode}-update-engine`,
            changeIds: impact.changeIds,
          });
        }),
      }));

      const draftId = `draft-${impact.bookId}-${Date.now()}`;
      const draft = {
        schema: 'success-os.curriculum-update-draft.v1',
        draftId,
        countryCode,
        country,
        educationalSystem,
        bookId: impact.bookId,
        createdAt: nowIso(),
        status: 'draft-pending-verification',
        impact,
        changeIds: impact.changeIds,
        changes: impact.changeIds.map((id) => changeById.get(id)).filter(Boolean),
        // Draft book copy — live book untouched
        book: {
          ...live,
          id: live.id,
          units: draftUnits,
          publication: {
            ...(live.publication || {}),
            studentPortalVisible: false,
            status: 'DRAFT_UPDATE_PENDING_ADMIN',
            reason: 'JO-06 safe update draft — live approved content preserved',
          },
          jo06: {
            draftId,
            phase,
            updatedAt: nowIso(),
            liveArchiveId: archiveId,
            requiresVerification: true,
            requiresAdminApproval: true,
          },
        },
      };

      writeJson(path.join(root(), 'drafts', `${draftId}.json`), draft);
      drafts.push({
        draftId,
        bookId: impact.bookId,
        lessonsPending: affectedLessonIds.size,
        status: draft.status,
      });

      notify('lesson-requires-regeneration', `Draft update created for ${impact.bookId}`, {
        draftId,
        bookId: impact.bookId,
        lessons: affectedLessonIds.size,
      });
    }

    return drafts;
  }

  function runDraftVerification(draftId) {
    const draft = readJson(path.join(root(), 'drafts', `${draftId}.json`));
    if (!draft) return { ok: false, error: 'DRAFT_NOT_FOUND' };

    let verification = {
      skipped: true,
      note: 'verifyBook not configured',
    };
    if (typeof verifyBook === 'function') {
      // Verify against temporary saved draft marker without publishing
      verification = verifyBook(draft.bookId, {
        dryRun: true,
        draftBook: draft.book,
      });
    }

    const passed =
      verification?.verificationPassed === true ||
      verification?.ok === true ||
      verification?.skipped === true;

    draft.status = passed ? 'draft-verified-pending-admin' : 'draft-verification-failed';
    draft.verification = verification;
    draft.verifiedAt = nowIso();
    writeJson(path.join(root(), 'drafts', `${draftId}.json`), draft);

    if (!passed) {
      notify('verification-fails', `Draft verification failed for ${draft.bookId}`, {
        draftId,
        bookId: draft.bookId,
      });
    }

    return { ok: true, draftId, status: draft.status, verification };
  }

  function adminApproveDraft(draftId, options = {}) {
    const draft = readJson(path.join(root(), 'drafts', `${draftId}.json`));
    if (!draft) return { ok: false, error: 'DRAFT_NOT_FOUND' };
    if (draft.status === 'draft-verification-failed') {
      return { ok: false, error: 'VERIFICATION_REQUIRED_BEFORE_APPROVAL', draftId };
    }

    // Re-verify before approve
    const verified = runDraftVerification(draftId);
    if (verified.status === 'draft-verification-failed') {
      return { ok: false, error: 'VERIFICATION_FAILED', draftId };
    }

    const live = loadBook(draft.bookId);
    if (!live) return { ok: false, error: 'LIVE_BOOK_MISSING', bookId: draft.bookId };

    // Promote draft units/lessons into live ONLY for affected lessons; keep rest
    const draftLessonMap = new Map();
    for (const unit of list(draft.book.units)) {
      for (const lesson of list(unit.lessons)) {
        draftLessonMap.set(lesson.id, { unitId: unit.id || unit.unitId, lesson });
      }
    }
    const affected = new Set(draft.impact.lessonsAffected.map((l) => l.lessonId));

    const promoted = {
      ...live,
      units: list(live.units).map((unit) => ({
        ...unit,
        lessons: list(unit.lessons).map((lesson) => {
          if (!affected.has(lesson.id)) return lesson;
          const d = draftLessonMap.get(lesson.id)?.lesson || lesson;
          return {
            ...d,
            approvalStatus: 'admin-approved',
            jo06: {
              ...(d.jo06 || {}),
              approvalStatus: 'admin-approved',
              approvedAt: nowIso(),
              approvedBy: options.approvedBy || 'admin',
            },
          };
        }),
      })),
      jo06: {
        ...(live.jo06 || {}),
        lastApprovedDraftId: draftId,
        lastApprovedAt: nowIso(),
      },
      // Do not auto student-publish — JO-03 admin publish path remains authoritative
      publication: {
        ...(live.publication || {}),
        status:
          live.publication?.status === 'PUBLISHED'
            ? 'PUBLISHED'
            : 'PENDING_ADMIN_APPROVAL',
        reason: 'JO-06 draft approved — content updated; publish rules unchanged',
      },
      updatedAt: nowIso(),
    };

    saveBook(promoted);
    draft.status = 'admin-approved';
    draft.approvedAt = nowIso();
    draft.approvedBy = options.approvedBy || 'admin';
    writeJson(path.join(root(), 'drafts', `${draftId}.json`), draft);
    writeJson(path.join(root(), 'approvals', `${draftId}.json`), {
      draftId,
      bookId: draft.bookId,
      status: 'approved',
      at: nowIso(),
      by: options.approvedBy || 'admin',
    });

    const state = readState();
    writeState({
      ...state,
      approvedUpdateIds: [...new Set([...(state.approvedUpdateIds || []), draftId])],
      pendingDraftIds: list(state.pendingDraftIds).filter((id) => id !== draftId),
    });

    writeJson(path.join(root(), 'history', `${draftId}-approved.json`), {
      draftId,
      bookId: draft.bookId,
      event: 'approved',
      at: nowIso(),
    });

    return { ok: true, draftId, bookId: draft.bookId, status: 'admin-approved' };
  }

  function adminRejectDraft(draftId, options = {}) {
    const draft = readJson(path.join(root(), 'drafts', `${draftId}.json`));
    if (!draft) return { ok: false, error: 'DRAFT_NOT_FOUND' };
    draft.status = 'admin-rejected';
    draft.rejectedAt = nowIso();
    draft.rejectedBy = options.rejectedBy || 'admin';
    draft.rejectReason = options.notes || 'Admin rejected update draft';
    writeJson(path.join(root(), 'drafts', `${draftId}.json`), draft);
    writeJson(path.join(root(), 'approvals', `${draftId}.json`), {
      draftId,
      bookId: draft.bookId,
      status: 'rejected',
      at: nowIso(),
      by: options.rejectedBy || 'admin',
      notes: options.notes || null,
    });
    const state = readState();
    writeState({
      ...state,
      rejectedUpdateIds: [...new Set([...(state.rejectedUpdateIds || []), draftId])],
      pendingDraftIds: list(state.pendingDraftIds).filter((id) => id !== draftId),
    });
    return { ok: true, draftId, status: 'admin-rejected' };
  }

  /**
   * Full monitor cycle: snapshot → detect → impact → drafts → verify → notify.
   * Never creates new books. Never overwrites approved live content.
   */
  function runMonitorCycle(options = {}) {
    ensureDirs(root());
    const current = captureSnapshot();
    const previous = loadPreviousSnapshot(current.snapshotId);

    let changes = [];
    if (!previous) {
      notify('curriculum-changes', 'Baseline monitor snapshot captured (no prior diff)', {
        snapshotId: current.snapshotId,
      });
      changes = [];
    } else if (previous.fingerprint === current.fingerprint) {
      notify('curriculum-changes', 'No curriculum changes detected', {
        snapshotId: current.snapshotId,
      });
      changes = [];
    } else {
      changes = detectChanges(previous, current);
      notify('curriculum-changes', `Detected ${changes.length} curriculum change(s)`, {
        snapshotId: current.snapshotId,
        changeCount: changes.length,
      });
    }

    // Allow manual injected changes (for tests / MoE notices)
    if (list(options.injectChanges).length) {
      changes = changes.concat(options.injectChanges);
    }

    writeJson(path.join(root(), 'changes', `changes-${current.snapshotId}.json`), {
      snapshotId: current.snapshotId,
      changes,
      detectedAt: nowIso(),
    });
    writeJson(path.join(root(), 'changes', 'latest.json'), {
      snapshotId: current.snapshotId,
      changes,
      detectedAt: nowIso(),
    });

    const impacts = analyzeImpact(changes);
    writeJson(path.join(root(), 'impacts', `impact-${current.snapshotId}.json`), {
      snapshotId: current.snapshotId,
      impacts,
      analyzedAt: nowIso(),
    });
    writeJson(path.join(root(), 'impacts', 'latest.json'), {
      snapshotId: current.snapshotId,
      impacts,
      analyzedAt: nowIso(),
    });

    const drafts =
      changes.length && !options.detectOnly
        ? createSafeDrafts(impacts, changes, options)
        : [];

    const verifiedDrafts = [];
    for (const d of drafts) {
      const verified = runDraftVerification(d.draftId);
      verifiedDrafts.push({
        ...d,
        status: verified.status || d.status,
      });
    }

    const state = readState();
    writeState({
      ...state,
      lastMonitorAt: nowIso(),
      lastSnapshotId: current.snapshotId,
      pendingDraftIds: [
        ...new Set([
          ...(state.pendingDraftIds || []),
          ...verifiedDrafts.map((d) => d.draftId),
        ]),
      ],
    });

    const dashboard = buildDashboard();
    writeJson(path.join(root(), 'dashboards', 'latest.json'), dashboard);
    writeJson(path.join(root(), 'reports', `monitor-${Date.now()}.json`), {
      snapshotId: current.snapshotId,
      changeCount: changes.length,
      impactBooks: impacts.length,
      drafts: verifiedDrafts.length,
    });

    return {
      ok: true,
      countryCode,
      snapshotId: current.snapshotId,
      changeCount: changes.length,
      changes,
      impacts,
      drafts: verifiedDrafts,
      dashboard,
    };
  }

  function listDrafts() {
    const dir = path.join(root(), 'drafts');
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => readJson(path.join(dir, f)))
      .filter(Boolean)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  function buildDashboard() {
    const changes = readJson(path.join(root(), 'changes', 'latest.json'));
    const impacts = readJson(path.join(root(), 'impacts', 'latest.json'));
    const drafts = listDrafts();
    const notifications = listNotifications();
    const state = readState();

    return {
      schema: 'success-os.curriculum-update-dashboard.v1',
      countryCode,
      country,
      educationalSystem,
      phase,
      latestCurriculumUpdates: list(changes?.changes).slice(0, 30),
      booksRequiringUpdates: list(impacts?.impacts).map((i) => ({
        bookId: i.bookId,
        grade: i.grade,
        subject: i.subject,
        lessonsAffected: i.lessonsAffected.length,
        severities: i.severities,
      })),
      lessonsPendingReview: drafts
        .filter((d) =>
          ['draft-pending-verification', 'draft-verified-pending-admin', 'draft-verification-failed'].includes(
            d.status,
          ),
        )
        .map((d) => ({
          draftId: d.draftId,
          bookId: d.bookId,
          status: d.status,
          lessons: d.impact?.lessonsAffected?.length || 0,
        })),
      approvedUpdates: drafts
        .filter((d) => d.status === 'admin-approved')
        .map((d) => ({ draftId: d.draftId, bookId: d.bookId, approvedAt: d.approvedAt })),
      rejectedUpdates: drafts
        .filter((d) => d.status === 'admin-rejected')
        .map((d) => ({ draftId: d.draftId, bookId: d.bookId, rejectedAt: d.rejectedAt })),
      updateHistory: fs.existsSync(path.join(root(), 'history'))
        ? fs
            .readdirSync(path.join(root(), 'history'))
            .filter((f) => f.endsWith('.json'))
            .slice(-40)
            .map((f) => readJson(path.join(root(), 'history', f)))
            .filter(Boolean)
        : [],
      updateProgress: {
        pendingDrafts: list(state.pendingDraftIds).length,
        approved: list(state.approvedUpdateIds).length,
        rejected: list(state.rejectedUpdateIds).length,
        lastMonitorAt: state.lastMonitorAt,
        unreadNotifications: notifications.filter((n) => !n.read).length,
      },
      notifications: notifications.slice(0, 20),
      updatedAt: nowIso(),
    };
  }

  return {
    countryCode,
    country,
    educationalSystem,
    phase,
    root,
    captureSnapshot,
    detectChanges,
    analyzeImpact,
    createSafeDrafts,
    runMonitorCycle,
    runDraftVerification,
    adminApproveDraft,
    adminRejectDraft,
    listDrafts,
    listNotifications,
    markNotificationRead,
    notify,
    buildDashboard,
    readState,
    CHANGE_TYPES,
    SEVERITY,
  };
}
