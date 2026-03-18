import React from "react";

export default function ComparisonBar({ label, valueA, valueB, nameA, nameB, colorA = "#5ba3f5", colorB = "#e05c5c" }) {
  const total = (valueA || 0) + (valueB || 0);
  const pctA = total > 0 ? ((valueA || 0) / total) * 100 : 50;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-text-muted mb-1">
        <span>{label}</span>
        <span>
          <span style={{ color: colorA }}>{(valueA || 0).toLocaleString()}</span>
          {" vs "}
          <span style={{ color: colorB }}>{(valueB || 0).toLocaleString()}</span>
        </span>
      </div>
      <div className="h-3 bg-black/30 rounded-full overflow-hidden flex">
        <div
          className="h-full transition-all duration-500 rounded-l-full"
          style={{ width: `${pctA}%`, backgroundColor: colorA }}
        />
        <div
          className="h-full transition-all duration-500 rounded-r-full"
          style={{ width: `${100 - pctA}%`, backgroundColor: colorB }}
        />
      </div>
    </div>
  );
}
