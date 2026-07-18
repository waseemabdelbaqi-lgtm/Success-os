import type { Auth } from "firebase-admin/auth";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { getPermissionsForRole } from "@/types/permissions";
import type { CustomClaims } from "@/types/auth";
import type { UserRole } from "@/types/roles";
import type { UserStatus } from "@/types/auth";
import { logger } from "@/lib/logger";

export async function setUserCustomClaims(
  uid: string,
  role: UserRole,
  status: UserStatus = "active",
): Promise<CustomClaims> {
  const auth = getFirebaseAdminAuth();
  const permissions = [...getPermissionsForRole(role)];

  const claims: CustomClaims = {
    role,
    permissions,
    status,
  };

  await auth.setCustomUserClaims(uid, claims);

  logger.info("Custom claims set", { uid, role, status });

  return claims;
}

export async function getUserCustomClaims(
  uid: string,
): Promise<CustomClaims | null> {
  const auth = getFirebaseAdminAuth();
  const user = await auth.getUser(uid);

  if (!user.customClaims) {
    return null;
  }

  const { role, permissions, status } = user.customClaims as CustomClaims;

  if (!role) {
    return null;
  }

  return {
    role,
    permissions: permissions ?? [...getPermissionsForRole(role)],
    status: status ?? "active",
  };
}

export async function updateUserRole(
  uid: string,
  newRole: UserRole,
): Promise<CustomClaims> {
  const existingClaims = await getUserCustomClaims(uid);
  const status = existingClaims?.status ?? "active";

  return setUserCustomClaims(uid, newRole, status);
}

export async function revokeAllSessions(uid: string): Promise<void> {
  const auth = getFirebaseAdminAuth();
  await auth.revokeRefreshTokens(uid);
  logger.info("All sessions revoked for user", { uid });
}

export async function disableUser(uid: string): Promise<void> {
  const auth = getFirebaseAdminAuth();
  await auth.updateUser(uid, { disabled: true });
  await setUserCustomClaims(uid, (await getUserCustomClaims(uid))!.role, "suspended");
  await revokeAllSessions(uid);
}

export async function enableUser(uid: string): Promise<void> {
  const auth = getFirebaseAdminAuth();
  await auth.updateUser(uid, { disabled: false });
  const claims = await getUserCustomClaims(uid);
  if (claims) {
    await setUserCustomClaims(uid, claims.role, "active");
  }
}

export function getAdminAuth(): Auth {
  return getFirebaseAdminAuth();
}
