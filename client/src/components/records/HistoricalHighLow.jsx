import React from "react";
import { TrendingUp, TrendingDown, Trophy, ArrowDown } from "lucide-react";

function formatCount(n) {
  if (n == null) return "\u2014";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatDate(ts) {
  if (!ts) return "\u2014";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RecordCard({ label, isPeak, value, timestamp, color, accentBorder }) {
  const Icon = isPeak ? Trophy : ArrowDown;
  const iconColor = isPeak ? "text-green" : "text-rs3";
  const borderClass = isPeak ? "border-l-green/40" : "border-l-rs3/40";

  return (
    <div className={`
      bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-4
      shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300
      border-l-2 ${borderClass}
    `}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className={iconColor} />
        <span className="text-xs text-text-muted uppercase tracking-wide font-medium">
          {label}
        </span>
      </div>
      <div className={`text-xl font-bold ${color} mb-1`}>
        {formatCount(value)}
      </div>
      <div className="text-xs text-text-dim">
        {formatDate(timestamp)}
      </div>
    </div>
  );
}

export default function HistoricalHighLow({ data }) {
  if (!data) return null;

  const { peaks, lows } = data;
  if (!peaks || !lows) return null;

  const records = [
    { label: "Peak Total", isPeak: true, value: peaks.total?.total_players, timestamp: peaks.total?.timestamp, color: "text-gold" },
    { label: "Peak OSRS", isPeak: true, value: peaks.osrs?.osrs, timestamp: peaks.osrs?.timestamp, color: "text-osrs" },
    { label: "Peak RS3", isPeak: true, value: peaks.rs3?.rs3, timestamp: peaks.rs3?.timestamp, color: "text-rs3" },
    { label: "Low Total", isPeak: false, value: lows.total?.total_players, timestamp: lows.total?.timestamp, color: "text-gold" },
    { label: "Low OSRS", isPeak: false, value: lows.osrs?.osrs, timestamp: lows.osrs?.timestamp, color: "text-osrs" },
    { label: "Low RS3", isPeak: false, value: lows.rs3?.rs3, timestamp: lows.rs3?.timestamp, color: "text-rs3" },
  ];

  return (
    <div>
      <h3 className="font-cinzel text-base font-semibold text-text-primary mb-3">All-Time Records</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {records.map((r, i) => (
          <div key={r.label} className={`animate-fade-in-up stagger-${i + 1}`}>
            <RecordCard {...r} />
          </div>
        ))}
      </div>
    </div>
  );
}
