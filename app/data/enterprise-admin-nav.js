/**
 * ADMIN-01 — Enterprise Admin navigation + module registry.
 * Sidebar, toolbars, and actions are config-driven (no hardcoded UI lists).
 * ADMIN-NEXT ERP modules are appended via enterprise-erp-modules (shell unchanged).
 */

import {
  ENTERPRISE_ERP_MODULES,
  ENTERPRISE_ERP_NAV,
  ENTERPRISE_ERP_NAV_GROUPS,
} from "./enterprise-erp-modules.js";

export const ENTERPRISE_ADMIN_SCHEMA = "success-os.enterprise-admin.v2";
export const ENTERPRISE_ADMIN_VERSION = "2.1.0";

/**
 * Sidebar section order for Enterprise Admin.
 * Keep ids stable — only labels/grouping change for UX.
 */
export const ENTERPRISE_ADMIN_GROUP_ORDER = Object.freeze([
  "overview",
  "people",
  "orgs",
  "academic",
  "admissions",
  "marketing",
  "hr",
  "finance",
  "partners",
  "workflow",
  "system",
  "curriculum",
]);

/** Core ADMIN-01 sidebar — regrouped into operational sections. */
const ENTERPRISE_ADMIN_NAV_CORE = [
  // Overview
  {
    id: "dashboard",
    label: "Dashboard",
    labelAr: "لوحة التحكم",
    href: "/dashboard/admin",
    icon: "grid",
    group: "overview",
  },

  // People
  {
    id: "students",
    label: "Students",
    labelAr: "الطلاب",
    href: "/dashboard/admin/students",
    icon: "users",
    group: "people",
    crud: true,
  },
  {
    id: "teachers",
    label: "Teachers",
    labelAr: "المعلمون",
    href: "/dashboard/admin/teachers",
    icon: "teacher",
    group: "people",
    crud: true,
  },
  {
    id: "parents",
    label: "Parents",
    labelAr: "أولياء الأمور",
    href: "/dashboard/admin/parents",
    icon: "users",
    group: "people",
  },

  // Organizations
  {
    id: "schools",
    label: "Schools",
    labelAr: "المدارس",
    href: "/dashboard/admin/schools",
    icon: "building",
    group: "orgs",
  },
  {
    id: "universities",
    label: "Universities",
    labelAr: "الجامعات",
    href: "/dashboard/admin/universities",
    icon: "building",
    group: "orgs",
  },
  {
    id: "educational-centers",
    label: "Educational Centers",
    labelAr: "المراكز التعليمية",
    href: "/dashboard/admin/educational-centers",
    icon: "building",
    group: "orgs",
  },
  {
    id: "recruitment-companies",
    label: "Recruitment Companies",
    labelAr: "شركات التوظيف",
    href: "/dashboard/admin/recruitment-companies",
    icon: "briefcase",
    group: "orgs",
  },
  {
    id: "employers",
    label: "Employers",
    labelAr: "أصحاب العمل",
    href: "/dashboard/admin/employers",
    icon: "briefcase",
    group: "orgs",
  },
  {
    id: "job-seekers",
    label: "Job Seekers",
    labelAr: "الباحثون عن عمل",
    href: "/dashboard/admin/job-seekers",
    icon: "users",
    group: "orgs",
  },

  // Academic content
  {
    id: "courses",
    label: "Courses",
    labelAr: "الدورات",
    href: "/dashboard/admin/courses",
    icon: "book",
    group: "academic",
  },
  {
    id: "subjects",
    label: "Subjects",
    labelAr: "المواد",
    href: "/dashboard/admin/subjects",
    icon: "book",
    group: "academic",
  },
  {
    id: "books",
    label: "Books",
    labelAr: "الكتب",
    href: "/dashboard/admin/books",
    icon: "book",
    group: "academic",
  },
  {
    id: "recorded-lessons",
    label: "Recorded Lessons",
    labelAr: "الدروس المسجلة",
    href: "/dashboard/admin/recorded-lessons",
    icon: "video",
    group: "academic",
  },
  {
    id: "live-classes",
    label: "Live Classes",
    labelAr: "الحصص المباشرة",
    href: "/dashboard/admin/live-classes",
    icon: "video",
    group: "academic",
  },
  {
    id: "ai-content",
    label: "AI Content",
    labelAr: "محتوى الذكاء الاصطناعي",
    href: "/dashboard/admin/ai-content",
    icon: "spark",
    group: "academic",
  },
  {
    id: "question-bank",
    label: "Question Bank",
    labelAr: "بنك الأسئلة",
    href: "/dashboard/admin/question-bank",
    icon: "quiz",
    group: "academic",
  },
  {
    id: "exams",
    label: "Exams",
    labelAr: "الاختبارات",
    href: "/dashboard/admin/exams",
    icon: "quiz",
    group: "academic",
  },
  {
    id: "certificates",
    label: "Certificates",
    labelAr: "الشهادات",
    href: "/dashboard/admin/certificates",
    icon: "award",
    group: "academic",
  },

  // Admissions & growth
  {
    id: "scholarships",
    label: "Scholarships",
    labelAr: "المنح",
    href: "/dashboard/admin/scholarships",
    icon: "award",
    group: "admissions",
  },
  {
    id: "admissions",
    label: "Admissions",
    labelAr: "القبول",
    href: "/dashboard/admin/admissions",
    icon: "file",
    group: "admissions",
  },
  {
    id: "study-abroad",
    label: "Study Abroad",
    labelAr: "الدراسة في الخارج",
    href: "/dashboard/admin/study-abroad",
    icon: "globe",
    group: "admissions",
  },

  // Marketing & media
  {
    id: "social-media",
    label: "Social Media",
    labelAr: "وسائل التواصل",
    href: "/dashboard/admin/social-media",
    icon: "share",
    group: "marketing",
  },
  {
    id: "marketing",
    label: "Marketing",
    labelAr: "التسويق",
    href: "/dashboard/admin/marketing",
    icon: "megaphone",
    group: "marketing",
  },
  {
    id: "sales",
    label: "Sales",
    labelAr: "المبيعات",
    href: "/dashboard/admin/sales",
    icon: "currency",
    group: "marketing",
  },

  // HR overview entry (detail modules come from ERP nav)
  {
    id: "human-resources",
    label: "HR Overview",
    labelAr: "نظرة الموارد البشرية",
    href: "/dashboard/admin/human-resources",
    icon: "badge",
    group: "hr",
  },
  {
    id: "employees",
    label: "Employees",
    labelAr: "الموظفون",
    href: "/dashboard/admin/employees",
    icon: "badge",
    group: "hr",
    crud: true,
  },

  // Finance overview entry
  {
    id: "finance",
    label: "Finance Overview",
    labelAr: "نظرة المالية",
    href: "/dashboard/admin/finance",
    icon: "currency",
    group: "finance",
  },

  // Partners & support
  {
    id: "partners",
    label: "Partners",
    labelAr: "الشركاء",
    href: "/dashboard/admin/partners",
    icon: "handshake",
    group: "partners",
    crud: true,
  },
  {
    id: "support-center",
    label: "Support Center",
    labelAr: "مركز الدعم",
    href: "/dashboard/admin/support-center",
    icon: "life-ring",
    group: "partners",
  },

  // System
  {
    id: "notifications",
    label: "Notifications",
    labelAr: "الإشعارات",
    href: "/dashboard/admin/notifications",
    icon: "bell",
    group: "system",
    crud: true,
  },
  {
    id: "reports",
    label: "Reports",
    labelAr: "التقارير",
    href: "/dashboard/admin/reports",
    icon: "chart",
    group: "system",
  },
  {
    id: "permissions",
    label: "Permissions",
    labelAr: "الصلاحيات",
    href: "/dashboard/admin/permissions",
    icon: "lock",
    group: "system",
    crud: true,
  },
  {
    id: "settings",
    label: "Settings",
    labelAr: "الإعدادات",
    href: "/dashboard/admin/settings",
    icon: "gear",
    group: "system",
  },
  {
    id: "system-configuration",
    label: "System Configuration",
    labelAr: "إعدادات النظام",
    href: "/dashboard/admin/system-configuration",
    icon: "sliders",
    group: "system",
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    labelAr: "سجلات التدقيق",
    href: "/dashboard/admin/audit-logs",
    icon: "list",
    group: "system",
  },

  // Curriculum ops
  {
    id: "jordan-ops",
    label: "Jordan Curriculum Ops",
    labelAr: "عمليات منهاج الأردن",
    href: "/admin",
    icon: "flag",
    group: "curriculum",
  },
];

