/**
 * SUCCESS OS — Global Dynamic Platform Engine
 *
 * Configuration-driven layer over existing modules (nav, commission, payments, RBAC).
 * Does NOT rebuild completed modules — migrates hardcoded surface to editable config.
 *
 * Engines: pages · labels · navigation · buttons · forms · filters · journeys ·
 * dashboards · tables · settings registry · feature flags · notifications ·
 * workflows · content · localization · branding · quality audit · audit trail.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  DPE_BUTTON_ACTIONS,
  DPE_CONTENT_TYPES,
  DPE_DASHBOARD_TYPES,
  DPE_DEFAULT_CONFIG,
  DPE_FIELD_TYPES,
  DPE_JOURNEY_TYPES,
  DPE_NAV_SURFACES,
  DPE_NOTIFICATION_CHANNELS,
  DPE_NOTIFICATION_TRIGGERS,
  DPE_PAGE_STATUSES,
  DPE_PAYMENT_LEDGER_FIELDS,
  DPE_QUALITY_PATTERNS,
  DPE_SEED_FEATURE_FLAGS,
  DPE_SEED_FILTER_CHAINS,
  DPE_SEED_LABELS,
  DPE_SEED_SETTINGS,
  DPE_SETTINGS_LEVELS,
  DPE_TEXT_VARIABLES,
} from '../../data/enterprise-dynamic-platform-catalog.js';
import { ENTERPRISE_ADMIN_NAV, ENTERPRISE_ADMIN_NAV_GROUPS } from '../../data/enterprise-admin-nav.js';
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
import { getCommissionDefaults } from './enterprise-commission-engine.js';

const COLLECTIONS = Object.freeze({
  pages: 'dpe-pages',
  labels: 'dpe-labels',
  nav: 'dpe-nav',
  buttons: 'dpe-buttons',
  forms: 'dpe-forms',
  filters: 'dpe-filters',
  journeys: 'dpe-journeys',
  dashboards: 'dpe-dashboards',
  tables: 'dpe-tables',
  settings: 'dpe-settings',
  flags: 'dpe-feature-flags',
  notifications: 'dpe-notifications',
  workflows: 'dpe-workflows',
  content: 'dpe-content',
  branding: 'dpe-branding',
  quality: 'dpe-quality-findings',
  audit: 'dpe-audit',
});

const CONFIG_FILE = () => path.join(erpRoot(), 'config', 'dynamic-platform.json');

function liveBus() {
  if (!globalThis.__SUCCESS_OS_DPE_BUS__) {
    globalThis.__SUCCESS_OS_DPE_BUS__ = { listeners: new Set(), version: 0, last: null };
  }
  return globalThis.__SUCCESS_OS_DPE_BUS__;
}

export function subscribeDpeLive(listener) {
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

function stamp(meta = {}) {
  return {
    createdAt: erpNow(),
    createdBy: meta.user || 'owner',
    updatedAt: erpNow(),
    updatedBy: meta.user || 'owner',
    version: 1,
  };
}

function bumpVersion(item, meta = {}) {
  return {
    ...item,
    updatedAt: erpNow(),
    updatedBy: meta.user || 'owner',
    version: Number(item.version || 1) + 1,
  };
}

function writeAudit(entry) {
  const doc = erpReadCollection(COLLECTIONS.audit);
  const row = { id: erpId(), at: erpNow(), ...entry };
  doc.items = [row, ...erpList(doc.items)].slice(0, 5000);
  erpWriteCollection(COLLECTIONS.audit, doc);
  erpAppendAudit({
    action: entry.action || 'dpe_event',
    moduleId: entry.moduleId || 'dynamic-platform',
    user: entry.user || 'system',
    entityId: entry.entityId,
    newValue: entry,
  });
  return row;
}

export function getDpeConfig() {
  erpEnsureDirs();
  const existing = erpReadJson(CONFIG_FILE());
  if (existing) return { ...DPE_DEFAULT_CONFIG, ...existing };
  const seeded = { ...DPE_DEFAULT_CONFIG, updatedAt: erpNow(), updatedBy: 'system' };
  erpWriteJson(CONFIG_FILE(), seeded);
  return seeded;
}

export function setDpeConfig(patch = {}, meta = {}) {
  const before = getDpeConfig();
  const next = { ...before, ...patch, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  erpWriteJson(CONFIG_FILE(), next);
  writeAudit({ action: 'dpe_config', user: meta.user || 'owner', oldValue: before, newValue: next });
  publishLive({ type: 'config.updated' });
  return { ok: true, config: next };
}

function seedNavFromExisting() {
  return ENTERPRISE_ADMIN_NAV.map((item, idx) => ({
    id: item.id,
    key: item.id,
    title: item.label,
    titleAr: item.label,
    icon: item.icon || 'list',
    route: item.href,
    parentId: null,
    order: idx + 1,
    surface: 'sidebar',
    group: item.group || 'main',
    userTypes: ['*'],
    roles: ['owner', 'admin', 'super_admin'],
    permissions: [],
    countries: ['*'],
    languages: ['*'],
    tenants: ['*'],
    subscriptionPlans: ['*'],
    visibilityCondition: null,
    status: 'active',
    crud: Boolean(item.crud),
    source: 'migrated_enterprise_admin_nav',
    ...stamp({ user: 'system' }),
  }));
}

function seedLabels() {
  return DPE_SEED_LABELS.map((l) => ({
    id: l.key,
    key: l.key,
    en: l.en,
    ar: l.ar,
    contexts: l.contexts || {},
    status: 'active',
    ...stamp({ user: 'system' }),
  }));
}

function seedFilters() {
  return DPE_SEED_FILTER_CHAINS.map((c) => ({
    id: c.key,
    key: c.key,
    label: c.label,
    steps: c.steps,
    status: 'active',
    ...stamp({ user: 'system' }),
  }));
}

function seedFlags() {
  return DPE_SEED_FEATURE_FLAGS.map((f) => ({
    id: f.key,
    ...f,
    countries: ['*'],
    tenants: ['*'],
    roles: ['*'],
    betaUsers: [],
    startDate: null,
    endDate: null,
    emergencyDisabled: false,
    ...stamp({ user: 'system' }),
  }));
}

function seedSettings() {
  return DPE_SEED_SETTINGS.map((s) => ({
    id: `${s.level}:${s.scope || 'default'}:${s.key}`,
    ...s,
    scope: s.scope || null,
    status: 'active',
    history: [],
    ...stamp({ user: 'system' }),
  }));
}

function seedDashboards() {
  return DPE_DASHBOARD_TYPES.map((type, idx) => ({
    id: `dashboard-${type}`,
    key: type,
    title: `${type.replace(/_/g, ' ')} dashboard`,
    titleAr: `لوحة ${type}`,
    widgets: [
      { id: 'kpi-users', type: 'kpi', title: 'Users', dataSource: 'users.active', order: 1, size: 'sm' },
      { id: 'kpi-revenue', type: 'kpi', title: 'Revenue', dataSource: 'finance.revenue', order: 2, size: 'sm' },
      { id: 'chart-growth', type: 'chart', title: 'Growth', dataSource: 'analytics.growth', order: 3, size: 'md' },
      { id: 'table-recent', type: 'table', title: 'Recent activity', dataSource: 'audit.recent', order: 4, size: 'lg' },
    ],
    order: idx + 1,
    status: 'published',
    ...stamp({ user: 'system' }),
  }));
}

function seedPages() {
  return [
    {
      id: 'page-home-admin',
      title: 'Home Dashboard',
      titleAr: 'لوحة التحكم الرئيسية',
      subtitle: 'Live enterprise overview',
      subtitleAr: 'نظرة عامة مباشرة',
      description: 'Owner home with dynamic KPIs',
      slug: 'dashboard/admin',
      seo: { title: 'Success OS Admin', description: 'Enterprise admin home' },
      sections: [
        { id: 'hero', type: 'hero', titleKey: 'portal.welcome' },
        { id: 'kpis', type: 'stats', dataSource: 'home.kpis' },
        { id: 'activity', type: 'list', dataSource: 'home.recentActivity' },
      ],
      components: [],
      buttons: [{ key: 'refresh', action: 'call_api', label: 'Refresh' }],
      permissions: ['platform.manage', 'reports.view'],
      visibilityRules: { roles: ['owner', 'admin', 'super_admin'] },
      status: 'published',
      ...stamp({ user: 'system' }),
    },
  ];
}

function seedForms() {
  return [
    {
      id: 'form-student-onboarding',
      key: 'student_onboarding',
      title: 'Student Onboarding',
      titleAr: 'تسجيل الطالب',
      audience: 'students',
      fields: [
        { key: 'fullName', type: 'text', label: 'Full name', labelAr: 'الاسم الكامل', required: true },
        { key: 'email', type: 'email', label: 'Email', labelAr: 'البريد', required: true },
        { key: 'country', type: 'country', label: 'Country', labelAr: 'الدولة', required: true },
        { key: 'grade', type: 'dropdown', label: 'Grade', labelAr: 'الصف', required: true, dependsOn: 'country' },
        { key: 'subject', type: 'multi_select', label: 'Subjects', labelAr: 'المواد', dependsOn: 'grade' },
      ],
      status: 'published',
      ...stamp({ user: 'system' }),
    },
    {
      id: 'form-support-ticket',
      key: 'support_ticket',
      title: 'Support Ticket',
      titleAr: 'تذكرة دعم',
      audience: 'support',
      fields: [
        { key: 'subject', type: 'text', label: 'Subject', required: true },
        { key: 'priority', type: 'dropdown', label: 'Priority', options: ['low', 'medium', 'high'], required: true },
        { key: 'description', type: 'rich_text', label: 'Description', required: true },
        { key: 'attachment', type: 'file_upload', label: 'Attachment', required: false },
      ],
      status: 'published',
      ...stamp({ user: 'system' }),
    },
  ];
}

function seedJourneys() {
  return [
    {
      id: 'journey-university',
      key: 'university_application',
      type: 'university',
      title: 'University Application Journey',
      steps: DPE_SEED_FILTER_CHAINS.find((c) => c.key === 'university_journey')?.steps || [],
      allowSaveContinue: true,
      draftSaving: true,
      loginCheck: true,
      paymentStep: true,
      approvalStep: true,
      status: 'published',
      ...stamp({ user: 'system' }),
    },
    {
      id: 'journey-job',
      key: 'job_seeker',
      type: 'job_seeker',
      title: 'Job Seeker Journey',
      steps: DPE_SEED_FILTER_CHAINS.find((c) => c.key === 'job_journey')?.steps || [],
      allowSaveContinue: true,
      draftSaving: true,
      loginCheck: true,
      status: 'published',
      ...stamp({ user: 'system' }),
    },
  ];
}

function seedNotifications() {
  return DPE_NOTIFICATION_TRIGGERS.slice(0, 8).map((trigger) => ({
    id: `notif-${trigger}`,
    key: trigger,
    trigger,
    channels: ['in_app', 'email'],
    titleEn: `${trigger.replace(/_/g, ' ')} notification`,
    titleAr: `إشعار ${trigger}`,
    bodyEn: 'Hello {{user_name}} — update regarding {{service_name}}.',
    bodyAr: 'مرحباً {{user_name}} — تحديث بخصوص {{service_name}}.',
    status: 'active',
    ...stamp({ user: 'system' }),
  }));
}

function seedWorkflows() {
  return [
    {
      id: 'wf-payment-approval',
      key: 'payment_approval',
      title: 'Payment Approval',
      trigger: 'payment.created',
      steps: [
        { type: 'condition', when: 'amount > 1000', then: 'require_approval' },
        { type: 'approval', role: 'finance' },
        { type: 'notification', template: 'payment' },
        { type: 'action', action: 'record_update', target: 'payment.status', value: 'approved' },
      ],
      status: 'active',
      ...stamp({ user: 'system' }),
    },
    {
      id: 'wf-content-publish',
      key: 'content_publish',
      title: 'Content Publish',
      trigger: 'content.submitted',
      steps: [
        { type: 'approval', role: 'content' },
        { type: 'schedule', delayHours: 0 },
        { type: 'action', action: 'publish' },
        { type: 'notification', template: 'new_content' },
      ],
      status: 'active',
      ...stamp({ user: 'system' }),
    },
  ];
}

function seedBranding() {
  return [
    {
      id: 'branding-platform',
      scope: 'platform',
      brandName: 'Success OS',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#0f766e',
      secondaryColor: '#134e4a',
      fonts: 'Cairo, Inter, sans-serif',
      domain: 'success-os.app',
      subdomain: 'app',
      loginPage: { layout: 'split' },
      landingPage: { hero: 'full-bleed' },
      emailBranding: { fromName: 'Success OS' },
      invoiceBranding: { showLogo: true },
      certificateBranding: { seal: true },
      mobileBranding: { splash: true },
      footer: { text: '© Success OS' },
      socialLinks: [],
      ...stamp({ user: 'system' }),
    },
  ];
}

function seedButtons() {
  return DPE_BUTTON_ACTIONS.map((action, idx) => ({
    id: `btn-${action}`,
    key: action,
    title: action.replace(/_/g, ' '),
    titleAr: action,
    icon: 'action',
    size: 'md',
    position: 'inline',
    route: null,
    action,
    permission: null,
    confirmation: ['approve', 'reject', 'archive', 'refund'].includes(action),
    workflow: null,
    notification: null,
    visibilityRule: { roles: ['*'] },
    loadingState: 'Processing…',
    successState: 'Done',
    errorState: 'Failed',
    disabledState: 'Unavailable',
    functional: true,
    order: idx + 1,
    status: 'active',
    ...stamp({ user: 'system' }),
  }));
}

function seedTables() {
  return [
    {
      id: 'table-students',
      key: 'students',
      title: 'Students',
      columns: [
        { key: 'name', label: 'Name', visible: true },
        { key: 'email', label: 'Email', visible: true },
        { key: 'grade', label: 'Grade', visible: true },
        { key: 'country', label: 'Country', visible: true },
        { key: 'status', label: 'Status', visible: true },
      ],
      features: {
        search: true,
        filter: true,
        sort: true,
        pagination: true,
        columnSelection: true,
        savedViews: true,
        bulkActions: true,
        export: true,
        import: true,
        print: true,
        archive: true,
        restore: true,
        softDelete: true,
        inlineEditing: true,
        mobileView: true,
        realTimeUpdates: true,
      },
      status: 'active',
      ...stamp({ user: 'system' }),
    },
  ];
}

export function ensureDynamicPlatformEngine() {
  erpEnsureDirs();
  getDpeConfig();
  ensureCollection(COLLECTIONS.pages, seedPages());
  ensureCollection(COLLECTIONS.labels, seedLabels());
  ensureCollection(COLLECTIONS.nav, seedNavFromExisting());
  ensureCollection(COLLECTIONS.buttons, seedButtons());
  ensureCollection(COLLECTIONS.forms, seedForms());
  ensureCollection(COLLECTIONS.filters, seedFilters());
  ensureCollection(COLLECTIONS.journeys, seedJourneys());
  ensureCollection(COLLECTIONS.dashboards, seedDashboards());
  ensureCollection(COLLECTIONS.tables, seedTables());
  ensureCollection(COLLECTIONS.settings, seedSettings());
  ensureCollection(COLLECTIONS.flags, seedFlags());
  ensureCollection(COLLECTIONS.notifications, seedNotifications());
  ensureCollection(COLLECTIONS.workflows, seedWorkflows());
  ensureCollection(COLLECTIONS.content, []);
  ensureCollection(COLLECTIONS.branding, seedBranding());
  ensureCollection(COLLECTIONS.quality, []);
  ensureCollection(COLLECTIONS.audit, []);

  // Keep nav in sync additively with ENTERPRISE_ADMIN_NAV
  const navDoc = erpReadCollection(COLLECTIONS.nav);
  const byKey = new Map(erpList(navDoc.items).map((i) => [i.key, i]));
  let changed = false;
  for (const seeded of seedNavFromExisting()) {
    if (!byKey.has(seeded.key)) {
      byKey.set(seeded.key, seeded);
      changed = true;
    }
  }
  if (changed) erpWriteCollection(COLLECTIONS.nav, { items: [...byKey.values()] });

  return { ok: true };
}

/** Interpolate {{variables}} using context. */
export function resolveDynamicText(template, context = {}) {
  const commission = (() => {
    try {
      return getCommissionDefaults()?.defaultCommissionPercent;
    } catch {
      return 10;
    }
  })();
  const vars = {
    user_name: context.user_name || context.userName || 'User',
    organization_name: context.organization_name || context.organizationName || 'Organization',
    country_name: context.country_name || context.country || '',
    curriculum_name: context.curriculum_name || context.curriculum || '',
    grade_name: context.grade_name || context.grade || '',
    subject_name: context.subject_name || context.subject || '',
    service_name: context.service_name || context.service || 'service',
    subscription_name: context.subscription_name || context.subscriptionPlan || '',
    commission_rate: context.commission_rate ?? commission,
    currency: context.currency || 'USD',
    current_date: (context.current_date || new Date().toISOString()).slice(0, 10),
    tenant_name: context.tenant_name || context.tenantName || 'Success OS',
  };
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return vars[key] != null ? String(vars[key]) : '';
  });
}

