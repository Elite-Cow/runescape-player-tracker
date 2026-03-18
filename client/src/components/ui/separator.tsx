import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "../../lib/utils";

const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    gradient?: boolean;
  }
>(
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
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        gradient
          ? orientation === "horizontal"
            ? "h-px w-full bg-gradient-to-r from-transparent via-[#c8a84b]/40 to-transparent"
            : "h-full w-px bg-gradient-to-b from-transparent via-[#c8a84b]/40 to-transparent"
          : orientation === "horizontal"
            ? "h-px w-full bg-[#1a2048]"
            : "h-full w-px bg-[#1a2048]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
