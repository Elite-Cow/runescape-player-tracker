import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

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

function RecordCard({ label, icon: Icon, value, field, timestamp, color, iconColor }) {
  return (
    <div className="bg-bg-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={iconColor} />
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
    { label: "Peak Total", icon: TrendingUp, value: peaks.total?.total_players, timestamp: peaks.total?.timestamp, color: "text-gold", iconColor: "text-green" },
    { label: "Peak OSRS", icon: TrendingUp, value: peaks.osrs?.osrs, timestamp: peaks.osrs?.timestamp, color: "text-osrs", iconColor: "text-green" },
    { label: "Peak RS3", icon: TrendingUp, value: peaks.rs3?.rs3, timestamp: peaks.rs3?.timestamp, color: "text-rs3", iconColor: "text-green" },
    { label: "Low Total", icon: TrendingDown, value: lows.total?.total_players, timestamp: lows.total?.timestamp, color: "text-gold", iconColor: "text-rs3" },
    { label: "Low OSRS", icon: TrendingDown, value: lows.osrs?.osrs, timestamp: lows.osrs?.timestamp, color: "text-osrs", iconColor: "text-rs3" },
    { label: "Low RS3", icon: TrendingDown, value: lows.rs3?.rs3, timestamp: lows.rs3?.timestamp, color: "text-rs3", iconColor: "text-rs3" },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">All-Time Records</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {records.map((r) => (
          <RecordCard key={r.label} {...r} />
        ))}
      </div>
    </div>
  );
}
