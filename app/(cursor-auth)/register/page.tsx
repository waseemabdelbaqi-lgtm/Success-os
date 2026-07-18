import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { AppleSignInButton } from "@/components/auth/apple-sign-in-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage(): ReactNode {
  return (
    <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-zinc-600">
          Choose your account type and get started with Success OS.
        </p>
      </div>

      <GoogleSignInButton />
      <AppleSignInButton />
      <AuthDivider />

      <SignUpForm />

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-medium text-zinc-900 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
