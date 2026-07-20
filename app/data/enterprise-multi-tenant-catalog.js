/**
 * SUCCESS OS — Multi-Tenant & White Label Platform catalog.
 * One codebase · unlimited organizations · configurable branding & modules.
 */

export const MT_DEFAULT_CONFIG = Object.freeze({
  platformDomain: 'success-os.app',
  defaultTimezone: 'Asia/Amman',
  defaultCurrency: 'USD',
  defaultLanguages: ['ar', 'en'],
  trialDays: 14,
  gracePeriodDays: 7,
  softDeleteRetentionDays: 90,
  allowCustomDomains: true,
  requireSslCustomDomains: true,
  impersonationRequiresReason: true,
  ownerCanAggregate: true,
  maxTenantsSoftCap: null, // null = unlimited (no hardcoded limit)
  updatedAt: null,
});

export const MT_ORG_TYPES = Object.freeze([
  { key: 'school', label: 'Schools', labelAr: 'مدارس' },
  { key: 'university', label: 'Universities', labelAr: 'جامعات' },
  { key: 'college', label: 'Colleges', labelAr: 'كليات' },
  { key: 'educational_center', label: 'Educational Centers', labelAr: 'مراكز تعليمية' },
  { key: 'training_institute', label: 'Training Institutes', labelAr: 'معاهد تدريب' },
  { key: 'company', label: 'Companies', labelAr: 'شركات' },
  { key: 'government', label: 'Government Organizations', labelAr: 'جهات حكومية' },
  { key: 'ngo', label: 'NGOs', labelAr: 'منظمات غير ربحية' },
  { key: 'private_academy', label: 'Private Academies', labelAr: 'أكاديميات خاصة' },
  { key: 'future_org', label: 'Future Organizations', labelAr: 'منظمات مستقبلية' },
]);

export const MT_TENANT_STATUSES = Object.freeze([
  'trial',
  'active',
  'past_due',
  'grace',
  'suspended',
  'cancelled',
  'deleted',
]);

export const MT_BILLING_CYCLES = Object.freeze([
  'monthly',
  'quarterly',
  'yearly',
  'lifetime',
  'usage_based',
]);

/** Toggleable modules per tenant — Owner / Tenant Admin. */
export const MT_MODULES = Object.freeze([
  { key: 'student_portal', label: 'Student Portal', labelAr: 'بوابة الطالب', group: 'portals' },
  { key: 'teacher_portal', label: 'Teacher Portal', labelAr: 'بوابة المعلم', group: 'portals' },
  { key: 'parent_portal', label: 'Parent Portal', labelAr: 'بوابة ولي الأمر', group: 'portals' },
  { key: 'school_portal', label: 'School Portal', labelAr: 'بوابة المدرسة', group: 'portals' },
  { key: 'university_portal', label: 'University Portal', labelAr: 'بوابة الجامعة', group: 'portals' },
  { key: 'marketplace', label: 'Marketplace', labelAr: 'السوق', group: 'commerce' },
  { key: 'hr', label: 'HR', labelAr: 'الموارد البشرية', group: 'ops' },
  { key: 'finance', label: 'Finance', labelAr: 'المالية', group: 'ops' },
  { key: 'erp', label: 'ERP', labelAr: 'تخطيط الموارد', group: 'ops' },
  { key: 'ai', label: 'AI', labelAr: 'الذكاء الاصطناعي', group: 'intelligence' },
  { key: 'admissions', label: 'Admissions', labelAr: 'القبول', group: 'growth' },
  { key: 'scholarships', label: 'Scholarships', labelAr: 'المنح', group: 'growth' },
  { key: 'recruitment', label: 'Recruitment', labelAr: 'التوظيف', group: 'growth' },
  { key: 'support', label: 'Support', labelAr: 'الدعم', group: 'ops' },
  { key: 'analytics', label: 'Analytics', labelAr: 'التحليلات', group: 'intelligence' },
  { key: 'crm', label: 'CRM', labelAr: 'إدارة العملاء', group: 'growth' },
  { key: 'communication', label: 'Communication', labelAr: 'التواصل', group: 'ops' },
]);

export const MT_RESOURCE_LIMIT_KEYS = Object.freeze([
  'users',
  'storageGb',
  'bandwidthGb',
  'aiCredits',
  'videoGeneration',
  'books',
  'courses',
  'teachers',
  'students',
  'apiCalls',
]);

