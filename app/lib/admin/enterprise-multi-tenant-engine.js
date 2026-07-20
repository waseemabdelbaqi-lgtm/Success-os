/**
 * SUCCESS OS — Multi-Tenant & White Label Engine
 *
 * One codebase · unlimited tenants · white-label branding · module toggles ·
 * data isolation · subscriptions · limits · billing · owner control ·
 * tenant-aware API context · global analytics.
 */

import path from 'node:path';
import {
  MT_BILLING_CYCLES,
  MT_DEFAULT_BRANDING,
  MT_DEFAULT_CONFIG,
  MT_ISOLATED_COLLECTIONS,
  MT_MODULES,
  MT_ORG_TYPES,
  MT_RESOURCE_LIMIT_KEYS,
  MT_SUBSCRIPTION_PLANS,
  MT_TENANT_STATUSES,
  MT_WHITE_LABEL_FIELDS,
  findMtPlan,
  slugifyTenant,
} from '../../data/enterprise-multi-tenant-catalog.js';
import {
  erpActiveItems,
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

const COLLECTIONS = Object.freeze({
  tenants: 'mt-tenants',
  subscriptions: 'mt-subscriptions',
  invoices: 'mt-invoices',
  usage: 'mt-usage',
  modules: 'mt-module-overrides',
  branding: 'mt-branding',
  impersonations: 'mt-impersonations',
  tenantData: 'mt-tenant-data',
  audit: 'mt-audit',
});

const CONFIG_FILE = () => path.join(erpRoot(), 'config', 'multi-tenant.json');

function liveBus() {
  if (!globalThis.__SUCCESS_OS_MT_BUS__) {
    globalThis.__SUCCESS_OS_MT_BUS__ = { listeners: new Set(), version: 0, last: null };
  }
  return globalThis.__SUCCESS_OS_MT_BUS__;
}

export function subscribeMtLive(listener) {
  const bus = liveBus();
  bus.listeners.add(listener);
  return () => bus.listeners.delete(listener);
}

function publishLive(event) {
  const bus = liveBus();
  bus.version += 1;
  bus.last = { ...event, version: bus.version, at: erpNow() };
  for (const listener of bus.listeners) {
    try {
      listener(bus.last);
    } catch {
      /* ignore */
    }
  }
}

function ensureCollection(name, seed = []) {
  erpEnsureDirs();
  const file = path.join(erpRoot(), 'collections', `${name}.json`);
  if (erpReadJson(file)) return erpReadJson(file);
  const doc = { items: seed, updatedAt: erpNow() };
  erpWriteCollection(name, doc);
  return doc;
}

function money(n) {
  return Number(Number(n || 0).toFixed(2));
}

function addDays(iso, days) {
  const d = new Date(iso || Date.now());
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d.toISOString();
}

export function getMtConfig() {
  erpEnsureDirs();
  const existing = erpReadJson(CONFIG_FILE());
  if (existing) return { ...MT_DEFAULT_CONFIG, ...existing };
  const seeded = { ...MT_DEFAULT_CONFIG, updatedAt: erpNow(), updatedBy: 'system' };
  erpWriteJson(CONFIG_FILE(), seeded);
  return seeded;
}

export function setMtConfig(patch = {}, meta = {}) {
  const before = getMtConfig();
  const next = { ...before, ...patch, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  erpWriteJson(CONFIG_FILE(), next);
  erpAppendAudit({
    action: 'mt_config',
    moduleId: 'multi-tenant-platform',
    user: meta.user || 'owner',
    oldValue: before,
    newValue: next,
  });
  publishLive({ type: 'config.updated' });
  return { ok: true, config: next };
}

function emptyUsage() {
  return Object.fromEntries(MT_RESOURCE_LIMIT_KEYS.map((k) => [k, 0]));
}

function seedDemoTenants() {
  const config = getMtConfig();
  const now = erpNow();
  return [
    {
      id: 'tenant-demo-school',
      tenantId: 'tenant-demo-school',
      name: 'Amman Bright School',
      orgType: 'school',
      subdomain: 'amman-bright',
      domain: '',
      country: 'JO',
      currency: 'JOD',
      timezone: 'Asia/Amman',
      languages: ['ar', 'en'],
      planKey: 'professional',
      billingCycle: 'yearly',
      status: 'active',
      logoUrl: '',
      brandColors: { primary: '#0f766e', secondary: '#134e4a' },
      theme: 'default',
      storageGbUsed: 42,
      usersCount: 380,
      healthScore: 92,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    },
    {
      id: 'tenant-demo-uni',
      tenantId: 'tenant-demo-uni',
      name: 'Levant Open University',
      orgType: 'university',
      subdomain: 'levant-uni',
      domain: 'learn.levant-uni.example',
      country: 'JO',
      currency: 'USD',
      timezone: config.defaultTimezone,
      languages: ['ar', 'en'],
      planKey: 'enterprise',
      billingCycle: 'yearly',
      status: 'active',
      logoUrl: '',
      brandColors: { primary: '#1d4ed8', secondary: '#1e3a8a' },
      theme: 'academic',
      storageGbUsed: 210,
      usersCount: 4200,
      healthScore: 88,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    },
  ];
}

export function ensureMultiTenantEngine() {
  erpEnsureDirs();
  getMtConfig();
  ensureCollection(COLLECTIONS.tenants, seedDemoTenants());
  ensureCollection(COLLECTIONS.subscriptions, []);
  ensureCollection(COLLECTIONS.invoices, []);
  ensureCollection(COLLECTIONS.usage, []);
  ensureCollection(COLLECTIONS.modules, []);
  ensureCollection(COLLECTIONS.branding, []);
  ensureCollection(COLLECTIONS.impersonations, []);
  ensureCollection(COLLECTIONS.tenantData, []);
  ensureCollection(COLLECTIONS.audit, []);

  // Ensure demo tenants have branding + usage + subscription rows
  for (const t of erpList(erpReadCollection(COLLECTIONS.tenants).items)) {
    ensureTenantSideData(t);
  }
  return { ok: true };
}

function ensureTenantSideData(tenant) {
  const plan = findMtPlan(tenant.planKey) || findMtPlan('starter');
  const brandingDoc = erpReadCollection(COLLECTIONS.branding);
  if (!erpList(brandingDoc.items).some((b) => b.tenantId === tenant.tenantId)) {
    brandingDoc.items = [
      {
        id: tenant.tenantId,
        tenantId: tenant.tenantId,
        ...MT_DEFAULT_BRANDING,
        brandName: tenant.name,
        primaryColor: tenant.brandColors?.primary || MT_DEFAULT_BRANDING.primaryColor,
        secondaryColor: tenant.brandColors?.secondary || MT_DEFAULT_BRANDING.secondaryColor,
        domain: tenant.domain || '',
        subdomain: tenant.subdomain,
        updatedAt: erpNow(),
      },
      ...erpList(brandingDoc.items),
    ];
    erpWriteCollection(COLLECTIONS.branding, brandingDoc);
  }

  const modulesDoc = erpReadCollection(COLLECTIONS.modules);
  if (!erpList(modulesDoc.items).some((m) => m.tenantId === tenant.tenantId)) {
    const enabled = Object.fromEntries(
      MT_MODULES.map((m) => [m.key, erpList(plan.modules).includes(m.key)]),
    );
    modulesDoc.items = [
      {
        id: tenant.tenantId,
        tenantId: tenant.tenantId,
        enabled,
        updatedAt: erpNow(),
      },
      ...erpList(modulesDoc.items),
    ];
    erpWriteCollection(COLLECTIONS.modules, modulesDoc);
  }

  const usageDoc = erpReadCollection(COLLECTIONS.usage);
  if (!erpList(usageDoc.items).some((u) => u.tenantId === tenant.tenantId)) {
    usageDoc.items = [
      {
        id: tenant.tenantId,
        tenantId: tenant.tenantId,
        ...emptyUsage(),
        users: Number(tenant.usersCount || 0),
        storageGb: Number(tenant.storageGbUsed || 0),
        students: Math.floor(Number(tenant.usersCount || 0) * 0.7),
        teachers: Math.floor(Number(tenant.usersCount || 0) * 0.08),
        updatedAt: erpNow(),
      },
      ...erpList(usageDoc.items),
    ];
    erpWriteCollection(COLLECTIONS.usage, usageDoc);
  }

  const subDoc = erpReadCollection(COLLECTIONS.subscriptions);
  if (!erpList(subDoc.items).some((s) => s.tenantId === tenant.tenantId && s.status !== 'ended')) {
    const now = erpNow();
    subDoc.items = [
      {
        id: erpId(),
        tenantId: tenant.tenantId,
        planKey: tenant.planKey,
        billingCycle: tenant.billingCycle || 'monthly',
        status: tenant.status === 'trial' ? 'trial' : 'active',
        startedAt: now,
        renewsAt: addDays(now, tenant.billingCycle === 'yearly' ? 365 : 30),
        trialEndsAt: tenant.status === 'trial' ? addDays(now, plan.trialDays || 14) : null,
        price: plan.customPricing
          ? 0
          : tenant.billingCycle === 'yearly'
            ? plan.priceYearly
            : plan.priceMonthly,
        currency: tenant.currency || 'USD',
        limits: { ...plan.limits },
        createdAt: now,
        updatedAt: now,
      },
      ...erpList(subDoc.items),
    ];
    erpWriteCollection(COLLECTIONS.subscriptions, subDoc);
  }

  // Isolated data namespace marker
  const dataDoc = erpReadCollection(COLLECTIONS.tenantData);
  if (!erpList(dataDoc.items).some((d) => d.tenantId === tenant.tenantId)) {
    dataDoc.items = [
      {
        id: tenant.tenantId,
        tenantId: tenant.tenantId,
        collections: Object.fromEntries(MT_ISOLATED_COLLECTIONS.map((c) => [c, 0])),
        encryptedAtRest: true,
        backupEnabled: true,
        lastBackupAt: null,
        updatedAt: erpNow(),
      },
      ...erpList(dataDoc.items),
    ];
    erpWriteCollection(COLLECTIONS.tenantData, dataDoc);
  }
}

function writeAudit(entry) {
  const doc = erpReadCollection(COLLECTIONS.audit);
  const row = { id: erpId(), at: erpNow(), ...entry };
  doc.items = [row, ...erpList(doc.items)].slice(0, 5000);
  erpWriteCollection(COLLECTIONS.audit, doc);
  erpAppendAudit({
    action: entry.action || 'mt_event',
    moduleId: entry.moduleId || 'multi-tenant-platform',
    user: entry.user || 'system',
    entityId: entry.tenantId || entry.entityId,
    newValue: entry,
  });
  return row;
}

function listTenants({ includeDeleted = false } = {}) {
  return erpList(erpReadCollection(COLLECTIONS.tenants).items).filter((t) => {
    if (includeDeleted) return true;
    return t.status !== 'deleted' && !t.deletedAt;
  });
}

function getTenant(tenantId) {
  return listTenants({ includeDeleted: true }).find((t) => t.tenantId === tenantId || t.id === tenantId) || null;
}

function saveTenant(tenant) {
  const doc = erpReadCollection(COLLECTIONS.tenants);
  const exists = erpList(doc.items).some((t) => t.tenantId === tenant.tenantId);
  doc.items = exists
    ? erpList(doc.items).map((t) => (t.tenantId === tenant.tenantId ? tenant : t))
    : [tenant, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.tenants, doc);
  return tenant;
}

function subdomainTaken(subdomain, exceptTenantId) {
  const slug = erpText(subdomain).toLowerCase();
  return listTenants({ includeDeleted: true }).some(
    (t) => t.subdomain === slug && t.tenantId !== exceptTenantId && t.status !== 'deleted',
  );
}

/**
 * Owner: create tenant with plan, branding shell, modules, isolation namespace.
 */
export function createTenant(payload = {}, meta = {}) {
  ensureMultiTenantEngine();
  const config = getMtConfig();
  const activeCount = listTenants().length;
  if (config.maxTenantsSoftCap != null && activeCount >= Number(config.maxTenantsSoftCap)) {
    return { ok: false, error: 'TENANT_SOFT_CAP_REACHED' };
  }

  const name = erpText(payload.name);
  if (!name) return { ok: false, error: 'NAME_REQUIRED' };
  const orgType = erpText(payload.orgType) || 'school';
  if (!MT_ORG_TYPES.some((o) => o.key === orgType)) return { ok: false, error: 'INVALID_ORG_TYPE' };

  const planKey = erpText(payload.planKey) || 'starter';
  const plan = findMtPlan(planKey);
  if (!plan) return { ok: false, error: 'INVALID_PLAN' };

  let subdomain = slugifyTenant(payload.subdomain || name);
  if (subdomainTaken(subdomain)) {
    subdomain = `${subdomain}-${Date.now().toString(36).slice(-4)}`;
  }

  const billingCycle = erpText(payload.billingCycle) || 'monthly';
  if (!MT_BILLING_CYCLES.includes(billingCycle)) return { ok: false, error: 'INVALID_BILLING_CYCLE' };

  const now = erpNow();
  const startTrial = payload.startTrial !== false && (plan.trialDays || 0) > 0;
  const tenantId = erpId();
  const tenant = {
    id: tenantId,
    tenantId,
    name,
    orgType,
    subdomain,
    domain: erpText(payload.domain),
    country: erpText(payload.country) || 'JO',
    currency: erpText(payload.currency) || config.defaultCurrency,
    timezone: erpText(payload.timezone) || config.defaultTimezone,
    languages: erpList(payload.languages).length ? erpList(payload.languages) : [...config.defaultLanguages],
    planKey,
    billingCycle,
    status: startTrial ? 'trial' : 'active',
    logoUrl: erpText(payload.logoUrl),
    brandColors: {
      primary: erpText(payload.primaryColor) || MT_DEFAULT_BRANDING.primaryColor,
      secondary: erpText(payload.secondaryColor) || MT_DEFAULT_BRANDING.secondaryColor,
    },
    theme: erpText(payload.theme) || 'default',
    storageGbUsed: 0,
    usersCount: 1,
    healthScore: 100,
    trialEndsAt: startTrial ? addDays(now, plan.trialDays || config.trialDays) : null,
    graceEndsAt: null,
    suspendedAt: null,
    suspendedReason: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: meta.user || 'owner',
  };

  saveTenant(tenant);
  ensureTenantSideData(tenant);

  // Optional custom limits
  if (payload.limits && typeof payload.limits === 'object') {
    setTenantLimits(tenantId, payload.limits, meta);
  }
  // Optional module overrides
  if (payload.modules && typeof payload.modules === 'object') {
    setTenantModules(tenantId, payload.modules, meta);
  }

  writeAudit({
    action: 'tenant_create',
    tenantId,
    user: meta.user || 'owner',
    name,
    planKey,
  });
  publishLive({ type: 'tenant.created', tenantId });
  return { ok: true, tenant: enrichTenant(tenant) };
}

function enrichTenant(tenant) {
  if (!tenant) return null;
  const plan = findMtPlan(tenant.planKey);
  const branding = getTenantBranding(tenant.tenantId);
  const modules = getTenantModules(tenant.tenantId);
  const usage = getTenantUsage(tenant.tenantId);
  const subscription = getActiveSubscription(tenant.tenantId);
  const limits = subscription?.limits || plan?.limits || {};
  const isolation = getTenantIsolation(tenant.tenantId);
  return {
    ...tenant,
    plan,
    branding,
    modules: modules?.enabled || {},
    usage,
    limits,
    subscription,
    isolation,
    limitStatus: computeLimitStatus(usage, limits),
    publicUrl: tenant.domain
      ? `https://${tenant.domain}`
      : `https://${tenant.subdomain}.${getMtConfig().platformDomain}`,
  };
}

function getTenantBranding(tenantId) {
  return erpList(erpReadCollection(COLLECTIONS.branding).items).find((b) => b.tenantId === tenantId) || null;
}

function getTenantModules(tenantId) {
  return erpList(erpReadCollection(COLLECTIONS.modules).items).find((m) => m.tenantId === tenantId) || null;
}

function getTenantUsage(tenantId) {
  return erpList(erpReadCollection(COLLECTIONS.usage).items).find((u) => u.tenantId === tenantId) || {
    tenantId,
    ...emptyUsage(),
  };
}

function getTenantIsolation(tenantId) {
  return erpList(erpReadCollection(COLLECTIONS.tenantData).items).find((d) => d.tenantId === tenantId) || null;
}

function getActiveSubscription(tenantId) {
  return erpList(erpReadCollection(COLLECTIONS.subscriptions).items).find(
    (s) => s.tenantId === tenantId && !['ended', 'cancelled'].includes(s.status),
  );
}

function computeLimitStatus(usage, limits) {
  const status = {};
  for (const key of MT_RESOURCE_LIMIT_KEYS) {
    const limit = limits?.[key];
    const used = Number(usage?.[key] || 0);
    if (limit == null) {
      status[key] = { used, limit: null, unlimited: true, pct: 0, exceeded: false };
    } else {
      const pct = limit === 0 ? (used > 0 ? 1 : 0) : used / limit;
      status[key] = { used, limit, unlimited: false, pct: Number(pct.toFixed(3)), exceeded: used > limit };
    }
  }
  return status;
}

export function updateTenant(tenantId, patch = {}, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant || tenant.status === 'deleted') return { ok: false, error: 'TENANT_NOT_FOUND' };

  const next = { ...tenant };
  for (const key of [
    'name',
    'orgType',
    'country',
    'currency',
    'timezone',
    'theme',
    'logoUrl',
    'domain',
  ]) {
    if (patch[key] !== undefined) next[key] = patch[key];
  }
  if (patch.languages) next.languages = erpList(patch.languages);
  if (patch.subdomain) {
    const slug = slugifyTenant(patch.subdomain);
    if (subdomainTaken(slug, tenant.tenantId)) return { ok: false, error: 'SUBDOMAIN_TAKEN' };
    next.subdomain = slug;
  }
  if (patch.primaryColor || patch.secondaryColor) {
    next.brandColors = {
      primary: patch.primaryColor || next.brandColors?.primary,
      secondary: patch.secondaryColor || next.brandColors?.secondary,
    };
  }
  next.updatedAt = erpNow();
  next.updatedBy = meta.user || 'owner';
  saveTenant(next);

  if (patch.subdomain || patch.domain || patch.primaryColor || patch.secondaryColor || patch.brandName || patch.logoUrl) {
    updateWhiteLabel(tenantId, {
      subdomain: next.subdomain,
      domain: next.domain,
      primaryColor: next.brandColors?.primary,
      secondaryColor: next.brandColors?.secondary,
      brandName: patch.brandName || next.name,
      logoUrl: next.logoUrl,
    }, meta);
  }

  writeAudit({ action: 'tenant_update', tenantId, user: meta.user || 'owner', patch });
  publishLive({ type: 'tenant.updated', tenantId });
  return { ok: true, tenant: enrichTenant(next) };
}

export function updateWhiteLabel(tenantId, brandingPatch = {}, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant || tenant.status === 'deleted') return { ok: false, error: 'TENANT_NOT_FOUND' };

  const doc = erpReadCollection(COLLECTIONS.branding);
  const existing = erpList(doc.items).find((b) => b.tenantId === tenantId) || {
    id: tenantId,
    tenantId,
    ...MT_DEFAULT_BRANDING,
  };
  const next = { ...existing };
  for (const field of MT_WHITE_LABEL_FIELDS) {
    if (brandingPatch[field] !== undefined) next[field] = brandingPatch[field];
  }
  // Also accept nested brand colors shortcuts
  if (brandingPatch.primaryColor) next.primaryColor = brandingPatch.primaryColor;
  if (brandingPatch.secondaryColor) next.secondaryColor = brandingPatch.secondaryColor;
  next.updatedAt = erpNow();
  next.updatedBy = meta.user || 'owner';

  doc.items = erpList(doc.items).some((b) => b.tenantId === tenantId)
    ? erpList(doc.items).map((b) => (b.tenantId === tenantId ? next : b))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.branding, doc);

  // Mirror key fields onto tenant record
  const t = {
    ...tenant,
    logoUrl: next.logoUrl || tenant.logoUrl,
    domain: next.domain ?? tenant.domain,
    subdomain: next.subdomain || tenant.subdomain,
    brandColors: { primary: next.primaryColor, secondary: next.secondaryColor },
    updatedAt: erpNow(),
  };
  saveTenant(t);

  writeAudit({ action: 'white_label_update', tenantId, user: meta.user || 'owner' });
  publishLive({ type: 'branding.updated', tenantId });
  return { ok: true, branding: next, tenant: enrichTenant(t) };
}

