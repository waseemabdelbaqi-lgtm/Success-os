"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function SiteHeader(): ReactNode {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const { dashboardPath, roleLabel } = useRole();

  return (
    <header className="border-b border-[#eadde0] bg-[#fffcfa]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href={ROUTES.home}
          className="text-lg font-semibold tracking-tight text-[#4b0a11]"
        >
          {APP_NAME}
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {isLoading ? (
            <span className="text-[#8a7872]">Loading...</span>
          ) : isAuthenticated && user ? (
            <>
              {roleLabel && (
                <span className="hidden text-[#6b5a52] sm:inline">
                  {roleLabel}
                </span>
              )}
              {dashboardPath && (
                <Link
                  href={dashboardPath}
                  className="font-medium text-[#4b0a11] hover:text-[#9e1722]"
                >
                  Dashboard
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                href={ROUTES.login}
                className="font-medium text-[#6b5a52] hover:text-[#9e1722]"
              >
                Sign in
              </Link>
              <Link
                href={ROUTES.register}
                className="rounded-full bg-[#9e1722] px-4 py-2 font-medium text-white hover:bg-[#7a121c]"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
