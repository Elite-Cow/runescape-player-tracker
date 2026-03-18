import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs compound components must be used within <Tabs>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Tabs Root
// ---------------------------------------------------------------------------

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");

  const value = controlledValue ?? internalValue;
  const onValueChange = controlledOnChange ?? setInternalValue;

  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// TabsList
// ---------------------------------------------------------------------------

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-lg glass-card p-1 text-[#888888]",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

// ---------------------------------------------------------------------------
// TabsTrigger
// ---------------------------------------------------------------------------

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = useTabsContext();
    const isActive = ctx.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        onClick={() => ctx.onValueChange(value)}
        onKeyDown={(e) => {
          const parent = (e.target as HTMLElement).parentElement;
          if (!parent) return;
          const tabs = Array.from(parent.querySelectorAll<HTMLElement>('[role="tab"]'));
          const idx = tabs.indexOf(e.target as HTMLElement);

          let next = -1;
          if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
          else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = tabs.length - 1;

          if (next !== -1) {
            e.preventDefault();
            tabs[next].focus();
            tabs[next].click();
          }
        }}
        className={cn(
          "relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a84b]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d1f]",
          "disabled:pointer-events-none disabled:opacity-50",
          isActive ? "text-[#c8a84b]" : "hover:text-[#e0e0e0]",
          className
        )}
        {...props}
      >
        {isActive && (
          <motion.span
            layoutId="tab-indicator"
            className="absolute inset-0 rounded-md bg-gradient-to-r from-[#c8a84b]/20 to-[#c8a84b]/10 border border-[#c8a84b]/30 shadow-sm"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

// ---------------------------------------------------------------------------
// TabsContent
// ---------------------------------------------------------------------------

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = useTabsContext();
    const isActive = ctx.value === value;

    return (
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            ref={ref}
            key={value}
            role="tabpanel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a84b]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d1f]",
              className
            )}
            {...(props as any)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