export function setTenantModules(tenantId, enabledMap = {}, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant || tenant.status === 'deleted') return { ok: false, error: 'TENANT_NOT_FOUND' };

  const doc = erpReadCollection(COLLECTIONS.modules);
  const existing = erpList(doc.items).find((m) => m.tenantId === tenantId) || {
    id: tenantId,
    tenantId,
    enabled: {},
  };
  const enabled = { ...existing.enabled };
  for (const mod of MT_MODULES) {
    if (enabledMap[mod.key] !== undefined) enabled[mod.key] = Boolean(enabledMap[mod.key]);
  }
  const next = { ...existing, enabled, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  doc.items = erpList(doc.items).some((m) => m.tenantId === tenantId)
    ? erpList(doc.items).map((m) => (m.tenantId === tenantId ? next : m))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.modules, doc);
  writeAudit({ action: 'modules_update', tenantId, user: meta.user || 'owner', enabled });
  publishLive({ type: 'modules.updated', tenantId });
  return { ok: true, modules: next };
}

export function setTenantLimits(tenantId, limitsPatch = {}, meta = {}) {
  ensureMultiTenantEngine();
  const sub = getActiveSubscription(tenantId);
  if (!sub) return { ok: false, error: 'SUBSCRIPTION_NOT_FOUND' };
  const limits = { ...sub.limits };
  for (const key of MT_RESOURCE_LIMIT_KEYS) {
    if (limitsPatch[key] !== undefined) {
      const v = limitsPatch[key];
      limits[key] = v === null || v === '' ? null : Number(v);
    }
  }
  const doc = erpReadCollection(COLLECTIONS.subscriptions);
  const next = { ...sub, limits, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  doc.items = erpList(doc.items).map((s) => (s.id === sub.id ? next : s));
  erpWriteCollection(COLLECTIONS.subscriptions, doc);
  writeAudit({ action: 'limits_update', tenantId, user: meta.user || 'owner', limits });
  publishLive({ type: 'limits.updated', tenantId });
  return { ok: true, subscription: next };
}

export function changeTenantPlan(tenantId, payload = {}, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant || tenant.status === 'deleted') return { ok: false, error: 'TENANT_NOT_FOUND' };
  const planKey = erpText(payload.planKey);
  const plan = findMtPlan(planKey);
  if (!plan) return { ok: false, error: 'INVALID_PLAN' };
  const billingCycle = erpText(payload.billingCycle) || tenant.billingCycle || 'monthly';

  const nextTenant = {
    ...tenant,
    planKey,
    billingCycle,
    status: tenant.status === 'suspended' ? 'suspended' : tenant.status === 'trial' ? 'trial' : 'active',
    updatedAt: erpNow(),
  };
  saveTenant(nextTenant);

  const subDoc = erpReadCollection(COLLECTIONS.subscriptions);
  const current = getActiveSubscription(tenantId);
  if (current) {
    const ended = { ...current, status: 'ended', endedAt: erpNow(), updatedAt: erpNow() };
    subDoc.items = erpList(subDoc.items).map((s) => (s.id === current.id ? ended : s));
  }
  const now = erpNow();
  const price =
    plan.customPricing ? Number(payload.customPrice || 0) : billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const newSub = {
    id: erpId(),
    tenantId,
    planKey,
    billingCycle,
    status: 'active',
    startedAt: now,
    renewsAt: addDays(now, billingCycle === 'yearly' ? 365 : billingCycle === 'quarterly' ? 90 : 30),
    price,
    currency: tenant.currency || 'USD',
    limits: payload.limits ? { ...plan.limits, ...payload.limits } : { ...plan.limits },
    createdAt: now,
    updatedAt: now,
    changedFrom: current?.planKey || tenant.planKey,
    changedBy: meta.user || 'owner',
  };
  subDoc.items = [newSub, ...erpList(subDoc.items)];
  erpWriteCollection(COLLECTIONS.subscriptions, subDoc);

  // Align modules to plan defaults (keep extras already enabled if enterprise/custom)
  const modDefaults = Object.fromEntries(MT_MODULES.map((m) => [m.key, erpList(plan.modules).includes(m.key)]));
  const existingMods = getTenantModules(tenantId)?.enabled || {};
  const merged = { ...modDefaults };
  for (const k of Object.keys(existingMods)) {
    if (existingMods[k] && modDefaults[k]) merged[k] = true;
    if (planKey === 'enterprise' || planKey === 'custom' || planKey === 'government') {
      if (existingMods[k]) merged[k] = true;
    }
  }
  setTenantModules(tenantId, merged, meta);

  writeAudit({ action: 'plan_change', tenantId, user: meta.user || 'owner', planKey, billingCycle });
  publishLive({ type: 'plan.changed', tenantId, planKey });
  return { ok: true, tenant: enrichTenant(nextTenant), subscription: newSub };
}

