/**
 * ADMIN-01 — Enterprise Admin RBAC matrix.
 * Scenario: الإضافة / التعديل / الحذف للمشرف فقط.
 * باقي الأدوار: قراءة وتشغيل حسب الاختصاص.
 */

import {
  SUPERVISOR_ROLES,
  SCENARIO_ROLE_SCOPES,
  canCrud,
  canManagePermissions,
  canPerformAction,
  isSupervisor,
} from './scenario-permissions.js';

export const ENTERPRISE_ADMIN_PERMISSION_FLAGS = Object.freeze([
  'platform.manage',
  'platform.config',
  'platform.audit',
  'users.read',
  'users.write',
  'users.delete',
  'users.suspend',
  'students.read',
  'students.write',
  'students.delete',
  'students.suspend',
  'students.transfer',
  'teachers.read',
  'teachers.write',
  'teachers.delete',
  'teachers.assign',
  'parents.read',
  'parents.write',
  'orgs.read',
  'orgs.write',
  'academic.read',
  'academic.write',
  'content.read',
  'content.write',
  'content.publish',
  'finance.read',
  'finance.write',
  'finance.payout',
  'finance.commission',
  'hr.read',
  'hr.write',
  'hr.payroll',
  'tasks.read',
  'tasks.write',
  'tasks.approve',
  'partners.read',
  'partners.write',
  'partners.verify',
  'marketing.read',
  'marketing.write',
  'sales.read',
  'sales.write',
  'social.read',
  'social.write',
  'social.publish',
  'support.read',
  'support.write',
  'notifications.send',
  'reports.view',
  'reports.export',
  'permissions.manage',
  'settings.manage',
  'audit.read',
  'data.restore',
  'data.permanent_delete',
]);

const WRITE_DELETE = new Set(
  ENTERPRISE_ADMIN_PERMISSION_FLAGS.filter(
    (p) =>
      p.endsWith('.write') ||
      p.endsWith('.delete') ||
      p === 'permissions.manage' ||
      p === 'data.permanent_delete' ||
      p === 'data.restore' ||
      p === 'platform.config',
  ),
);

function scopePermissions(scope) {
  if (scope.permissions.includes('*') || scope.crud) {
    return [...ENTERPRISE_ADMIN_PERMISSION_FLAGS];
  }
  // Exact flags from scenario + never grant write/delete
  return ENTERPRISE_ADMIN_PERMISSION_FLAGS.filter(
    (f) => scope.permissions.includes(f) && !WRITE_DELETE.has(f),
  );
}

/** Default enterprise roles — generated from scenario matrix */
export const ENTERPRISE_ADMIN_DEFAULT_ROLES = Object.freeze(
  Object.entries(SCENARIO_ROLE_SCOPES).map(([key, scope]) => ({
    key,
    name: scope.labelAr,
    description: [
      scope.section === 'company' ? 'الشركة' : scope.section === 'partners' ? 'الشركاء' : 'المستخدمون',
      scope.dept,
      scope.crud ? 'مشرف · CRUD' : 'قراءة/تشغيل حسب الاختصاص',
    ]
      .filter(Boolean)
      .join(' · '),
    permissions: scopePermissions(scope),
  })),
);

export function rolePermissionCount(role) {
  return Array.isArray(role?.permissions) ? role.permissions.length : 0;
}

export {
  SUPERVISOR_ROLES,
  canCrud,
  canManagePermissions,
  canPerformAction,
  isSupervisor,
};

/** Resolve actor role from request body / headers / session fallback */
export function resolveActorRole(input = {}) {
  const raw =
    input.role ||
    input.actorRole ||
    input.userRole ||
    input._role ||
    input.user ||
    '';
  const key = String(raw).toLowerCase().replace(/\s+/g, '_');
  if (SUPERVISOR_ROLES.includes(key) || SCENARIO_ROLE_SCOPES[key]) return key;
  // Map common aliases
  if (key === 'مشرف' || key === 'supervisor') return 'admin';
  if (key === 'owner' || key === 'ceo') return key === 'ceo' ? 'owner' : 'owner';
  return key || 'employee';
}
