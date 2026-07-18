"use client";

import type { ReactNode } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 font-sans text-zinc-900">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Application error</h1>
          <p className="text-zinc-600">
            {error.message || "A critical error occurred."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
