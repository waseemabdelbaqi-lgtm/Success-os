/**
 * AI Teacher Engine permissions — mirrors platform PERMISSIONS.ATE_*.
 */
import {
  PERMISSIONS,
  getPermissionsForRole,
  roleHasPermission,
  type Permission,
} from "@/types/permissions";
import type { UserRole } from "@/types/roles";

export const ATE_PERMISSIONS = {
  SESSION_START: PERMISSIONS.ATE_SESSION_START,
  SESSION_CHAT: PERMISSIONS.ATE_SESSION_CHAT,
  MEMORY_READ: PERMISSIONS.ATE_MEMORY_READ,
  MEMORY_WRITE: PERMISSIONS.ATE_MEMORY_WRITE,
  RECOMMEND: PERMISSIONS.ATE_RECOMMEND,
  ADMIN: PERMISSIONS.ATE_ADMIN,
  VOICE_USE: PERMISSIONS.ATE_VOICE_USE,
  WHITEBOARD_USE: PERMISSIONS.ATE_WHITEBOARD_USE,
} as const;

export const ALL_ATE_PERMISSIONS: Permission[] = Object.values(ATE_PERMISSIONS);

export function getAtePermissionsForRole(role: UserRole): Permission[] {
  return getPermissionsForRole(role).filter((p) => p.startsWith("ate:"));
}

export function roleHasAtePermission(role: UserRole, permission: Permission): boolean {
  return roleHasPermission(role, permission);
}

export function hasAtePermission(
  granted: Permission[],
  permission: Permission,
): boolean {
  return granted.includes(permission);
}
