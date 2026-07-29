#!/usr/bin/env node
/**
 * Marketplace journey tests (Playwright-equivalent logical flows).
 * Full browser Playwright can be layered when @playwright/test is available.
 */
import assert from 'node:assert/strict';
import { memReset } from '../../app/lib/marketplace/in-memory-store.js';
import { createTeacherCourse, submitTeacherCourseForReview } from '../../app/lib/marketplace/teacher-courses.js';
import { transitionCourseStatus } from '../../app/lib/marketplace/admin-review.js';
import { purchaseRecordedCourse } from '../../app/lib/marketplace/checkout.js';
import { listPublishedCourses } from '../../app/lib/marketplace/catalog.js';
import {
  createS4sCourseProductionJob,
  advanceS4sCourseProductionJob,
  S4S_INTELLIGENCE_COURSE_PRODUCTION,
} from '../../enterprise-ai/src/pipelines/s4s-intelligence-course-production.js';
import { parseRecordedLessonFilters, teacherGenderFilterVisible } from '../../app/data/recorded-lesson-filters.js';
import { mem } from '../../app/lib/marketplace/in-memory-store.js';

memReset();

// Seed S4S published course
const now = new Date().toISOString();
mem().courses.push({
  id: 's4s-1',
  owner_type: 'PLATFORM',
  teacher_id: null,
  source_type: 'S4S_INTELLIGENCE',
  title: 'S4S Physics Circuits',
  description: 'Official AI course',
  country: 'Jordan',
  curriculum: 'MoE',
  grade_level: '11',
  subject: 'Physics',
  language: 'ar',
  price: 0,
  currency: 'USD',
  publication_status: 'PUBLISHED',
  rating_average: null,
  rating_count: 0,
  enrolment_count: 0,
  total_lessons: 8,
  total_duration_minutes: 120,
  preview_enabled: true,
  recommended: true,
  created_at: now,
  updated_at: now,
  published_at: now,
});

// Student: Subject → Recorded Lessons → S4S Intelligence → Preview
const s4sCatalog = await listPublishedCourses({
  subject: 'Physics',
  lessonSource: 'S4S_INTELLIGENCE',
});
assert.ok(s4sCatalog.items.some((c) => c.id === 's4s-1'));
assert.equal(s4sCatalog.items[0].preview_enabled || s4sCatalog.items[0].previewEnabled, true);

// Student: Teachers → Gender Filter visible only then
const allFilters = parseRecordedLessonFilters({ lessonSource: 'ALL' });
assert.equal(teacherGenderFilterVisible(allFilters), false);
const teacherFilters = parseRecordedLessonFilters({
  lessonSource: 'TEACHER_RECORDED',
  teacherGender: 'female',
});
assert.equal(teacherGenderFilterVisible(teacherFilters), true);
assert.equal(teacherFilters.teacherGender, 'female');

// Teacher create → price → 30% → submit
const teacherId = 'flow-teacher';
const created = await createTeacherCourse(teacherId, {
  title: 'Teacher Algebra',
  price: 50,
  subject: 'Math',
  teacherGender: 'female',
  country: 'Jordan',
  curriculum: 'MoE',
  grade: '10',
  language: 'en',
  copyrightDeclarationAccepted: true,
});
assert.equal(created.pricingPreview.platformCommissionPercentage, 30);
const submitted = await submitTeacherCourseForReview(teacherId, created.course.id, {
  copyrightDeclarationAccepted: true,
});
assert.equal(submitted.ok, true);

// Admin review → approve → publish manually
await transitionCourseStatus({
  courseId: created.course.id,
  actorId: 'admin-flow',
  actorRole: 'master-admin',
  toStatus: 'UNDER_REVIEW',
});
await transitionCourseStatus({
  courseId: created.course.id,
  actorId: 'admin-flow',
  actorRole: 'master-admin',
  toStatus: 'APPROVED',
});
const published = await transitionCourseStatus({
  courseId: created.course.id,
  actorId: 'admin-flow',
  actorRole: 'master-admin',
  toStatus: 'PUBLISHED',
});
assert.equal(published.course.publication_status, 'PUBLISHED');

// Student teachers filter → gender → checkout → enrolment → dashboard pointer
const teacherCatalog = await listPublishedCourses({
  lessonSource: 'TEACHER_RECORDED',
  teacherGender: 'female',
});
assert.ok(teacherCatalog.items.some((c) => c.id === created.course.id));

const purchase = await purchaseRecordedCourse({
  studentId: 'flow-student',
  courseId: created.course.id,
});
assert.equal(purchase.ok, true);
assert.equal(purchase.enrolment.status, 'ACTIVE');
assert.equal(purchase.paymentMode, 'TEST_MODE');
assert.equal(purchase.livePayments, false);

// AIOS S4S production — human gates, no auto publish
let job = createS4sCourseProductionJob({ requestedBy: 'admin-flow' });
assert.equal(job.task_type, S4S_INTELLIGENCE_COURSE_PRODUCTION);
assert.equal(job.auto_publish, false);
assert.equal(job.vercel_auto_deploy, false);

// Advance until media gate (without media approval)
for (let i = 0; i < 10; i++) {
  const step = advanceS4sCourseProductionJob(job);
  job = step.job;
  if (step.gate === 'MEDIA_APPROVAL_REQUIRED') break;
}
assert.equal(job.media_status, 'AWAITING_APPROVAL');

// Continue with media + human approvals until manual publication gate
let final = { job, gate: null };
for (let i = 0; i < 15; i++) {
  final = advanceS4sCourseProductionJob(job, { approveMedia: true, approvePublish: true });
  job = final.job;
  if (final.gate === 'MANUAL_PUBLICATION_REQUIRED') break;
}
assert.equal(final.gate, 'MANUAL_PUBLICATION_REQUIRED');
assert.equal(final.job.status, 'APPROVED_CATALOGUE_DRAFT');
assert.equal(final.job.publication_readiness, 'READY_FOR_MANUAL_PUBLISH');
assert.equal(final.job.auto_publish, false);

console.log(
  JSON.stringify(
    {
      ok: true,
      suite: 'marketplace-playwright-flows',
      flows: [
        'student-s4s-preview',
        'student-teacher-gender-checkout-enrol',
        'teacher-create-submit-30pct',
        'admin-approve-publish-manual',
        'aios-s4s-human-gates',
      ],
    },
    null,
    2,
  ),
);
