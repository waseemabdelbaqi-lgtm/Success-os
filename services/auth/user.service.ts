import { BaseService } from "@/services/base/base.service";
import { getAdminFirestore, COLLECTIONS } from "@/lib/firebase/firestore";
import {
  setUserCustomClaims,
  getUserCustomClaims,
  updateUserRole,
} from "@/lib/auth/claims";
import { USER_ROLES, SELF_REGISTERABLE_ROLES, isValidRole } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import type { AuthProvider, UserProfile, UserStatus } from "@/types/auth";
import type { ServiceResult } from "@/types";
import { AppError } from "@/lib/logger";
import { FieldValue } from "firebase-admin/firestore";

export class UserService extends BaseService {
  constructor() {
    super("UserService");
  }

  async createUserProfile(input: {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL?: string | null;
    role: UserRole;
    registrationProvider: AuthProvider;
  }): Promise<ServiceResult<UserProfile>> {
    try {
      if (!SELF_REGISTERABLE_ROLES.includes(input.role)) {
        throw new AppError({
          code: "FORBIDDEN",
          message: "This role cannot be self-assigned during registration.",
          statusCode: 403,
        });
      }

      const db = getAdminFirestore();
      const now = new Date().toISOString();

      const profile: UserProfile = {
        uid: input.uid,
        email: input.email,
        displayName: input.displayName,
        photoURL: input.photoURL ?? null,
        role: input.role,
        status: "active",
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        registrationProvider: input.registrationProvider,
        onboardingComplete: false,
      };

      await db.collection(COLLECTIONS.USERS).doc(input.uid).set(profile);
      await setUserCustomClaims(input.uid, input.role, "active");

      return this.success(profile);
    } catch (error) {
      return this.failure(
        "USER_CREATE_FAILED",
        "Failed to create user profile.",
        error,
      );
    }
  }

  async getUserProfile(uid: string): Promise<ServiceResult<UserProfile | null>> {
    try {
      const db = getAdminFirestore();
      const doc = await db.collection(COLLECTIONS.USERS).doc(uid).get();

      if (!doc.exists) {
        return this.success(null);
      }

      return this.success(doc.data() as UserProfile);
    } catch (error) {
      return this.failure(
        "USER_GET_FAILED",
        "Failed to retrieve user profile.",
        error,
      );
    }
  }

  async updateLastLogin(uid: string): Promise<void> {
    const db = getAdminFirestore();
    await db.collection(COLLECTIONS.USERS).doc(uid).update({
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async assignRole(
    actorUid: string,
    targetUid: string,
    newRole: UserRole,
  ): Promise<ServiceResult<UserProfile>> {
    try {
      const actorClaims = await getUserCustomClaims(actorUid);

      if (
        !actorClaims ||
        !["super_admin", "owner", "admin"].includes(actorClaims.role)
      ) {
        throw new AppError({
          code: "FORBIDDEN",
          message: "Insufficient privileges to assign roles.",
          statusCode: 403,
        });
      }

      if (!isValidRole(newRole)) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "Invalid role specified.",
          statusCode: 422,
        });
      }

      if (
        newRole === USER_ROLES.SUPER_ADMIN &&
        actorClaims.role !== USER_ROLES.SUPER_ADMIN
      ) {
        throw new AppError({
          code: "FORBIDDEN",
          message: "Only Super Admins can assign the Super Admin role.",
          statusCode: 403,
        });
      }

      const db = getAdminFirestore();
      const userRef = db.collection(COLLECTIONS.USERS).doc(targetUid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new AppError({
          code: "NOT_FOUND",
          message: "User not found.",
          statusCode: 404,
        });
      }

      const previousRole = (userDoc.data() as UserProfile).role;

      await userRef.update({
        role: newRole,
        updatedAt: new Date().toISOString(),
      });

      await updateUserRole(targetUid, newRole);

      await db.collection(COLLECTIONS.ROLE_AUDIT_LOG).add({
        actorUid,
        targetUid,
        previousRole,
        newRole,
        timestamp: FieldValue.serverTimestamp(),
      });

      const updated = await userRef.get();
      return this.success(updated.data() as UserProfile);
    } catch (error) {
      return this.failure(
        "ROLE_ASSIGN_FAILED",
        "Failed to assign role.",
        error,
      );
    }
  }

  async updateUserStatus(
    uid: string,
    status: UserStatus,
  ): Promise<ServiceResult<void>> {
    try {
      const db = getAdminFirestore();
      await db.collection(COLLECTIONS.USERS).doc(uid).update({
        status,
        updatedAt: new Date().toISOString(),
      });

      const claims = await getUserCustomClaims(uid);
      if (claims) {
        await setUserCustomClaims(uid, claims.role, status);
      }

      return this.success(undefined);
    } catch (error) {
      return this.failure(
        "USER_STATUS_UPDATE_FAILED",
        "Failed to update user status.",
        error,
      );
    }
  }

  async ensureUserProfile(
    uid: string,
    email: string,
    displayName: string | null,
    registrationProvider: AuthProvider,
    defaultRole: UserRole = USER_ROLES.JOB_SEEKER,
  ): Promise<ServiceResult<UserProfile>> {
    const existing = await this.getUserProfile(uid);

    if (!existing.ok) {
      return existing as ServiceResult<UserProfile>;
    }

    if (existing.data) {
      await this.updateLastLogin(uid);
      return this.success(existing.data);
    }

    return this.createUserProfile({
      uid,
      email,
      displayName,
      role: defaultRole,
      registrationProvider,
    });
  }
}

export const userService = new UserService();
