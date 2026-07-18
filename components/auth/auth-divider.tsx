"use client";

import type { ReactNode } from "react";

type AuthDividerProps = {
  label?: string;
};

export function AuthDivider({ label = "or" }: AuthDividerProps): ReactNode {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-3 text-zinc-500">{label}</span>
      </div>
    </div>
  );
}
