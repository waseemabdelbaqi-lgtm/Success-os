import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputProps): ReactNode {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-bold text-[#6f1117]">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "block w-full rounded-xl border border-[#d4af37]/30 bg-white/85 px-4 py-2.5 text-sm text-[#2d1e19] shadow-sm placeholder:text-[#a9968f] focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 disabled:opacity-50",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
