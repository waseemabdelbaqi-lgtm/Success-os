/**
 * SUCCESS OS — Global Dynamic Platform Engine catalog.
 * Configuration schemas for pages, labels, nav, forms, filters, journeys,
 * dashboards, tables, settings, feature flags, notifications, workflows.
 * Existing modules are NOT rebuilt — they consume these configs.
 */

export const DPE_DEFAULT_CONFIG = Object.freeze({
  engineVersion: '1.0.0',
  softDeleteDefault: true,
  permanentDeleteOwnerOnly: true,
  financialRecordsNeverPermanentDelete: true,
  cacheTtlSeconds: 60,
  defaultLanguage: 'ar',
  defaultDirection: 'rtl',
  supportLanguages: ['ar', 'en'],
  contextDimensions: [
    'userType',
    'role',
    'permission',
    'country',
    'city',
    'language',
    'educationalSystem',
    'curriculum',
    'grade',
    'subject',
    'institutionType',
    'tenant',
    'subscriptionPlan',
    'contract',
    'serviceType',
    'device',
    'platform',
    'date',
    'campaign',
    'businessRule',
  ],
  updatedAt: null,
});

export const DPE_PAGE_STATUSES = Object.freeze([
  'draft',
  'review',
  'scheduled',
  'published',
  'unpublished',
  'archived',
  'deleted',
]);

export const DPE_TEXT_VARIABLES = Object.freeze([
  'user_name',
  'organization_name',
  'country_name',
  'curriculum_name',
  'grade_name',
  'subject_name',
  'service_name',
  'subscription_name',
  'commission_rate',
  'currency',
  'current_date',
  'tenant_name',
]);

export const DPE_FIELD_TYPES = Object.freeze([
  'text',
  'email',
  'phone',
  'number',
  'password',
  'date',
  'time',
  'date_range',
  'dropdown',
  'multi_select',
  'checkbox',
  'radio',
  'file_upload',
  'image_upload',
  'video_upload',
  'address',
  'country',
  'city',
  'currency',
  'signature',
  'rich_text',
  'repeater',
  'conditional_section',
]);

export const DPE_BUTTON_ACTIONS = Object.freeze([
  'open_page',
  'open_modal',
  'submit_form',
  'approve',
  'reject',
  'archive',
  'restore',
  'assign',
  'book',
  'buy',
  'subscribe',
  'pay',
  'refund',
  'download',
  'upload',
  'send_notification',
  'trigger_workflow',
  'call_api',
]);

export const DPE_NAV_SURFACES = Object.freeze([
  'main_menu',
  'sidebar',
  'header',
  'footer',
  'mobile',
  'portal',
  'dashboard',
  'quick_actions',
  'breadcrumbs',
  'profile_menu',
]);

export const DPE_DASHBOARD_TYPES = Object.freeze([
  'owner',
  'admin',
  'employee',
  'teacher',
  'student',
  'parent',
  'school',
  'university',
  'college',
  'center',
  'employer',
  'recruitment_company',
  'job_seeker',
  'partner',
  'tenant_admin',
]);

export const DPE_JOURNEY_TYPES = Object.freeze([
  'student',
  'teacher',
  'parent',
  'employee',
  'school',
  'university',
  'college',
  'center',
  'employer',
  'recruitment_company',
  'job_seeker',
  'partner',
]);

export const DPE_NOTIFICATION_CHANNELS = Object.freeze([
  'in_app',
  'push',
  'email',
  'sms',
  'whatsapp',
]);

export const DPE_NOTIFICATION_TRIGGERS = Object.freeze([
  'registration',
  'approval',
  'rejection',
  'payment',
  'payout',
  'booking',
  'cancellation',
  'refund',
  'subscription',
  'expiration',
  'task',
  'deadline',
  'attendance',
  'exam',
  'result',
  'new_content',
  'security_alert',
]);

export const DPE_SETTINGS_LEVELS = Object.freeze([
  'global',
  'country',
  'tenant',
  'portal',
  'module',
  'role',
  'user',
]);

