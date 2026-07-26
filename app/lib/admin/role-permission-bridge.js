/**
 * Bridge: Enterprise Admin permission matrix → role control dashboards.
 * Effective permissions come from the admin-managed roles store.
 */

import {
  ENTERPRISE_ADMIN_DEFAULT_ROLES,
  ENTERPRISE_ADMIN_PERMISSION_FLAGS,
  rolePermissionCount,
} from '../../data/enterprise-admin-rbac.js';
import {
  USER_CONTROL_DASHBOARD_ROLES,
  PUBLIC_DASHBOARD_LINKS,
  filterModulesByPermissions,
  getRoleDashboardDefinition,
} from '../../data/role-dashboard-modules.js';
import { getPermissionsMatrix } from './enterprise-admin-engine.js';

/** Map app role keys to enterprise role keys when names diverge. */
const ROLE_KEY_ALIASES = Object.freeze({
  school: ['school', 'school_manager'],
  university: ['university', 'university_manager'],
  educational_center: ['educational_center', 'center_manager'],
  job_seeker: ['job_seeker', 'jobseeker'],
  social_media_manager: ['social_media_manager', 'marketing'],
  recruitment_company: ['recruitment_company'],
  employee: ['employee'],
  college: ['college'],
  school_student: ['school_student', 'student'],
  university_student: ['university_student', 'student'],
  super_admin: ['super_admin'],
});

function list(v) {
  return Array.isArray(v) ? v : [];
}

function defaultRoleByKey(key) {
  return ENTERPRISE_ADMIN_DEFAULT_ROLES.find((r) => r.key === key) || null;
}

function resolveCandidateKeys(roleKey) {
  const aliases = ROLE_KEY_ALIASES[roleKey] || [roleKey];
  return [...new Set(aliases)];
}

/**
 * Resolve the enterprise role record for a user-facing role key.
 */
export function resolveEnterpriseRole(roleKey) {
  const matrix = getPermissionsMatrix();
  const roles = list(matrix.roles);
  const candidates = resolveCandidateKeys(roleKey);

  for (const key of candidates) {
    const found = roles.find((r) => r.key === key || r.id === key);
    if (found) return found;
  }

  for (const key of candidates) {
    const fallback = defaultRoleByKey(key);
    if (fallback) {
      return {
        ...fallback,
        id: fallback.key,
        permissionCount: rolePermissionCount(fallback),
        source: 'default',
      };
    }
  }

  return null;
}

/**
 * Effective permission flags for a role (admin matrix wins over defaults).
 */
export function getEffectivePermissionsForRole(roleKey) {
  const role = resolveEnterpriseRole(roleKey);
  if (!role) return [];
  return list(role.permissions).filter((p) =>
    ENTERPRISE_ADMIN_PERMISSION_FLAGS.includes(p),
  );
}

/**
 * Build the control-dashboard payload for one role.
 */
export function buildRoleControlDashboard(roleKey, options = {}) {
  const lang = options.lang === 'en' ? 'en' : 'ar';
  const definition = getRoleDashboardDefinition(roleKey);
  const role = resolveEnterpriseRole(roleKey);
  const permissions = getEffectivePermissionsForRole(roleKey);
  const modules = definition
    ? filterModulesByPermissions(definition.modules, permissions)
    : [];
  const locked = definition
    ? definition.modules.filter(
        (mod) => !modules.some((open) => open.id === mod.id),
      )
    : [];

  return {
    ok: true,
    roleKey,
    role: role
      ? {
          key: role.key,
          name: role.name,
          description: role.description,
          permissionCount: rolePermissionCount(role),
          source: role.source || 'enterprise-admin',
        }
      : null,
    label: definition ? (lang === 'ar' ? definition.labelAr : definition.label) : roleKey,
    labelAr: definition?.labelAr || roleKey,
    labelEn: definition?.label || roleKey,
    permissions,
    modules: modules.map((mod) => ({
      ...mod,
      title: lang === 'ar' ? mod.titleAr : mod.title,
      description: lang === 'ar' ? mod.descriptionAr : mod.description,
      unlocked: true,
    })),
    lockedModules: locked.map((mod) => ({
      id: mod.id,
      title: lang === 'ar' ? mod.titleAr : mod.title,
      description: lang === 'ar' ? mod.descriptionAr : mod.description,
      permissions: mod.permissions,
      unlocked: false,
    })),
    dashboardPath: resolveDashboardPath(roleKey),
    managedByAdmin: true,
    permissionsHref: '/dashboard/admin/permissions',
    generatedAt: new Date().toISOString(),
  };
}

function resolveDashboardPath(roleKey) {
  if (roleKey === 'student') return '/students/dashboard';
  if (roleKey === 'job_seeker' || roleKey === 'jobseeker') return '/jobs/dashboard';
  if (roleKey === 'admin') return '/dashboard/admin';
  if (roleKey === 'super_admin') return '/dashboard/super-admin';
  if (roleKey === 'employee') return '/dashboard/employees';
  if (roleKey === 'teacher') return '/teachers/dashboard';
  return `/dashboard/${String(roleKey).replace(/_/g, '-')}`;
}

/**
 * Directory of all user control dashboards for admin distribution view.
 */
export function listUserControlDashboards(options = {}) {
  const lang = options.lang === 'en' ? 'en' : 'ar';
  return {
    ok: true,
    roles: USER_CONTROL_DASHBOARD_ROLES.map((roleKey) => {
      const dash = buildRoleControlDashboard(roleKey, { lang });
      return {
        roleKey,
        label: dash.label,
        labelAr: dash.labelAr,
        labelEn: dash.labelEn,
        dashboardPath: dash.dashboardPath,
        permissionCount: dash.permissions.length,
        unlockedModules: dash.modules.length,
        lockedModules: dash.lockedModules.length,
        roleSource: dash.role?.source || null,
      };
    }),
    publicLinks: PUBLIC_DASHBOARD_LINKS.map((item) => ({
      ...item,
      absoluteHint: item.href,
    })),
    permissionsHref: '/dashboard/admin/permissions',
    generatedAt: new Date().toISOString(),
  };
}
