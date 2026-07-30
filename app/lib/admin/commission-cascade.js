/**
 * Commission override cascade for Recorded Lessons marketplace.
 *
 * Approved priority (most specific wins):
 * 1. campaign-specific
 * 2. course-specific
 * 3. teacher-specific
 * 4. partner-type
 * 5. lesson-source
 * 6. global default
 *
 * Equal scope → highest explicit priority, then newest active rule.
 */

import {
  calculateTeacherPriceSplit,
  DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
} from './teacher-price-split.js';
import { normalizeLessonSource } from '../../data/recorded-lesson-sources.js';

export const COMMISSION_CASCADE_LAYERS = Object.freeze([
  { id: 'global', label: 'Global Default', rank: 0 },
  { id: 'lesson_source', label: 'Lesson Source', rank: 1 },
  { id: 'partner_type', label: 'Partner Type', rank: 2 },
  { id: 'teacher_override', label: 'Teacher Override', rank: 3 },
  { id: 'course_override', label: 'Course Override', rank: 4 },
  { id: 'special_campaign', label: 'Campaign', rank: 5 },
  { id: 'final', label: 'Final Commission', rank: 6 },
]);

/** Winner evaluation order (highest specificity first). */
const WINNER_ORDER = Object.freeze([
  'special_campaign',
  'course_override',
  'teacher_override',
  'partner_type',
  'lesson_source',
  'global',
]);

function numOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function text(v) {
  return String(v || '').trim();
}

function activeRules(rules = []) {
  return (Array.isArray(rules) ? rules : []).filter(
    (r) =>
      !r.deletedAt &&
      !r.archivedAt &&
      (!r.status || r.status === 'active' || r.status === 'ACTIVE'),
  );
}

function inDateWindow(rule, at) {
  const from = rule.effective_start_at || rule.dateFrom || rule.scheduledFrom || rule.effectiveFrom;
  const to = rule.effective_end_at || rule.dateTo || rule.effectiveTo;
  if (from && at < from) return false;
  if (to && at > to) return false;
  return true;
}

function normalizeLayer(rule) {
  const explicit = text(rule.overrideLayer || rule.layer || rule.scope)
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (
    [
      'special_campaign',
      'campaign',
      'campaign_override',
      'course_override',
      'course',
      'teacher_override',
      'teacher',
      'partner_type',
      'partner',
      'lesson_source',
      'source',
      'global',
    ].includes(explicit)
  ) {
    if (explicit === 'campaign' || explicit === 'campaign_override') return 'special_campaign';
    if (explicit === 'course') return 'course_override';
    if (explicit === 'teacher') return 'teacher_override';
    if (explicit === 'partner') return 'partner_type';
    if (explicit === 'source') return 'lesson_source';
    return explicit;
  }

  if (rule.promotionId || rule.campaignId || rule.campaign_id || rule.specialCampaign === true) {
    return 'special_campaign';
  }
  if (rule.courseId || rule.course_id) return 'course_override';
  if (rule.teacherId || rule.teacher_id || text(rule.partnerType).toLowerCase() === 'teacher') {
    if (rule.partnerId || rule.teacherId || rule.teacher_id) return 'teacher_override';
  }
  if (rule.partnerType || rule.partner_type) return 'partner_type';
  if (rule.sourceType || rule.source_type || rule.lessonSource || rule.lesson_source) {
    return 'lesson_source';
  }
  return null;
}

function ruleMatchesContext(rule, ctx, layer) {
  if (!inDateWindow(rule, ctx.at)) return false;

  if (layer === 'special_campaign') {
    const promo = text(ctx.promotionId || ctx.campaignId);
    const rulePromo = text(rule.promotionId || rule.campaignId || rule.campaign_id);
    if (rulePromo) return Boolean(promo) && rulePromo === promo;
    return Boolean(promo) || rule.specialCampaign === true;
  }

  if (layer === 'course_override') {
    const courseId = text(ctx.courseId);
    const ruleCourse = text(rule.courseId || rule.course_id);
    if (!ruleCourse || !courseId) return false;
    return ruleCourse === courseId;
  }

  if (layer === 'teacher_override') {
    const teacherId = text(ctx.teacherId || ctx.partnerId);
    const ruleTeacher = text(rule.teacherId || rule.teacher_id || rule.partnerId);
    if (ruleTeacher && teacherId && ruleTeacher !== teacherId) return false;
    if (rule.partnerType && text(rule.partnerType).toLowerCase() !== 'teacher') return false;
    return Boolean(teacherId || ruleTeacher);
  }

  if (layer === 'partner_type') {
    const ctxType = text(ctx.partnerType).toLowerCase();
    const ruleType = text(rule.partnerType || rule.partner_type).toLowerCase();
    if (!ruleType) return false;
    return Boolean(ctxType) && ruleType === ctxType;
  }

  if (layer === 'lesson_source') {
    const ctxSource = normalizeLessonSource(ctx.sourceType || ctx.lessonSource);
    const ruleSource = normalizeLessonSource(
      rule.sourceType || rule.source_type || rule.lessonSource || rule.lesson_source,
    );
    if (!ruleSource || ruleSource === 'ALL') return false;
    return ctxSource === ruleSource;
  }

  return false;
}