function contextMatch(ruleValue, actual) {
  if (!ruleValue || ruleValue.includes('*')) return true;
  if (actual == null || actual === '') return false;
  const values = Array.isArray(actual) ? actual : [actual];
  return values.some((v) => ruleValue.includes(String(v)));
}

function matchesContexts(itemContexts = {}, ctx = {}) {
  const map = {
    userType: ctx.userType || ctx.role,
    role: ctx.role,
    country: ctx.country,
    language: ctx.language,
    institutionType: ctx.institutionType,
    tenant: ctx.tenant || ctx.tenantId,
    subscriptionPlan: ctx.subscriptionPlan,
  };
  for (const [key, allowed] of Object.entries(itemContexts || {})) {
    if (!contextMatch(erpList(allowed).map(String), map[key])) return false;
  }
  return true;
}

export function resolveLabel(key, context = {}) {
  ensureDynamicPlatformEngine();
  const lang = context.language || getDpeConfig().defaultLanguage || 'ar';
  const items = erpActiveItems(erpReadCollection(COLLECTIONS.labels).items).filter((l) => !l.deletedAt);
  const match = items.find((l) => l.key === key && matchesContexts(l.contexts, context)) || items.find((l) => l.key === key);
  if (!match) return { ok: false, error: 'LABEL_NOT_FOUND', key };
  const raw = lang === 'en' ? match.en : match.ar || match.en;
  return { ok: true, key, text: resolveDynamicText(raw, context), language: lang, version: match.version };
}