export function suspendTenant(tenantId, payload = {}, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant || tenant.status === 'deleted') return { ok: false, error: 'TENANT_NOT_FOUND' };
  const next = {
    ...tenant,
    status: 'suspended',
    suspendedAt: erpNow(),
    suspendedReason: erpText(payload.reason) || 'owner_suspend',
    updatedAt: erpNow(),
  };
  saveTenant(next);
  writeAudit({ action: 'tenant_suspend', tenantId, user: meta.user || 'owner', reason: next.suspendedReason });
  publishLive({ type: 'tenant.suspended', tenantId });
  return { ok: true, tenant: enrichTenant(next) };
}

export function activateTenant(tenantId, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant || tenant.status === 'deleted') return { ok: false, error: 'TENANT_NOT_FOUND' };
  const next = {
    ...tenant,
    status: 'active',
    suspendedAt: null,
    suspendedReason: null,
    graceEndsAt: null,
    updatedAt: erpNow(),
  };
  saveTenant(next);
  writeAudit({ action: 'tenant_activate', tenantId, user: meta.user || 'owner' });
  publishLive({ type: 'tenant.activated', tenantId });
  return { ok: true, tenant: enrichTenant(next) };
}

export function softDeleteTenant(tenantId, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant) return { ok: false, error: 'TENANT_NOT_FOUND' };
  const next = {
    ...tenant,
    status: 'deleted',
    deletedAt: erpNow(),
    deletedBy: meta.user || 'owner',
    updatedAt: erpNow(),
  };
  saveTenant(next);
  writeAudit({ action: 'tenant_soft_delete', tenantId, user: meta.user || 'owner' });
  publishLive({ type: 'tenant.deleted', tenantId });
  return { ok: true, tenant: enrichTenant(next) };
}

