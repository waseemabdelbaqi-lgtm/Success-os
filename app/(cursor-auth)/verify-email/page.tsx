import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EmailVerificationPage } from "@/components/auth/email-verification";

export const metadata: Metadata = {
  title: "Verify email",
};

export default function VerifyEmailPage(): ReactNode {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <EmailVerificationPage />
    </div>
  );
}
