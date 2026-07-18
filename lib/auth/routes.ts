import { AUTH_ROUTES, PROTECTED_ROUTE_PREFIX, PUBLIC_ROUTES } from "@/lib/constants";
import { getRoleDashboardPath } from "@/types/roles";
import { isValidRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";

export function isProtectedRoute(pathname: string): boolean {
  return (
    pathname === PROTECTED_ROUTE_PREFIX ||
    pathname.startsWith(`${PROTECTED_ROUTE_PREFIX}/`)
  );
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith("/api/")) {
    return true;
  }

  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function shouldBypassAuthMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp")
  );
}

export function getPostAuthRedirectUrl(
  requestUrl: string,
  role?: UserRole,
): string {
  const url = new URL(requestUrl);
  const redirectParam = url.searchParams.get("redirect");

  if (redirectParam && redirectParam.startsWith("/")) {
    return redirectParam;
  }

  if (role && isValidRole(role)) {
    if (role === "student") {
      return "/student/dashboard";
    }
    return getRoleDashboardPath(role);
  }

  return "/dashboard";
}
