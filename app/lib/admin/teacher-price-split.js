/**
 * Teacher price split for Recorded Lessons / teacher services.
 *
 * Example (configurable rates — not hardcoded in UI callers):
 *   Teacher Price        50 USD
 *   Platform Commission  30%
 *   Teacher Receives     35 USD
 *   Success OS           15 USD
 *
 * Uses integer minor units for final money values.
 */

import {
  clampPercent,
  formatMoney,
  fromMinorUnits,
  percentOfMinor,
  toMinorUnits,
} from '../marketplace/money.js';

export const DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT = 30;

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
