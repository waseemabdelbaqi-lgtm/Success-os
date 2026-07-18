import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage(): ReactNode {
  return (
    <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-zinc-600">
          We will email you a secure link to reset your password.
        </p>
      </div>

      <PasswordResetForm />

      <p className="text-center text-sm text-zinc-500">
        Remember your password?{" "}
        <Link href={ROUTES.login} className="font-medium text-zinc-900 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
