"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { signUpWithEmail } from "@/lib/firebase/auth-actions";
import {
  SELF_REGISTERABLE_ROLES,
  ROLE_DEFINITIONS,
  getRoleDashboardPath,
} from "@/types/roles";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import type { UserRole } from "@/types/roles";

const roleOptions = SELF_REGISTERABLE_ROLES.map((role) => ({
  value: role,
  label: ROLE_DEFINITIONS[role].label,
}));

export function SignUpForm(): ReactNode {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(SELF_REGISTERABLE_ROLES[0]!);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);

    try {
      await signUpWithEmail({
        email,
        password,
        displayName,
        role,
      });

      router.push(getRoleDashboardPath(role));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Full name"
        type="text"
        autoComplete="name"
        required
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        disabled={isLoading}
      />

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
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
      />

      <Select
        label="Account type"
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        options={roleOptions}
        disabled={isLoading}
      />

      <p className="text-xs text-zinc-500">
        {ROLE_DEFINITIONS[role].description}
      </p>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