function pickBestRule(candidates) {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => {
    const ap = Number(a.priority || 0);
    const bp = Number(b.priority || 0);
    if (ap !== bp) return bp - ap;
    const aTime = String(a.updated_at || a.updatedAt || a.created_at || a.createdAt || '');
    const bTime = String(b.updated_at || b.updatedAt || b.created_at || b.createdAt || '');
    return bTime.localeCompare(aTime);
  })[0];
}

function rulePercent(rule) {
  if (!rule) return null;
  if (rule.zeroCommission === true || rule.pricingType === 'zero') return 0;
  return numOrNull(rule.percent ?? rule.percentage);
}

/**
 * Resolve Final Commission through the approved override cascade.
 */
export function resolveCommissionCascade({
  globalCommissionPercent = DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
  rules = [],
  context = {},
  teacherPrice = 0,
  currency = 'USD',
} = {}) {
  const at = context.at || new Date().toISOString();
  const ctx = {
    at,
    partnerId: context.partnerId || context.teacherId || null,
    teacherId: context.teacherId || context.partnerId || null,
    courseId: context.courseId || null,
    partnerType: context.partnerType || null,
    promotionId: context.promotionId || context.campaignId || null,
    campaignId: context.campaignId || context.promotionId || null,
    service: context.service || null,
    sourceType: normalizeLessonSource(context.sourceType || context.lessonSource) || null,
    lessonSource: normalizeLessonSource(context.lessonSource || context.sourceType) || null,
  };

  const live = activeRules(rules);
  const globalPercent = Number(globalCommissionPercent);
  const safeGlobal = Number.isFinite(globalPercent)
    ? globalPercent
    : DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT;

  const layers = {
    global: {
      id: 'global',
      label: 'Global Default',
      active: true,
      percent: safeGlobal,
      ruleId: null,
      ruleName: 'global-default',
      source: 'defaults',
    },
    lesson_source: emptyLayer('lesson_source', 'Lesson Source'),
    partner_type: emptyLayer('partner_type', 'Partner Type'),
    teacher_override: emptyLayer('teacher_override', 'Teacher Override'),
    course_override: emptyLayer('course_override', 'Course Override'),
    special_campaign: emptyLayer('special_campaign', 'Campaign'),
  };

  for (const layerId of [
    'lesson_source',
    'partner_type',
    'teacher_override',
    'course_override',
    'special_campaign',
  ]) {
    const candidates = live.filter((r) => {
      const layer = normalizeLayer(r);
      return layer === layerId && ruleMatchesContext(r, ctx, layerId);
    });
    const best = pickBestRule(candidates);
    const pct = rulePercent(best);
    if (best && pct != null) {
      layers[layerId] = {
        id: layerId,
        label: layers[layerId].label,
        active: true,
        percent: pct,
        ruleId: best.id,
        ruleName: best.name || best.id,
        source: 'rule',
        priority: Number(best.priority || 0),
      };
    }
  }

  let winner = layers.global;
  for (const id of WINNER_ORDER) {
    if (layers[id]?.active && layers[id].percent != null) {
      winner = layers[id];
      break;
    }
  }

  const finalPercent = Number(winner.percent);
  const split = calculateTeacherPriceSplit({
    teacherPrice,
    commissionPercent: finalPercent,
    currency,
  });

  const cascadeSteps = WINNER_ORDER.map((key) => {
    const layer = layers[key];
    return {
      key,
      label: layer.label,
      value: layer.percent,
      display: layer.active && layer.percent != null ? `${layer.percent}%` : '—',
      applied: winner.id === key,
      active: layer.active,
      ruleName: layer.ruleName,
      ruleId: layer.ruleId,
    };
  }).concat([
    {
      key: 'final',
      label: 'Final Commission',
      value: finalPercent,
      display: `${finalPercent}%`,
      applied: true,
      active: true,
      winnerLayer: winner.id,
      winnerLabel: winner.label,
    },
  ]);

  return {
    layers,
    cascadeSteps,
    finalCommissionPercent: finalPercent,
    winnerLayer: winner.id,
    winnerLabel: winner.label,
    ruleId: winner.ruleId || null,
    teacherPriceSplit: split,
    teacherReceives: split.teacherReceives,
    successOs: split.successOs,
    resolutionLog: {
      winnerLayer: winner.id,
      ruleId: winner.ruleId || null,
      percent: finalPercent,
      evaluatedAt: at,
      priorityOrder: WINNER_ORDER,
    },
  };
}

function emptyLayer(id, label) {
  return {
    id,
    label,
    active: false,
    percent: null,
    ruleId: null,
    ruleName: null,
    source: null,
  };
}
