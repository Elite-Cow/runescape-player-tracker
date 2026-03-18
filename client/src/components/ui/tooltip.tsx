import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  delayDuration: number;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error("Tooltip compound components must be within <Tooltip>");
  return ctx;
}

// ---------------------------------------------------------------------------
// TooltipProvider (no-op wrapper for API compat)
// ---------------------------------------------------------------------------

function TooltipProvider({ children }: { children: React.ReactNode; delayDuration?: number }) {
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Tooltip Root
// ---------------------------------------------------------------------------

interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

function Tooltip({ children, delayDuration = 300 }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef, delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// TooltipTrigger
// ---------------------------------------------------------------------------

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  const ctx = useTooltipContext();
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleEnter = () => {
    timerRef.current = setTimeout(() => ctx.setOpen(true), ctx.delayDuration);
  };
  const handleLeave = () => {
    clearTimeout(timerRef.current);
    ctx.setOpen(false);
  };

  const combinedRef = React.useCallback(
    (node: HTMLElement | null) => {
      (ctx.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [ctx.triggerRef, ref]
  );

  return (
    <span
      ref={combinedRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      {...props}
    >
      {children}
    </span>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

// ---------------------------------------------------------------------------
// TooltipContent
// ---------------------------------------------------------------------------

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sideOffset?: number;
  side?: "top" | "bottom" | "left" | "right";
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 6, ...props }, ref) => {
    const ctx = useTooltipContext();
    const [pos, setPos] = React.useState({ top: 0, left: 0 });

    React.useEffect(() => {
      if (!ctx.open || !ctx.triggerRef.current) return;
      const rect = ctx.triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.top - sideOffset,
        left: rect.left + rect.width / 2,
      });
    }, [ctx.open, ctx.triggerRef, sideOffset]);

    return createPortal(
      <AnimatePresence>
        {ctx.open && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={cn(
              "fixed z-[100] overflow-hidden rounded-lg border border-[#c8a84b]/30 glass-card px-3 py-1.5 text-sm text-[#e0e0e0] shadow-lg shadow-black/40 -translate-x-1/2 -translate-y-full pointer-events-none",
              className
            )}
            style={{ top: pos.top, left: pos.left }}
            {...(props as any)}
          />
        )}
      </AnimatePresence>,
      document.body
    );
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
