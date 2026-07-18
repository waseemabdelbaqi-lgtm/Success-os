import type { DecodedIdToken } from "firebase-admin/auth";
import type { CustomClaims } from "@/types/auth";
import type { Permission } from "@/types/permissions";
import {
  getPermissionsForRole,
  roleHasPermission,
  canAccessRoleDashboard,
} from "@/types/permissions";
import {
  isValidRole,
  roleFromSlug,
  getRoleDashboardPath,
  type UserRole,
} from "@/types/roles";
import { AppError } from "@/lib/logger";

export function extractCustomClaims(
  decoded: DecodedIdToken,
): CustomClaims | null {
  const role = decoded.role as string | undefined;
  const permissions = decoded.permissions as Permission[] | undefined;
  const status = decoded.status as CustomClaims["status"] | undefined;

  if (!role || !isValidRole(role)) {
    return null;
  }

  return {
    role,
    permissions: permissions ?? [...getPermissionsForRole(role)],
    status: status ?? "active",
  };
}

export function hasPermission(
  userPermissions: Permission[],
  permission: Permission,
): boolean {
  return userPermissions.includes(permission);
}

export function hasAnyPermission(
  userPermissions: Permission[],
  permissions: Permission[],
): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(
  userPermissions: Permission[],
  permissions: Permission[],
): boolean {
  return permissions.every((p) => userPermissions.includes(p));
}

export function requirePermission(
  userPermissions: Permission[],
  permission: Permission,
): void {
  if (!hasPermission(userPermissions, permission)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: `Missing required permission: ${permission}`,
      statusCode: 403,
    });
  }
}

export function requireRole(userRole: UserRole, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have access to this resource.",
      statusCode: 403,
    });
  }
}

export function requireDashboardAccess(
  userRole: UserRole,
  dashboardSlug: string,
): void {
  const targetRole = roleFromSlug(dashboardSlug);

  if (!targetRole) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Dashboard not found.",
      statusCode: 404,
    });
  }

  if (!canAccessRoleDashboard(userRole, targetRole)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have access to this dashboard.",
      statusCode: 403,
    });
  }
}

export function getUserDashboardPath(role: UserRole): string {
  return getRoleDashboardPath(role);
}

export function checkRolePermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return roleHasPermission(role, permission);
}

export { canAccessRoleDashboard, roleHasPermission, getPermissionsForRole };
