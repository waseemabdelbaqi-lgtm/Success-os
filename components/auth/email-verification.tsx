"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { getRoleDashboardPath } from "@/types/roles";

export function EmailVerificationBanner(): ReactNode {
  const { user, sendVerificationEmail, refreshSession } = useAuth();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.emailVerified) return null;

  async function handleResend(): Promise<void> {
    setIsSending(true);
    setError(null);
    setMessage(null);

    try {
      await sendVerificationEmail();
      setMessage("Verification email sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleRefresh(): Promise<void> {
    await refreshSession();
    router.refresh();
  }

  return (
    <Alert variant="warning" className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Verify your email address</p>
          <p className="mt-1 text-amber-700">
            We sent a verification link to {user.email}. Some features may be
            limited until verified.
          </p>
          {message && <p className="mt-1 text-green-700">{message}</p>}
          {error && <p className="mt-1 text-red-700">{error}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResend}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Resend email"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            I&apos;ve verified
          </Button>
        </div>
      </div>
    </Alert>
  );
}

export function EmailVerificationPage(): ReactNode {
  const { user, sendVerificationEmail, refreshSession, isLoading } = useAuth();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  if (!user) {
    return (
      <Alert variant="info">
        Please sign in to verify your email address.
      </Alert>
    );
  }

  const currentUser = user;

  if (currentUser.emailVerified) {
    return (
      <div className="space-y-4">
        <Alert variant="success">Your email is verified.</Alert>
        <Button
          onClick={() => router.push(getRoleDashboardPath(currentUser.role))}
        >
          Go to dashboard
        </Button>
      </div>
    );
  }

  async function handleResend(): Promise<void> {
    setIsSending(true);
    setError(null);
    try {
      await sendVerificationEmail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleContinue(): Promise<void> {
    await refreshSession();
    if (currentUser.emailVerified) {
      router.push(getRoleDashboardPath(currentUser.role));
    } else {
      setError("Email not yet verified. Please check your inbox.");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
      <p className="text-sm text-zinc-600">
        We sent a verification link to <strong>{currentUser.email}</strong>.
        Click the link in the email, then return here.
      </p>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-3">
        <Button onClick={handleContinue}>I&apos;ve verified my email</Button>
        <Button
          variant="secondary"
          onClick={handleResend}
          disabled={isSending}
        >
          {isSending ? "Sending..." : "Resend email"}
        </Button>
      </div>
    </div>
  );
}