export function restoreTenant(tenantId, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant) return { ok: false, error: 'TENANT_NOT_FOUND' };
  const next = {
    ...tenant,
    status: 'active',
    deletedAt: null,
    deletedBy: null,
    restoredAt: erpNow(),
    restoredBy: meta.user || 'owner',
    updatedAt: erpNow(),
  };
  saveTenant(next);
  writeAudit({ action: 'tenant_restore', tenantId, user: meta.user || 'owner' });
  publishLive({ type: 'tenant.restored', tenantId });
  return { ok: true, tenant: enrichTenant(next) };
}

/**
 * Record usage against tenant limits (tenant-aware API metering).
 */
export function recordTenantUsage(tenantId, usagePatch = {}, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant || ['deleted', 'suspended'].includes(tenant.status)) {
    return { ok: false, error: 'TENANT_UNAVAILABLE', status: tenant?.status };
  }
  const doc = erpReadCollection(COLLECTIONS.usage);
  const existing = getTenantUsage(tenantId);
  const next = { ...existing, tenantId, id: tenantId, updatedAt: erpNow() };
  for (const key of MT_RESOURCE_LIMIT_KEYS) {
    if (usagePatch[key] !== undefined) {
      next[key] = Number(next[key] || 0) + Number(usagePatch[key] || 0);
    }
  }
  doc.items = erpList(doc.items).some((u) => u.tenantId === tenantId)
    ? erpList(doc.items).map((u) => (u.tenantId === tenantId ? next : u))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.usage, doc);

  const sub = getActiveSubscription(tenantId);
  const limitStatus = computeLimitStatus(next, sub?.limits || {});
  const exceeded = Object.values(limitStatus).some((s) => s.exceeded);

  // Update isolation counters lightly
  const isoDoc = erpReadCollection(COLLECTIONS.tenantData);
  const iso = getTenantIsolation(tenantId);
  if (iso) {
    const collections = { ...iso.collections };
    if (usagePatch.students) collections.students = Number(collections.students || 0) + Number(usagePatch.students);
    if (usagePatch.teachers) collections.teachers = Number(collections.teachers || 0) + Number(usagePatch.teachers);
    if (usagePatch.users) collections.users = Number(collections.users || 0) + Number(usagePatch.users);
    const isoNext = { ...iso, collections, updatedAt: erpNow() };
    isoDoc.items = erpList(isoDoc.items).map((d) => (d.tenantId === tenantId ? isoNext : d));
    erpWriteCollection(COLLECTIONS.tenantData, isoDoc);
  }

  publishLive({ type: 'usage.recorded', tenantId });
  return { ok: true, usage: next, limitStatus, exceeded };
}