/** Sidebar modules — ADMIN-01 core + ADMIN-NEXT ERP extensions. */
export const ENTERPRISE_ADMIN_NAV = Object.freeze([
  ...ENTERPRISE_ADMIN_NAV_CORE,
  ...ENTERPRISE_ERP_NAV,
]);

/** Section labels (English string kept for compatibility; Arabic via labelAr helpers). */
export const ENTERPRISE_ADMIN_NAV_GROUPS = Object.freeze({
  overview: "Overview",
  people: "People",
  orgs: "Organizations",
  academic: "Academic Content",
  admissions: "Admissions & Growth",
  marketing: "Marketing & Media",
  hr: "Human Resources",
  finance: "Finance & Accounting",
  partners: "Partners & Support",
  workflow: "Tasks & Teams",
  system: "System & Permissions",
  curriculum: "Curriculum Ops",
  ...ENTERPRISE_ERP_NAV_GROUPS,
});

export const ENTERPRISE_ADMIN_NAV_GROUPS_AR = Object.freeze({
  overview: "نظرة عامة",
  people: "المستخدمون",
  orgs: "المؤسسات",
  academic: "المحتوى الأكاديمي",
  admissions: "القبول والنمو",
  marketing: "التسويق والإعلام",
  hr: "الموارد البشرية",
  finance: "المالية والمحاسبة",
  partners: "الشركاء والدعم",
  workflow: "المهام والفرق",
  system: "النظام والصلاحيات",
  curriculum: "عمليات المناهج",
});

