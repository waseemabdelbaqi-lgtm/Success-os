#!/usr/bin/env node
import assert from 'node:assert/strict';
import { memReset } from '../../app/lib/marketplace/in-memory-store.js';
import {
  createTeacherCourse,
  updateTeacherCourse,
  submitTeacherCourseForReview,
} from '../../app/lib/marketplace/teacher-courses.js';
import { purchaseRecordedCourse } from '../../app/lib/marketplace/checkout.js';
import {
  transitionCourseStatus,
  upsertCommissionRule,
} from '../../app/lib/marketplace/admin-review.js';
import { assertNoServiceRoleInPublicEnv } from '../../app/lib/marketplace/supabase-server.js';
import fs from 'node:fs';
import path from 'node:path';

memReset();

// Service role must not be in NEXT_PUBLIC_* 
delete process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
delete process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;
assert.equal(assertNoServiceRoleInPublicEnv(), true);

process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = 'leak';
assert.throws(() => assertNoServiceRoleInPublicEnv(), /SERVICE_ROLE_EXPOSED/);
delete process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const teacherId = 'sec-teacher';
const studentId = 'sec-student';
const created = await createTeacherCourse(teacherId, {
  title: 'Secure Course',
  price: 80,
  copyrightDeclarationAccepted: true,
});
assert.equal(created.ok, true);

// Teacher cannot edit commission via update patch
const updated = await updateTeacherCourse(teacherId, created.course.id, {
  price: 90,
  commissionPercent: 1,
  effectiveCommissionPercentage: 1,
});
assert.equal(updated.ok, true);
assert.equal(updated.course.price, 90);
assert.equal(updated.pricingPreview.platformCommissionPercentage, 15);
assert.equal(updated.pricingPreview.teacherEstimatedGrossShare, Number((90 * 0.85).toFixed(2)));

// Teacher cannot approve own course
await submitTeacherCourseForReview(teacherId, created.course.id, {
  copyrightDeclarationAccepted: true,
});
const selfPub = await transitionCourseStatus({
  courseId: created.course.id,
  actorId: teacherId,
  actorRole: 'teacher',
  toStatus: 'PUBLISHED',
});
assert.equal(selfPub.ok, false);

// Unauthorised users cannot manage commission / payouts
const unauthRule = await upsertCommissionRule({
  actorId: studentId,
  actorRole: 'student',
  reason: 'hack',
  rule: { scope: 'global', percentage: 1 },
});
assert.equal(unauthRule.ok, false);
assert.equal(unauthRule.error, 'FINANCE_ADMIN_REQUIRED');

// Student cannot force price via checkout
await transitionCourseStatus({
  courseId: created.course.id,
  actorId: 'admin-x',
  actorRole: 'master-admin',
  toStatus: 'UNDER_REVIEW',
});
await transitionCourseStatus({
  courseId: created.course.id,
  actorId: 'admin-x',
  actorRole: 'master-admin',
  toStatus: 'APPROVED',
});
await transitionCourseStatus({
  courseId: created.course.id,
  actorId: 'admin-x',
  actorRole: 'master-admin',
  toStatus: 'PUBLISHED',
});

const purchase = await purchaseRecordedCourse({
  studentId,
  courseId: created.course.id,
  clientPrice: 0.01,
});
assert.equal(purchase.ok, true);
assert.equal(purchase.purchase.paid_amount, 90);
assert.notEqual(purchase.purchase.paid_amount, 0.01);

// Snapshot not editable by student path
assert.ok(Object.isFrozen(purchase.snapshot));

// Client bundle / public env files must not hardcode service role
const envExample = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExample)) {
  const text = fs.readFileSync(envExample, 'utf8');
  assert.ok(!/NEXT_PUBLIC_.*SERVICE_ROLE/.test(text));
}

console.log(JSON.stringify({ ok: true, suite: 'marketplace-security' }, null, 2));
