import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function GETrendIndicator({ label, change }) {
  if (change == null) return null;

  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-text-muted">{label}:</span>
      <span
        className={`flex items-center gap-0.5 text-xs font-semibold ${
          isUp ? "text-green" : isDown ? "text-rs3" : "text-text-dim"
        }`}
      >
        {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : <Minus size={12} />}
        {isUp ? "+" : ""}{change.toFixed(1)}%
      </span>
    </div>
  );
}
