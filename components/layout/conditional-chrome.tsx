"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type ConditionalChromeProps = {
  children: ReactNode;
};

export function ConditionalChrome({ children }: ConditionalChromeProps): ReactNode {
  const pathname = usePathname();
  const hasImmersiveChrome =
    pathname === "/" ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/portals");

  if (hasImmersiveChrome) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
