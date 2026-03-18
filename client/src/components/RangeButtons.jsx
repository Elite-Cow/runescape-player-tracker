import React from "react";
import { Lock } from "lucide-react";

const RANGES = ["24h", "7d", "30d", "6m", "1y", "all"];

export default function RangeButtons({ availability, selected, onSelect }) {
  return (
    <div className="flex gap-2 justify-center mb-6 flex-wrap">
      {RANGES.map((range) => {
        const disabled = !availability[range];
        const active = selected === range;
        return (
          <button
            key={range}
            disabled={disabled}
            onClick={() => !disabled && onSelect(range)}
            className={`
              px-4 py-1.5 rounded-full text-sm
              transition-all duration-200
              ${disabled
                ? "text-text-dim opacity-40 cursor-not-allowed border border-border-light/50"
                : active
                  ? "font-bold cursor-pointer text-bg-dark border border-gold"
                  : "border border-border-mid bg-transparent text-text-primary cursor-pointer hover:border-gold/50 hover:text-gold hover:-translate-y-0.5"
              }
            `}
            style={active ? {
              background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
              boxShadow: "0 0 16px rgba(200,168,75,0.25)",
            } : undefined}
          >
            <span className="flex items-center gap-1.5">
              {disabled && <Lock size={11} />}
              {range.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
