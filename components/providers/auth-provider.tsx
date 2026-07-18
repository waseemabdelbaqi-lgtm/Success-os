"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  handleOAuthRedirectResult,
  refreshServerSession,
  verifyEmail as sendVerifyEmail,
} from "@/lib/firebase/auth-actions";
import { ROUTES } from "@/lib/constants";
import { getRoleDashboardPath } from "@/types/roles";
import { getPermissionsForRole } from "@/types/permissions";
import { USER_ROLES } from "@/types/roles";
import type { AuthContextValue, AuthState, AuthUser } from "@/types/auth";

const defaultState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchServerUser(): Promise<Partial<AuthUser> | null> {
  try {
    const response = await fetch(ROUTES.api.auth.session, {
      credentials: "same-origin",
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data ?? null;
  } catch {
    return null;
  }
}

function mapFirebaseUser(
  user: User,
  serverUser?: Partial<AuthUser> | null,
): AuthUser {
  const role = serverUser?.role ?? USER_ROLES.JOB_SEEKER;
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
    disabled: false,
    providerIds: user.providerData.map(
      (provider) => provider.providerId as AuthUser["providerIds"][number],
    ),
    role,
    permissions: serverUser?.permissions ?? [...getPermissionsForRole(role)],
    status: serverUser?.status ?? "active",
    createdAt: user.metadata.creationTime ?? new Date().toISOString(),
    lastLoginAt: user.metadata.lastSignInTime ?? null,
  };
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps): ReactNode {
  const [state, setState] = useState<AuthState>(defaultState);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const isPreviewPlaceholder =
      !apiKey ||
      apiKey.includes("placeholder") ||
      apiKey.includes("preview-");

    if (isPreviewPlaceholder) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      return;
    }

    let unsubscribe = () => {};

    try {
      const auth = getFirebaseAuth();

      handleOAuthRedirectResult().catch(() => {
        // No redirect result — expected on normal page loads
      });

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          return;
        }

        const serverUser = await fetchServerUser();

        setState({
          user: mapFirebaseUser(firebaseUser, serverUser),
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      });
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }

    return unsubscribe;
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);

    await fetch(ROUTES.api.auth.logout, {
      method: "POST",
      credentials: "same-origin",
    });

    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (!user) return;

    await refreshServerSession(user);
    await user.getIdToken(true);
    const serverUser = await fetchServerUser();

    setState((prev) => ({
      ...prev,
      user: mapFirebaseUser(user, serverUser),
    }));
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("No authenticated user.");
    }

    await sendVerifyEmail(user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signOut,
      refreshSession,
      sendVerificationEmail,
    }),
    [state, signOut, refreshSession, sendVerificationEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider.");
  }

  return context;
}

export function useDashboardPath(): string | null {
  const { user } = useAuthContext();
  if (!user) return null;
  return getRoleDashboardPath(user.role);
}
