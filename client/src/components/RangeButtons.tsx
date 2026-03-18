import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { TimeRange, AvailabilityMap } from "../types/api";

const RANGES: TimeRange[] = ["24h", "7d", "30d", "6m", "1y", "all"];

interface RangeButtonsProps {
  availability: AvailabilityMap;
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
}

export default function RangeButtons({ availability, selected, onSelect }: RangeButtonsProps) {
  return (
    <div className="flex gap-2 justify-center mb-6 flex-wrap">
      {RANGES.map((range) => {
        const disabled = !availability[range];
        const active = selected === range;
        return (
          <motion.button
            key={range}
            disabled={disabled}
            onClick={() => !disabled && onSelect(range)}
            whileHover={!disabled && !active ? { scale: 1.05, y: -2 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
              relative px-4 py-1.5 rounded-full text-sm
              transition-colors duration-200
              ${disabled
                ? "text-text-dim opacity-40 cursor-not-allowed border border-white/[0.04]"
                : active
                  ? "font-bold cursor-pointer text-[#080d1f] border border-gold"
                  : "border border-white/[0.1] bg-transparent text-text-primary cursor-pointer hover:border-gold/50 hover:text-gold"
              }
            `}
            style={active ? {
              background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
              boxShadow: "0 0 16px rgba(200,168,75,0.25)",
            } : undefined}
          >
            {active && (
              <motion.span
                layoutId="range-indicator"
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
                  boxShadow: "0 0 16px rgba(200,168,75,0.25)",
                  zIndex: -1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="flex items-center gap-1.5">
              {disabled && <Lock size={11} />}
              {range.toUpperCase()}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
