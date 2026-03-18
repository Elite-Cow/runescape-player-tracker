import React from "react";

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
              px-4 py-1.5 rounded text-sm border
              transition-all duration-150
              ${disabled
                ? "border-border-light text-text-dim opacity-50 cursor-not-allowed"
                : active
                  ? "border-gold bg-gold text-bg-dark font-bold cursor-pointer"
                  : "border-border-mid bg-transparent text-text-primary cursor-pointer hover:border-gold/50 hover:text-gold"
              }
            `}
          >
            {range.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
