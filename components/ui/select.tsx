import type { SelectHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({
  label,
  error,
  options,
  className,
  id,
  ...props
}: SelectProps): ReactNode {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-bold text-[#6f1117]">
        {label}
      </label>
      <select
        id={selectId}
        className={cn(
          "block w-full rounded-xl border border-[#d4af37]/30 bg-white/85 px-4 py-2.5 text-sm text-[#2d1e19] shadow-sm focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 disabled:opacity-50",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
