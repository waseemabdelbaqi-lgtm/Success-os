import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-[#9c2929] to-[#6f1117] text-white shadow-[0_10px_24px_rgba(139,30,30,0.22)] hover:from-[#d4af37] hover:to-[#a77716] hover:text-[#3b170e] focus-visible:ring-[#d4af37]",
  secondary:
    "border border-[#d4af37]/40 bg-white/80 text-[#6f1117] shadow-sm hover:border-[#d4af37] hover:bg-[#fff7e6] focus-visible:ring-[#d4af37]",
  ghost:
    "bg-transparent text-[#6f1117] hover:bg-[#8b1e1e]/8 focus-visible:ring-[#d4af37]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps): ReactNode {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