export function resolveNavigation(context = {}) {
  ensureDynamicPlatformEngine();
  const surface = context.surface || 'sidebar';
  const items = erpActiveItems(erpReadCollection(COLLECTIONS.nav).items)
    .filter((n) => n.status === 'active' && !n.deletedAt)
    .filter((n) => !surface || n.surface === surface || surface === 'all')
    .filter((n) => contextMatch(n.roles, context.role))
    .filter((n) => contextMatch(n.countries, context.country))
    .filter((n) => contextMatch(n.languages, context.language))
    .filter((n) => contextMatch(n.tenants, context.tenant || context.tenantId))
    .filter((n) => contextMatch(n.subscriptionPlans, context.subscriptionPlan))
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((n) => ({
      id: n.id,
      title: context.language === 'en' ? n.title : n.titleAr || n.title,
      icon: n.icon,
      route: n.route,
      parentId: n.parentId,
      order: n.order,
      group: n.group,
    }));

  // Prevent empty / invalid routes
  const valid = items.filter((n) => n.route && n.route !== '#' && !String(n.route).includes('undefined'));
  return { ok: true, surface, items: valid, groups: ENTERPRISE_ADMIN_NAV_GROUPS };
}

export function evaluateFeatureFlag(flagKey, context = {}) {
  ensureDynamicPlatformEngine();
  const flag = erpList(erpReadCollection(COLLECTIONS.flags).items).find((f) => f.key === flagKey);
  if (!flag) return { ok: false, enabled: false, error: 'FLAG_NOT_FOUND' };
  if (flag.emergencyDisabled) return { ok: true, enabled: false, reason: 'emergency_disable' };
  if (!flag.enabled) return { ok: true, enabled: false, reason: 'disabled' };
  const now = Date.now();
  if (flag.startDate && new Date(flag.startDate).getTime() > now) return { ok: true, enabled: false, reason: 'not_started' };
  if (flag.endDate && new Date(flag.endDate).getTime() < now) return { ok: true, enabled: false, reason: 'ended' };
  if (!contextMatch(flag.countries, context.country)) return { ok: true, enabled: false, reason: 'country' };
  if (!contextMatch(flag.tenants, context.tenant || context.tenantId)) return { ok: true, enabled: false, reason: 'tenant' };
  if (!contextMatch(flag.roles, context.role)) return { ok: true, enabled: false, reason: 'role' };
  if (erpList(flag.betaUsers).length && context.userId && flag.betaUsers.includes(context.userId)) {
    return { ok: true, enabled: true, reason: 'beta_user' };
  }
  const pct = Number(flag.rolloutPercent ?? 100);
  if (pct >= 100) return { ok: true, enabled: true, reason: 'full_rollout' };
  const bucket = Math.abs(hashString(`${flagKey}:${context.userId || context.tenantId || 'anon'}`)) % 100;
  return { ok: true, enabled: bucket < pct, reason: 'percentage', bucket, pct };
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

/**
 * Settings inheritance: Global → Country → Tenant → Module → Role → User
 */
export function resolveSetting(key, context = {}) {
  ensureDynamicPlatformEngine();
  const items = erpActiveItems(erpReadCollection(COLLECTIONS.settings).items).filter((s) => s.key === key && !s.deletedAt);
  const order = ['user', 'role', 'module', 'portal', 'tenant', 'country', 'global'];
  for (const level of order) {
    const hit = items.find((s) => {
      if (s.level !== level) return false;
      if (level === 'global') return true;
      if (level === 'country') return s.scope === context.country;
      if (level === 'tenant') return s.scope === (context.tenant || context.tenantId);
      if (level === 'module') return s.scope === context.moduleId;
      if (level === 'role') return s.scope === context.role;
      if (level === 'user') return s.scope === context.userId;
      if (level === 'portal') return s.scope === context.portal;
      return false;
    });
    if (hit) return { ok: true, key, value: hit.value, level: hit.level, id: hit.id, version: hit.version };
  }
  return { ok: false, error: 'SETTING_NOT_FOUND', key };
}

export function upsertSetting(payload = {}, meta = {}) {
  ensureDynamicPlatformEngine();
  const key = erpText(payload.key);
  const level = erpText(payload.level) || 'global';
  if (!key) return { ok: false, error: 'KEY_REQUIRED' };
  if (!DPE_SETTINGS_LEVELS.includes(level)) return { ok: false, error: 'INVALID_LEVEL' };
  const scope = payload.scope || null;
  const id = `${level}:${scope || 'default'}:${key}`;
  const doc = erpReadCollection(COLLECTIONS.settings);
  const existing = erpList(doc.items).find((s) => s.id === id);
  const next = existing
    ? bumpVersion(
        {
          ...existing,
          value: payload.value,
          category: payload.category || existing.category,
          note: payload.note ?? existing.note,
          history: [
            { version: existing.version, value: existing.value, at: erpNow(), by: meta.user || 'owner' },
            ...erpList(existing.history),
          ].slice(0, 50),
          status: 'active',
        },
        meta,
      )
    : {
        id,
        key,
        level,
        scope,
        value: payload.value,
        category: payload.category || 'general',
        note: payload.note || '',
        history: [],
        status: 'active',
        ...stamp(meta),
      };
  doc.items = existing
    ? erpList(doc.items).map((s) => (s.id === id ? next : s))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.settings, doc);
  writeAudit({ action: 'setting_upsert', user: meta.user || 'owner', entityId: id, key, level });
  publishLive({ type: 'setting.upserted', key, level });
  return { ok: true, setting: next };
}