export const DPE_PAYMENT_LEDGER_FIELDS = Object.freeze([
  'transactionId',
  'payer',
  'provider',
  'providerType',
  'service',
  'grossAmount',
  'discount',
  'tax',
  'paymentGatewayFee',
  'platformShare',
  'providerShare',
  'currency',
  'exchangeRate',
  'paymentDate',
  'settlementDate',
  'depositDate',
  'amountDeposited',
  'amountPaidToProvider',
  'remainingBalance',
  'bankReference',
  'paymentStatus',
  'payoutStatus',
  'approvedBy',
  'createdDate',
  'updatedDate',
]);

export const DPE_CONTENT_TYPES = Object.freeze([
  'countries',
  'educational_systems',
  'curricula',
  'grades',
  'subjects',
  'books',
  'units',
  'lessons',
  'videos',
  'exams',
  'questions',
  'universities',
  'schools',
  'centers',
  'courses',
  'jobs',
  'scholarships',
  'services',
  'articles',
  'faqs',
  'policies',
]);

/** Seed label keys — editable from dashboard, context-aware. */
export const DPE_SEED_LABELS = Object.freeze([
  {
    key: 'portal.welcome',
    en: 'Welcome, {{user_name}}',
    ar: 'مرحباً، {{user_name}}',
    contexts: { userType: ['*'] },
  },
  {
    key: 'portal.student.title',
    en: 'Learning & Progress',
    ar: 'التعلّم والتقدّم',
    contexts: { userType: ['student'] },
  },
  {
    key: 'portal.teacher.title',
    en: 'Teaching & Earnings',
    ar: 'التدريس والأرباح',
    contexts: { userType: ['teacher'] },
  },
  {
    key: 'portal.university.title',
    en: 'University Services',
    ar: 'خدمات الجامعة',
    contexts: { institutionType: ['university'] },
  },
  {
    key: 'portal.school.title',
    en: 'School Services',
    ar: 'خدمات المدرسة',
    contexts: { institutionType: ['school'] },
  },
  {
    key: 'portal.employer.title',
    en: 'Recruitment Hub',
    ar: 'مركز التوظيف',
    contexts: { userType: ['employer'] },
  },
  {
    key: 'finance.commission.label',
    en: 'Platform commission ({{commission_rate}}%)',
    ar: 'عمولة المنصة ({{commission_rate}}%)',
    contexts: { userType: ['*'] },
  },
  {
    key: 'country.jordan.banner',
    en: 'Jordan curriculum settings active',
    ar: 'إعدادات منهج الأردن مفعّلة',
    contexts: { country: ['JO', 'Jordan'] },
  },
  {
    key: 'tenant.branded.footer',
    en: '{{tenant_name}} · powered by Success OS',
    ar: '{{tenant_name}} · مدعوم من Success OS',
    contexts: { tenant: ['*'] },
  },
  {
    key: 'empty.no_results',
    en: 'No results for {{service_name}}',
    ar: 'لا نتائج لـ {{service_name}}',
    contexts: { userType: ['*'] },
  },
  {
    key: 'error.permission_denied',
    en: 'You do not have permission for this action',
    ar: 'ليس لديك صلاحية لهذا الإجراء',
    contexts: { userType: ['*'] },
  },
  {
    key: 'success.saved',
    en: 'Saved successfully',
    ar: 'تم الحفظ بنجاح',
    contexts: { userType: ['*'] },
  },
]);

