#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  RECORDED_LESSON_SOURCES,
  normalizeLessonSource,
  matchesLessonSourceFilter,
  lessonSourceLabel,
} from '../app/data/recorded-lesson-sources.js';
import {
  applyRecordedLessonCatalog,
  RECORDED_LESSON_FILTER_STEPS,
  teacherGenderFilterVisible,
} from '../app/data/recorded-lesson-filters.js';

assert.equal(
  RECORDED_LESSON_SOURCES.map((s) => s.id).join('|'),
  'ALL|S4S_INTELLIGENCE|TEACHER_RECORDED',
);
assert.ok(!RECORDED_LESSON_SOURCES.some((s) => /female/i.test(s.id)));
assert.equal(normalizeLessonSource('Female Teacher'), 'TEACHER_RECORDED');
assert.equal(lessonSourceLabel('TEACHER_RECORDED'), 'Teachers');
assert.equal(matchesLessonSourceFilter('TEACHER_RECORDED', 'ALL'), true);
assert.equal(teacherGenderFilterVisible({ lessonSource: 'TEACHER_RECORDED' }), true);
assert.equal(teacherGenderFilterVisible({ lessonSource: 'S4S_INTELLIGENCE' }), false);
assert.ok(RECORDED_LESSON_FILTER_STEPS.some((s) => s.key === 'teacherGender' && s.conditionalOn === 'TEACHER_RECORDED'));

const byPop = applyRecordedLessonCatalog(
  [
    { title: 'a', popularity: 1, publishedAt: '2020-01-01', lessonSource: 'TEACHER_RECORDED' },
    { title: 'b', popularity: 9, publishedAt: '2019-01-01', lessonSource: 'S4S_INTELLIGENCE' },
  ],
  { sort: 'popularity' },
);
assert.equal(byPop.items[0].title, 'b');

console.log(
  JSON.stringify(
    {
      ok: true,
      lessonSources: RECORDED_LESSON_SOURCES.map((s) => s.id),
      filterSteps: RECORDED_LESSON_FILTER_STEPS.map((s) => s.label),
    },
    null,
    2,
  ),
);