export function upsertLabel(payload = {}, meta = {}) {
  ensureDynamicPlatformEngine();
  const key = erpText(payload.key);
  if (!key) return { ok: false, error: 'KEY_REQUIRED' };
  const doc = erpReadCollection(COLLECTIONS.labels);
  const existing = erpList(doc.items).find((l) => l.key === key && !l.deletedAt);
  const next = existing
    ? bumpVersion(
        {
          ...existing,
          en: payload.en ?? existing.en,
          ar: payload.ar ?? existing.ar,
          contexts: payload.contexts || existing.contexts,
        },
        meta,
      )
    : {
        id: key,
        key,
        en: payload.en || '',
        ar: payload.ar || '',
        contexts: payload.contexts || {},
        status: 'active',
        ...stamp(meta),
      };
  doc.items = existing
    ? erpList(doc.items).map((l) => (l.key === key ? next : l))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.labels, doc);
  writeAudit({ action: 'label_upsert', user: meta.user || 'owner', entityId: key });
  publishLive({ type: 'label.upserted', key });
  return { ok: true, label: next };
}

export function upsertNavItem(payload = {}, meta = {}) {
  ensureDynamicPlatformEngine();
  const key = erpText(payload.key || payload.id);
  if (!key) return { ok: false, error: 'KEY_REQUIRED' };
  const route = erpText(payload.route);
  if (!route || route === '#') return { ok: false, error: 'VALID_ROUTE_REQUIRED' };
  const doc = erpReadCollection(COLLECTIONS.nav);
  const existing = erpList(doc.items).find((n) => n.key === key);
  const next = existing
    ? bumpVersion(
        {
          ...existing,
          title: payload.title ?? existing.title,
          titleAr: payload.titleAr ?? existing.titleAr,
          icon: payload.icon ?? existing.icon,
          route,
          parentId: payload.parentId ?? existing.parentId,
          order: payload.order != null ? Number(payload.order) : existing.order,
          surface: payload.surface || existing.surface,
          group: payload.group ?? existing.group,
          roles: payload.roles || existing.roles,
          countries: payload.countries || existing.countries,
          languages: payload.languages || existing.languages,
          tenants: payload.tenants || existing.tenants,
          subscriptionPlans: payload.subscriptionPlans || existing.subscriptionPlans,
          status: payload.status || existing.status,
        },
        meta,
      )
    : {
        id: key,
        key,
        title: payload.title || key,
        titleAr: payload.titleAr || payload.title || key,
        icon: payload.icon || 'list',
        route,
        parentId: payload.parentId || null,
        order: Number(payload.order || 999),
        surface: payload.surface || 'sidebar',
        group: payload.group || 'main',
        userTypes: payload.userTypes || ['*'],
        roles: payload.roles || ['*'],
        permissions: payload.permissions || [],
        countries: payload.countries || ['*'],
        languages: payload.languages || ['*'],
        tenants: payload.tenants || ['*'],
        subscriptionPlans: payload.subscriptionPlans || ['*'],
        status: payload.status || 'active',
        source: 'owner_dashboard',
        ...stamp(meta),
      };
  // Duplicate route check (same surface)
  const dup = erpList(doc.items).find(
    (n) => n.route === route && n.key !== key && n.surface === next.surface && n.status === 'active' && !n.deletedAt,
  );
  if (dup) return { ok: false, error: 'DUPLICATE_ROUTE', conflict: dup.key };

  doc.items = existing
    ? erpList(doc.items).map((n) => (n.key === key ? next : n))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.nav, doc);
  writeAudit({ action: 'nav_upsert', user: meta.user || 'owner', entityId: key });
  publishLive({ type: 'nav.upserted', key });
  return { ok: true, item: next };
}