export function createInvoice(tenantId, payload = {}, meta = {}) {
  ensureMultiTenantEngine();
  const tenant = getTenant(tenantId);
  if (!tenant) return { ok: false, error: 'TENANT_NOT_FOUND' };
  const sub = getActiveSubscription(tenantId);
  const amount = money(payload.amount != null ? payload.amount : sub?.price || 0);
  const invoice = {
    id: erpId(),
    tenantId,
    number: `INV-${Date.now().toString(36).toUpperCase()}`,
    amount,
    currency: tenant.currency || 'USD',
    status: payload.status || 'open',
    periodStart: payload.periodStart || erpNow(),
    periodEnd: payload.periodEnd || sub?.renewsAt || addDays(erpNow(), 30),
    planKey: tenant.planKey,
    createdAt: erpNow(),
    createdBy: meta.user || 'system',
  };
  const doc = erpReadCollection(COLLECTIONS.invoices);
  doc.items = [invoice, ...erpList(doc.items)].slice(0, 5000);
  erpWriteCollection(COLLECTIONS.invoices, doc);
  writeAudit({ action: 'invoice_create', tenantId, user: meta.user || 'system', invoiceId: invoice.id, amount });
  publishLive({ type: 'invoice.created', tenantId, invoiceId: invoice.id });
  return { ok: true, invoice };
}

