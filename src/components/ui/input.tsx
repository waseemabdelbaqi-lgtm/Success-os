import * as React from "react";
import { cn } from "@/src/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-[#e2d4d6] bg-white px-3 py-2 text-sm text-[#301218] shadow-sm transition-colors placeholder:text-[#9a8589] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e1722] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
