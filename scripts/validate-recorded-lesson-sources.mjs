#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  RECORDED_LESSON_SOURCES,
  normalizeLessonSource,
  matchesLessonSourceFilter,
  lessonSourceLabel,
} from '../app/data/recorded-lesson-sources.js';
import { listModuleItems, mutateModule } from '../app/lib/admin/enterprise-admin-engine.js';

assert.equal(RECORDED_LESSON_SOURCES.map((s) => s.label).join('|'), 'S4S Intelligence|Teacher|Female Teacher|All');
assert.equal(normalizeLessonSource('all'), 'all');
assert.equal(normalizeLessonSource('S4S Intelligence'), 's4s_intelligence');
assert.equal(normalizeLessonSource('Female Teacher'), 'female_teacher');
assert.equal(lessonSourceLabel('teacher'), 'Teacher');
assert.equal(matchesLessonSourceFilter('teacher', 'all'), true);
assert.equal(matchesLessonSourceFilter('teacher', 'teacher'), true);
assert.equal(matchesLessonSourceFilter('s4s_intelligence', 'teacher'), false);

const a = mutateModule('recorded-lessons', 'add', {
  title: 'AI Circuit Lesson',
  subject: 'Physics',
  grade: 'AS',
  lessonSource: 's4s_intelligence',
  status: 'draft',
  durationMinutes: 20,
});
assert.equal(a.ok, true, a.error);

const b = mutateModule('recorded-lessons', 'add', {
  title: 'Teacher Optics',
  subject: 'Physics',
  lessonSource: 'teacher',
  teacherName: 'Ahmad',
  status: 'published',
});
assert.equal(b.ok, true, b.error);

const c = mutateModule('recorded-lessons', 'add', {
  title: 'Female Teacher Algebra',
  subject: 'Math',
  lessonSource: 'female_teacher',
  teacherName: 'Sara',
  status: 'published',
});
assert.equal(c.ok, true, c.error);

const missing = mutateModule('recorded-lessons', 'add', { title: 'No source' });
assert.equal(missing.ok, false);
assert.equal(missing.error, 'LESSON_SOURCE_REQUIRED');

const all = listModuleItems('recorded-lessons', { lessonSource: 'all' });
assert.ok(all.total >= 3);
assert.ok(all.schema.filters?.lessonSource);

const onlyIntel = listModuleItems('recorded-lessons', { lessonSource: 's4s_intelligence' });
assert.ok(onlyIntel.items.every((i) => i.lessonSource === 's4s_intelligence'));
assert.ok(onlyIntel.items.some((i) => i.lessonSourceLabel === 'S4S Intelligence'));

const onlyFemale = listModuleItems('recorded-lessons', { lessonSource: 'female_teacher' });
assert.ok(onlyFemale.items.every((i) => i.lessonSource === 'female_teacher'));

console.log(
  JSON.stringify(
    {
      ok: true,
      sources: RECORDED_LESSON_SOURCES.map((s) => s.label),
      totals: {
        all: all.total,
        s4s_intelligence: onlyIntel.total,
        female_teacher: onlyFemale.total,
      },
    },
    null,
    2,
  ),
);