export function payInvoice(invoiceId, meta = {}) {
  ensureMultiTenantEngine();
  const doc = erpReadCollection(COLLECTIONS.invoices);
  const invoice = erpList(doc.items).find((i) => i.id === invoiceId);
  if (!invoice) return { ok: false, error: 'INVOICE_NOT_FOUND' };
  const next = { ...invoice, status: 'paid', paidAt: erpNow(), paidBy: meta.user || 'system' };
  doc.items = erpList(doc.items).map((i) => (i.id === invoiceId ? next : i));
  erpWriteCollection(COLLECTIONS.invoices, doc);

  const tenant = getTenant(invoice.tenantId);
  if (tenant && ['past_due', 'grace', 'trial'].includes(tenant.status)) {
    saveTenant({ ...tenant, status: 'active', updatedAt: erpNow() });
  }
  writeAudit({ action: 'invoice_paid', tenantId: invoice.tenantId, user: meta.user || 'system', invoiceId });
  publishLive({ type: 'invoice.paid', invoiceId });
  return { ok: true, invoice: next };
}

/**
 * Billing tick: renewals, trials → grace → suspend.
 */
export function runBillingTick(meta = {}) {
  ensureMultiTenantEngine();
  const config = getMtConfig();
  const now = Date.now();
  const results = { renewed: 0, trialsEnded: 0, graceStarted: 0, suspended: 0, invoices: 0 };

  for (const tenant of listTenants()) {
    const sub = getActiveSubscription(tenant.tenantId);
    if (!sub) continue;

    if (tenant.status === 'trial' && tenant.trialEndsAt && new Date(tenant.trialEndsAt).getTime() < now) {
      const graceEnds = addDays(erpNow(), config.gracePeriodDays);
      saveTenant({
        ...tenant,
        status: 'grace',
        graceEndsAt: graceEnds,
        updatedAt: erpNow(),
      });
      results.trialsEnded += 1;
      results.graceStarted += 1;
      createInvoice(tenant.tenantId, { amount: sub.price, status: 'open' }, meta);
      results.invoices += 1;
      continue;
    }

    if (tenant.status === 'grace' && tenant.graceEndsAt && new Date(tenant.graceEndsAt).getTime() < now) {
      suspendTenant(tenant.tenantId, { reason: 'grace_period_expired' }, meta);
      results.suspended += 1;
      continue;
    }

    if (sub.renewsAt && new Date(sub.renewsAt).getTime() < now && ['active'].includes(tenant.status)) {
      const days = sub.billingCycle === 'yearly' ? 365 : sub.billingCycle === 'quarterly' ? 90 : 30;
      const subDoc = erpReadCollection(COLLECTIONS.subscriptions);
      const renewed = {
        ...sub,
        renewsAt: addDays(erpNow(), days),
        lastRenewedAt: erpNow(),
        updatedAt: erpNow(),
      };
      subDoc.items = erpList(subDoc.items).map((s) => (s.id === sub.id ? renewed : s));
      erpWriteCollection(COLLECTIONS.subscriptions, subDoc);
      createInvoice(tenant.tenantId, { amount: sub.price, status: 'open' }, meta);
      results.renewed += 1;
      results.invoices += 1;
    }
  }

  publishLive({ type: 'billing.tick', results });
  return { ok: true, results };
}

