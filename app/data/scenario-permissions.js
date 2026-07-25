/**
 * Scenario RBAC — SUCCESS OS
 *
 * المشرف (supervisor) = super_admin + admin
 *   → وحدهم يملكون إضافة / تعديل / حذف على السجلات والصلاحيات.
 *
 * باقي الأدوار: قراءة + تشغيل حسب الاختصاص (شركة / شركاء / مستخدمون).
 */

export const SUPERVISOR_ROLES = Object.freeze(['super_admin', 'admin']);

/** CRUD verbs reserved for المشرف */
export const CRUD_ACTIONS = Object.freeze([
  'add',
  'create',
  'edit',
  'update',
  'delete',
  'bulkDelete',
  'restore',
  'archive',
  'permanentDelete',
  'createRole',
  'deleteRole',
  'togglePermission',
  'assignPermissions',
  'updateRolePermissions',
]);

/** Operate verbs allowed by specialty (not full CRUD) */
export const OPERATE_ACTIONS = Object.freeze([
  'view',
  'export',
  'approve',
  'reject',
  'publish',
  'respond',
  'assign',
  'suspend',
  'activate',
  'processPayment',
  'markTransferred',
  'previewCommission',
]);

/**
 * Specialty scopes aligned with control hubs.
 * permissions = enterprise-admin flags the role may USE (read/operate).
 * hubs = control-hub ids the role should see as primary workspace.
 */