/** Dependent filter chains (parent → children). */
export const DPE_SEED_FILTER_CHAINS = Object.freeze([
  {
    key: 'education_onboarding',
    label: 'Education Onboarding',
    steps: [
      { key: 'country', label: 'Country', dependsOn: null },
      { key: 'educational_system', label: 'Educational System', dependsOn: 'country' },
      { key: 'qualification', label: 'Qualification', dependsOn: 'educational_system' },
      { key: 'grade', label: 'Grade', dependsOn: 'qualification' },
      { key: 'subject', label: 'Subject', dependsOn: 'grade' },
      { key: 'service', label: 'Service', dependsOn: 'subject' },
      { key: 'delivery_mode', label: 'Delivery Mode', dependsOn: 'service' },
      { key: 'location', label: 'Location', dependsOn: 'delivery_mode' },
      { key: 'price', label: 'Price', dependsOn: null },
    ],
  },
  {
    key: 'university_journey',
    label: 'University Journey',
    steps: [
      { key: 'nationality', label: 'Nationality', dependsOn: null },
      { key: 'residence_country', label: 'Residence Country', dependsOn: 'nationality' },
      { key: 'destination', label: 'Destination', dependsOn: 'residence_country' },
      { key: 'city', label: 'City', dependsOn: 'destination' },
      { key: 'degree', label: 'Degree', dependsOn: 'city' },
      { key: 'major', label: 'Major', dependsOn: 'degree' },
      { key: 'language', label: 'Language', dependsOn: 'major' },
      { key: 'budget', label: 'Budget', dependsOn: null },
      { key: 'admission_requirements', label: 'Admission Requirements', dependsOn: 'degree' },
    ],
  },
  {
    key: 'job_journey',
    label: 'Job Journey',
    steps: [
      { key: 'country', label: 'Country', dependsOn: null },
      { key: 'city', label: 'City', dependsOn: 'country' },
      { key: 'work_mode', label: 'Work Mode', dependsOn: null },
      { key: 'industry', label: 'Industry', dependsOn: 'country' },
      { key: 'job_family', label: 'Job Family', dependsOn: 'industry' },
      { key: 'role', label: 'Role', dependsOn: 'job_family' },
      { key: 'experience', label: 'Experience', dependsOn: 'role' },
      { key: 'contract', label: 'Contract', dependsOn: null },
      { key: 'salary', label: 'Salary', dependsOn: null },
    ],
  },
]);

export const DPE_QUALITY_PATTERNS = Object.freeze([
  { id: 'hardcoded_percent', pattern: String.raw`\b10\s*%|commissionPercent\s*[:=]\s*10\b`, severity: 'high', category: 'finance' },
  { id: 'hardcoded_title_jsx', pattern: String.raw`<h[1-3][^>]*>[^<{]{3,}`, severity: 'medium', category: 'labels' },
  { id: 'todo_placeholder', pattern: String.raw`TODO|FIXME|placeholder page|coming soon`, severity: 'medium', category: 'placeholders' },
  { id: 'hardcoded_route_href', pattern: String.raw`href=["']/dashboard/[^"']+["']`, severity: 'low', category: 'navigation' },
  { id: 'hardcoded_role', pattern: String.raw`role\s*===\s*['"]admin['"]|role\s*===\s*['"]teacher['"]`, severity: 'medium', category: 'permissions' },
]);

export const DPE_SEED_FEATURE_FLAGS = Object.freeze([
  { key: 'dynamic_nav', label: 'Dynamic Navigation', enabled: true, rolloutPercent: 100 },
  { key: 'dynamic_labels', label: 'Dynamic Labels', enabled: true, rolloutPercent: 100 },
  { key: 'form_builder', label: 'Form Builder', enabled: true, rolloutPercent: 100 },
  { key: 'journey_builder', label: 'Journey Builder', enabled: true, rolloutPercent: 50 },
  { key: 'feature_dashboard_builder', label: 'Dashboard Builder', enabled: true, rolloutPercent: 100 },
  { key: 'beta_ai_agents', label: 'AI Agents OS (beta)', enabled: false, rolloutPercent: 10 },
]);

export const DPE_SEED_SETTINGS = Object.freeze([
  { key: 'platform.default_currency', level: 'global', value: 'USD', category: 'finance' },
  { key: 'platform.default_language', level: 'global', value: 'ar', category: 'localization' },
  { key: 'platform.commission_default_percent', level: 'global', value: 10, category: 'finance', note: 'Initial default only — owned by Commission Engine config' },
  { key: 'platform.soft_delete', level: 'global', value: true, category: 'data' },
  { key: 'country.JO.tax_rate', level: 'country', scope: 'JO', value: 16, category: 'finance' },
  { key: 'country.JO.phone_format', level: 'country', scope: 'JO', value: '+962XXXXXXXXX', category: 'localization' },
]);