/**
 * Owner impersonation — always audited. No silent cross-tenant access.
 */
export function startImpersonation(tenantId, payload = {}, meta = {}) {
  ensureMultiTenantEngine();
  const config = getMtConfig();
  const tenant = getTenant(tenantId);
  if (!tenant || tenant.status === 'deleted') return { ok: false, error: 'TENANT_NOT_FOUND' };
  const reason = erpText(payload.reason);
  if (config.impersonationRequiresReason && !reason) {
    return { ok: false, error: 'REASON_REQUIRED' };
  }
  const session = {
    id: erpId(),
    tenantId,
    actor: meta.user || 'owner',
    actorRole: meta.role || 'owner',
    reason: reason || 'unspecified',
    startedAt: erpNow(),
    endedAt: null,
    status: 'active',
  };
  const doc = erpReadCollection(COLLECTIONS.impersonations);
  doc.items = [session, ...erpList(doc.items)].slice(0, 2000);
  erpWriteCollection(COLLECTIONS.impersonations, doc);
  writeAudit({
    action: 'impersonation_start',
    tenantId,
    user: meta.user || 'owner',
    reason: session.reason,
    sessionId: session.id,
  });
  publishLive({ type: 'impersonation.started', tenantId, sessionId: session.id });
  return {
    ok: true,
    session,
    tenantContext: resolveTenantContext({ tenantId, role: 'tenant_admin', impersonatedBy: meta.user || 'owner' }),
  };
}

export function endImpersonation(sessionId, meta = {}) {
  ensureMultiTenantEngine();
  const doc = erpReadCollection(COLLECTIONS.impersonations);
  const session = erpList(doc.items).find((s) => s.id === sessionId);
  if (!session) return { ok: false, error: 'SESSION_NOT_FOUND' };
  const next = { ...session, status: 'ended', endedAt: erpNow(), endedBy: meta.user || 'owner' };
  doc.items = erpList(doc.items).map((s) => (s.id === sessionId ? next : s));
  erpWriteCollection(COLLECTIONS.impersonations, doc);
  writeAudit({ action: 'impersonation_end', tenantId: session.tenantId, user: meta.user || 'owner', sessionId });
  publishLive({ type: 'impersonation.ended', sessionId });
  return { ok: true, session: next };
}

/**
 * Tenant-aware API context — authentication, routing, limits, logs.
 */
export function resolveTenantContext(payload = {}) {
  ensureMultiTenantEngine();
  const tenantId = erpText(payload.tenantId);
  const subdomain = erpText(payload.subdomain);
  const domain = erpText(payload.domain);
  let tenant = null;
  if (tenantId) tenant = getTenant(tenantId);
  else if (subdomain) tenant = listTenants().find((t) => t.subdomain === subdomain);
  else if (domain) tenant = listTenants().find((t) => t.domain === domain);

  if (!tenant || tenant.status === 'deleted') {
    return { ok: false, error: 'TENANT_NOT_FOUND' };
  }
  if (tenant.status === 'suspended') {
    return { ok: false, error: 'TENANT_SUSPENDED', tenantId: tenant.tenantId };
  }

  const enriched = enrichTenant(tenant);
  const role = erpText(payload.role) || 'tenant_admin';
  const isOwner = ['owner', 'super_admin', 'admin'].includes(role) || Boolean(payload.impersonatedBy);

  return {
    ok: true,
    tenantId: tenant.tenantId,
    status: tenant.status,
    role,
    isOwner,
    crossTenantForbidden: !isOwner,
    modules: enriched.modules,
    branding: enriched.branding,
    limits: enriched.limits,
    limitStatus: enriched.limitStatus,
    isolation: {
      collections: MT_ISOLATED_COLLECTIONS,
      namespace: `tenant:${tenant.tenantId}`,
      encryptedAtRest: enriched.isolation?.encryptedAtRest !== false,
    },
    publicUrl: enriched.publicUrl,
    impersonatedBy: payload.impersonatedBy || null,
  };
}

/**
 * Tenant Admin scope — only own organization data.
 */
export function getTenantAdminDashboard(tenantId, meta = {}) {
  ensureMultiTenantEngine();
  const ctx = resolveTenantContext({ tenantId, role: meta.role || 'tenant_admin' });
  if (!ctx.ok) return ctx;
  if (ctx.crossTenantForbidden === false && meta.role === 'tenant_admin') {
    // tenant admin path
  }
  const tenant = enrichTenant(getTenant(tenantId));
  const invoices = erpList(erpReadCollection(COLLECTIONS.invoices).items)
    .filter((i) => i.tenantId === tenantId)
    .slice(0, 20);
  return {
    ok: true,
    scope: 'tenant',
    tenant,
    context: ctx,
    invoices,
    message: 'Tenant Admin can manage only this organization. No cross-tenant access.',
  };
}

