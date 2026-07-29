/**
 * ADMIN-NEXT — Dynamic Commission Engine.
 * Platform-wide default 10% lives in config only — never hardcoded in UI or payment callers.
 * Recorded Lessons marketplace default (TEACHER_RECORDED) is 30% via globalCommissionPercent /
 * recordedLessonCommissionPercent and the marketplace commission engine.
 */

import path from 'node:path';
import {
  erpAppendAudit,
  erpEnsureDirs,
  erpId,
  erpList,
  erpNow,
  erpReadCollection,
  erpReadJson,
  erpRoot,
  erpText,
  erpWriteCollection,
  erpWriteJson,
} from './enterprise-erp-store.js';
import {
  calculateTeacherPriceSplit,
  isRecordedLessonService,
  DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
} from './teacher-price-split.js';
import { resolveCommissionCascade } from './commission-cascade.js';
import { resolveMarketplaceCommission } from '../marketplace/commission-engine.js';

const DEFAULTS_FILE = () => path.join(erpRoot(), 'config', 'commission-defaults.json');

const BASE_DEFAULTS = {
  defaultCommissionPercent: 10,
  /** Cascade root — Global Commission for Recorded Lessons teacher split. */
  globalCommissionPercent: DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
  /** Alias for Recorded Lessons callers; mirrors global when unset. */
  recordedLessonCommissionPercent: DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
  defaultCurrency: 'USD',
  note: 'Owner-configurable. Never hardcode this value in application code paths.',
};

function mergeCommissionDefaults(existing) {
  const merged = { ...BASE_DEFAULTS, ...existing };
  if (existing.globalCommissionPercent == null) {
    merged.globalCommissionPercent =
      existing.recordedLessonCommissionPercent ?? BASE_DEFAULTS.globalCommissionPercent;
  }
  if (existing.recordedLessonCommissionPercent == null) {
    merged.recordedLessonCommissionPercent =
      merged.globalCommissionPercent ?? BASE_DEFAULTS.recordedLessonCommissionPercent;
  }
  return merged;
}

/** Seed configurable defaults (Owner can change anytime via API). */
export function ensureCommissionDefaults() {
  erpEnsureDirs();
  const existing = erpReadJson(DEFAULTS_FILE());
  if (existing) {
    const merged = mergeCommissionDefaults(existing);
    const changed =
      existing.globalCommissionPercent == null ||
      existing.recordedLessonCommissionPercent == null;
    if (changed) {
      merged.updatedAt = existing.updatedAt || erpNow();
      erpWriteJson(DEFAULTS_FILE(), merged);
    }
    return merged;
  }
  const defaults = {
    ...BASE_DEFAULTS,
    updatedAt: erpNow(),
    updatedBy: 'system',
  };
  erpWriteJson(DEFAULTS_FILE(), defaults);
  return defaults;
}

export function getCommissionDefaults() {
  return ensureCommissionDefaults();
}

export function setCommissionDefaults(patch = {}, meta = {}) {
  const before = ensureCommissionDefaults();
  const next = {
    ...before,
    ...patch,
    defaultCommissionPercent:
      patch.defaultCommissionPercent != null
        ? Number(patch.defaultCommissionPercent)
        : before.defaultCommissionPercent,
    globalCommissionPercent:
      patch.globalCommissionPercent != null
        ? Number(patch.globalCommissionPercent)
        : before.globalCommissionPercent,
    recordedLessonCommissionPercent:
      patch.recordedLessonCommissionPercent != null
        ? Number(patch.recordedLessonCommissionPercent)
        : patch.globalCommissionPercent != null
          ? Number(patch.globalCommissionPercent)
          : before.recordedLessonCommissionPercent,
    updatedAt: erpNow(),
    updatedBy: meta.user || 'owner',
  };
  erpWriteJson(DEFAULTS_FILE(), next);
  erpAppendAudit({
    action: 'financial_change',
    moduleId: 'commission-defaults',
    user: meta.user || 'owner',
    oldValue: before,
    newValue: next,
    reason: meta.reason || 'update_commission_defaults',
  });
  return { ok: true, defaults: next };
}

/**
 * Preview Teacher Price split for Recorded Lessons (and teacher services).
 */
