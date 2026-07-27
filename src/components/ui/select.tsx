import * as React from "react";
import { cn } from "@/src/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(
        "flex h-11 w-full rounded-xl border border-[#e2d4d6] bg-white px-3 py-2 text-sm text-[#301218] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e1722] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
