/**
 * Recorded Lessons subject results layout:
 *
 * 📚 Physics
 * ▶ S4S Intelligence ⭐ Recommended
 * ──────────────
 * Teacher Lessons
 * ──────────────
 * Female Teacher Lessons
 */

import {
  lessonSourceLabel,
  matchesLessonSourceFilter,
  normalizeLessonSource,
} from './recorded-lesson-sources.js';

export const RECORDED_LESSON_RESULT_SECTIONS = Object.freeze([
  {
    id: 's4s_intelligence',
    lessonSource: 's4s_intelligence',
    title: 'S4S Intelligence',
    playPrefix: true,
    recommended: true,
    recommendedLabel: 'Recommended',
  },
  {
    id: 'teacher',
    lessonSource: 'teacher',
    title: 'Teacher Lessons',
    playPrefix: false,
    recommended: false,
  },
  {
    id: 'female_teacher',
    lessonSource: 'female_teacher',
    title: 'Female Teacher Lessons',
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
 * Group catalog items into the three Lesson Source result sections.
 * When lessonSource filter is a concrete source, only that section is active.
 */
export function groupRecordedLessonsBySource(items = [], options = {}) {
  const subject = options.subject && options.subject !== 'all' ? options.subject : null;
  const sourceFilter = normalizeLessonSource(options.lessonSource || 'all') || 'all';
  const rows = (Array.isArray(items) ? items : []).filter((row) => {
    if (subject) {
      const rowSubject = String(row.subject || row.subjectId || '').trim();
      if (rowSubject.toLowerCase() !== String(subject).toLowerCase()) return false;
    }
    return matchesLessonSourceFilter(row.lessonSource, sourceFilter === 'all' ? 'all' : sourceFilter);
  });

  const sections = RECORDED_LESSON_RESULT_SECTIONS.map((section) => {
    if (sourceFilter !== 'all' && sourceFilter !== section.lessonSource) {
      return {
        ...section,
        visible: false,
        items: [],
        count: 0,
      };
    }
    const sectionItems = rows.filter(
      (row) => normalizeLessonSource(row.lessonSource) === section.lessonSource,
    );
    return {
      ...section,
      visible: sourceFilter === 'all' || sourceFilter === section.lessonSource,
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
    layout: ['s4s_intelligence', 'divider', 'teacher', 'divider', 'female_teacher'],
  };
}
