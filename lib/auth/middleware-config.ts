import type { MiddlewareRouteRule } from "@/lib/auth/middleware-types";
import { ROLE_DEFINITIONS, ALL_ROLES } from "@/types/roles";
import { STUDENT_ROUTE_PREFIX } from "@/lib/student-portal/constants";

const DASHBOARD_PREFIX = "/dashboard";

export const MIDDLEWARE_ROUTE_RULES: MiddlewareRouteRule[] = [
  {
    id: "auth-login",
    pattern: "/login",
    type: "auth",
    requiresAuth: false,
    redirectIfAuthenticated: true,
  },
  {
    id: "auth-register",
    pattern: "/register",
    type: "auth",
    requiresAuth: false,
    redirectIfAuthenticated: true,
  },
  {
    id: "auth-forgot-password",
    pattern: "/forgot-password",
    type: "auth",
    requiresAuth: false,
    redirectIfAuthenticated: false,
  },
  {
    id: "auth-verify-email",
    pattern: "/verify-email",
    type: "auth",
    requiresAuth: false,
    redirectIfAuthenticated: false,
  },
  {
    id: "dashboard-root",
    pattern: DASHBOARD_PREFIX,
    type: "protected",
    requiresAuth: true,
    exact: true,
  },
  ...ALL_ROLES.map((role) => ({
    id: `dashboard-${ROLE_DEFINITIONS[role].slug}`,
    pattern: ROLE_DEFINITIONS[role].dashboardPath,
    type: "role-dashboard" as const,
    requiresAuth: true,
    requiredRole: role,
    dashboardSlug: ROLE_DEFINITIONS[role].slug,
  })),
  {
    id: "protected-general",
    pattern: DASHBOARD_PREFIX,
    type: "protected",
    requiresAuth: true,
  },
  // Protect Cursor book-portal surfaces only. SUCCESS-OS legacy student
  // routes (material/results/service/catch-all redirects) stay public.
  {
    id: "student-book-portal-root",
    pattern: STUDENT_ROUTE_PREFIX,
    type: "student-portal",
    requiresAuth: true,
    requiredRole: "student",
    exact: true,
  },
  ...[
    "dashboard",
    "books",
    "subjects",
    "predictor",
    "bookmarks",
    "notes",
    "highlights",
    "favorites",
    "reading-history",
    "assistant",
    "notifications",
    "profile",
    "settings",
  ].map((segment) => ({
    id: `student-book-portal-${segment}`,
    pattern: `${STUDENT_ROUTE_PREFIX}/${segment}`,
    type: "student-portal" as const,
    requiresAuth: true,
    requiredRole: "student" as const,
  })),
];

export function getDashboardSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith(`${DASHBOARD_PREFIX}/`)) {
    return null;
  }

  const slug = pathname.slice(DASHBOARD_PREFIX.length + 1).split("/")[0];
  return slug ?? null;
}

export function isRoleDashboardPath(pathname: string): boolean {
  const slug = getDashboardSlugFromPath(pathname);
  if (!slug) return false;
  return ALL_ROLES.some((role) => ROLE_DEFINITIONS[role].slug === slug);
}
