/**
 * Commission override cascade:
 *
 * Global Commission
 * ↓
 * Teacher Override
 * ↓
 * Center Override
 * ↓
 * Special Campaign
 * ↓
 * Final Commission
 *
 * Most specific matching layer wins. Layers without a match are skipped (shown as inactive).
 */

import { calculateTeacherPriceSplit } from './teacher-price-split.js';

export const COMMISSION_CASCADE_LAYERS = Object.freeze([
  { id: 'global', label: 'Global Commission', rank: 0 },
  { id: 'teacher_override', label: 'Teacher Override', rank: 1 },
  { id: 'center_override', label: 'Center Override', rank: 2 },
  { id: 'special_campaign', label: 'Special Campaign', rank: 3 },
  { id: 'final', label: 'Final Commission', rank: 4 },
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
    (r) => !r.deletedAt && !r.archivedAt && (!r.status || r.status === 'active'),
  );
}

function inDateWindow(rule, at) {
  if (rule.dateFrom && at < rule.dateFrom) return false;
  if (rule.dateTo && at > rule.dateTo) return false;
  if (rule.scheduledFrom && at < rule.scheduledFrom) return false;
  return true;
}

function normalizeLayer(rule) {
  const explicit = text(rule.overrideLayer || rule.layer).toLowerCase().replace(/[\s-]+/g, '_');
  if (['teacher_override', 'center_override', 'special_campaign', 'global'].includes(explicit)) {
    return explicit;
  }
  if (rule.promotionId || rule.campaignId || rule.specialCampaign === true) {
    return 'special_campaign';
  }
  const partnerType = text(rule.partnerType).toLowerCase();
  if (partnerType === 'center' || partnerType === 'educational_center' || partnerType === 'educational-center') {
    return 'center_override';
  }
  if (partnerType === 'teacher') return 'teacher_override';
  return null;
}

function ruleMatchesContext(rule, ctx, layer) {
  if (!inDateWindow(rule, ctx.at)) return false;

  if (layer === 'special_campaign') {
    const promo = text(ctx.promotionId || ctx.campaignId);
    if (rule.promotionId || rule.campaignId) {
      return (
        text(rule.promotionId || rule.campaignId) === promo && Boolean(promo)
      );
    }
    // Layer-tagged campaign rule without specific promo id applies when any campaign context exists
    return Boolean(promo) || rule.specialCampaign === true;
  }

  if (layer === 'teacher_override') {
    if (rule.partnerId && text(rule.partnerId) !== text(ctx.partnerId || ctx.teacherId)) {
      return false;
    }
    if (rule.partnerType && text(rule.partnerType).toLowerCase() !== 'teacher') return false;
    // Require a teacher context to apply teacher override
    return Boolean(ctx.partnerId || ctx.teacherId || text(ctx.partnerType).toLowerCase() === 'teacher');
  }

  if (layer === 'center_override') {
    if (rule.partnerId && text(rule.partnerId) !== text(ctx.centerId || ctx.partnerId)) {
      return false;
    }
    const ctxType = text(ctx.partnerType || ctx.centerType).toLowerCase();
    if (rule.partnerType) {
      const rt = text(rule.partnerType).toLowerCase();
      if (!['center', 'educational_center', 'educational-center'].includes(rt)) return false;
    }
    return Boolean(
      ctx.centerId ||
        ['center', 'educational_center', 'educational-center'].includes(ctxType),
    );
  }

  return false;
}

function pickBestRule(candidates) {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => {
    const ap = Number(a.priority || 0);
    const bp = Number(b.priority || 0);
    if (ap !== bp) return bp - ap;
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
  })[0];
}

function rulePercent(rule) {
  if (!rule) return null;
  if (rule.zeroCommission === true || rule.pricingType === 'zero') return 0;
  return numOrNull(rule.percent ?? rule.percentage);
}

/**
 * Resolve Final Commission through the override cascade.
 *
 * @param {object} input
 * @param {number} input.globalCommissionPercent
 * @param {object[]} [input.rules]
 * @param {object} [input.context] partner/teacher/center/campaign context
 * @param {number} [input.teacherPrice]
 * @param {string} [input.currency]
 */
export function resolveCommissionCascade({
  globalCommissionPercent = 30,
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
    centerId: context.centerId || null,
    partnerType: context.partnerType || null,
    promotionId: context.promotionId || context.campaignId || null,
    campaignId: context.campaignId || context.promotionId || null,
    service: context.service || null,
  };

  const live = activeRules(rules);
  const globalPercent = Number(globalCommissionPercent);
  const safeGlobal = Number.isFinite(globalPercent) ? globalPercent : 30;

  const layers = {
    global: {
      id: 'global',
      label: 'Global Commission',
      active: true,
      percent: safeGlobal,
      ruleId: null,
      ruleName: 'global-default',
      source: 'defaults',
    },
    teacher_override: {
      id: 'teacher_override',
      label: 'Teacher Override',
      active: false,
      percent: null,
      ruleId: null,
      ruleName: null,
      source: null,
    },
    center_override: {
      id: 'center_override',
      label: 'Center Override',
      active: false,
      percent: null,
      ruleId: null,
      ruleName: null,
      source: null,
    },
    special_campaign: {
      id: 'special_campaign',
      label: 'Special Campaign',
      active: false,
      percent: null,
      ruleId: null,
      ruleName: null,
      source: null,
    },
  };

  for (const layerId of ['teacher_override', 'center_override', 'special_campaign']) {
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
      };
    }
  }

  // Winner = highest-rank active layer (campaign > center > teacher > global)
  const order = ['special_campaign', 'center_override', 'teacher_override', 'global'];
  let winner = layers.global;
  for (const id of order) {
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

  const cascadeSteps = [
    {
      key: 'global',
      label: 'Global Commission',
      value: layers.global.percent,
      display: `${layers.global.percent}%`,
      applied: winner.id === 'global',
      active: true,
    },
    {
      key: 'teacher_override',
      label: 'Teacher Override',
      value: layers.teacher_override.percent,
      display: layers.teacher_override.active
        ? `${layers.teacher_override.percent}%`
        : '—',
      applied: winner.id === 'teacher_override',
      active: layers.teacher_override.active,
      ruleName: layers.teacher_override.ruleName,
    },
    {
      key: 'center_override',
      label: 'Center Override',
      value: layers.center_override.percent,
      display: layers.center_override.active ? `${layers.center_override.percent}%` : '—',
      applied: winner.id === 'center_override',
      active: layers.center_override.active,
      ruleName: layers.center_override.ruleName,
    },
    {
      key: 'special_campaign',
      label: 'Special Campaign',
      value: layers.special_campaign.percent,
      display: layers.special_campaign.active
        ? `${layers.special_campaign.percent}%`
        : '—',
      applied: winner.id === 'special_campaign',
      active: layers.special_campaign.active,
      ruleName: layers.special_campaign.ruleName,
    },
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
  ];

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
  };
}