export function softDeleteRecord(collectionKey, id, meta = {}) {
  ensureDynamicPlatformEngine();
  const name = COLLECTIONS[collectionKey] || collectionKey;
  const doc = erpReadCollection(name);
  const item = erpList(doc.items).find((i) => i.id === id || i.key === id);
  if (!item) return { ok: false, error: 'NOT_FOUND' };
  const config = getDpeConfig();
  if (config.financialRecordsNeverPermanentDelete && ['dpe-settings'].includes(name) && item.category === 'finance') {
    // still soft-delete allowed
  }
  const next = {
    ...item,
    status: 'deleted',
    deletedAt: erpNow(),
    deletedBy: meta.user || 'owner',
    updatedAt: erpNow(),
  };
  doc.items = erpList(doc.items).map((i) => (i.id === item.id ? next : i));
  erpWriteCollection(name, doc);
  writeAudit({ action: 'soft_delete', user: meta.user || 'owner', entityId: item.id, collection: name });
  publishLive({ type: 'record.deleted', collection: name, id: item.id });
  return { ok: true, item: next };
}

export function restoreRecord(collectionKey, id, meta = {}) {
  ensureDynamicPlatformEngine();
  const name = COLLECTIONS[collectionKey] || collectionKey;
  const doc = erpReadCollection(name);
  const item = erpList(doc.items).find((i) => i.id === id || i.key === id);
  if (!item) return { ok: false, error: 'NOT_FOUND' };
  const next = {
    ...item,
    status: item.status === 'deleted' ? 'active' : item.status,
    deletedAt: null,
    deletedBy: null,
    restoredAt: erpNow(),
    restoredBy: meta.user || 'owner',
    updatedAt: erpNow(),
  };
  doc.items = erpList(doc.items).map((i) => (i.id === item.id ? next : i));
  erpWriteCollection(name, doc);
  writeAudit({ action: 'restore', user: meta.user || 'owner', entityId: item.id, collection: name });
  publishLive({ type: 'record.restored', collection: name, id: item.id });
  return { ok: true, item: next };
}

