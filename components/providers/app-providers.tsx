"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps): ReactNode {
  return <AuthProvider>{children}</AuthProvider>;
}
