import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080d1f] backdrop-blur-sm hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "border-[#c8a84b]/40 bg-[#c8a84b]/15 text-[#c8a84b] focus:ring-[#c8a84b]",
        osrs: "border-[#5ba3f5]/40 bg-[#5ba3f5]/15 text-[#5ba3f5] focus:ring-[#5ba3f5]",
        rs3: "border-[#e05c5c]/40 bg-[#e05c5c]/15 text-[#e05c5c] focus:ring-[#e05c5c]",
        success:
          "border-[#4ade80]/40 bg-[#4ade80]/15 text-[#4ade80] focus:ring-[#4ade80]",
        outline:
          "border-[#1a2048] text-[#888888] bg-transparent hover:bg-[#1a2048]/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
