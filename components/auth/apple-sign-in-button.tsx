"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  signInWithApple,
  isAppleSignInAvailable,
} from "@/lib/firebase/auth-actions";
import { useAuth } from "@/hooks/use-auth";
import { getRoleDashboardPath } from "@/types/roles";
import { ROUTES } from "@/lib/constants";

export function AppleSignInButton(): ReactNode {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAppleSignInAvailable()) {
    return (
      <p className="text-center text-xs text-zinc-400">
        Apple Sign-In available when configured in Firebase and Apple Developer.
      </p>
    );
  }

  async function handleSignIn(): Promise<void> {
    setError(null);
    setIsLoading(true);

    try {
      const credential = await signInWithApple(false);

      if (credential) {
        await refreshSession();

        const sessionRes = await fetch(ROUTES.api.auth.session, {
          credentials: "same-origin",
        });
        const sessionData = await sessionRes.json();
        const role = sessionData?.data?.role;

        const destination = role
          ? getRoleDashboardPath(role)
          : ROUTES.dashboard;

        router.push(destination);
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Apple sign-in failed.";
      if (!message.includes("popup-closed")) {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <Button
        type="button"
        variant="secondary"
        className="w-full bg-black text-white hover:bg-zinc-800"
        onClick={handleSignIn}
        disabled={isLoading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        {isLoading ? "Signing in..." : "Continue with Apple"}
      </Button>
    </div>
  );
}
