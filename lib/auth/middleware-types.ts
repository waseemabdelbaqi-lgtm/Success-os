export type MiddlewareRouteType =
  | "public"
  | "auth"
  | "protected"
  | "role-dashboard"
  | "student-portal";

export type MiddlewareRouteRule = {
  id: string;
  pattern: string;
  type: MiddlewareRouteType;
  requiresAuth: boolean;
  exact?: boolean;
  redirectIfAuthenticated?: boolean;
  requiredRole?: string;
  dashboardSlug?: string;
  allowedRoles?: string[];
  requiredPermissions?: string[];
};

export type MiddlewareAuthContext = {
  isAuthenticated: boolean;
  uid?: string;
  role?: string;
  permissions?: string[];
  status?: string;
};

export type MiddlewareDecision =
  | { action: "allow" }
  | { action: "redirect"; url: string }
  | { action: "deny"; status: number };
