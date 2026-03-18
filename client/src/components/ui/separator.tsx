import * as React from "react";

import { cn } from "../../lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  gradient?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      className,
      orientation = "horizontal",
      decorative = true,
      gradient = false,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0",
        gradient
          ? orientation === "horizontal"
            ? "h-px w-full bg-gradient-to-r from-transparent via-[#c8a84b]/40 to-transparent"
            : "h-full w-px bg-gradient-to-b from-transparent via-[#c8a84b]/40 to-transparent"
          : orientation === "horizontal"
            ? "h-px w-full bg-white/[0.06]"
            : "h-full w-px bg-white/[0.06]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };
