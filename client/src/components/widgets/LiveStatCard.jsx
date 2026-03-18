import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import SparklineChart from "./SparklineChart";

function formatCount(n) {
  if (n == null) return "\u2014";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function LiveStatCard({ label, value, sparklineData, delta, color }) {
  const isUp = delta > 0;
  const isDown = delta < 0;

  return (
    <div className="bg-bg-card rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted uppercase tracking-wide font-medium">
          {label}
        </span>
        {delta !== 0 ? (
          <span
            className={`flex items-center gap-1 text-xs font-semibold ${
              isUp ? "text-green" : "text-rs3"
            }`}
          >
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isUp ? "+" : ""}
            {formatCount(delta)}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-text-dim">
            <Minus size={14} />
            0
          </span>
        )}
      </div>

      <div className="text-2xl font-bold" style={{ color }}>
        {formatCount(value)}
      </div>

      {sparklineData && sparklineData.length > 1 && (
        <SparklineChart data={sparklineData} color={color} />
      )}
    </div>
  );
}
