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
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href={ROUTES.home}
          className="text-lg font-semibold tracking-tight"
        >
          {APP_NAME}
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {isLoading ? (
            <span className="text-zinc-400">Loading...</span>
          ) : isAuthenticated && user ? (
            <>
              {roleLabel && (
                <span className="hidden text-zinc-500 sm:inline">
                  {roleLabel}
                </span>
              )}
              {dashboardPath && (
                <Link
                  href={dashboardPath}
                  className="font-medium text-zinc-700 hover:text-zinc-900"
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
                className="font-medium text-zinc-600 hover:text-zinc-900"
              >
                Sign in
              </Link>
              <Link
                href={ROUTES.register}
                className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800"
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
