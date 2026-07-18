import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
  label?: string;
};

export function ProgressBar({
  value,
  className,
  label,
}: ProgressBarProps): ReactNode {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-xs font-semibold text-[#78635b]">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-[#8b1e1e]/9">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8b1e1e] via-[#ad3932] to-[#d4af37] shadow-[0_0_14px_rgba(212,175,55,0.4)] transition-all duration-500"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