export function getGlobalMtAnalytics() {
  ensureMultiTenantEngine();
  const tenants = listTenants().map((t) => enrichTenant(t));
  const invoices = erpList(erpReadCollection(COLLECTIONS.invoices).items);
  const paid = invoices.filter((i) => i.status === 'paid');
  const revenueByTenant = {};
  for (const inv of paid) {
    revenueByTenant[inv.tenantId] = money(Number(revenueByTenant[inv.tenantId] || 0) + Number(inv.amount || 0));
  }
  const byStatus = {};
  const byPlan = {};
  const byOrgType = {};
  let users = 0;
  let aiCredits = 0;
  let storage = 0;
  for (const t of tenants) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    byPlan[t.planKey] = (byPlan[t.planKey] || 0) + 1;
    byOrgType[t.orgType] = (byOrgType[t.orgType] || 0) + 1;
    users += Number(t.usage?.users || t.usersCount || 0);
    aiCredits += Number(t.usage?.aiCredits || 0);
    storage += Number(t.usage?.storageGb || t.storageGbUsed || 0);
  }
  const top = [...tenants]
    .sort((a, b) => Number(b.healthScore || 0) - Number(a.healthScore || 0))
    .slice(0, 8)
    .map((t) => ({
      tenantId: t.tenantId,
      name: t.name,
      planKey: t.planKey,
      healthScore: t.healthScore,
      users: t.usage?.users || t.usersCount,
      revenue: revenueByTenant[t.tenantId] || 0,
    }));

  return {
    totalTenants: tenants.length,
    revenueTotal: money(paid.reduce((s, i) => s + Number(i.amount || 0), 0)),
    revenueByTenant,
    growthByTenant: tenants.map((t) => ({
      tenantId: t.tenantId,
      name: t.name,
      users: t.usage?.users || 0,
      createdAt: t.createdAt,
    })),
    activeUsers: users,
    aiUsage: aiCredits,
    storageUsageGb: storage,
    subscriptionStatus: byStatus,
    byPlan,
    byOrgType,
    healthScoreAvg: tenants.length
      ? Math.round(tenants.reduce((s, t) => s + Number(t.healthScore || 0), 0) / tenants.length)
      : null,
    topPerformingTenants: top,
  };
}

export function getMultiTenantDashboard() {
  ensureMultiTenantEngine();
  const tenants = listTenants({ includeDeleted: true }).map((t) => enrichTenant(t));
  const active = tenants.filter((t) => t.status !== 'deleted');
  const analytics = getGlobalMtAnalytics();
  return {
    ok: true,
    generatedAt: erpNow(),
    config: getMtConfig(),
    catalog: {
      orgTypes: MT_ORG_TYPES,
      plans: MT_SUBSCRIPTION_PLANS,
      modules: MT_MODULES,
      statuses: MT_TENANT_STATUSES,
      billingCycles: MT_BILLING_CYCLES,
      resourceLimits: MT_RESOURCE_LIMIT_KEYS,
      whiteLabelFields: MT_WHITE_LABEL_FIELDS,
      isolatedCollections: MT_ISOLATED_COLLECTIONS,
    },
    stats: {
      tenants: active.length,
      deleted: tenants.filter((t) => t.status === 'deleted').length,
      trial: active.filter((t) => t.status === 'trial').length,
      active: active.filter((t) => t.status === 'active').length,
      suspended: active.filter((t) => t.status === 'suspended').length,
      revenue: analytics.revenueTotal,
      users: analytics.activeUsers,
      healthAvg: analytics.healthScoreAvg,
      openInvoices: erpList(erpReadCollection(COLLECTIONS.invoices).items).filter((i) => i.status === 'open').length,
    },
    tenants: active,
    deletedTenants: tenants.filter((t) => t.status === 'deleted').slice(0, 20),
    subscriptions: erpList(erpReadCollection(COLLECTIONS.subscriptions).items).slice(0, 50),
    invoices: erpList(erpReadCollection(COLLECTIONS.invoices).items).slice(0, 40),
    impersonations: erpList(erpReadCollection(COLLECTIONS.impersonations).items).slice(0, 30),
    audit: erpList(erpReadCollection(COLLECTIONS.audit).items).slice(0, 40),
    analytics,
  };
}

export async function mutateMultiTenantCenter(action, payload = {}, meta = {}) {
  ensureMultiTenantEngine();
  switch (action) {
    case 'createTenant':
      return createTenant(payload, meta);
    case 'updateTenant':
      return updateTenant(payload.tenantId || payload.id, payload, meta);
    case 'updateWhiteLabel':
      return updateWhiteLabel(payload.tenantId || payload.id, payload.branding || payload, meta);
    case 'setModules':
      return setTenantModules(payload.tenantId || payload.id, payload.modules || payload.enabled || payload, meta);
    case 'setLimits':
      return setTenantLimits(payload.tenantId || payload.id, payload.limits || payload, meta);
    case 'changePlan':
      return changeTenantPlan(payload.tenantId || payload.id, payload, meta);
    case 'suspend':
      return suspendTenant(payload.tenantId || payload.id, payload, meta);
    case 'activate':
      return activateTenant(payload.tenantId || payload.id, meta);
    case 'softDelete':
      return softDeleteTenant(payload.tenantId || payload.id, meta);
    case 'restore':
      return restoreTenant(payload.tenantId || payload.id, meta);
    case 'recordUsage':
      return recordTenantUsage(payload.tenantId || payload.id, payload.usage || payload, meta);
    case 'createInvoice':
      return createInvoice(payload.tenantId || payload.id, payload, meta);
    case 'payInvoice':
      return payInvoice(payload.invoiceId || payload.id, meta);
    case 'billingTick':
      return runBillingTick(meta);
    case 'impersonate':
      return startImpersonation(payload.tenantId || payload.id, payload, meta);
    case 'endImpersonation':
      return endImpersonation(payload.sessionId || payload.id, meta);
    case 'resolveContext':
      return resolveTenantContext(payload);
    case 'tenantAdminDashboard':
      return getTenantAdminDashboard(payload.tenantId || payload.id, meta);
    case 'setConfig':
      return setMtConfig(payload, meta);
    case 'analytics':
      return { ok: true, analytics: getGlobalMtAnalytics() };
    case 'sync':
      return ensureMultiTenantEngine();
    default:
      return { ok: false, error: 'UNKNOWN_ACTION', action };
  }
}

export const MT_MODULE_IDS = Object.freeze([
  'multi-tenant-platform',
  'mt-tenants',
  'mt-white-label',
  'mt-modules',
  'mt-subscriptions',
  'mt-billing',
  'mt-limits',
  'mt-isolation',
  'mt-tenant-admin',
  'mt-analytics',
  'mt-security',
]);