export const SCENARIO_ROLE_SCOPES = Object.freeze({
  // ── المشرفون ────────────────────────────────────────────
  super_admin: {
    section: 'company',
    dept: 'قيادة',
    labelAr: 'المشرف الأعلى',
    crud: true,
    managePermissions: true,
    permissions: ['*'],
    hubs: ['owner', 'super-admin', 'admin-erp'],
  },
  admin: {
    section: 'company',
    dept: 'قيادة',
    labelAr: 'المشرف',
    crud: true,
    managePermissions: true,
    permissions: ['*'],
    hubs: ['admin-erp', 'super-admin', 'owner'],
  },

  // ── الشركة ──────────────────────────────────────────────
  owner: {
    section: 'company',
    dept: 'قيادة',
    labelAr: 'المالك',
    crud: false,
    managePermissions: false,
    permissions: [
      'reports.view',
      'reports.export',
      'finance.read',
      'users.read',
      'orgs.read',
      'academic.read',
      'partners.read',
      'audit.read',
      'tasks.read',
      'tasks.approve',
    ],
    hubs: ['owner', 'admin-erp', 'finance', 'hr', 'legal'],
  },
  engineer: {
    section: 'company',
    dept: 'تقنية',
    labelAr: 'مهندس المنصة',
    crud: false,
    managePermissions: false,
    permissions: [
      'platform.audit',
      'audit.read',
      'settings.manage',
      'reports.view',
      'tasks.read',
      'tasks.write',
    ],
    hubs: ['engineer', 'security-qa'],
  },
  hr: {
    section: 'company',
    dept: 'موارد بشرية',
    labelAr: 'الموارد البشرية',
    crud: false,
    managePermissions: false,
    permissions: ['hr.read', 'users.read', 'tasks.read', 'tasks.write', 'reports.view'],
    hubs: ['hr'],
  },
  legal: {
    section: 'company',
    dept: 'قانونية',
    labelAr: 'الدائرة القانونية',
    crud: false,
    managePermissions: false,
    permissions: [
      'partners.read',
      'audit.read',
      'reports.view',
      'tasks.read',
      'tasks.approve',
    ],
    hubs: ['legal'],
  },
  finance: {
    section: 'company',
    dept: 'مالية',
    labelAr: 'المالية',
    crud: false,
    managePermissions: false,
    permissions: [
      'finance.read',
      'finance.payout',
      'finance.commission',
      'reports.view',
      'reports.export',
      'tasks.read',
    ],
    hubs: ['finance'],
  },
  marketing: {
    section: 'company',
    dept: 'تسويق',
    labelAr: 'التسويق',
    crud: false,
    managePermissions: false,
    permissions: [
      'marketing.read',
      'social.read',
      'social.publish',
      'notifications.send',
      'reports.view',
      'tasks.read',
      'tasks.write',
    ],
    hubs: ['marketing-sales'],
  },
  sales: {
    section: 'company',
    dept: 'تسويق',
    labelAr: 'المبيعات',
    crud: false,
    managePermissions: false,
    permissions: ['sales.read', 'orgs.read', 'partners.read', 'reports.view', 'tasks.read'],
    hubs: ['marketing-sales', 'partners-admin'],
  },
  content_creator: {
    section: 'company',
    dept: 'محتوى',
    labelAr: 'صانع المحتوى',
    crud: false,
    managePermissions: false,
    permissions: [
      'content.read',
      'academic.read',
      'tasks.read',
      'tasks.write',
      'reports.view',
    ],
    hubs: ['content'],
  },
  social_media_manager: {
    section: 'company',
    dept: 'تسويق',
    labelAr: 'السوشيال ميديا',
    crud: false,
    managePermissions: false,
    permissions: [
      'social.read',
      'social.publish',
      'marketing.read',
      'content.read',
      'notifications.send',
      'reports.view',
    ],
    hubs: ['marketing-sales'],
  },
  academic_director: {
    section: 'company',
    dept: 'أكاديمي',
    labelAr: 'المدير الأكاديمي',
    crud: false,
    managePermissions: false,
    permissions: [
      'academic.read',
      'content.read',
      'students.read',
      'teachers.read',
      'reports.view',
      'reports.export',
      'tasks.read',
      'tasks.approve',
    ],
    hubs: ['academic', 'house-teacher'],
  },
  customer_support: {
    section: 'company',
    dept: 'دعم',
    labelAr: 'دعم العملاء',
    crud: false,
    managePermissions: false,
    permissions: [
      'support.read',
      'support.write',
      'users.read',
      'notifications.send',
      'tasks.read',
    ],
    hubs: ['support', 'security-qa'],
  },
  employee: {
    section: 'company',
    dept: 'دعم',
    labelAr: 'موظف داخلي',
    crud: false,
    managePermissions: false,
    permissions: ['tasks.read', 'tasks.write', 'hr.read', 'notifications.send'],
    hubs: ['support'],
  },

  // ── الشركاء ─────────────────────────────────────────────
  teacher: {
    section: 'partners',
    dept: null,
    labelAr: 'المعلم الشريك',
    crud: false,
    managePermissions: false,
    permissions: [
      'students.read',
      'academic.read',
      'content.read',
      'tasks.read',
      'tasks.write',
      'reports.view',
    ],
    hubs: ['partner-teacher'],
  },
  school_manager: {
    section: 'partners',
    dept: null,
    labelAr: 'المدرسة الشريكة',
    crud: false,
    managePermissions: false,
    permissions: [
      'orgs.read',
      'students.read',
      'teachers.read',
      'academic.read',
      'partners.read',
      'reports.view',
    ],
    hubs: ['partner-school'],
  },
  university_manager: {
    section: 'partners',
    dept: null,
    labelAr: 'الجامعة الشريكة',
    crud: false,
    managePermissions: false,
    permissions: [
      'orgs.read',
      'students.read',
      'academic.read',
      'partners.read',
      'reports.view',
      'reports.export',
    ],
    hubs: ['partner-university'],
  },
  center_manager: {
    section: 'partners',
    dept: null,
    labelAr: 'المركز التعليمي',
    crud: false,
    managePermissions: false,
    permissions: [
      'orgs.read',
      'students.read',
      'teachers.read',
      'partners.read',
      'reports.view',
    ],
    hubs: ['partner-center'],
  },
  employer: {
    section: 'partners',
    dept: null,
    labelAr: 'شركة التوظيف',
    crud: false,
    managePermissions: false,
    permissions: ['orgs.read', 'users.read', 'partners.read', 'reports.view'],
    hubs: ['partner-employer'],
  },
  partner: {
    section: 'partners',
    dept: null,
    labelAr: 'شريك',
    crud: false,
    managePermissions: false,
    permissions: ['orgs.read', 'partners.read', 'reports.view'],
    hubs: ['partners-admin'],
  },
  recruitment_company: {
    section: 'partners',
    dept: null,
    labelAr: 'شركة استقطاب',
    crud: false,
    managePermissions: false,
    permissions: ['orgs.read', 'users.read', 'partners.read', 'reports.view'],
    hubs: ['partner-employer'],
  },

  // ── المستخدمون ──────────────────────────────────────────
  student: {
    section: 'users',
    dept: null,
    labelAr: 'الطالب',
    crud: false,
    managePermissions: false,
    permissions: ['academic.read', 'content.read'],
    hubs: ['user-student'],
  },
  job_seeker: {
    section: 'users',
    dept: null,
    labelAr: 'الباحث عن عمل',
    crud: false,
    managePermissions: false,
    permissions: ['content.read', 'reports.view'],
    hubs: ['user-jobseeker'],
  },
  parent: {
    section: 'company',
    dept: 'دعم',
    labelAr: 'ولي الأمر (متابعة)',
    crud: false,
    managePermissions: false,
    permissions: ['students.read', 'academic.read', 'support.read'],
    hubs: ['support'],
  },
});