export function previewTeacherPriceSplit(input = {}) {
  const defaults = ensureCommissionDefaults();
  const service = input.service || 'recorded-lesson';
  const cascade = previewCommissionCascade({
    ...input,
    service,
    teacherPrice: input.teacherPrice ?? input.price ?? input.grossAmount ?? 0,
  });
  if (input.commissionPercent != null) {
    return calculateTeacherPriceSplit({
      teacherPrice: input.teacherPrice ?? input.price ?? input.grossAmount ?? 0,
      commissionPercent: Number(input.commissionPercent),
      currency: input.currency || defaults.defaultCurrency || 'USD',
    });
  }
  return {
    ...cascade.teacherPriceSplit,
    cascadeSteps: cascade.cascadeSteps,
    finalCommissionPercent: cascade.finalCommissionPercent,
    winnerLayer: cascade.winnerLayer,
  };
}

/**
 * Preview Global → Source → Partner → Teacher → Course → Campaign → Final cascade.
 */
export function previewCommissionCascade(input = {}) {
  const defaults = ensureCommissionDefaults();
  const rules = erpActiveItemsSafe(erpReadCollection('commission-rules').items);
  const globalPercent =
    input.globalCommissionPercent != null
      ? Number(input.globalCommissionPercent)
      : isRecordedLessonService(input.service || 'recorded-lesson')
        ? Number(
            defaults.globalCommissionPercent ??
              defaults.recordedLessonCommissionPercent ??
              DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
          )
        : Number(defaults.globalCommissionPercent ?? defaults.defaultCommissionPercent ?? 10);

  return resolveCommissionCascade({
    globalCommissionPercent: globalPercent,
    rules,
    context: {
      at: input.at,
      partnerId: input.partnerId || input.teacherId,
      teacherId: input.teacherId || input.partnerId,
      courseId: input.courseId,
      centerId: input.centerId,
      partnerType: input.partnerType,
      promotionId: input.promotionId || input.campaignId,
      campaignId: input.campaignId || input.promotionId,
      service: input.service || 'recorded-lesson',
      sourceType: input.sourceType || input.lessonSource,
      lessonSource: input.lessonSource || input.sourceType,
    },
    teacherPrice: input.teacherPrice ?? input.price ?? input.grossAmount ?? 0,
    currency: input.currency || defaults.defaultCurrency || 'USD',
  });
}

function scoreRule(rule, ctx) {
  let score = 0;
  const checks = [
    ['partnerId', 100],
    ['partnerType', 80],
    ['contractId', 70],
    ['subscriptionId', 65],
    ['promotionId', 60],
    ['service', 50],
    ['subject', 45],
    ['curriculum', 40],
    ['city', 30],
    ['country', 25],
    ['vip', 20],
  ];
  for (const [key, pts] of checks) {
    if (rule[key] == null || rule[key] === '' || rule[key] === false) continue;
    if (String(rule[key]) !== String(ctx[key] ?? '')) return -1;
    score += pts;
  }
  if (rule.dateFrom && ctx.at < rule.dateFrom) return -1;
  if (rule.dateTo && ctx.at > rule.dateTo) return -1;
  if (rule.scheduledFrom && ctx.at < rule.scheduledFrom) return -1;
  if (rule.status && rule.status !== 'active') return -1;
  if (rule.deletedAt || rule.archivedAt) return -1;
  return score + (Number(rule.priority) || 0);
}

function applyRuleAmount(rule, gross) {
  const type = rule.pricingType || rule.type || 'percentage';
  const pct = Number(rule.percent ?? rule.percentage ?? 0);
  const fixed = Number(rule.fixedAmount ?? 0);
  let amount = 0;

  if (type === 'zero' || rule.zeroCommission === true) {
    amount = 0;
  } else if (type === 'percentage') {
    amount = (gross * pct) / 100;
  } else if (type === 'fixed') {
    amount = fixed;
  } else if (type === 'percentage_plus_fixed') {
    amount = (gross * pct) / 100 + fixed;
  } else if (type === 'tiered') {
    const tiers = erpList(rule.tiers).sort((a, b) => Number(a.min || 0) - Number(b.min || 0));
    const tier = tiers.find(
      (t) => gross >= Number(t.min || 0) && (t.max == null || gross <= Number(t.max)),
    );
    if (tier) {
      amount =
        tier.pricingType === 'fixed'
          ? Number(tier.fixedAmount || 0)
          : (gross * Number(tier.percent || 0)) / 100;
    }
  } else {
    amount = (gross * pct) / 100;
  }

  if (rule.minimum != null) amount = Math.max(amount, Number(rule.minimum));
  if (rule.maximum != null) amount = Math.min(amount, Number(rule.maximum));
  return Math.max(0, Number(amount.toFixed(6)));
}

