import type { MiddlewareAuthContext, MiddlewareDecision, MiddlewareRouteRule } from "@/lib/auth/middleware-types";
import { MIDDLEWARE_ROUTE_RULES, getDashboardSlugFromPath } from "@/lib/auth/middleware-config";
import { canAccessRoleDashboard } from "@/types/permissions";
import { roleFromSlug, getRoleDashboardPath, isValidRole } from "@/types/roles";
import { STUDENT_PORTAL_ACCESS_ROLES } from "@/lib/student-portal/constants";

function matchRule(pathname: string, rule: MiddlewareRouteRule): boolean {
  return rule.exact ? pathname === rule.pattern : pathname === rule.pattern || pathname.startsWith(`${rule.pattern}/`);
}

export function evaluateMiddleware(pathname: string, auth: MiddlewareAuthContext, loginUrl: string): MiddlewareDecision {
  const rules = MIDDLEWARE_ROUTE_RULES.filter((rule) => matchRule(pathname, rule));
  if (!rules.length) return { action: "allow" };
  const roleDashboardRule = rules.find((r) => r.type === "role-dashboard");
  const studentPortalRule = rules.find((r) => r.type === "student-portal");
  const authRule = rules.find((r) => r.type === "auth");

  if (authRule?.redirectIfAuthenticated && auth.isAuthenticated) {
    return { action: "redirect", url: auth.role && isValidRole(auth.role) ? getRoleDashboardPath(auth.role) : "/dashboard" };
  }
  if (rules.some((r) => r.requiresAuth) && !auth.isAuthenticated) {
    const url = new URL(loginUrl);
    url.searchParams.set("redirect", pathname);
    return { action: "redirect", url: url.pathname + url.search };
  }
  if (auth.isAuthenticated && auth.status === "suspended") return { action: "redirect", url: "/login?error=account_suspended" };
  if (auth.isAuthenticated && auth.status === "pending") return { action: "redirect", url: "/verify-email" };

  const restrictedRule = rules.find((rule) => rule.allowedRoles?.length);
  if (restrictedRule && (!auth.role || !restrictedRule.allowedRoles?.includes(auth.role))) return { action: "deny", status: 403 };

  if (studentPortalRule && auth.role && isValidRole(auth.role) && !STUDENT_PORTAL_ACCESS_ROLES.includes(auth.role as (typeof STUDENT_PORTAL_ACCESS_ROLES)[number])) {
    return { action: "redirect", url: getRoleDashboardPath(auth.role) };
  }
  if (roleDashboardRule && auth.role && isValidRole(auth.role)) {
    const slug = getDashboardSlugFromPath(pathname);
    const targetRole = slug ? roleFromSlug(slug) : null;
    if (!targetRole || !canAccessRoleDashboard(auth.role, targetRole)) return { action: "redirect", url: getRoleDashboardPath(auth.role) };
  }
  return { action: "allow" };
}

