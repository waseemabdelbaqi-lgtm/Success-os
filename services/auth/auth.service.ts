import { BaseService } from "@/services/base/base.service";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import {
  createSessionCookie,
  getSessionFromCookies,
  revokeSession,
  mapDecodedTokenToSession,
} from "@/lib/auth/session";
import {
  signSessionMeta,
  createSessionMetaFromClaims,
} from "@/lib/auth/session-meta";
import { extractCustomClaims } from "@/lib/auth/rbac";
import { getUserCustomClaims } from "@/lib/auth/claims";
import { getServerEnv } from "@/lib/env";
import { mapUserRecordToAuthUser } from "@/types/auth";
import type { AuthSession, AuthUser } from "@/types/auth";
import type { ServiceResult } from "@/types";
import { userService } from "@/services/auth/user.service";

export type SessionCreationResult = {
  sessionCookie: string;
  sessionMetaCookie: string;
  maxAge: number;
  session: AuthSession;
  user: AuthUser;
};

export class AuthService extends BaseService {
  constructor() {
    super("AuthService");
  }

  async getCurrentUser(): Promise<ServiceResult<AuthUser | null>> {
    try {
      const session = await getSessionFromCookies();

      if (!session) {
        return this.success(null);
      }

      const auth = getFirebaseAdminAuth();
      const userRecord = await auth.getUser(session.uid);
      const claims = await getUserCustomClaims(session.uid);

      return this.success(mapUserRecordToAuthUser(userRecord, claims));
    } catch (error) {
      return this.failure(
        "AUTH_GET_USER_FAILED",
        "Failed to retrieve current user.",
        error,
      );
    }
  }

  async createSessionFromIdToken(
    idToken: string,
  ): Promise<ServiceResult<SessionCreationResult>> {
    try {
      const auth = getFirebaseAdminAuth();
      const decoded = await auth.verifyIdToken(idToken, true);
      const claims =
        extractCustomClaims(decoded) ??
        (await getUserCustomClaims(decoded.uid));

      const session = mapDecodedTokenToSession(decoded, claims);
      const { cookie, maxAge } = await createSessionCookie(idToken);

      const userRecord = await auth.getUser(decoded.uid);
      const user = mapUserRecordToAuthUser(userRecord, claims);

      await userService.updateLastLogin(decoded.uid);

      const env = getServerEnv();
      const sessionMeta = createSessionMetaFromClaims(
        decoded.uid,
        session.role,
        session.permissions,
        session.status,
        maxAge,
      );
      const sessionMetaCookie = await signSessionMeta(
        sessionMeta,
        env.auth.sessionMetaSecret,
      );

      return this.success({
        sessionCookie: cookie,
        sessionMetaCookie,
        maxAge,
        session,
        user,
      });
    } catch (error) {
      return this.failure(
        "AUTH_SESSION_CREATE_FAILED",
        "Failed to create authentication session.",
        error,
      );
    }
  }

  async revokeCurrentSession(
    sessionCookie: string,
  ): Promise<ServiceResult<void>> {
    try {
      await revokeSession(sessionCookie);
      return this.success(undefined);
    } catch (error) {
      return this.failure(
        "AUTH_SESSION_REVOKE_FAILED",
        "Failed to revoke authentication session.",
        error,
      );
    }
  }
}

export const authService = new AuthService();
