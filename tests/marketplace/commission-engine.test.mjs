#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  resolveMarketplaceCommission,
  buildFinancialSnapshot,
  CALCULATION_VERSION,
  DEFAULT_TEACHER_COMMISSION_PERCENT,
} from '../../app/lib/marketplace/commission-engine.js';
import { calculateTeacherPriceSplit } from '../../app/lib/admin/teacher-price-split.js';
import { resolveCommissionCascade } from '../../app/lib/admin/commission-cascade.js';
import { attemptMutateSnapshot, purchaseRecordedCourse } from '../../app/lib/marketplace/checkout.js';
import { mem, memReset } from '../../app/lib/marketplace/in-memory-store.js';
import {
  createTeacherCourse,
  submitTeacherCourseForReview,
  previewTeacherPricing,
} from '../../app/lib/marketplace/teacher-courses.js';
import {
  transitionCourseStatus,
  upsertCommissionRule,
  allowedPublicationTransitions,
} from '../../app/lib/marketplace/admin-review.js';
import {
  normalizeLessonSource,
  RECORDED_LESSON_SOURCE_IDS,
} from '../../app/data/recorded-lesson-sources.js';
import { teacherGenderFilterVisible, parseRecordedLessonFilters } from '../../app/data/recorded-lesson-filters.js';

memReset();

// Taxonomy
assert.deepEqual(RECORDED_LESSON_SOURCE_IDS, ['ALL', 'S4S_INTELLIGENCE', 'TEACHER_RECORDED']);
assert.equal(normalizeLessonSource('female_teacher'), 'TEACHER_RECORDED');
assert.equal(normalizeLessonSource('teacher'), 'TEACHER_RECORDED');
assert.equal(normalizeLessonSource('s4s_intelligence'), 'S4S_INTELLIGENCE');
assert.equal(teacherGenderFilterVisible({ lessonSource: 'ALL' }), false);
assert.equal(teacherGenderFilterVisible({ lessonSource: 'TEACHER_RECORDED' }), true);
assert.equal(parseRecordedLessonFilters({ lessonSource: 'ALL', teacherGender: 'female' }).teacherGender, 'all');

// 30% default commission
assert.equal(DEFAULT_TEACHER_COMMISSION_PERCENT, 30);
const split = calculateTeacherPriceSplit({ teacherPrice: 50, commissionPercent: 30 });
assert.equal(split.teacherReceives, 35);
assert.equal(split.successOs, 15);

const defaultRes = resolveMarketplaceCommission({
  originalPrice: 50,
  sourceType: 'TEACHER_RECORDED',
});
assert.equal(defaultRes.effectiveCommissionPercentage, 30);
assert.equal(defaultRes.platformCommissionAmount, 15);
assert.equal(defaultRes.teacherGrossShare, 35);

// S4S platform-owned
const s4s = resolveMarketplaceCommission({
  originalPrice: 40,
  sourceType: 'S4S_INTELLIGENCE',
});
assert.equal(s4s.effectiveCommissionPercentage, 100);
assert.equal(s4s.teacherGrossShare, 0);
assert.equal(s4s.platformCommissionAmount, 40);

// Override priority: campaign > course > teacher > partner > source > global
const rules = [
  { id: 'g', scope: 'global', percentage: 30, priority: 0, status: 'ACTIVE' },
  {
    id: 'src',
    scope: 'lesson_source',
    source_type: 'TEACHER_RECORDED',
    percentage: 28,
    priority: 1,
    status: 'ACTIVE',
  },
  {
    id: 'pt',
    scope: 'partner_type',
    partner_type: 'teacher',
    percentage: 25,
    priority: 1,
    status: 'ACTIVE',
  },
  {
    id: 't',
    scope: 'teacher_override',
    teacher_id: 'T1',
    percentage: 20,
    priority: 1,
    status: 'ACTIVE',
  },
  {
    id: 'c',
    scope: 'course_override',
    course_id: 'C1',
    percentage: 15,
    priority: 1,
    status: 'ACTIVE',
  },
  {
    id: 'camp',
    scope: 'special_campaign',
    campaign_id: 'CAMP1',
    percentage: 10,
    priority: 1,
    status: 'ACTIVE',
  },
];

const campWin = resolveMarketplaceCommission({
  originalPrice: 100,
  sourceType: 'TEACHER_RECORDED',
  teacherId: 'T1',
  courseId: 'C1',
  campaignId: 'CAMP1',
  partnerType: 'teacher',
  rules,
});
assert.equal(campWin.effectiveCommissionPercentage, 10);
assert.equal(campWin.appliedRule.scope, 'special_campaign');

const courseWin = resolveMarketplaceCommission({
  originalPrice: 100,
  sourceType: 'TEACHER_RECORDED',
  teacherId: 'T1',
  courseId: 'C1',
  partnerType: 'teacher',
  rules,
});
assert.equal(courseWin.effectiveCommissionPercentage, 15);

