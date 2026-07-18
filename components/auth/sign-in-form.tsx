"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { signInWithEmail } from "@/lib/firebase/auth-actions";
import { ROUTES } from "@/lib/constants";
import { getRoleDashboardPath } from "@/types/roles";
import { useAuth } from "@/hooks/use-auth";

export function SignInForm(): ReactNode {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmail({ email, password });
      await refreshSession();

      const sessionRes = await fetch(ROUTES.api.auth.session, {
        credentials: "same-origin",
      });
      const sessionData = await sessionRes.json();
      const role = sessionData?.data?.role;

      const redirect = new URLSearchParams(window.location.search).get("redirect");
      const destination = redirect && redirect.startsWith("/")
        ? redirect
        : role
          ? getRoleDashboardPath(role)
          : ROUTES.dashboard;

      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
      />

      <div className="flex items-center justify-between text-sm">
        <Link
          href={ROUTES.forgotPassword}
          className="font-medium text-zinc-600 hover:text-zinc-900"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