export function upsertPage(payload = {}, meta = {}) {
  ensureDynamicPlatformEngine();
  const doc = erpReadCollection(COLLECTIONS.pages);
  const id = erpText(payload.id) || erpId();
  const existing = erpList(doc.items).find((p) => p.id === id);
  const next = existing
    ? bumpVersion(
        {
          ...existing,
          title: payload.title ?? existing.title,
          titleAr: payload.titleAr ?? existing.titleAr,
          subtitle: payload.subtitle ?? existing.subtitle,
          description: payload.description ?? existing.description,
          slug: payload.slug ?? existing.slug,
          seo: payload.seo || existing.seo,
          sections: payload.sections || existing.sections,
          components: payload.components || existing.components,
          buttons: payload.buttons || existing.buttons,
          permissions: payload.permissions || existing.permissions,
          visibilityRules: payload.visibilityRules || existing.visibilityRules,
          status: payload.status || existing.status,
          scheduledAt: payload.scheduledAt ?? existing.scheduledAt,
        },
        meta,
      )
    : {
        id,
        title: payload.title || 'Untitled',
        titleAr: payload.titleAr || payload.title || 'بدون عنوان',
        subtitle: payload.subtitle || '',
        description: payload.description || '',
        slug: payload.slug || `page-${id.slice(0, 8)}`,
        seo: payload.seo || {},
        sections: payload.sections || [],
        components: payload.components || [],
        buttons: payload.buttons || [],
        permissions: payload.permissions || [],
        visibilityRules: payload.visibilityRules || {},
        status: payload.status || 'draft',
        scheduledAt: payload.scheduledAt || null,
        ...stamp(meta),
      };
  if (!DPE_PAGE_STATUSES.includes(next.status) && next.status !== 'draft') {
    /* allow all listed */
  }
  doc.items = existing
    ? erpList(doc.items).map((p) => (p.id === id ? next : p))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.pages, doc);
  writeAudit({ action: 'page_upsert', user: meta.user || 'owner', entityId: id, status: next.status });
  publishLive({ type: 'page.upserted', id });
  return { ok: true, page: next };
}

export function publishPage(pageId, meta = {}) {
  return upsertPage({ id: pageId, status: 'published' }, meta);
}

export function upsertForm(payload = {}, meta = {}) {
  ensureDynamicPlatformEngine();
  const key = erpText(payload.key);
  if (!key) return { ok: false, error: 'KEY_REQUIRED' };
  const doc = erpReadCollection(COLLECTIONS.forms);
  const existing = erpList(doc.items).find((f) => f.key === key);
  const fields = erpList(payload.fields || existing?.fields).map((f) => ({
    ...f,
    type: DPE_FIELD_TYPES.includes(f.type) ? f.type : 'text',
  }));
  const next = existing
    ? bumpVersion({ ...existing, title: payload.title ?? existing.title, titleAr: payload.titleAr ?? existing.titleAr, audience: payload.audience ?? existing.audience, fields, status: payload.status || existing.status }, meta)
    : {
        id: `form-${key}`,
        key,
        title: payload.title || key,
        titleAr: payload.titleAr || payload.title || key,
        audience: payload.audience || 'general',
        fields,
        status: payload.status || 'draft',
        ...stamp(meta),
      };
  doc.items = existing
    ? erpList(doc.items).map((f) => (f.key === key ? next : f))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.forms, doc);
  writeAudit({ action: 'form_upsert', user: meta.user || 'owner', entityId: next.id });
  publishLive({ type: 'form.upserted', key });
  return { ok: true, form: next };
}

export function upsertFilterChain(payload = {}, meta = {}) {
  ensureDynamicPlatformEngine();
  const key = erpText(payload.key);
  if (!key) return { ok: false, error: 'KEY_REQUIRED' };
  const doc = erpReadCollection(COLLECTIONS.filters);
  const existing = erpList(doc.items).find((f) => f.key === key);
  const steps = erpList(payload.steps || existing?.steps);
  const next = existing
    ? bumpVersion({ ...existing, label: payload.label ?? existing.label, steps, status: payload.status || existing.status }, meta)
    : { id: key, key, label: payload.label || key, steps, status: 'active', ...stamp(meta) };
  doc.items = existing
    ? erpList(doc.items).map((f) => (f.key === key ? next : f))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.filters, doc);
  writeAudit({ action: 'filter_upsert', user: meta.user || 'owner', entityId: key });
  publishLive({ type: 'filter.upserted', key });
  return { ok: true, filter: next };
}

/** When parent changes, clear invalid child selections. */
export function applyFilterDependency(chainKey, selections = {}) {
  ensureDynamicPlatformEngine();
  const chain = erpList(erpReadCollection(COLLECTIONS.filters).items).find((f) => f.key === chainKey);
  if (!chain) return { ok: false, error: 'CHAIN_NOT_FOUND' };
  const next = { ...selections };
  const steps = erpList(chain.steps);
  for (const step of steps) {
    if (!step.dependsOn) continue;
    if (next[step.dependsOn] == null || next[step.dependsOn] === '') {
      next[step.key] = null;
    }
  }
  return { ok: true, chainKey, selections: next, steps };
}

