"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-6 px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        Error
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-zinc-600">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href={ROUTES.home}
          className="inline-flex h-11 items-center rounded-lg border border-zinc-300 px-4 text-sm font-medium"
        >
          Go home
        </Link>
      </div>
    </section>
  );
}
