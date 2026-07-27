import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-[#fff0f1] text-[#9e1722]",
        partner: "bg-[#effaf6] text-[#13815e]",
        email: "bg-[#fff7e8] text-[#785117]",
        muted: "bg-[#f5f0f1] text-[#73636a]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
