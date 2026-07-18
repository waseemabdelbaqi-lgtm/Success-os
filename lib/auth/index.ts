export {
  getSessionFromCookies,
  verifySessionCookie,
  verifyIdToken,
  createSessionCookie,
  revokeSession,
  buildSessionCookieHeader,
  buildClearSessionCookieHeader,
} from "@/lib/auth/session";

export {
  isProtectedRoute,
  isAuthRoute,
  isPublicRoute,
  shouldBypassAuthMiddleware,
  getPostAuthRedirectUrl,
} from "@/lib/auth/routes";

export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireRole,
  requireDashboardAccess,
  getUserDashboardPath,
  extractCustomClaims,
} from "@/lib/auth/rbac";

export {
  setUserCustomClaims,
  getUserCustomClaims,
  updateUserRole,
  revokeAllSessions,
} from "@/lib/auth/claims";

export {
  signSessionMeta,
  verifySessionMeta,
  SESSION_META_COOKIE_NAME,
} from "@/lib/auth/session-meta";

export { evaluateMiddleware } from "@/lib/auth/middleware-engine";
export { MIDDLEWARE_ROUTE_RULES } from "@/lib/auth/middleware-config";
