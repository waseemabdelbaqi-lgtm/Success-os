/**
 * ADMIN-01 — Enterprise Admin navigation + module registry.
 * Sidebar, toolbars, and actions are config-driven (no hardcoded UI lists).
 * ADMIN-NEXT ERP modules are appended via enterprise-erp-modules (shell unchanged).
 */

import {
  ENTERPRISE_ERP_MODULES,
  ENTERPRISE_ERP_NAV,
  ENTERPRISE_ERP_NAV_GROUPS,
} from './enterprise-erp-modules.js';
import {
  RECORDED_LESSON_CONCRETE_SOURCES,
  lessonSourceLabel,
} from './recorded-lesson-sources.js';

export const ENTERPRISE_ADMIN_SCHEMA = 'success-os.enterprise-admin.v2';
export const ENTERPRISE_ADMIN_VERSION = '2.0.0';

/** Core ADMIN-01 sidebar — preserved order. */
const ENTERPRISE_ADMIN_NAV_CORE = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard/admin', icon: 'grid', group: 'main' },
  { id: 'students', label: 'Students', href: '/dashboard/admin/students', icon: 'users', group: 'people', crud: true },
  { id: 'teachers', label: 'Teachers', href: '/dashboard/admin/teachers', icon: 'teacher', group: 'people', crud: true },
  { id: 'parents', label: 'Parents', href: '/dashboard/admin/parents', icon: 'users', group: 'people' },
  { id: 'schools', label: 'Schools', href: '/dashboard/admin/schools', icon: 'building', group: 'orgs' },
  { id: 'universities', label: 'Universities', href: '/dashboard/admin/universities', icon: 'building', group: 'orgs' },
  { id: 'educational-centers', label: 'Educational Centers', href: '/dashboard/admin/educational-centers', icon: 'building', group: 'orgs' },
  { id: 'recruitment-companies', label: 'Recruitment Companies', href: '/dashboard/admin/recruitment-companies', icon: 'briefcase', group: 'orgs' },
  { id: 'employers', label: 'Employers', href: '/dashboard/admin/employers', icon: 'briefcase', group: 'orgs' },
  { id: 'job-seekers', label: 'Job Seekers', href: '/dashboard/admin/job-seekers', icon: 'users', group: 'orgs' },
  { id: 'courses', label: 'Courses', href: '/dashboard/admin/courses', icon: 'book', group: 'academic' },
  { id: 'subjects', label: 'Subjects', href: '/dashboard/admin/subjects', icon: 'book', group: 'academic' },
  { id: 'books', label: 'Books', href: '/dashboard/admin/books', icon: 'book', group: 'academic' },
  { id: 'recorded-lessons', label: 'Recorded Lessons', href: '/dashboard/admin/recorded-lessons', icon: 'video', group: 'academic' },
  { id: 'live-classes', label: 'Live Classes', href: '/dashboard/admin/live-classes', icon: 'video', group: 'academic' },
  { id: 'ai-content', label: 'AI Content', href: '/dashboard/admin/ai-content', icon: 'spark', group: 'academic' },
  { id: 'question-bank', label: 'Question Bank', href: '/dashboard/admin/question-bank', icon: 'quiz', group: 'academic' },
  { id: 'exams', label: 'Exams', href: '/dashboard/admin/exams', icon: 'quiz', group: 'academic' },
  { id: 'certificates', label: 'Certificates', href: '/dashboard/admin/certificates', icon: 'award', group: 'academic' },
  { id: 'scholarships', label: 'Scholarships', href: '/dashboard/admin/scholarships', icon: 'award', group: 'growth' },
  { id: 'admissions', label: 'Admissions', href: '/dashboard/admin/admissions', icon: 'file', group: 'growth' },
  { id: 'study-abroad', label: 'Study Abroad', href: '/dashboard/admin/study-abroad', icon: 'globe', group: 'growth' },
  { id: 'social-media', label: 'Social Media', href: '/dashboard/admin/social-media', icon: 'share', group: 'growth' },
  { id: 'human-resources', label: 'Human Resources', href: '/dashboard/admin/human-resources', icon: 'badge', group: 'ops' },
  { id: 'employees', label: 'Employees', href: '/dashboard/admin/employees', icon: 'badge', group: 'ops', crud: true },
  { id: 'finance', label: 'Finance & Accounting', href: '/dashboard/admin/finance', icon: 'currency', group: 'ops' },
  { id: 'marketing', label: 'Marketing', href: '/dashboard/admin/marketing', icon: 'megaphone', group: 'ops' },
  { id: 'sales', label: 'Sales', href: '/dashboard/admin/sales', icon: 'currency', group: 'ops' },
  { id: 'partners', label: 'Partners', href: '/dashboard/admin/partners', icon: 'handshake', group: 'ops', crud: true },
  { id: 'support-center', label: 'Support Center', href: '/dashboard/admin/support-center', icon: 'life-ring', group: 'ops' },
  { id: 'notifications', label: 'Notifications', href: '/dashboard/admin/notifications', icon: 'bell', group: 'system', crud: true },
  { id: 'reports', label: 'Reports', href: '/dashboard/admin/reports', icon: 'chart', group: 'system' },
  { id: 'permissions', label: 'Permissions', href: '/dashboard/admin/permissions', icon: 'lock', group: 'system', crud: true },
  { id: 'settings', label: 'Settings', href: '/dashboard/admin/settings', icon: 'gear', group: 'system' },
  { id: 'system-configuration', label: 'System Configuration', href: '/dashboard/admin/system-configuration', icon: 'sliders', group: 'system' },
  { id: 'audit-logs', label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: 'list', group: 'system' },
  { id: 'jordan-ops', label: 'Jordan Curriculum Ops', href: '/admin', icon: 'flag', group: 'system' },
];

