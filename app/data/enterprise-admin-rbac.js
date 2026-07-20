/**
 * ADMIN-01 — Enterprise Admin RBAC matrix.
 * Every permission is individually configurable per role.
 */

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
  'comms.read',
  'comms.write',
  'comms.moderate',
  'comms.meetings',
  'comms.config',
  'reports.view',
  'reports.export',
  'permissions.manage',
  'settings.manage',
  'audit.read',
  'data.restore',
  'data.permanent_delete',
]);

/** Default enterprise roles (configurable; stored copy can diverge). */
export const ENTERPRISE_ADMIN_DEFAULT_ROLES = Object.freeze([
  {
    key: 'super_admin',
    name: 'Super Admin',
    description: 'Full platform control',
    permissions: [...ENTERPRISE_ADMIN_PERMISSION_FLAGS],
  },
  {
    key: 'owner',
    name: 'Owner',
    description: 'Business owner access',
    permissions: ENTERPRISE_ADMIN_PERMISSION_FLAGS.filter((p) => !p.startsWith('platform.config')),
  },
  {
    key: 'ceo',
    name: 'CEO',
    description: 'Executive oversight',
    permissions: ENTERPRISE_ADMIN_PERMISSION_FLAGS.filter(
      (p) =>
        p.startsWith('reports') ||
        p.startsWith('finance.read') ||
        p.startsWith('users.read') ||
        p.startsWith('orgs.read') ||
        p.startsWith('academic.read'),
    ),
  },
  {
    key: 'admin',
    name: 'Admin',
    description: 'Platform administration',
    permissions: ENTERPRISE_ADMIN_PERMISSION_FLAGS.filter((p) => p !== 'data.permanent_delete'),
  },
  {
    key: 'teacher_manager',
    name: 'Teacher Manager',
    description: 'Manage teachers and assignments',
    permissions: [
      'teachers.read',
      'teachers.write',
      'teachers.assign',
      'academic.read',
      'tasks.read',
      'tasks.write',
      'reports.view',
    ],
  },
  {
    key: 'center_manager',
    name: 'Center Manager',
    description: 'Educational center management',
    permissions: [
      'orgs.read',
      'orgs.write',
      'students.read',
      'teachers.read',
      'partners.read',
      'reports.view',
    ],
  },
  {
    key: 'ai_team',
    name: 'AI Team',
    description: 'AI content production',
    permissions: ['content.read', 'content.write', 'content.publish', 'academic.read', 'tasks.read', 'tasks.write'],
  },
  {
    key: 'employee',
    name: 'Employee',
    description: 'Internal staff',
    permissions: ['tasks.read', 'tasks.write', 'hr.read', 'notifications.send'],
  },
  {
    key: 'academic_director',
    name: 'Academic Director',
    description: 'Academic programs and content',
    permissions: ENTERPRISE_ADMIN_PERMISSION_FLAGS.filter(
      (p) =>
        p.startsWith('academic') ||
        p.startsWith('content') ||
        p.startsWith('students') ||
        p.startsWith('teachers') ||
        p.startsWith('reports') ||
        p.startsWith('tasks'),
    ),
  },
  {
    key: 'school_manager',
    name: 'School Manager',
    description: 'School institution management',
    permissions: [
      'orgs.read',
      'orgs.write',
      'students.read',
      'students.write',
      'teachers.read',
      'teachers.assign',
      'academic.read',
      'partners.read',
      'reports.view',
    ],
  },
  {
    key: 'university_manager',
    name: 'University Manager',
    description: 'University institution management',
    permissions: [
      'orgs.read',
      'orgs.write',
      'students.read',
      'academic.read',
      'academic.write',
      'partners.read',
      'reports.view',
      'reports.export',
    ],
  },
  {
    key: 'teacher',
    name: 'Teacher',
    description: 'Teaching and student grades',
    permissions: [
      'students.read',
      'academic.read',
      'content.read',
      'content.write',
      'tasks.read',
      'tasks.write',
      'reports.view',
    ],
  },
  {
    key: 'content_creator',
    name: 'Content Creator',
    description: 'Educational content production',
    permissions: ['content.read', 'content.write', 'academic.read', 'tasks.read'],
  },
  {
    key: 'video_creator',
    name: 'Video Creator',
    description: 'Video lesson production',
    permissions: ['content.read', 'content.write', 'academic.read'],
  },
  {
    key: 'finance',
    name: 'Finance',
    description: 'Finance and accounting',
    permissions: [
      'finance.read',
      'finance.write',
      'finance.payout',
      'finance.commission',
      'reports.view',
      'reports.export',
    ],
  },
  {
    key: 'hr',
    name: 'HR',
    description: 'Human resources',
    permissions: ['hr.read', 'hr.write', 'hr.payroll', 'users.read', 'tasks.read', 'tasks.write'],
  },
  {
    key: 'marketing',
    name: 'Marketing',
    description: 'Marketing campaigns',
    permissions: [
      'marketing.read',
      'marketing.write',
      'social.read',
      'social.write',
      'social.publish',
      'notifications.send',
      'reports.view',
    ],
  },
  {
    key: 'customer_support',
    name: 'Customer Support',
    description: 'Support center',
    permissions: ['support.read', 'support.write', 'users.read', 'notifications.send', 'tasks.read'],
  },
  {
    key: 'sales',
    name: 'Sales',
    description: 'Sales pipeline',
    permissions: ['sales.read', 'sales.write', 'orgs.read', 'partners.read', 'reports.view'],
  },
  {
    key: 'student',
    name: 'Student',
    description: 'Learner access',
    permissions: ['academic.read', 'content.read'],
  },
  {
    key: 'parent',
    name: 'Parent',
    description: 'Parent portal',
    permissions: ['students.read', 'academic.read', 'support.read'],
  },
  {
    key: 'partner',
    name: 'Partner',
    description: 'Partner organization',
    permissions: ['orgs.read', 'partners.read', 'reports.view'],
  },
  {
    key: 'employer',
    name: 'Employer',
    description: 'Employer hiring',
    permissions: ['orgs.read', 'users.read', 'partners.read'],
  },
  {
    key: 'recruitment_company',
    name: 'Recruitment Company',
    description: 'Recruitment partner',
    permissions: ['orgs.read', 'users.read', 'partners.read', 'reports.view'],
  },
]);

export function rolePermissionCount(role) {
  return Array.isArray(role?.permissions) ? role.permissions.length : 0;
}
