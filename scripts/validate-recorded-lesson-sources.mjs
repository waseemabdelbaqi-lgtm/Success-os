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
} from '../app/data/recorded-lesson-filters.js';
import { listModuleItems, mutateModule } from '../app/lib/admin/enterprise-admin-engine.js';

assert.equal(RECORDED_LESSON_SOURCES.map((s) => s.label).join('|'), 'S4S Intelligence|Teacher|Female Teacher|All');
assert.deepEqual(
  RECORDED_LESSON_FILTER_STEPS.map((s) => s.label),
  [
    'Country',
    'Curriculum',
    'Grade',
    'Subject',
    'Teacher Gender',
    'Language',
    'Price',
    'Rating',
    'Duration',
    'Sort',
    'Results',
  ],
);

assert.equal(normalizeLessonSource('Female Teacher'), 'female_teacher');
assert.equal(lessonSourceLabel('teacher'), 'Teacher');
assert.equal(matchesLessonSourceFilter('teacher', 'all'), true);

const samples = [
  {
    title: 'AI Circuit Lesson',
    country: 'Jordan',
    curriculum: 'MoE',
    grade: 'Grade 11',
    subject: 'Physics',
    teacherGender: 'male',
    language: 'ar',
    lessonSource: 's4s_intelligence',
    price: 0,
    rating: 4.6,
    durationMinutes: 20,
    popularity: 10,
    status: 'published',
  },
  {
    title: 'Teacher Optics',
    country: 'Jordan',
    curriculum: 'MoE',
    grade: 'Grade 11',
    subject: 'Physics',
    teacherGender: 'male',
    language: 'ar',
    lessonSource: 'teacher',
    teacherName: 'Ahmad',
    price: 15,
    rating: 4.2,
    durationMinutes: 35,
    popularity: 40,
    status: 'published',
  },
  {
    title: 'Female Teacher Algebra',
    country: 'UAE',
    curriculum: 'British',
    grade: 'Year 10',
    subject: 'Math',
    teacherGender: 'female',
    language: 'en',
    lessonSource: 'female_teacher',
    teacherName: 'Sara',
    price: 25,
    rating: 4.8,
    durationMinutes: 45,
    popularity: 80,
    status: 'published',
  },
];

for (const sample of samples) {
  const r = mutateModule('recorded-lessons', 'add', sample);
  assert.equal(r.ok, true, r.error);
}

const missing = mutateModule('recorded-lessons', 'add', { title: 'No source' });
assert.equal(missing.ok, false);

const jordanPhysics = listModuleItems('recorded-lessons', {
  country: 'Jordan',
  subject: 'Physics',
  sort: 'newest',
});
assert.ok(jordanPhysics.total >= 2);
assert.ok(jordanPhysics.facets?.countries?.some((c) => c.id === 'Jordan' || c.label === 'Jordan'));

const femaleOnly = listModuleItems('recorded-lessons', {
  teacherGender: 'female',
  sort: 'popularity',
});
assert.ok(femaleOnly.items.every((i) => i.teacherGender === 'female'));

const byPop = applyRecordedLessonCatalog(
  [
    { title: 'a', popularity: 1, publishedAt: '2020-01-01' },
    { title: 'b', popularity: 9, publishedAt: '2019-01-01' },
  ],
  { sort: 'popularity' },
);
assert.equal(byPop.items[0].title, 'b');

console.log(
  JSON.stringify(
    {
      ok: true,
      filterSteps: RECORDED_LESSON_FILTER_STEPS.map((s) => s.label),
      lessonSources: RECORDED_LESSON_SOURCES.map((s) => s.label),
      sampleTotals: {
        jordanPhysics: jordanPhysics.total,
        femaleOnly: femaleOnly.total,
        all: listModuleItems('recorded-lessons', { lessonSource: 'all' }).total,
      },
    },
    null,
    2,
  ),
);
