/**
 * Teacher price split for Recorded Lessons / teacher services.
 *
 * Example (configurable rates — not hardcoded in UI callers):
 *   Course Price                 100
 *   Teacher Gross Share          85%  → 85
 *   Success OS Platform Commission 15% → 15
 *
 * Uses integer minor units for final money values.
 * Default percent lives in this constant / admin config — never scatter magic numbers in UI.
 */

import {
  clampPercent,
  formatMoney,
  fromMinorUnits,
  percentOfMinor,
  toMinorUnits,
} from '../marketplace/money.js';

/** Default Success OS platform commission for TEACHER_RECORDED (teacher gross = 100 − this). */
export const DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT = 15;

/** Default teacher gross share percentage before fees/refunds/taxes/deductions. */
export const DEFAULT_TEACHER_RECORDED_GROSS_SHARE_PERCENT = 100 - DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT;

export function money2(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Number(v.toFixed(2));
}

/**
 * @param {object} input
 * @param {number|string} input.teacherPrice - list price set by teacher / lesson
 * @param {number|string} [input.commissionPercent] - platform commission %
 * @param {string} [input.currency]
 */
export function calculateTeacherPriceSplit({
  teacherPrice,
  commissionPercent = DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
  currency = 'USD',
} = {}) {
  const cur = currency || 'USD';
  const priceMinor = toMinorUnits(teacherPrice, cur);
  const safePct = clampPercent(commissionPercent, DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT);
  const successOsMinor = percentOfMinor(priceMinor, safePct);
  const teacherReceivesMinor = Math.max(0, priceMinor - successOsMinor);

  const price = fromMinorUnits(priceMinor, cur);
  const successOs = fromMinorUnits(successOsMinor, cur);
  const teacherReceives = fromMinorUnits(teacherReceivesMinor, cur);

  return {
    teacherPrice: price,
    platformCommissionPercent: safePct,
    platformCommissionLabel: `${safePct}%`,
    teacherReceives,
    successOs,
    currency: cur,
    minor: {
      teacherPrice: priceMinor,
      platformCommission: successOsMinor,
      teacherReceives: teacherReceivesMinor,
      successOs: successOsMinor,
    },
    breakdown: [
      {
        key: 'teacherPrice',
        label: 'Teacher Price',
        value: price,
        display: formatMoney(priceMinor, cur),
      },
      {
        key: 'platformCommission',
        label: 'Platform Commission',
        value: safePct,
        display: `${safePct}%`,
      },
      {
        key: 'teacherReceives',
        label: 'Teacher Receives',
        value: teacherReceives,
        display: formatMoney(teacherReceivesMinor, cur),
      },
      {
        key: 'successOs',
        label: 'Success OS',
        value: successOs,
        display: formatMoney(successOsMinor, cur),
      },
    ],
  };
}

export function isRecordedLessonService(service) {
  const s = String(service || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  return (
    s === 'recorded-lesson' ||
    s === 'recorded-lessons' ||
    s === 'recorded' ||
    s === 'teacher-recorded' ||
    s === 's4s-intelligence-course'
  );
}
