/**
 * Authoritative server-side commission resolution for Recorded Lessons Marketplace.
 *
 * Priority:
 * 1. campaign-specific
 * 2. course-specific
 * 3. teacher-specific
 * 4. partner-type
 * 5. lesson-source
 * 6. global default
 *
 * Defaults:
 *   TEACHER_RECORDED → 30% platform / 70% teacher gross
 *   S4S_INTELLIGENCE → platform-owned (no teacher split)
 */

import { normalizeLessonSource } from '../../data/recorded-lesson-sources.js';
import { resolveCommissionCascade } from '../admin/commission-cascade.js';
import {
  DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
  isRecordedLessonService,
} from '../admin/teacher-price-split.js';
import {
  clampPercent,
  fromMinorUnits,
  percentOfMinor,
  toMinorUnits,
} from './money.js';

export const CALCULATION_VERSION = 'recorded-marketplace-v1';
export const DEFAULT_TEACHER_COMMISSION_PERCENT = DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT;

const S4S_DEFAULT_PLATFORM_PERCENT = 100;

/**
 * Resolve marketplace commission and return a full financial breakdown.
 *
 * All money fields are returned in major units AND minor units.
 */
export function resolveMarketplaceCommission({
  originalPrice = 0,
  discountAmount = 0,
  currency = 'USD',
  sourceType = 'TEACHER_RECORDED',
  teacherId = null,
  courseId = null,
  studentId = null,
  partnerType = null,
  campaignId = null,
  promotionId = null,
  paymentProcessingFee = 0,
  taxAmount = 0,
  refundAmount = 0,
  rules = [],
  globalCommissionPercent = DEFAULT_TEACHER_COMMISSION_PERCENT,
  at = null,
} = {}) {
  const cur = currency || 'USD';
  const source = normalizeLessonSource(sourceType) || 'TEACHER_RECORDED';
  const originalMinor = toMinorUnits(originalPrice, cur);
  const discountMinor = Math.min(originalMinor, Math.max(0, toMinorUnits(discountAmount, cur)));
  const paidMinor = Math.max(0, originalMinor - discountMinor);
  const feeMinor = Math.max(0, toMinorUnits(paymentProcessingFee, cur));
  const taxMinor = Math.max(0, toMinorUnits(taxAmount, cur));
  const refundMinor = Math.max(0, Math.min(paidMinor, toMinorUnits(refundAmount, cur)));

  // S4S Intelligence: platform-owned revenue by default (no teacher split).
  if (source === 'S4S_INTELLIGENCE') {
    const platformCommissionMinor = paidMinor;
    const teacherGrossMinor = 0;
    const teacherFinalMinor = 0;
    const platformFinalMinor = Math.max(0, paidMinor - feeMinor - taxMinor - refundMinor);

    return buildResult({
      currency: cur,
      sourceType: source,
      originalMinor,
      discountMinor,
      paidMinor,
      effectiveCommissionPercent: S4S_DEFAULT_PLATFORM_PERCENT,
      platformCommissionMinor,
      teacherGrossMinor,
      feeMinor,
      taxMinor,
      refundMinor,
      teacherFinalMinor,
      platformFinalMinor,
      appliedRule: {
        id: null,
        scope: 's4s_platform_owned',
        name: 'S4S_INTELLIGENCE_PLATFORM_OWNED',
        percent: S4S_DEFAULT_PLATFORM_PERCENT,
      },
      teacherId: null,
      courseId,
      studentId,
      resolutionLog: {
        mode: 'platform_owned',
        sourceType: source,
        note: 'S4S Intelligence courses have no teacher split by default',
      },
    });
  }

  const cascade = resolveCommissionCascade({
    globalCommissionPercent:
      globalCommissionPercent ?? DEFAULT_TEACHER_COMMISSION_PERCENT,
    rules,
    context: {
      at: at || new Date().toISOString(),
      teacherId,
      partnerId: teacherId,
      courseId,
      partnerType: partnerType || 'teacher',
      campaignId,
      promotionId: promotionId || campaignId,
      sourceType: source,
      lessonSource: source,
      service: 'recorded-lesson',
    },
    teacherPrice: fromMinorUnits(paidMinor, cur),
    currency: cur,
  });

  const effectivePercent = clampPercent(
    cascade.finalCommissionPercent,
    DEFAULT_TEACHER_COMMISSION_PERCENT,
  );
  const platformCommissionMinor = percentOfMinor(paidMinor, effectivePercent);
  const teacherGrossMinor = Math.max(0, paidMinor - platformCommissionMinor);
  const teacherFinalMinor = Math.max(0, teacherGrossMinor - refundMinor);
  const platformRetainedMinor = Math.max(0, platformCommissionMinor - feeMinor - taxMinor);

  return buildResult({
    currency: cur,
    sourceType: source,
    originalMinor,
    discountMinor,
    paidMinor,
    effectiveCommissionPercent: effectivePercent,
    platformCommissionMinor,
    teacherGrossMinor,
    feeMinor,
    taxMinor,
    refundMinor,
    teacherFinalMinor,
    platformFinalMinor: platformRetainedMinor,
    appliedRule: {
      id: cascade.ruleId,
      scope: cascade.winnerLayer,
      name: cascade.winnerLabel,
      percent: effectivePercent,
    },
    teacherId,
    courseId,
    studentId,
    resolutionLog: cascade.resolutionLog,
    cascade,
  });
}

