import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select compound components must be within <Select>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Select Root
// ---------------------------------------------------------------------------

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function Select({ value: controlledValue, defaultValue, onValueChange: controlledOnChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const value = controlledValue ?? internalValue;
  const onValueChange = controlledOnChange ?? setInternalValue;

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, triggerRef }}>
      {children}
    </SelectContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SelectGroup, SelectValue (simple pass-throughs)
// ---------------------------------------------------------------------------

function SelectGroup({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="group" {...props}>{children}</div>;
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();
  return <span>{value || placeholder}</span>;
}

// ---------------------------------------------------------------------------
// SelectTrigger
// ---------------------------------------------------------------------------

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const ctx = useSelectContext();

  const combinedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      (ctx.triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [ctx.triggerRef, ref]
  );

  return (
    <button
      ref={combinedRef}
      type="button"
      role="combobox"
      aria-expanded={ctx.open}
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-white/[0.08] bg-[rgba(15,21,53,0.6)] backdrop-blur-sm px-3 py-2 text-sm text-[#e0e0e0] placeholder:text-[#666666] transition-all duration-200",
        "hover:border-white/[0.15]",
        "focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/50 focus:border-[#c8a84b]/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("opacity-50 transition-transform duration-200", ctx.open && "rotate-180")}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

// ---------------------------------------------------------------------------
// SelectContent (portal + dropdown)
// ---------------------------------------------------------------------------

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "popper" | "item-aligned";
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const ctx = useSelectContext();
    const dropdownRef = React.useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = React.useState({ top: 0, left: 0, width: 0 });

    // Position the dropdown relative to the trigger
    React.useEffect(() => {
      if (!ctx.open || !ctx.triggerRef.current) return;
      const rect = ctx.triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }, [ctx.open, ctx.triggerRef]);

    // Click outside to close
    React.useEffect(() => {
      if (!ctx.open) return;
      function handleClick(e: MouseEvent) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          ctx.triggerRef.current &&
          !ctx.triggerRef.current.contains(e.target as Node)
        ) {
          ctx.setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [ctx]);

    // Close on Escape
    React.useEffect(() => {
      if (!ctx.open) return;
      function handleKey(e: KeyboardEvent) {
        if (e.key === "Escape") ctx.setOpen(false);
      }
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }, [ctx]);

    return createPortal(
      <AnimatePresence>
        {ctx.open && (
          <motion.div
            ref={(node) => {
              dropdownRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "fixed z-50 max-h-96 overflow-hidden rounded-lg glass-card shadow-xl shadow-black/40",
              className
            )}
            style={{
              top: pos.top,
              left: pos.left,
              minWidth: pos.width,
            }}
            {...(props as any)}
          >
            <div className="p-1 overflow-y-auto max-h-[calc(96*4px)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);
SelectContent.displayName = "SelectContent";

// ---------------------------------------------------------------------------
// SelectLabel
// ---------------------------------------------------------------------------

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "py-1.5 pl-8 pr-2 text-sm font-semibold text-[#c8a84b]",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled, ...props }, ref) => {
    const ctx = useSelectContext();
    const isSelected = ctx.value === value;

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled}
        onClick={() => {
          if (disabled) return;
          ctx.onValueChange(value);
          ctx.setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) {
              ctx.onValueChange(value);
              ctx.setOpen(false);
            }
          }
        }}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
          "hover:bg-[#c8a84b]/15 hover:text-[#c8a84b]",
          "focus:bg-[#c8a84b]/15 focus:text-[#c8a84b]",
          isSelected && "text-[#c8a84b]",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </span>
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

// ---------------------------------------------------------------------------
// SelectSeparator
// ---------------------------------------------------------------------------

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-white/[0.06]", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

// Scroll buttons no longer needed (CSS overflow handles it)
const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