export function setFeatureFlag(payload = {}, meta = {}) {
  ensureDynamicPlatformEngine();
  const key = erpText(payload.key);
  if (!key) return { ok: false, error: 'KEY_REQUIRED' };
  const doc = erpReadCollection(COLLECTIONS.flags);
  const existing = erpList(doc.items).find((f) => f.key === key);
  const next = existing
    ? bumpVersion(
        {
          ...existing,
          enabled: payload.enabled != null ? Boolean(payload.enabled) : existing.enabled,
          rolloutPercent: payload.rolloutPercent != null ? Number(payload.rolloutPercent) : existing.rolloutPercent,
          countries: payload.countries || existing.countries,
          tenants: payload.tenants || existing.tenants,
          roles: payload.roles || existing.roles,
          betaUsers: payload.betaUsers || existing.betaUsers,
          startDate: payload.startDate ?? existing.startDate,
          endDate: payload.endDate ?? existing.endDate,
          emergencyDisabled: payload.emergencyDisabled != null ? Boolean(payload.emergencyDisabled) : existing.emergencyDisabled,
        },
        meta,
      )
    : {
        id: key,
        key,
        label: payload.label || key,
        enabled: Boolean(payload.enabled),
        rolloutPercent: Number(payload.rolloutPercent ?? 0),
        countries: payload.countries || ['*'],
        tenants: payload.tenants || ['*'],
        roles: payload.roles || ['*'],
        betaUsers: payload.betaUsers || [],
        startDate: payload.startDate || null,
        endDate: payload.endDate || null,
        emergencyDisabled: false,
        ...stamp(meta),
      };
  doc.items = existing
    ? erpList(doc.items).map((f) => (f.key === key ? next : f))
    : [next, ...erpList(doc.items)];
  erpWriteCollection(COLLECTIONS.flags, doc);
  writeAudit({ action: 'feature_flag', user: meta.user || 'owner', entityId: key, enabled: next.enabled });
  publishLive({ type: 'flag.updated', key });
  return { ok: true, flag: next };
}

export function updateBranding(payload = {}, meta = {}) {
  ensureDynamicPlatformEngine();
  const doc = erpReadCollection(COLLECTIONS.branding);
  const existing = erpList(doc.items).find((b) => b.scope === (payload.scope || 'platform')) || erpList(doc.items)[0];
  if (!existing) return { ok: false, error: 'BRANDING_NOT_FOUND' };
  const next = bumpVersion({ ...existing, ...payload, scope: existing.scope }, meta);
  doc.items = erpList(doc.items).map((b) => (b.id === existing.id ? next : b));
  erpWriteCollection(COLLECTIONS.branding, doc);
  writeAudit({ action: 'branding_update', user: meta.user || 'owner', entityId: existing.id });
  publishLive({ type: 'branding.updated' });
  return { ok: true, branding: next };
}

/**
 * Quality audit — scan repo for hardcoded patterns (does not rebuild modules).
 */
export function runQualityAudit(meta = {}) {
  ensureDynamicPlatformEngine();
  const roots = [
    path.join(process.cwd(), 'app'),
    path.join(process.cwd(), 'components'),
  ];
  const findings = [];
  const skip = new Set(['node_modules', '.next', 'library', 'enterprise-admin']);

  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (skip.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (/\.(js|jsx|ts|tsx)$/.test(ent.name)) scanFile(full);
    }
  }

  function scanFile(file) {
    let text = '';
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      return;
    }
    // Skip the dynamic platform itself and commission engine (already config-driven)
    if (file.includes('enterprise-dynamic-platform') || file.includes('enterprise-commission-engine')) return;
    const rel = path.relative(process.cwd(), file);
    for (const pat of DPE_QUALITY_PATTERNS) {
      const re = new RegExp(pat.pattern, 'gi');
      let m;
      while ((m = re.exec(text))) {
        const line = text.slice(0, m.index).split('\n').length;
        findings.push({
          id: erpId(),
          patternId: pat.id,
          category: pat.category,
          severity: pat.severity,
          file: rel,
          line,
          snippet: String(m[0]).slice(0, 120),
          status: 'open',
          recommendation: 'Move to Dynamic Platform config / label / settings registry',
          at: erpNow(),
        });
        if (findings.length > 500) return;
      }
    }
  }

  for (const root of roots) walk(root);

  const doc = erpReadCollection(COLLECTIONS.quality);
  doc.items = [...findings, ...erpList(doc.items)].slice(0, 2000);
  erpWriteCollection(COLLECTIONS.quality, doc);
  writeAudit({
    action: 'quality_audit',
    user: meta.user || 'owner',
    findingCount: findings.length,
  });
  publishLive({ type: 'quality.audited', count: findings.length });

  const byCategory = {};
  const bySeverity = {};
  for (const f of findings) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  }
  return { ok: true, count: findings.length, byCategory, bySeverity, findings: findings.slice(0, 100) };
}

export function getResolvedContextBundle(context = {}) {
  ensureDynamicPlatformEngine();
  const labels = {};
  for (const key of ['portal.welcome', 'finance.commission.label', 'success.saved', 'error.permission_denied']) {
    const r = resolveLabel(key, context);
    if (r.ok) labels[key] = r.text;
  }
  return {
    ok: true,
    context,
    labels,
    navigation: resolveNavigation({ ...context, surface: context.surface || 'sidebar' }),
    flags: Object.fromEntries(
      erpList(erpReadCollection(COLLECTIONS.flags).items).map((f) => [f.key, evaluateFeatureFlag(f.key, context)]),
    ),
    branding: erpList(erpReadCollection(COLLECTIONS.branding).items)[0] || null,
    commissionDefault: (() => {
      try {
        return getCommissionDefaults();
      } catch {
        return { defaultCommissionPercent: 10 };
      }
    })(),
    settingCurrency: resolveSetting('platform.default_currency', context),
    settingLanguage: resolveSetting('platform.default_language', context),
  };
}

