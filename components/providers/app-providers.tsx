"use client";

import type { ReactNode } from "react";
import { CompanionGuideBeacon } from "@/components/ai/companion-guide-beacon";
import { AuthProvider } from "@/components/providers/auth-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps): ReactNode {
  return (
    <AuthProvider>
      <CompanionGuideBeacon />
      {children}
    </AuthProvider>
  );
}
