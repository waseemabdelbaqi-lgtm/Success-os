/**
 * AI Teacher Engine permissions — integration with platform RBAC.
 */
import type { AtePermission } from "@/types/ai-teacher-engine";
import { USER_ROLES, type UserRole } from "@/types/roles";

export const ATE_PERMISSIONS = {
  SESSION_START: "ate:session:start",
  SESSION_CHAT: "ate:session:chat",
  MEMORY_READ: "ate:memory:read",
  MEMORY_WRITE: "ate:memory:write",
  RECOMMEND: "ate:recommend",
  ADMIN: "ate:admin",
  VOICE_USE: "ate:voice:use",
  WHITEBOARD_USE: "ate:whiteboard:use",
} as const satisfies Record<string, AtePermission>;

export const ALL_ATE_PERMISSIONS: AtePermission[] = Object.values(ATE_PERMISSIONS);

const STUDENT_ATE: AtePermission[] = [
  ATE_PERMISSIONS.SESSION_START,
  ATE_PERMISSIONS.SESSION_CHAT,
  ATE_PERMISSIONS.MEMORY_READ,
  ATE_PERMISSIONS.RECOMMEND,
  ATE_PERMISSIONS.VOICE_USE,
  ATE_PERMISSIONS.WHITEBOARD_USE,
];

const TEACHER_ATE: AtePermission[] = [
  ...STUDENT_ATE,
  ATE_PERMISSIONS.MEMORY_WRITE,
];

const ADMIN_ATE: AtePermission[] = [...ALL_ATE_PERMISSIONS];

/** Role → ATE permission grants (ATE-scoped; complements platform PERMISSIONS). */
export const ATE_ROLE_PERMISSIONS: Partial<Record<UserRole, readonly AtePermission[]>> = {
  [USER_ROLES.STUDENT]: STUDENT_ATE,
  [USER_ROLES.PARENT]: [
    ATE_PERMISSIONS.MEMORY_READ,
    ATE_PERMISSIONS.RECOMMEND,
  ],
  [USER_ROLES.TEACHER]: TEACHER_ATE,
  [USER_ROLES.ACADEMIC_DIRECTOR]: ADMIN_ATE,
  [USER_ROLES.ADMIN]: ADMIN_ATE,
  [USER_ROLES.OWNER]: ADMIN_ATE,
  [USER_ROLES.SUPER_ADMIN]: ADMIN_ATE,
  [USER_ROLES.SCHOOL]: TEACHER_ATE,
};

export function getAtePermissionsForRole(role: UserRole): AtePermission[] {
  return [...(ATE_ROLE_PERMISSIONS[role] ?? [])];
}

export function roleHasAtePermission(role: UserRole, permission: AtePermission): boolean {
  return getAtePermissionsForRole(role).includes(permission);
}

export function hasAtePermission(
  granted: AtePermission[],
  permission: AtePermission,
): boolean {
  return granted.includes(permission);
}
