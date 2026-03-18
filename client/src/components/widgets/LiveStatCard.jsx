import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import SparklineChart from "./SparklineChart";

function formatCount(n) {
  if (n == null) return "\u2014";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function LiveStatCard({ label, value, sparklineData, delta, color, index = 0 }) {
  const isUp = delta > 0;
  const isDown = delta < 0;

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg p-5 flex flex-col gap-3
        bg-gradient-to-br from-[#1e1e1e] to-bg-card
        shadow-md hover:shadow-lg hover:-translate-y-1
        transition-all duration-300
        animate-fade-in-up stagger-${index + 1}
      `}
    >
      {/* Colored top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted uppercase tracking-wide font-medium">
          {label}
        </span>
        {delta !== 0 ? (
          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isUp
                ? "text-green bg-green/10"
                : "text-rs3 bg-rs3/10"
            }`}
          >
            {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {isUp ? "+" : ""}
            {formatCount(delta)}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-text-dim px-2 py-0.5 rounded-full bg-white/5">
            <Minus size={13} />
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