/**
 * Resolve commission for a payment context.
 * Recorded-lesson services use the marketplace cascade (default 30%).
 * Other services keep legacy scoring with platform default 10%.
 */
export function resolveCommission(context = {}) {
  const defaults = ensureCommissionDefaults();
  const ctx = {
    at: context.at || erpNow(),
    partnerId: context.partnerId || null,
    partnerType: context.partnerType || null,
    country: context.country || null,
    city: context.city || null,
    curriculum: context.curriculum || null,
    subject: context.subject || null,
    service: context.service || null,
    subscriptionId: context.subscriptionId || null,
    contractId: context.contractId || null,
    promotionId: context.promotionId || context.campaignId || null,
    vip: context.vip === true,
    teacherId: context.teacherId || null,
    centerId: context.centerId || null,
    campaignId: context.campaignId || null,
    courseId: context.courseId || null,
    sourceType: context.sourceType || context.lessonSource || null,
  };
  const gross = Number(context.grossAmount || 0);

  if (isRecordedLessonService(ctx.service) || ctx.sourceType) {
    const market = resolveMarketplaceCommission({
      originalPrice: gross,
      discountAmount: Number(context.discount || context.discountAmount || 0),
      currency: context.currency || defaults.defaultCurrency || 'USD',
      sourceType: ctx.sourceType || 'TEACHER_RECORDED',
      teacherId: ctx.teacherId || ctx.partnerId,
      courseId: ctx.courseId,
      partnerType: ctx.partnerType || 'teacher',
      campaignId: ctx.campaignId,
      promotionId: ctx.promotionId,
      rules: erpActiveItemsSafe(erpReadCollection('commission-rules').items),
      globalCommissionPercent: Number(
        defaults.recordedLessonCommissionPercent ??
          defaults.globalCommissionPercent ??
          DEFAULT_TEACHER_RECORDED_COMMISSION_PERCENT,
      ),
      at: ctx.at,
    });
    return {
      source: 'marketplace',
      ruleId: market.appliedCommissionRuleId,
      ruleName: market.appliedRule?.name,
      pricingType: 'percentage',
      percent: market.effectiveCommissionPercentage,
      fixedAmount: 0,
      commissionAmount: market.platformCommissionAmount,
      teacherReceives: market.teacherGrossShare,
      successOs: market.platformCommissionAmount,
      winnerLayer: market.appliedRule?.scope,
      calculationVersion: market.calculationVersion,
      marketplace: market,
      defaultsVersion: defaults.updatedAt,
    };
  }

  const cascade = previewCommissionCascade({
    ...ctx,
    teacherPrice: gross,
    grossAmount: gross,
    currency: context.currency || defaults.defaultCurrency || 'USD',
    service: ctx.service,
  });

  const rules = erpActiveItemsSafe(erpReadCollection('commission-rules').items);
  let best = null;
  let bestScore = -1;
  for (const rule of rules) {
    if (rule.overrideLayer || rule.layer || rule.scope) continue;
    const s = scoreRule(rule, ctx);
    if (s > bestScore) {
      bestScore = s;
      best = rule;
    }
  }

  if (cascade.winnerLayer !== 'global' || !best) {
    const percent = cascade.finalCommissionPercent;
    const amount = Number(((gross * percent) / 100).toFixed(6));
    return {
      source: cascade.winnerLayer === 'global' ? 'default' : 'cascade',
      ruleId: cascade.ruleId,
      pricingType: 'percentage',
      percent,
      fixedAmount: 0,
      commissionAmount: amount,
      teacherReceives: cascade.teacherReceives,
      successOs: cascade.successOs,
      winnerLayer: cascade.winnerLayer,
      defaultsVersion: defaults.updatedAt,
    };
  }

  const commissionAmount = applyRuleAmount(best, gross);
  return {
    source: 'rule',
    ruleId: best.id,
    ruleName: best.name,
    pricingType: best.pricingType || best.type || 'percentage',
    percent: Number(best.percent ?? best.percentage ?? 0),
    fixedAmount: Number(best.fixedAmount ?? 0),
    commissionAmount,
    ruleVersion: best.version || 1,
  };
}

