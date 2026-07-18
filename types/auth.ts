import type { UserRecord } from "firebase-admin/auth";
import type { Permission } from "@/types/permissions";
import { USER_ROLES, type UserRole } from "@/types/roles";

export type AuthProvider =
  | "password"
  | "google.com"
  | "apple.com"
  | "github.com";

export type UserStatus = "active" | "suspended" | "pending";

export type AuthUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  disabled: boolean;
  providerIds: AuthProvider[];
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AuthSession = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
  expiresAt: number;
  issuedAt: number;
};

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = SignInCredentials & {
  displayName: string;
  role: UserRole;
};

export type AuthTokenPayload = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  role?: UserRole;
  permissions?: Permission[];
  status?: UserStatus;
  auth_time: number;
  exp: number;
  iat: number;
};

export type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  registrationProvider: AuthProvider;
  onboardingComplete: boolean;
};

export type CustomClaims = {
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
};

export function mapUserRecordToAuthUser(
  record: UserRecord,
  claims?: CustomClaims | null,
): AuthUser {
  return {
    uid: record.uid,
    email: record.email ?? null,
    emailVerified: record.emailVerified,
    displayName: record.displayName ?? null,
    photoURL: record.photoURL ?? null,
    phoneNumber: record.phoneNumber ?? null,
    disabled: record.disabled,
    providerIds: record.providerData.map(
      (provider) => provider.providerId as AuthProvider,
    ),
    role: claims?.role ?? USER_ROLES.JOB_SEEKER,
    permissions: claims?.permissions ?? [],
    status: claims?.status ?? "active",
    createdAt: record.metadata.creationTime,
    lastLoginAt: record.metadata.lastSignInTime ?? null,
  };
}