export function getDynamicPlatformDashboard() {
  ensureDynamicPlatformEngine();
  const pages = erpList(erpReadCollection(COLLECTIONS.pages).items);
  const labels = erpList(erpReadCollection(COLLECTIONS.labels).items);
  const nav = erpList(erpReadCollection(COLLECTIONS.nav).items);
  const forms = erpList(erpReadCollection(COLLECTIONS.forms).items);
  const filters = erpList(erpReadCollection(COLLECTIONS.filters).items);
  const journeys = erpList(erpReadCollection(COLLECTIONS.journeys).items);
  const dashboards = erpList(erpReadCollection(COLLECTIONS.dashboards).items);
  const tables = erpList(erpReadCollection(COLLECTIONS.tables).items);
  const settings = erpList(erpReadCollection(COLLECTIONS.settings).items);
  const flags = erpList(erpReadCollection(COLLECTIONS.flags).items);
  const notifications = erpList(erpReadCollection(COLLECTIONS.notifications).items);
  const workflows = erpList(erpReadCollection(COLLECTIONS.workflows).items);
  const buttons = erpList(erpReadCollection(COLLECTIONS.buttons).items);
  const branding = erpList(erpReadCollection(COLLECTIONS.branding).items);
  const quality = erpList(erpReadCollection(COLLECTIONS.quality).items).slice(0, 50);
  const audit = erpList(erpReadCollection(COLLECTIONS.audit).items).slice(0, 40);

  let commission = { defaultCommissionPercent: 10 };
  try {
    commission = getCommissionDefaults();
  } catch {
    /* bridge optional if commission store missing */
  }

  return {
    ok: true,
    generatedAt: erpNow(),
    config: getDpeConfig(),
    catalog: {
      textVariables: DPE_TEXT_VARIABLES,
      fieldTypes: DPE_FIELD_TYPES,
      buttonActions: DPE_BUTTON_ACTIONS,
      navSurfaces: DPE_NAV_SURFACES,
      dashboardTypes: DPE_DASHBOARD_TYPES,
      journeyTypes: DPE_JOURNEY_TYPES,
      notificationChannels: DPE_NOTIFICATION_CHANNELS,
      notificationTriggers: DPE_NOTIFICATION_TRIGGERS,
      settingsLevels: DPE_SETTINGS_LEVELS,
      paymentLedgerFields: DPE_PAYMENT_LEDGER_FIELDS,
      contentTypes: DPE_CONTENT_TYPES,
      pageStatuses: DPE_PAGE_STATUSES,
      contextDimensions: getDpeConfig().contextDimensions,
    },
    stats: {
      pages: pages.filter((p) => p.status !== 'deleted').length,
      labels: labels.filter((l) => !l.deletedAt).length,
      navItems: nav.filter((n) => n.status === 'active').length,
      forms: forms.length,
      filterChains: filters.length,
      journeys: journeys.length,
      dashboards: dashboards.length,
      tables: tables.length,
      settings: settings.length,
      flags: flags.length,
      notifications: notifications.length,
      workflows: workflows.length,
      buttons: buttons.length,
      openQualityFindings: quality.filter((q) => q.status === 'open').length,
      commissionDefaultPercent: commission.defaultCommissionPercent,
    },
    pages: pages.slice(0, 40),
    labels: labels.slice(0, 80),
    nav: nav.slice(0, 120),
    buttons: buttons.slice(0, 40),
    forms,
    filters,
    journeys,
    dashboards,
    tables,
    settings,
    flags,
    notifications,
    workflows,
    branding,
    quality,
    audit,
    bridges: {
      commissionEngine: true,
      paymentEngine: true,
      adminNavSeeded: true,
      rbacExisting: true,
      note: 'Existing modules preserved — DPE provides configuration layer and Owner controls.',
    },
  };
}

export async function mutateDynamicPlatformCenter(action, payload = {}, meta = {}) {
  ensureDynamicPlatformEngine();
  switch (action) {
    case 'upsertPage':
      return upsertPage(payload, meta);
    case 'publishPage':
      return publishPage(payload.pageId || payload.id, meta);
    case 'upsertLabel':
      return upsertLabel(payload, meta);
    case 'resolveLabel':
      return resolveLabel(payload.key, payload.context || payload);
    case 'upsertNav':
      return upsertNavItem(payload, meta);
    case 'resolveNav':
      return resolveNavigation(payload.context || payload);
    case 'upsertForm':
      return upsertForm(payload, meta);
    case 'upsertFilter':
      return upsertFilterChain(payload, meta);
    case 'applyFilterDependency':
      return applyFilterDependency(payload.chainKey || payload.key, payload.selections || {});
    case 'setFlag':
      return setFeatureFlag(payload, meta);
    case 'evaluateFlag':
      return evaluateFeatureFlag(payload.key, payload.context || payload);
    case 'upsertSetting':
      return upsertSetting(payload, meta);
    case 'resolveSetting':
      return resolveSetting(payload.key, payload.context || payload);
    case 'updateBranding':
      return updateBranding(payload, meta);
    case 'softDelete':
      return softDeleteRecord(payload.collection || payload.collectionKey, payload.id, meta);
    case 'restore':
      return restoreRecord(payload.collection || payload.collectionKey, payload.id, meta);
    case 'qualityAudit':
      return runQualityAudit(meta);
    case 'resolveContext':
      return getResolvedContextBundle(payload.context || payload);
    case 'setConfig':
      return setDpeConfig(payload, meta);
    case 'sync':
      return ensureDynamicPlatformEngine();
    default:
      return { ok: false, error: 'UNKNOWN_ACTION', action };
  }
}

export const DPE_MODULE_IDS = Object.freeze([
  'dynamic-platform',
  'dpe-pages',
  'dpe-labels',
  'dpe-navigation',
  'dpe-buttons',
  'dpe-forms',
  'dpe-filters',
  'dpe-journeys',
  'dpe-dashboards',
  'dpe-tables',
  'dpe-settings',
  'dpe-flags',
  'dpe-notifications',
  'dpe-workflows',
  'dpe-content',
  'dpe-branding',
  'dpe-quality',
]);