/** Map control-center role ids → scenario keys */
export const CONTROL_CENTER_SCENARIO_KEY = Object.freeze({
  owner: 'owner',
  engineer: 'engineer',
  content: 'content_creator',
  social: 'social_media_manager',
  academic: 'academic_director',
  houseTeacher: 'employee',
  teacher: 'teacher',
  institution: 'university_manager',
  employer: 'employer',
  student: 'student',
});

export function isSupervisor(roleKey) {
  return SUPERVISOR_ROLES.includes(String(roleKey || '').toLowerCase());
}

export function getScenarioScope(roleKey) {
  const key = String(roleKey || '').toLowerCase();
  return (
    SCENARIO_ROLE_SCOPES[key] || {
      section: 'company',
      dept: null,
      labelAr: roleKey || 'مجهول',
      crud: false,
      managePermissions: false,
      permissions: [],
      hubs: [],
    }
  );
}

export function roleHasFlag(roleKey, flag) {
  if (isSupervisor(roleKey)) return true;
  const scope = getScenarioScope(roleKey);
  if (scope.permissions.includes('*')) return true;
  return scope.permissions.includes(flag);
}

export function canCrud(roleKey) {
  return isSupervisor(roleKey) || getScenarioScope(roleKey).crud === true;
}

export function canManagePermissions(roleKey) {
  return isSupervisor(roleKey) || getScenarioScope(roleKey).managePermissions === true;
}

export function canPerformAction(roleKey, action) {
  const a = String(action || '');
  if (CRUD_ACTIONS.includes(a) || a.startsWith('role')) {
    return canCrud(roleKey);
  }
  if (a === 'togglePermission' || a === 'createRole' || a === 'deleteRole') {
    return canManagePermissions(roleKey);
  }
  return true; // read/operate defaults allowed if hub access granted
}

/** Filter schema actions for UI — strip add/edit/delete unless supervisor */
export function filterSchemaActions(actions, roleKey) {
  const list = Array.isArray(actions) ? actions : [];
  if (canCrud(roleKey)) return list;
  return list.filter((a) => !CRUD_ACTIONS.includes(a) && !['add', 'edit', 'delete', 'create'].includes(a));
}

/** Permissions list for a hub card (display) */
export function permissionsForHub(hubId) {
  const entries = Object.entries(SCENARIO_ROLE_SCOPES).filter(([, s]) =>
    (s.hubs || []).includes(hubId),
  );
  if (!entries.length) {
    return { read: [], operate: [], crudNote: 'الإضافة والتعديل والحذف للمشرف فقط' };
  }
  const flags = [...new Set(entries.flatMap(([, s]) => s.permissions.filter((p) => p !== '*')))];
  return {
    roles: entries.map(([k, s]) => ({ key: k, labelAr: s.labelAr })),
    read: flags.filter((f) => f.endsWith('.read') || f.includes('view') || f.includes('export')),
    operate: flags.filter(
      (f) =>
        !f.endsWith('.read') &&
        !f.includes('view') &&
        !f.endsWith('.write') &&
        !f.endsWith('.delete'),
    ),
    crudNote: 'الإضافة والتعديل والحذف للمشرف فقط',
  };
}

/** Build enterprise default roles from scenario (supervisor keeps full flags) */
export function buildScenarioEnterpriseRoles(allFlags) {
  const flags = [...allFlags];
  return Object.entries(SCENARIO_ROLE_SCOPES).map(([key, scope]) => ({
    key,
    name: scope.labelAr,
    description: `${scope.section}/${scope.dept || 'general'} · crud=${scope.crud}`,
    permissions: scope.permissions.includes('*')
      ? flags
      : flags.filter((f) => {
          // Never grant write/delete to non-supervisors
          if (!scope.crud && (f.endsWith('.write') || f.endsWith('.delete') || f === 'permissions.manage' || f === 'data.permanent_delete' || f === 'data.restore')) {
            return false;
          }
          return scope.permissions.includes(f) || scope.permissions.some((p) => f.startsWith(p.replace(/\.(read|write|delete)$/, '')));
        }),
  }));
}
