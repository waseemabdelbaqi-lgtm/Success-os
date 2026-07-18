import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getServerEnv } from "@/lib/env";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { extractCustomClaims } from "@/lib/auth/rbac";
import { getUserCustomClaims } from "@/lib/auth/claims";
import { getPermissionsForRole } from "@/types/permissions";
import { USER_ROLES } from "@/types/roles";
import { AppError, logger } from "@/lib/logger";
import type { AuthSession, AuthTokenPayload, CustomClaims } from "@/types/auth";

export function mapDecodedTokenToSession(
  decoded: DecodedIdToken,
  claims?: CustomClaims | null,
): AuthSession {
  const resolvedClaims =
    claims ??
    extractCustomClaims(decoded) ?? {
      role: USER_ROLES.JOB_SEEKER,
      permissions: [...getPermissionsForRole(USER_ROLES.JOB_SEEKER)],
      status: "active" as const,
    };

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    emailVerified: decoded.email_verified ?? false,
    role: resolvedClaims.role,
    permissions: resolvedClaims.permissions,
    status: resolvedClaims.status,
    expiresAt: decoded.exp * 1000,
    issuedAt: decoded.iat * 1000,
  };
}

export function mapTokenPayloadToSession(
  payload: AuthTokenPayload,
): AuthSession {
  return {
    uid: payload.uid,
    email: payload.email ?? null,
    emailVerified: payload.email_verified ?? false,
    role: payload.role ?? USER_ROLES.JOB_SEEKER,
    permissions: payload.permissions ?? [],
    status: payload.status ?? "active",
    expiresAt: payload.exp * 1000,
    issuedAt: payload.iat * 1000,
  };
}

export async function getSessionCookieName(): Promise<string> {
  const env = getServerEnv();
  return env.auth.sessionCookieName;
}

export async function getSessionFromCookies(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const env = getServerEnv();
  const sessionCookie = cookieStore.get(env.auth.sessionCookieName);

  if (!sessionCookie?.value) {
    return null;
  }

  return verifySessionCookie(sessionCookie.value);
}

export async function verifySessionCookie(
  sessionCookie: string,
): Promise<AuthSession | null> {
  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const claims =
      extractCustomClaims(decoded) ??
      (await getUserCustomClaims(decoded.uid));
    return mapDecodedTokenToSession(decoded, claims);
  } catch (error) {
    logger.warn("Invalid session cookie", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

export async function verifyIdToken(idToken: string): Promise<AuthSession> {
  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    const claims =
      extractCustomClaims(decoded) ??
      (await getUserCustomClaims(decoded.uid));
    return mapDecodedTokenToSession(decoded, claims);
  } catch (error) {
    throw new AppError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired authentication token.",
      statusCode: 401,
      cause: error,
    });
  }
}

export async function createSessionCookie(
  idToken: string,
): Promise<{ cookie: string; maxAge: number }> {
  const env = getServerEnv();
  const auth = getFirebaseAdminAuth();

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: env.auth.sessionCookieMaxAge * 1000,
  });

  return {
    cookie: sessionCookie,
    maxAge: env.auth.sessionCookieMaxAge,
  };
}

export async function revokeSession(sessionCookie: string): Promise<void> {
  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie);
    await auth.revokeRefreshTokens(decoded.uid);
  } catch (error) {
    logger.warn("Failed to revoke session", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export function buildSessionCookieHeader(
  value: string,
  maxAge: number,
): string {
  const env = getServerEnv();
  const parts = [
    `${env.auth.sessionCookieName}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (env.auth.secureCookies) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function buildClearSessionCookieHeader(): string {
  const env = getServerEnv();
  const parts = [
    `${env.auth.sessionCookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (env.auth.secureCookies) {
    parts.push("Secure");
  }

  return parts.join("; ");
}
