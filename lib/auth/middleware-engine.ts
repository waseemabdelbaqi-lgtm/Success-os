import type {
  MiddlewareAuthContext,
  MiddlewareDecision,
  MiddlewareRouteRule,
} from "@/lib/auth/middleware-types";
import {
  MIDDLEWARE_ROUTE_RULES,
  getDashboardSlugFromPath,
} from "@/lib/auth/middleware-config";
import { canAccessRoleDashboard } from "@/types/permissions";
import { roleFromSlug, getRoleDashboardPath, isValidRole } from "@/types/roles";
import { STUDENT_PORTAL_ACCESS_ROLES } from "@/lib/student-portal/constants";

function matchRule(
  pathname: string,
  rule: MiddlewareRouteRule,
): boolean {
  if (rule.exact) {
    return pathname === rule.pattern;
  }

  return (
    pathname === rule.pattern || pathname.startsWith(`${rule.pattern}/`)
  );
}

function findMatchingRules(pathname: string): MiddlewareRouteRule[] {
  return MIDDLEWARE_ROUTE_RULES.filter((rule) => matchRule(pathname, rule));
}

export function evaluateMiddleware(
  pathname: string,
  auth: MiddlewareAuthContext,
  loginUrl: string,
): MiddlewareDecision {
  const rules = findMatchingRules(pathname);

  if (rules.length === 0) {
    return { action: "allow" };
  }

  const roleDashboardRule = rules.find((r) => r.type === "role-dashboard");
  const studentPortalRule = rules.find((r) => r.type === "student-portal");
  const authRule = rules.find((r) => r.type === "auth");

  if (authRule?.redirectIfAuthenticated && auth.isAuthenticated) {
    const dashboardPath = auth.role && isValidRole(auth.role)
      ? getRoleDashboardPath(auth.role)
      : "/dashboard";
    return { action: "redirect", url: dashboardPath };
  }

  const requiresAuth = rules.some((r) => r.requiresAuth);

  if (requiresAuth && !auth.isAuthenticated) {
    const url = new URL(loginUrl);
    url.searchParams.set("redirect", pathname);
    return { action: "redirect", url: url.pathname + url.search };
  }

  if (auth.isAuthenticated && auth.status === "suspended") {
    return { action: "redirect", url: "/login?error=account_suspended" };
  }

  if (auth.isAuthenticated && auth.status === "pending") {
    return { action: "redirect", url: "/verify-email" };
  }

  if (studentPortalRule && auth.role && isValidRole(auth.role)) {
    const hasAccess = STUDENT_PORTAL_ACCESS_ROLES.includes(
      auth.role as (typeof STUDENT_PORTAL_ACCESS_ROLES)[number],
    );

    if (!hasAccess) {
      return {
        action: "redirect",
        url: getRoleDashboardPath(auth.role),
      };
    }
  }

  if (roleDashboardRule && auth.role && isValidRole(auth.role)) {
    const slug = getDashboardSlugFromPath(pathname);

    if (slug) {
      const targetRole = roleFromSlug(slug);

      if (!targetRole) {
        return { action: "redirect", url: getRoleDashboardPath(auth.role) };
      }

      if (!canAccessRoleDashboard(auth.role, targetRole)) {
        return {
          action: "redirect",
          url: getRoleDashboardPath(auth.role),
        };
      }
    }
  }

  // Keep SUCCESS-OS /dashboard as the learner dashboard.
  // Role-specific dashboards live under /dashboard/[roleSlug] only.
  return { action: "allow" };
}