/** Module column + action schemas for dynamic tables. */
export const ENTERPRISE_ADMIN_MODULES = Object.freeze({
  students: {
    id: "students",
    collection: "students",
    label: "Students",
    searchable: ["name", "email", "grade", "country", "status"],
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "grade", label: "Grade" },
      { key: "country", label: "Country" },
      { key: "status", label: "Status" },
      { key: "updatedAt", label: "Updated" },
    ],
    actions: [
      "add",
      "edit",
      "delete",
      "suspend",
      "activate",
      "transfer",
      "archive",
      "restore",
      "analytics",
      "payments",
      "attendance",
      "certificates",
      "learningProgress",
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "grade", label: "Grade", type: "text" },
      { key: "country", label: "Country", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "suspended", "inactive"],
      },
    ],
  },
  teachers: {
    id: "teachers",
    collection: "teachers",
    label: "Teachers",
    searchable: ["name", "email", "subjects", "status"],
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "subjects", label: "Subjects" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status" },
      { key: "updatedAt", label: "Updated" },
    ],
    actions: [
      "add",
      "edit",
      "delete",
      "assignSubjects",
      "assignClasses",
      "archive",
      "restore",
      "revenue",
      "ratings",
      "availability",
      "performance",
    ],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "subjects", label: "Subjects", type: "text" },
      { key: "classes", label: "Classes", type: "text" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "availability", label: "Availability", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "suspended", "inactive"],
      },
    ],
  },
  employees: {
    id: "employees",
    collection: "employees",
    label: "Employees",
    searchable: ["name", "email", "department", "jobTitle", "status"],
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "department", label: "Department" },
      { key: "jobTitle", label: "Job Title" },
      { key: "status", label: "Status" },
    ],
    actions: ["add", "edit", "delete", "archive", "restore"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "department", label: "Department", type: "text" },
      { key: "jobTitle", label: "Job Title", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "on_leave", "terminated"],
      },
    ],
  },
  permissions: {
    id: "permissions",
    collection: "roles",
    label: "Permissions",
    searchable: ["name", "key", "description"],
    columns: [
      { key: "name", label: "Role" },
      { key: "key", label: "Key" },
      { key: "permissionCount", label: "Permissions" },
      { key: "updatedAt", label: "Updated" },
    ],
    actions: ["createRole", "assignPermissions", "permissionMatrix"],
    fields: [
      { key: "name", label: "Role name", type: "text", required: true },
      { key: "key", label: "Role key", type: "text", required: true },
      { key: "description", label: "Description", type: "text" },
    ],
  },
  ...ENTERPRISE_ERP_MODULES,
});

/** Generic shell modules (list from API; empty is valid live data). */
export const ENTERPRISE_ADMIN_SHELL_MODULES = Object.freeze(
  ENTERPRISE_ADMIN_NAV.filter(
    (n) =>
      n.id !== "dashboard" &&
      n.id !== "jordan-ops" &&
      !ENTERPRISE_ADMIN_MODULES[n.id],
  ).map((n) => n.id),
);

export function getNavItem(moduleId) {
  return ENTERPRISE_ADMIN_NAV.find((n) => n.id === moduleId) || null;
}

export function getModuleSchema(moduleId) {
  return (
    ENTERPRISE_ADMIN_MODULES[moduleId] || {
      id: moduleId,
      collection: moduleId,
      label: getNavItem(moduleId)?.label || moduleId,
      searchable: ["name", "title", "status"],
      columns: [
        { key: "name", label: "Name" },
        { key: "status", label: "Status" },
        { key: "updatedAt", label: "Updated" },
      ],
      actions: ["view", "add", "edit", "delete", "archive", "restore"],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "status", label: "Status", type: "text" },
      ],
    }
  );
}

export function resolveNavGroupLabel(groupId, lang = "en") {
  if (lang === "ar") {
    return (
      ENTERPRISE_ADMIN_NAV_GROUPS_AR[groupId] ||
      ENTERPRISE_ADMIN_NAV_GROUPS[groupId] ||
      groupId
    );
  }
  return ENTERPRISE_ADMIN_NAV_GROUPS[groupId] || groupId;
}

export function resolveNavItemLabel(item, lang = "en") {
  if (!item) return "";
  if (lang === "ar" && item.labelAr) return item.labelAr;
  return item.label || item.id;
}
