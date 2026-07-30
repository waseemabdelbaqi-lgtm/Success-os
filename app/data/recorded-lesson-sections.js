/**
 * Recorded Lessons subject results layout (corrected taxonomy):
 *
 * Physics
 * ▶ S4S Intelligence ⭐ Recommended (when recommendation logic supports it)
 * ──────────────
 * Teacher Lessons
 */

import {
  lessonSourceLabel,
  matchesLessonSourceFilter,
  normalizeLessonSource,
} from './recorded-lesson-sources.js';

export const RECORDED_LESSON_RESULT_SECTIONS = Object.freeze([
  {
    id: 'S4S_INTELLIGENCE',
    lessonSource: 'S4S_INTELLIGENCE',
    title: 'S4S Intelligence',
    playPrefix: true,
    recommended: true,
    recommendedLabel: 'Recommended',
  },
  {
    id: 'TEACHER_RECORDED',
    lessonSource: 'TEACHER_RECORDED',
    title: 'Teacher Lessons',
    playPrefix: false,
    recommended: false,
  },
]);

export function subjectDisplayTitle(subject) {
  const s = String(subject || '').trim();
  if (!s || s.toLowerCase() === 'all') return 'All Subjects';
  return s;
}

/**
 * Group catalog items into Lesson Source result sections.
 * When lessonSource filter is a concrete source, only that section is active.
 */
export function groupRecordedLessonsBySource(items = [], options = {}) {
  const subject = options.subject && options.subject !== 'all' ? options.subject : null;
  const sourceFilter = normalizeLessonSource(options.lessonSource || 'ALL') || 'ALL';
  const rows = (Array.isArray(items) ? items : []).filter((row) => {
    if (subject) {
      const rowSubject = String(row.subject || row.subjectId || '').trim();
      if (rowSubject.toLowerCase() !== String(subject).toLowerCase()) return false;
    }
    return matchesLessonSourceFilter(
      row.source_type || row.lessonSource || row.sourceType,
      sourceFilter === 'ALL' ? 'ALL' : sourceFilter,
    );
  });

  const sections = RECORDED_LESSON_RESULT_SECTIONS.map((section) => {
    if (sourceFilter !== 'ALL' && sourceFilter !== section.lessonSource) {
      return {
        ...section,
        visible: false,
        items: [],
        count: 0,
      };
    }
    const sectionItems = rows.filter(
      (row) =>
        normalizeLessonSource(row.source_type || row.lessonSource || row.sourceType) ===
        section.lessonSource,
    );
    return {
      ...section,
      visible: sourceFilter === 'ALL' || sourceFilter === section.lessonSource,
      label: section.title || lessonSourceLabel(section.lessonSource),
      items: sectionItems,
      count: sectionItems.length,
    };
  });

  return {
    subject: subjectDisplayTitle(subject || options.subjectLabel || 'All Subjects'),
    subjectKey: subject || 'all',
    sections,
    total: rows.length,
    layout: ['S4S_INTELLIGENCE', 'divider', 'TEACHER_RECORDED'],
  };
}
