/**
 * Teacher price split for Recorded Lessons / teacher services.
 *
 * Example (configurable rates — not hardcoded in UI callers):
 *   Teacher Price        50 USD
 *   Platform Commission  30%
 *   Teacher Receives     35 USD
 *   Success OS           15 USD
 */

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
  commissionPercent = 30,
  currency = 'USD',
} = {}) {
  const price = money2(teacherPrice);
  const pct = Number(commissionPercent);
  const safePct = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
  const successOs = money2((price * safePct) / 100);
  const teacherReceives = money2(Math.max(0, price - successOs));

  return {
    teacherPrice: price,
    platformCommissionPercent: safePct,
    platformCommissionLabel: `${safePct}%`,
    teacherReceives,
    successOs,
    currency: currency || 'USD',
    breakdown: [
      { key: 'teacherPrice', label: 'Teacher Price', value: price, display: `${price} ${currency || 'USD'}` },
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
        display: `${teacherReceives} ${currency || 'USD'}`,
      },
      {
        key: 'successOs',
        label: 'Success OS',
        value: successOs,
        display: `${successOs} ${currency || 'USD'}`,
      },
    ],
  };
}

export function isRecordedLessonService(service) {
  const s = String(service || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  return s === 'recorded-lesson' || s === 'recorded-lessons' || s === 'recorded';
}
