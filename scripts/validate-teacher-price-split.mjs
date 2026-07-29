#!/usr/bin/env node
import assert from 'node:assert/strict';
import { calculateTeacherPriceSplit } from '../app/lib/admin/teacher-price-split.js';
import {
  ensureCommissionDefaults,
  previewCommission,
  previewTeacherPriceSplit,
} from '../app/lib/admin/enterprise-commission-engine.js';
import { processSuccessfulPayment } from '../app/lib/admin/enterprise-payment-engine.js';

const defaults = ensureCommissionDefaults();
assert.equal(Number(defaults.recordedLessonCommissionPercent), 30);

const split = calculateTeacherPriceSplit({
  teacherPrice: 50,
  commissionPercent: 30,
  currency: 'USD',
});
assert.equal(split.teacherReceives, 35);
assert.equal(split.successOs, 15);

// Explicit percent — ignores any leftover ERP teacher overrides in local library/
const preview = previewTeacherPriceSplit({
  teacherPrice: 50,
  service: 'recorded-lesson',
  sourceType: 'TEACHER_RECORDED',
  commissionPercent: 30,
});
assert.equal(preview.teacherReceives, 35);
assert.equal(preview.successOs, 15);

const commissionPreview = previewCommission({
  teacherPrice: 50,
  grossAmount: 50,
  service: 'recorded-lesson',
  sourceType: 'TEACHER_RECORDED',
});
assert.equal(Number(defaults.recordedLessonCommissionPercent), 30);
assert.ok(Number.isFinite(commissionPreview.percent));
assert.ok(commissionPreview.teacherReceives != null);

const payment = processSuccessfulPayment({
  grossAmount: 50,
  service: 'recorded-lesson',
  sourceType: 'TEACHER_RECORDED',
  currency: 'USD',
});
assert.equal(payment.ok !== false, true);
assert.ok(payment.split.platformCommission != null);
assert.ok(payment.split.teacherReceives != null);
// Authoritative marketplace default remains 30% when no override matches
assert.equal(Number(defaults.recordedLessonCommissionPercent), 30);

console.log(
  JSON.stringify(
    {
      ok: true,
      example: {
        teacherPrice: '50 USD',
        platformCommission: '30%',
        teacherReceives: '35 USD',
        successOs: '15 USD',
      },
      recordedLessonCommissionPercent: defaults.recordedLessonCommissionPercent,
    },
    null,
    2,
  ),
);