// Promotion calculation
const promo = resolveMarketplaceCommission({
  originalPrice: 50,
  discountAmount: 10,
  sourceType: 'TEACHER_RECORDED',
});
assert.equal(promo.paidAmount, 40);
assert.equal(promo.platformCommissionAmount, 12);
assert.equal(promo.teacherGrossShare, 28);

// Refund calculation
const refund = resolveMarketplaceCommission({
  originalPrice: 50,
  sourceType: 'TEACHER_RECORDED',
  refundAmount: 10,
});
assert.equal(refund.refundAmount, 10);
assert.equal(refund.teacherFinalPayable, 25); // 35 - 10

// Cascade resolution log
const cascade = resolveCommissionCascade({
  globalCommissionPercent: 30,
  rules,
  context: { teacherId: 'T1', courseId: 'C1', campaignId: 'CAMP1', partnerType: 'teacher', sourceType: 'TEACHER_RECORDED' },
  teacherPrice: 100,
});
assert.equal(cascade.winnerLayer, 'special_campaign');
assert.ok(cascade.resolutionLog);

// Immutable snapshot + purchase flow
memReset();
const teacherId = 'teacher-1';
const studentId = 'student-1';
const created = await createTeacherCourse(teacherId, {
  title: 'Optics',
  price: 50,
  subject: 'Physics',
  curriculum: 'MoE',
  grade: '11',
  language: 'ar',
  copyrightDeclarationAccepted: true,
});
assert.equal(created.ok, true);
assert.equal(created.pricingPreview.platformCommissionPercentage, 30);
assert.equal(created.pricingPreview.commissionEditableByTeacher, false);

const submitted = await submitTeacherCourseForReview(teacherId, created.course.id, {
  copyrightDeclarationAccepted: true,
});
assert.equal(submitted.ok, true);

// Teacher cannot approve own course
const selfApprove = await transitionCourseStatus({
  courseId: created.course.id,
  actorId: teacherId,
  actorRole: 'master-admin',
  toStatus: 'APPROVED',
});
assert.equal(selfApprove.ok, false);
assert.equal(selfApprove.error, 'TEACHER_CANNOT_APPROVE_OWN_COURSE');

const approved = await transitionCourseStatus({
  courseId: created.course.id,
  actorId: 'admin-1',
  actorRole: 'master-admin',
  toStatus: 'UNDER_REVIEW',
});
assert.equal(approved.ok, true);
const approved2 = await transitionCourseStatus({
  courseId: created.course.id,
  actorId: 'admin-1',
  actorRole: 'master-admin',
  toStatus: 'APPROVED',
});
assert.equal(approved2.ok, true);
const published = await transitionCourseStatus({
  courseId: created.course.id,
  actorId: 'admin-1',
  actorRole: 'master-admin',
  toStatus: 'PUBLISHED',
});
assert.equal(published.ok, true);

const purchase = await purchaseRecordedCourse({
  studentId,
  courseId: created.course.id,
  clientPrice: 0.01, // must be ignored
});
assert.equal(purchase.ok, true);
assert.equal(purchase.purchase.paid_amount, 50);
assert.equal(purchase.snapshot.effective_commission_percentage, 30);
assert.equal(purchase.snapshot.calculation_version, CALCULATION_VERSION);
assert.ok(Object.isFrozen(purchase.snapshot) || attemptMutateSnapshot(purchase.snapshot.id, { paid_amount: 1 }).error === 'SNAPSHOT_IMMUTABLE');

const dup = await purchaseRecordedCourse({
  studentId,
  courseId: created.course.id,
});
assert.equal(dup.ok, false);
assert.equal(dup.error, 'DUPLICATE_ACTIVE_ENROLMENT');

// Publication transitions
assert.ok(allowedPublicationTransitions('APPROVED').includes('PUBLISHED'));
assert.ok(!allowedPublicationTransitions('DRAFT').includes('PUBLISHED'));

// Commission audit
const ruleUp = await upsertCommissionRule({
  actorId: 'finance-1',
  actorRole: 'finance-admin',
  reason: 'Campaign adjustment',
  rule: {
    scope: 'special_campaign',
    campaignId: 'SPRING',
    percentage: 12,
    priority: 5,
  },
});
assert.equal(ruleUp.ok, true);
assert.equal(ruleUp.audit.reason, 'Campaign adjustment');

const teacherPreview = await previewTeacherPricing(50, 'USD', teacherId);
assert.equal(teacherPreview.platformCommissionPercentage, 30);

console.log(
  JSON.stringify(
    {
      ok: true,
      suite: 'marketplace-commission-engine',
      defaults: { teacherCommission: 30, teacherShareExample: '35/15 on 50' },
      taxonomy: RECORDED_LESSON_SOURCE_IDS,
    },
    null,
    2,
  ),
);
