export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  OWNER: "owner",
  ADMIN: "admin",
  ACADEMIC_DIRECTOR: "academic_director",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  SCHOOL: "school",
  UNIVERSITY: "university",
  EDUCATIONAL_CENTER: "educational_center",
  EMPLOYER: "employer",
  JOB_SEEKER: "job_seeker",
  CONTENT_CREATOR: "content_creator",
  SOCIAL_MEDIA_MANAGER: "social_media_manager",
  CUSTOMER_SUPPORT: "customer_support",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export type RoleSlug = string;

export type RoleDefinition = {
  id: UserRole;
  slug: RoleSlug;
  label: string;
  description: string;
  dashboardPath: string;
  tier: RoleTier;
  selfRegisterable: boolean;
  category: RoleCategory;
};

export type RoleTier = "platform" | "education" | "employment" | "content" | "support";

export type RoleCategory =
  | "platform"
  | "education"
  | "employment"
  | "content"
  | "support";

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  [USER_ROLES.SUPER_ADMIN]: {
    id: USER_ROLES.SUPER_ADMIN,
    slug: "super-admin",
    label: "Super Admin",
    description: "Full platform control and system configuration.",
    dashboardPath: "/dashboard/super-admin",
    tier: "platform",
    selfRegisterable: false,
    category: "platform",
  },
  [USER_ROLES.OWNER]: {
    id: USER_ROLES.OWNER,
    slug: "owner",
    label: "Owner",
    description: "Organization ownership and strategic oversight.",
    dashboardPath: "/dashboard/owner",
    tier: "platform",
    selfRegisterable: false,
    category: "platform",
  },
  [USER_ROLES.ADMIN]: {
    id: USER_ROLES.ADMIN,
    slug: "admin",
    label: "Admin",
    description: "Platform administration and user management.",
    dashboardPath: "/dashboard/admin",
    tier: "platform",
    selfRegisterable: false,
    category: "platform",
  },
  [USER_ROLES.ACADEMIC_DIRECTOR]: {
    id: USER_ROLES.ACADEMIC_DIRECTOR,
    slug: "academic-director",
    label: "Academic Director",
    description: "Academic program oversight and curriculum management.",
    dashboardPath: "/dashboard/academic-director",
    tier: "education",
    selfRegisterable: false,
    category: "education",
  },
  [USER_ROLES.TEACHER]: {
    id: USER_ROLES.TEACHER,
    slug: "teacher",
    label: "Teacher",
    description: "Course delivery, grading, and student engagement.",
    dashboardPath: "/dashboard/teacher",
    tier: "education",
    selfRegisterable: false,
    category: "education",
  },
  [USER_ROLES.STUDENT]: {
    id: USER_ROLES.STUDENT,
    slug: "student",
    label: "Student",
    description: "Learning, assignments, and academic progress.",
    dashboardPath: "/student/dashboard",
    tier: "education",
    selfRegisterable: true,
    category: "education",
  },
  [USER_ROLES.PARENT]: {
    id: USER_ROLES.PARENT,
    slug: "parent",
    label: "Parent",
    description: "Monitor student progress and school communication.",
    dashboardPath: "/dashboard/parent",
    tier: "education",
    selfRegisterable: true,
    category: "education",
  },
  [USER_ROLES.SCHOOL]: {
    id: USER_ROLES.SCHOOL,
    slug: "school",
    label: "School",
    description: "School institution management and operations.",
    dashboardPath: "/dashboard/school",
    tier: "education",
    selfRegisterable: true,
    category: "education",
  },
  [USER_ROLES.UNIVERSITY]: {
    id: USER_ROLES.UNIVERSITY,
    slug: "university",
    label: "University",
    description: "University-level administration and programs.",
    dashboardPath: "/dashboard/university",
    tier: "education",
    selfRegisterable: true,
    category: "education",
  },
  [USER_ROLES.EDUCATIONAL_CENTER]: {
    id: USER_ROLES.EDUCATIONAL_CENTER,
    slug: "educational-center",
    label: "Educational Center",
    description: "Training center operations and course management.",
    dashboardPath: "/dashboard/educational-center",
    tier: "education",
    selfRegisterable: true,
    category: "education",
  },
  [USER_ROLES.EMPLOYER]: {
    id: USER_ROLES.EMPLOYER,
    slug: "employer",
    label: "Employer",
    description: "Job posting, hiring, and talent management.",
    dashboardPath: "/dashboard/employer",
    tier: "employment",
    selfRegisterable: true,
    category: "employment",
  },
  [USER_ROLES.JOB_SEEKER]: {
    id: USER_ROLES.JOB_SEEKER,
    slug: "job-seeker",
    label: "Job Seeker",
    description: "Job search, applications, and career tools.",
    dashboardPath: "/dashboard/job-seeker",
    tier: "employment",
    selfRegisterable: true,
    category: "employment",
  },
  [USER_ROLES.CONTENT_CREATOR]: {
    id: USER_ROLES.CONTENT_CREATOR,
    slug: "content-creator",
    label: "Content Creator",
    description: "Content creation, publishing, and audience growth.",
    dashboardPath: "/dashboard/content-creator",
    tier: "content",
    selfRegisterable: true,
    category: "content",
  },
  [USER_ROLES.SOCIAL_MEDIA_MANAGER]: {
    id: USER_ROLES.SOCIAL_MEDIA_MANAGER,
    slug: "social-media-manager",
    label: "Social Media Manager",
    description: "Social media campaigns and community management.",
    dashboardPath: "/dashboard/social-media-manager",
    tier: "content",
    selfRegisterable: false,
    category: "content",
  },
  [USER_ROLES.CUSTOMER_SUPPORT]: {
    id: USER_ROLES.CUSTOMER_SUPPORT,
    slug: "customer-support",
    label: "Customer Support",
    description: "Customer inquiries, tickets, and issue resolution.",
    dashboardPath: "/dashboard/customer-support",
    tier: "support",
    selfRegisterable: false,
    category: "support",
  },
};

export const ALL_ROLES = Object.values(USER_ROLES);

export const SELF_REGISTERABLE_ROLES = ALL_ROLES.filter(
  (role) => ROLE_DEFINITIONS[role].selfRegisterable,
);

export const ROLE_SLUGS = Object.fromEntries(
  ALL_ROLES.map((role) => [role, ROLE_DEFINITIONS[role].slug]),
) as Record<UserRole, RoleSlug>;

export function isValidRole(value: string): value is UserRole {
  return ALL_ROLES.includes(value as UserRole);
}

export function roleFromSlug(slug: string): UserRole | null {
  const entry = ALL_ROLES.find((role) => ROLE_DEFINITIONS[role].slug === slug);
  return entry ?? null;
}

export function getRoleDashboardPath(role: UserRole): string {
  return ROLE_DEFINITIONS[role].dashboardPath;
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_DEFINITIONS[role].label;
}
