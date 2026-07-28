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
assert.equal(split.teacherPrice, 50);
assert.equal(split.platformCommissionPercent, 30);
assert.equal(split.teacherReceives, 35);
assert.equal(split.successOs, 15);
assert.deepEqual(
  split.breakdown.map((b) => b.label),
  ['Teacher Price', 'Platform Commission', 'Teacher Receives', 'Success OS'],
);

const preview = previewTeacherPriceSplit({
  teacherPrice: 50,
  service: 'recorded-lesson',
});
assert.equal(preview.teacherReceives, 35);
assert.equal(preview.successOs, 15);

const commissionPreview = previewCommission({
  teacherPrice: 50,
  grossAmount: 50,
  service: 'recorded-lesson',
  partnerType: 'teacher',
});
assert.equal(commissionPreview.percent, 30);
assert.equal(commissionPreview.teacherReceives, 35);
assert.equal(commissionPreview.successOs, 15);

const payment = processSuccessfulPayment({
  grossAmount: 50,
  service: 'recorded-lesson',
  partnerType: 'teacher',
  currency: 'USD',
});
assert.equal(payment.ok !== false, true);
assert.equal(payment.split.teacherPrice, 50);
assert.equal(payment.split.platformCommission, 15);
assert.equal(payment.split.teacherReceives, 35);
assert.equal(payment.split.successOs, 15);

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
