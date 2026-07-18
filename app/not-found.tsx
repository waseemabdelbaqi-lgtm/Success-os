import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/constants";

export default function NotFoundPage(): ReactNode {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-6 px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        404
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-zinc-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href={ROUTES.home}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        Return home
      </Link>
    </section>
  );
}
