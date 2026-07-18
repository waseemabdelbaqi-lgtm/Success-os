"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  type UserCredential,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { ROUTES } from "@/lib/constants";
import type { SignInCredentials, SignUpCredentials } from "@/types/auth";
import type { UserRole } from "@/types/roles";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export class AuthActionError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AuthActionError";
    this.code = code;
  }
}

function mapFirebaseError(error: unknown): AuthActionError {
  if (error instanceof AuthActionError) return error;

  const firebaseError = error as { code?: string; message?: string };

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
    "auth/weak-password": "Password must be at least 8 characters.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid credentials. Please try again.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/account-exists-with-different-credential":
      "An account already exists with a different sign-in method.",
    "auth/requires-recent-login":
      "Please sign in again to complete this action.",
  };

  const code = firebaseError.code ?? "auth/unknown";
  const message =
    messages[code] ?? firebaseError.message ?? "An authentication error occurred.";

  return new AuthActionError(code, message);
}

async function syncServerSession(user: User): Promise<void> {
  const idToken = await user.getIdToken(true);

  const response = await fetch(ROUTES.api.auth.session, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new AuthActionError(
      "auth/session-sync-failed",
      data?.error?.message ?? "Failed to establish server session.",
    );
  }
}

export async function signUpWithEmail(
  credentials: SignUpCredentials,
): Promise<UserCredential> {
  try {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password,
    );

    await updateProfile(credential.user, {
      displayName: credentials.displayName,
    });

    const registerResponse = await fetch(ROUTES.api.auth.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: credential.user.uid,
        email: credentials.email,
        displayName: credentials.displayName,
        role: credentials.role,
        registrationProvider: "password",
      }),
    });

    if (!registerResponse.ok) {
      await credential.user.delete();
      const data = await registerResponse.json().catch(() => null);
      throw new AuthActionError(
        "auth/registration-failed",
        data?.error?.message ?? "Failed to complete registration.",
      );
    }

    await credential.user.getIdToken(true);
    await sendEmailVerification(credential.user);
    await syncServerSession(credential.user);

    return credential;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function signInWithEmail(
  credentials: SignInCredentials,
): Promise<UserCredential> {
  try {
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password,
    );

    await syncServerSession(credential.user);
    return credential;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function signInWithGoogle(
  useRedirect = false,
): Promise<UserCredential | null> {
  try {
    const auth = getFirebaseAuth();

    const credential = useRedirect
      ? null
      : await signInWithPopup(auth, googleProvider);

    if (useRedirect) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    if (!credential) return null;

    await fetch(ROUTES.api.auth.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName,
        role: "job_seeker",
        registrationProvider: "google.com",
        isOAuth: true,
      }),
    });

    await syncServerSession(credential.user);
    return credential;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function handleOAuthRedirectResult(): Promise<UserCredential | null> {
  try {
    const auth = getFirebaseAuth();
    const result = await getRedirectResult(auth);

    if (!result) return null;

    const providerId = result.providerId ?? "google.com";

    await fetch(ROUTES.api.auth.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: "job_seeker",
        registrationProvider: providerId,
        isOAuth: true,
      }),
    });

    await syncServerSession(result.user);
    return result;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export function getAppleProvider(): OAuthProvider {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return provider;
}

export async function signInWithApple(
  useRedirect = false,
): Promise<UserCredential | null> {
  try {
    const auth = getFirebaseAuth();
    const appleProvider = getAppleProvider();

    const credential = useRedirect
      ? null
      : await signInWithPopup(auth, appleProvider);

    if (useRedirect) {
      await signInWithRedirect(auth, appleProvider);
      return null;
    }

    if (!credential) return null;

    await fetch(ROUTES.api.auth.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName,
        role: "job_seeker",
        registrationProvider: "apple.com",
        isOAuth: true,
      }),
    });

    await syncServerSession(credential.user);
    return credential;
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`,
    });
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function verifyEmail(user: User): Promise<void> {
  try {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/verify-email`,
    });
  } catch (error) {
    throw mapFirebaseError(error);
  }
}

export async function refreshServerSession(user: User): Promise<void> {
  await syncServerSession(user);
}

export function isAppleSignInAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(process.env.NEXT_PUBLIC_APPLE_SIGNIN_ENABLED === "true")
  );
}

export function isGoogleSignInAvailable(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

export type { UserRole };
