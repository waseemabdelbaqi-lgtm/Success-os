import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertProps = {
  variant?: "error" | "success" | "warning" | "info";
  children: ReactNode;
  className?: string;
};

const variants = {
  error: "border-[#8b1e1e]/30 bg-[#8b1e1e]/8 text-[#6b1016]",
  success: "border-[#d4af37]/45 bg-[#fff5d7] text-[#71500f]",
  warning: "border-[#d4af37]/45 bg-[#fff5d7] text-[#71500f]",
  info: "border-[#d4af37]/40 bg-[#fffaf0] text-[#6b1016]",
};

export function Alert({
  variant = "info",
  children,
  className,
}: AlertProps): ReactNode {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variants[variant],
        className,
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