export const MT_SUBSCRIPTION_PLANS = Object.freeze([
  {
    key: 'free',
    label: 'Free',
    labelAr: 'مجاني',
    priceMonthly: 0,
    priceYearly: 0,
    trialDays: 0,
    modules: ['student_portal', 'teacher_portal', 'parent_portal', 'support'],
    limits: {
      users: 25,
      storageGb: 1,
      bandwidthGb: 10,
      aiCredits: 100,
      videoGeneration: 0,
      books: 5,
      courses: 3,
      teachers: 3,
      students: 20,
      apiCalls: 1000,
    },
  },
  {
    key: 'starter',
    label: 'Starter',
    labelAr: 'البداية',
    priceMonthly: 49,
    priceYearly: 490,
    trialDays: 14,
    modules: [
      'student_portal',
      'teacher_portal',
      'parent_portal',
      'school_portal',
      'support',
      'communication',
      'analytics',
    ],
    limits: {
      users: 200,
      storageGb: 20,
      bandwidthGb: 200,
      aiCredits: 2000,
      videoGeneration: 20,
      books: 50,
      courses: 30,
      teachers: 25,
      students: 150,
      apiCalls: 20000,
    },
  },
  {
    key: 'professional',
    label: 'Professional',
    labelAr: 'احترافي',
    priceMonthly: 149,
    priceYearly: 1490,
    trialDays: 14,
    modules: MT_MODULES.map((m) => m.key).filter((k) => !['erp', 'marketplace'].includes(k)),
    limits: {
      users: 2000,
      storageGb: 200,
      bandwidthGb: 2000,
      aiCredits: 20000,
      videoGeneration: 200,
      books: 500,
      courses: 300,
      teachers: 200,
      students: 1500,
      apiCalls: 200000,
    },
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    labelAr: 'مؤسسي',
    priceMonthly: 499,
    priceYearly: 4990,
    trialDays: 30,
    modules: MT_MODULES.map((m) => m.key),
    limits: {
      users: 50000,
      storageGb: 5000,
      bandwidthGb: 50000,
      aiCredits: 500000,
      videoGeneration: 5000,
      books: 10000,
      courses: 5000,
      teachers: 5000,
      students: 40000,
      apiCalls: 5000000,
    },
  },
  {
    key: 'government',
    label: 'Government',
    labelAr: 'حكومي',
    priceMonthly: 0,
    priceYearly: 0,
    customPricing: true,
    trialDays: 60,
    modules: MT_MODULES.map((m) => m.key),
    limits: {
      users: null,
      storageGb: null,
      bandwidthGb: null,
      aiCredits: null,
      videoGeneration: null,
      books: null,
      courses: null,
      teachers: null,
      students: null,
      apiCalls: null,
    },
  },
  {
    key: 'custom',
    label: 'Custom',
    labelAr: 'مخصص',
    priceMonthly: 0,
    priceYearly: 0,
    customPricing: true,
    trialDays: 14,
    modules: MT_MODULES.map((m) => m.key),
    limits: {
      users: null,
      storageGb: null,
      bandwidthGb: null,
      aiCredits: null,
      videoGeneration: null,
      books: null,
      courses: null,
      teachers: null,
      students: null,
      apiCalls: null,
    },
  },
]);

export const MT_WHITE_LABEL_FIELDS = Object.freeze([
  'logoUrl',
  'faviconUrl',
  'domain',
  'subdomain',
  'brandName',
  'primaryColor',
  'secondaryColor',
  'typography',
  'emailTemplates',
  'certificatesBranding',
  'invoicesBranding',
  'notificationsBranding',
  'landingPages',
  'loginPage',
  'dashboardTheme',
  'mobileBranding',
  'pdfBranding',
]);

export const MT_DEFAULT_BRANDING = Object.freeze({
  logoUrl: '',
  faviconUrl: '',
  brandName: 'Success OS',
  primaryColor: '#0f766e',
  secondaryColor: '#134e4a',
  typography: 'Cairo, Inter, sans-serif',
  emailTemplates: { header: 'default', footer: 'default' },
  certificatesBranding: { seal: true, signatureBlock: true },
  invoicesBranding: { showLogo: true, showTaxId: true },
  notificationsBranding: { fromName: 'Success OS' },
  landingPages: { heroStyle: 'full-bleed' },
  loginPage: { layout: 'split', showSocial: true },
  dashboardTheme: { density: 'comfortable', sidebar: 'left' },
  mobileBranding: { splash: true },
  pdfBranding: { headerLogo: true, watermark: false },
});

export const MT_ISOLATED_COLLECTIONS = Object.freeze([
  'users',
  'students',
  'teachers',
  'employees',
  'courses',
  'books',
  'lessons',
  'videos',
  'payments',
  'reports',
  'settings',
  'analytics',
  'documents',
  'audit_logs',
]);

export function findMtPlan(planKey) {
  return MT_SUBSCRIPTION_PLANS.find((p) => p.key === planKey) || null;
}

export function slugifyTenant(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48) || `tenant-${Date.now().toString(36)}`;
}
