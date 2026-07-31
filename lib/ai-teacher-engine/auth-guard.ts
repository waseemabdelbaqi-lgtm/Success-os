/**
 * ATE permission enforcement against platform RBAC.
 */
import { AppError, logger } from "@/lib/logger";
import { permissionService } from "@/services/auth/permission.service";
import type { Permission } from "@/types/permissions";
import { PERMISSIONS } from "@/types/permissions";

export const ATE_PLATFORM_PERMISSIONS = {
  SESSION_START: PERMISSIONS.ATE_SESSION_START,
  SESSION_CHAT: PERMISSIONS.ATE_SESSION_CHAT,
  MEMORY_READ: PERMISSIONS.ATE_MEMORY_READ,
  MEMORY_WRITE: PERMISSIONS.ATE_MEMORY_WRITE,
  RECOMMEND: PERMISSIONS.ATE_RECOMMEND,
  ADMIN: PERMISSIONS.ATE_ADMIN,
  VOICE_USE: PERMISSIONS.ATE_VOICE_USE,
  WHITEBOARD_USE: PERMISSIONS.ATE_WHITEBOARD_USE,
} as const;

function authEnforced(): boolean {
  // Default: enforce when not explicitly opened for local contract tests.
  return process.env.ATE_DEV_OPEN !== "1";
}

/**
 * Enforce an ATE platform permission.
 * Public/demo routes should not call this.
 */
export async function requireAtePermission(permission: Permission): Promise<void> {
  if (!authEnforced()) {
    logger.warn("ATE auth soft-open (ATE_DEV_OPEN=1)", { permission });
    return;
  }

  try {
    await permissionService.enforcePermission(permission);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError({
      code: "SERVICE_UNAVAILABLE",
      message:
        "AI Teacher Engine authentication is unavailable. Configure Firebase Auth or set ATE_DEV_OPEN=1 for local contract tests only.",
      statusCode: 503,
      cause: error,
    });
  }
}

/** Routes that do not require auth. */
export const ATE_PUBLIC_ACTIONS = new Set([
  "status",
  "snapshot",
  "architecture",
  "demo",
  "voice",
  "whiteboard",
  "permissions",
  "metrics",
]);