/** Sidebar modules — ADMIN-01 core + ADMIN-NEXT ERP extensions. */
export const ENTERPRISE_ADMIN_NAV = Object.freeze([
  ...ENTERPRISE_ADMIN_NAV_CORE,
  ...ENTERPRISE_ERP_NAV,
]);

export const ENTERPRISE_ADMIN_NAV_GROUPS = Object.freeze({
  main: 'Overview',
  people: 'People',
  orgs: 'Organizations',
  academic: 'Academic',
  growth: 'Growth',
  ops: 'Operations',
  ...ENTERPRISE_ERP_NAV_GROUPS,
  system: 'System',
});

/** Module column + action schemas for dynamic tables. */
export const ENTERPRISE_ADMIN_MODULES = Object.freeze({
  students: {
    id: 'students',
    collection: 'students',
    label: 'Students',
    searchable: ['name', 'email', 'grade', 'country', 'status'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'grade', label: 'Grade' },
      { key: 'country', label: 'Country' },
      { key: 'status', label: 'Status' },
      { key: 'updatedAt', label: 'Updated' },
    ],
    actions: [
      'add',
      'edit',
      'delete',
      'suspend',
      'activate',
      'transfer',
      'archive',
      'restore',
      'analytics',
      'payments',
      'attendance',
      'certificates',
      'learningProgress',
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'grade', label: 'Grade', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'suspended', 'inactive'] },
    ],
  },
  teachers: {
    id: 'teachers',
    collection: 'teachers',
    label: 'Teachers',
    searchable: ['name', 'email', 'subjects', 'status'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'subjects', label: 'Subjects' },
      { key: 'rating', label: 'Rating' },
      { key: 'status', label: 'Status' },
      { key: 'updatedAt', label: 'Updated' },
    ],
    actions: [
      'add',
      'edit',
      'delete',
      'assignSubjects',
      'assignClasses',
      'archive',
      'restore',
      'revenue',
      'ratings',
      'availability',
      'performance',
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'subjects', label: 'Subjects', type: 'text' },
      { key: 'classes', label: 'Classes', type: 'text' },
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'availability', label: 'Availability', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'suspended', 'inactive'] },
    ],
  },
  employees: {
    id: 'employees',
    collection: 'employees',
    label: 'Employees',
    searchable: ['name', 'email', 'department', 'jobTitle', 'status'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Department' },
      { key: 'jobTitle', label: 'Job Title' },
      { key: 'status', label: 'Status' },
    ],
    actions: ['add', 'edit', 'delete', 'archive', 'restore'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'jobTitle', label: 'Job Title', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'on_leave', 'terminated'] },
    ],
  },
  'recorded-lessons': {
    id: 'recorded-lessons',
    collection: 'recorded-lessons',
    label: 'Recorded Lessons',
    searchable: ['name', 'title', 'subject', 'grade', 'teacherName', 'lessonSource', 'status'],
    filters: {
      lessonSource: {
        label: 'Lesson Source',
        type: 'radio',
        options: [
          { value: 's4s_intelligence', label: 'S4S Intelligence' },
          { value: 'teacher', label: 'Teacher' },
          { value: 'female_teacher', label: 'Female Teacher' },
          { value: 'all', label: 'All' },
        ],
        default: 'all',
      },
    },
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'subject', label: 'Subject' },
      { key: 'grade', label: 'Grade' },
      { key: 'lessonSourceLabel', label: 'Lesson Source' },
      { key: 'teacherName', label: 'Teacher' },
      { key: 'durationMinutes', label: 'Minutes' },
      { key: 'status', label: 'Status' },
      { key: 'updatedAt', label: 'Updated' },
    ],
    actions: ['add', 'edit', 'delete', 'archive', 'restore', 'view'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'name', label: 'Name (optional)', type: 'text' },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'grade', label: 'Grade', type: 'text' },
      {
        key: 'lessonSource',
        label: 'Lesson Source',
        type: 'select',
        required: true,
        options: RECORDED_LESSON_CONCRETE_SOURCES.map((id) => ({
          value: id,
          label: lessonSourceLabel(id),
        })),
      },
      { key: 'teacherName', label: 'Teacher name', type: 'text' },
      { key: 'durationMinutes', label: 'Duration (minutes)', type: 'number' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: ['draft', 'pending', 'approved', 'published', 'archived', 'active', 'inactive'],
      },
    ],
    formatRow(row) {
      return {
        ...row,
        title: row.title || row.name || '—',
        name: row.name || row.title || '',
        lessonSourceLabel: lessonSourceLabel(row.lessonSource),
      };
    },
  },
  permissions: {
    id: 'permissions',
    collection: 'roles',
    label: 'Permissions',
    searchable: ['name', 'key', 'description'],
    columns: [
      { key: 'name', label: 'Role' },
      { key: 'key', label: 'Key' },
      { key: 'permissionCount', label: 'Permissions' },
      { key: 'updatedAt', label: 'Updated' },
    ],
    actions: ['createRole', 'assignPermissions', 'permissionMatrix'],
    fields: [
      { key: 'name', label: 'Role name', type: 'text', required: true },
      { key: 'key', label: 'Role key', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },
  ...ENTERPRISE_ERP_MODULES,
});

/** Generic shell modules (list from API; empty is valid live data). */
export const ENTERPRISE_ADMIN_SHELL_MODULES = Object.freeze(
  ENTERPRISE_ADMIN_NAV.filter(
    (n) =>
      n.id !== 'dashboard' &&
      n.id !== 'jordan-ops' &&
      !ENTERPRISE_ADMIN_MODULES[n.id],
  ).map((n) => n.id),
);

export function getNavItem(moduleId) {
  return ENTERPRISE_ADMIN_NAV.find((n) => n.id === moduleId) || null;
}

export function getModuleSchema(moduleId) {
  return ENTERPRISE_ADMIN_MODULES[moduleId] || {
    id: moduleId,
    collection: moduleId,
    label: getNavItem(moduleId)?.label || moduleId,
    searchable: ['name', 'title', 'status'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'updatedAt', label: 'Updated' },
    ],
    actions: ['view', 'add', 'edit', 'delete', 'archive', 'restore'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'text' },
    ],
  };
}
