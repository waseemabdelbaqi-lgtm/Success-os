import { BaseService } from "@/services/base/base.service";
import { getUserCustomClaims } from "@/lib/auth/claims";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireRole,
  requireDashboardAccess,
  getUserDashboardPath,
} from "@/lib/auth/rbac";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { mapUserRecordToAuthUser } from "@/types/auth";
import type { AuthUser } from "@/types/auth";
import type { Permission } from "@/types/permissions";
import type { UserRole } from "@/types/roles";
import type { ServiceResult } from "@/types";
import { AppError } from "@/lib/logger";

export class PermissionService extends BaseService {
  constructor() {
    super("PermissionService");
  }

  async getAuthenticatedUser(): Promise<ServiceResult<AuthUser>> {
    try {
      const session = await getSessionFromCookies();

      if (!session) {
        throw new AppError({
          code: "UNAUTHORIZED",
          message: "Not authenticated.",
          statusCode: 401,
        });
      }

      const auth = getFirebaseAdminAuth();
      const userRecord = await auth.getUser(session.uid);
      const claims = await getUserCustomClaims(session.uid);

      const user = mapUserRecordToAuthUser(userRecord, claims);

      return this.success(user);
    } catch (error) {
      if (error instanceof AppError) {
        return this.failure(error.code, error.message, error);
      }
      return this.failure(
        "AUTH_GET_USER_FAILED",
        "Failed to retrieve authenticated user.",
        error,
      );
    }
  }

  async requireAuthenticatedUser(): Promise<AuthUser> {
    const result = await this.getAuthenticatedUser();

    if (!result.ok) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: result.error.message,
        statusCode: 401,
      });
    }

    if (result.data.status === "suspended") {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Your account has been suspended.",
        statusCode: 403,
      });
    }

    return result.data;
  }

  async checkPermission(permission: Permission): Promise<boolean> {
    const result = await this.getAuthenticatedUser();
    if (!result.ok) return false;
    return hasPermission(result.data.permissions, permission);
  }

  async enforcePermission(permission: Permission): Promise<AuthUser> {
    const user = await this.requireAuthenticatedUser();
    requirePermission(user.permissions, permission);
    return user;
  }

  async enforceAnyPermission(permissions: Permission[]): Promise<AuthUser> {
    const user = await this.requireAuthenticatedUser();

    if (!hasAnyPermission(user.permissions, permissions)) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Insufficient permissions.",
        statusCode: 403,
      });
    }

    return user;
  }

  async enforceAllPermissions(permissions: Permission[]): Promise<AuthUser> {
    const user = await this.requireAuthenticatedUser();

    if (!hasAllPermissions(user.permissions, permissions)) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Insufficient permissions.",
        statusCode: 403,
      });
    }

    return user;
  }

  async enforceRole(allowedRoles: UserRole[]): Promise<AuthUser> {
    const user = await this.requireAuthenticatedUser();
    requireRole(user.role, allowedRoles);
    return user;
  }

  async enforceDashboardAccess(dashboardSlug: string): Promise<AuthUser> {
    const user = await this.requireAuthenticatedUser();
    requireDashboardAccess(user.role, dashboardSlug);
    return user;
  }

  getDashboardPathForUser(role: UserRole): string {
    return getUserDashboardPath(role);
  }
}

export const permissionService = new PermissionService();
