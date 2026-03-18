import * as React from "react";

import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-white/[0.08] bg-[rgba(15,21,53,0.6)] backdrop-blur-sm px-3 py-2 text-sm text-[#e0e0e0] placeholder:text-[#666666] transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#e0e0e0]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a84b]/50 focus-visible:border-[#c8a84b]/60 focus-visible:shadow-[0_0_16px_rgba(200,168,75,0.15)]",
          "hover:border-white/[0.15]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
