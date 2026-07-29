#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  calculateTeacherPriceSplit,
  DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
  DEFAULT_TEACHER_RECORDED_GROSS_SHARE_PERCENT,
} from '../app/lib/admin/teacher-price-split.js';
import {
  ensureCommissionDefaults,
  previewCommission,
  previewTeacherPriceSplit,
} from '../app/lib/admin/enterprise-commission-engine.js';
import { processSuccessfulPayment } from '../app/lib/admin/enterprise-payment-engine.js';

const defaults = ensureCommissionDefaults();
assert.equal(DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT, 15);
assert.equal(DEFAULT_TEACHER_RECORDED_GROSS_SHARE_PERCENT, 85);
assert.equal(Number(defaults.recordedLessonCommissionPercent), 15);
assert.equal(Number(defaults.globalCommissionPercent), 15);

// Example: Course Price 100 → Teacher 85 / Platform 15
const split = calculateTeacherPriceSplit({
  teacherPrice: 100,
  commissionPercent: DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
  currency: 'GBP',
});
assert.equal(split.teacherReceives, 85);
assert.equal(split.successOs, 15);
assert.equal(split.platformCommissionPercent, 15);

// Explicit percent — ignores any leftover ERP teacher overrides in local library/
const preview = previewTeacherPriceSplit({
  teacherPrice: 100,
  service: 'recorded-lesson',
  sourceType: 'TEACHER_RECORDED',
  commissionPercent: DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
  currency: 'GBP',
});
assert.equal(preview.teacherReceives, 85);
assert.equal(preview.successOs, 15);

const commissionPreview = previewCommission({
  teacherPrice: 100,
  grossAmount: 100,
  service: 'recorded-lesson',
  sourceType: 'TEACHER_RECORDED',
});
assert.equal(Number(defaults.recordedLessonCommissionPercent), 15);
assert.ok(Number.isFinite(commissionPreview.percent));
assert.ok(commissionPreview.teacherReceives != null);

const payment = processSuccessfulPayment({
  grossAmount: 100,
  service: 'recorded-lesson',
  sourceType: 'TEACHER_RECORDED',
  currency: 'GBP',
});
assert.equal(payment.ok !== false, true);
assert.ok(payment.split.platformCommission != null);
assert.ok(payment.split.teacherReceives != null);
assert.equal(Number(defaults.recordedLessonCommissionPercent), 15);

console.log(
  JSON.stringify(
    {
      ok: true,
      example: {
        coursePrice: '100 GBP',
        teacherGrossShare: '85%',
        teacherGrossEarnings: '85 GBP',
        platformCommission: '15%',
        platformShare: '15 GBP',
      },
      recordedLessonCommissionPercent: defaults.recordedLessonCommissionPercent,
      teacherGrossSharePercent: DEFAULT_TEACHER_RECORDED_GROSS_SHARE_PERCENT,
    },
    null,
    2,
  ),
);
