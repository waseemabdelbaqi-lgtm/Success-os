#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  groupRecordedLessonsBySource,
  RECORDED_LESSON_RESULT_SECTIONS,
} from '../app/data/recorded-lesson-sections.js';
import { listModuleItems, mutateModule } from '../app/lib/admin/enterprise-admin-engine.js';

assert.deepEqual(
  RECORDED_LESSON_RESULT_SECTIONS.map((s) => s.title),
  ['S4S Intelligence', 'Teacher Lessons', 'Female Teacher Lessons'],
);
assert.equal(RECORDED_LESSON_RESULT_SECTIONS[0].recommended, true);

const samples = [
  {
    title: 'Forces Intro',
    subject: 'Physics',
    lessonSource: 's4s_intelligence',
    grade: 'Grade 11',
    language: 'ar',
    status: 'published',
    durationMinutes: 18,
  },
  {
    title: 'Optics with Ahmad',
    subject: 'Physics',
    lessonSource: 'teacher',
    teacherName: 'Ahmad',
    grade: 'Grade 11',
    language: 'ar',
    status: 'published',
    durationMinutes: 30,
  },
  {
    title: 'Circuits with Sara',
    subject: 'Physics',
    lessonSource: 'female_teacher',
    teacherName: 'Sara',
    teacherGender: 'female',
    grade: 'Grade 11',
    language: 'en',
    status: 'published',
    durationMinutes: 25,
  },
  {
    title: 'Algebra Basics',
    subject: 'Math',
    lessonSource: 's4s_intelligence',
    status: 'published',
  },
];

for (const sample of samples) {
  const r = mutateModule('recorded-lessons', 'add', sample);
  assert.equal(r.ok, true, r.error);
}

const grouped = groupRecordedLessonsBySource(
  samples.map((s, i) => ({ ...s, id: `id-${i}` })),
  { subject: 'Physics', lessonSource: 'all' },
);

assert.equal(grouped.subject, 'Physics');
assert.equal(grouped.sections[0].title, 'S4S Intelligence');
assert.equal(grouped.sections[0].recommended, true);
assert.equal(grouped.sections[0].count, 1);
assert.equal(grouped.sections[1].title, 'Teacher Lessons');
assert.equal(grouped.sections[1].count, 1);
assert.equal(grouped.sections[2].title, 'Female Teacher Lessons');
assert.equal(grouped.sections[2].count, 1);
assert.equal(grouped.total, 3);

const api = listModuleItems('recorded-lessons', {
  subject: 'Physics',
  lessonSource: 'all',
  sort: 'newest',
});
assert.ok(api.grouped);
assert.equal(api.grouped.subject, 'Physics');
assert.ok(api.grouped.sections.some((s) => s.recommended && s.title === 'S4S Intelligence'));

console.log(
  JSON.stringify(
    {
      ok: true,
      layout: ['📚 Physics', '▶ S4S Intelligence ⭐ Recommended', '──────────────', 'Teacher Lessons', '──────────────', 'Female Teacher Lessons'],
      physicsCounts: api.grouped.sections.map((s) => ({ title: s.title, count: s.count, recommended: !!s.recommended })),
    },
    null,
    2,
  ),
);