function buildResult(input) {
  const cur = input.currency;
  return {
    originalPrice: fromMinorUnits(input.originalMinor, cur),
    discountAmount: fromMinorUnits(input.discountMinor, cur),
    paidAmount: fromMinorUnits(input.paidMinor, cur),
    currency: cur,
    effectiveCommissionPercentage: input.effectiveCommissionPercent,
    platformCommissionAmount: fromMinorUnits(input.platformCommissionMinor, cur),
    teacherGrossShare: fromMinorUnits(input.teacherGrossMinor, cur),
    paymentProcessingFee: fromMinorUnits(input.feeMinor, cur),
    taxAmount: fromMinorUnits(input.taxMinor, cur),
    refundAmount: fromMinorUnits(input.refundMinor, cur),
    teacherFinalPayable: fromMinorUnits(input.teacherFinalMinor, cur),
    platformFinalRetained: fromMinorUnits(input.platformFinalMinor, cur),
    appliedRule: input.appliedRule,
    appliedCommissionRuleId: input.appliedRule?.id || null,
    calculationVersion: CALCULATION_VERSION,
    sourceType: input.sourceType,
    teacherId: input.teacherId || null,
    courseId: input.courseId || null,
    studentId: input.studentId || null,
    resolutionLog: input.resolutionLog || null,
    cascade: input.cascade || null,
    minor: {
      originalPrice: input.originalMinor,
      discountAmount: input.discountMinor,
      paidAmount: input.paidMinor,
      platformCommissionAmount: input.platformCommissionMinor,
      teacherGrossShare: input.teacherGrossMinor,
      paymentProcessingFee: input.feeMinor,
      taxAmount: input.taxMinor,
      refundAmount: input.refundMinor,
      teacherFinalPayable: input.teacherFinalMinor,
      platformFinalRetained: input.platformFinalMinor,
    },
  };
}

/**
 * Build an immutable financial snapshot payload (DB insert shape).
 */
export function buildFinancialSnapshot({
  purchaseId,
  courseId,
  studentId,
  teacherId,
  sourceType,
  resolution,
} = {}) {
  if (!resolution) throw new Error('RESOLUTION_REQUIRED');
  return Object.freeze({
    purchase_id: purchaseId,
    course_id: courseId,
    student_id: studentId,
    teacher_id: teacherId || resolution.teacherId || null,
    source_type: normalizeLessonSource(sourceType || resolution.sourceType),
    original_price: resolution.originalPrice,
    discount_amount: resolution.discountAmount,
    paid_amount: resolution.paidAmount,
    currency: resolution.currency,
    effective_commission_percentage: resolution.effectiveCommissionPercentage,
    platform_commission_amount: resolution.platformCommissionAmount,
    teacher_gross_share: resolution.teacherGrossShare,
    payment_processing_fee: resolution.paymentProcessingFee,
    tax_amount: resolution.taxAmount,
    refund_amount: resolution.refundAmount,
    teacher_final_payable: resolution.teacherFinalPayable,
    platform_final_retained: resolution.platformFinalRetained,
    applied_commission_rule_id: resolution.appliedCommissionRuleId,
    calculation_version: resolution.calculationVersion || CALCULATION_VERSION,
  });
}

export function marketplaceServiceHint(service) {
  return isRecordedLessonService(service);
}