function erpActiveItemsSafe(items) {
  return erpList(items).filter((i) => !i.deletedAt && !i.archivedAt);
}

export function listCommissionRules(options = {}) {
  ensureCommissionDefaults();
  let items = erpActiveItemsSafe(erpReadCollection('commission-rules').items);
  const q = erpText(options.q).toLowerCase();
  if (q) {
    items = items.filter((r) =>
      ['name', 'partnerType', 'country', 'service', 'status'].some((k) =>
        String(r[k] || '')
          .toLowerCase()
          .includes(q),
      ),
    );
  }
  return {
    defaults: getCommissionDefaults(),
    total: items.length,
    items,
  };
}

export function mutateCommissionRule(action, payload = {}, meta = {}) {
  ensureCommissionDefaults();
  const doc = erpReadCollection('commission-rules');
  let items = erpList(doc.items);

  if (action === 'create' || action === 'add') {
    const id = erpId();
    const rule = {
      id,
      name: payload.name || 'Commission rule',
      status: payload.status || 'active',
      pricingType: payload.pricingType || 'percentage',
      percent: payload.percent != null ? Number(payload.percent) : null,
      fixedAmount: payload.fixedAmount != null ? Number(payload.fixedAmount) : null,
      minimum: payload.minimum != null ? Number(payload.minimum) : null,
      maximum: payload.maximum != null ? Number(payload.maximum) : null,
      zeroCommission: payload.zeroCommission === true,
      tiers: erpList(payload.tiers),
      partnerId: payload.partnerId || null,
      partnerType: payload.partnerType || null,
      country: payload.country || null,
      city: payload.city || null,
      curriculum: payload.curriculum || null,
      subject: payload.subject || null,
      service: payload.service || null,
      subscriptionId: payload.subscriptionId || null,
      contractId: payload.contractId || null,
      promotionId: payload.promotionId || null,
      vip: payload.vip === true,
      dateFrom: payload.dateFrom || null,
      dateTo: payload.dateTo || null,
      scheduledFrom: payload.scheduledFrom || null,
      priority: Number(payload.priority || 0),
      version: 1,
      createdAt: erpNow(),
      updatedAt: erpNow(),
    };
    items.push(rule);
    erpWriteCollection('commission-rules', { items });
    saveRuleVersion(rule);
    erpAppendAudit({
      action: 'create',
      moduleId: 'commission-rules',
      entityId: id,
      user: meta.user || 'system',
      newValue: rule,
    });
    return { ok: true, item: rule };
  }

  if (action === 'update' || action === 'edit') {
    const idx = items.findIndex((r) => r.id === payload.id);
    if (idx < 0) return { ok: false, error: 'NOT_FOUND' };
    const before = items[idx];
    const next = {
      ...before,
      ...payload,
      id: before.id,
      version: (Number(before.version) || 1) + 1,
      updatedAt: erpNow(),
    };
    items[idx] = next;
    erpWriteCollection('commission-rules', { items });
    saveRuleVersion(next);
    erpAppendAudit({
      action: 'edit',
      moduleId: 'commission-rules',
      entityId: before.id,
      user: meta.user || 'system',
      oldValue: before,
      newValue: next,
    });
    return { ok: true, item: next };
  }

  return { ok: false, error: 'UNKNOWN_ACTION' };
}

function saveRuleVersion(rule) {
  const versions = erpReadCollection('commission-rule-versions');
  versions.items = [
    { id: erpId(), ruleId: rule.id, version: rule.version, snapshot: rule, at: erpNow() },
    ...erpList(versions.items),
  ].slice(0, 5000);
  erpWriteCollection('commission-rule-versions', versions);
}

export function previewCommission(payload = {}) {
  return resolveCommission(payload);
}
