import * as React from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d1f] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#c8a84b] to-[#a8893b] text-[#080d1f] font-semibold shadow-md hover:from-[#d4b85b] hover:to-[#b89a4b] hover:shadow-lg hover:shadow-[#c8a84b]/20 focus-visible:ring-[#c8a84b]",
        secondary:
          "bg-[#1a2048] text-[#e0e0e0] border border-[#2a3068] hover:bg-[#222860] hover:text-white focus-visible:ring-[#5ba3f5]",
        outline:
          "border border-[#1a2048] bg-transparent text-[#e0e0e0] hover:bg-[#1a2048]/50 hover:text-white focus-visible:ring-[#c8a84b]",
        ghost:
          "text-[#e0e0e0] hover:bg-[#1a2048]/50 hover:text-white focus-visible:ring-[#c8a84b]",
        destructive:
          "bg-[#e05c5c] text-white shadow-md hover:bg-[#c94444] hover:shadow-lg hover:shadow-[#e05c5c]/20 focus-visible:ring-[#e05c5c]",
        link: "text-[#c8a84b] underline-offset-4 hover:underline hover:text-[#d4b85b]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(props as any)}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
