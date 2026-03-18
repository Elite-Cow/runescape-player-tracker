import React from "react";

function formatCount(n) {
  if (n == null) return "\u2014";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function computeStats(values) {
  if (!values.length) return { min: 0, avg: 0, max: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return { min, avg, max };
}

export default function StatsPanel({ chartData }) {
  if (!chartData) return null;

  const osrsPoints = chartData.osrs ?? [];
  const rs3Points = chartData.rs3 ?? [];

  const osrsVals = osrsPoints.map((d) => d.osrs).filter((v) => v > 0);
  const rs3Vals = rs3Points.map((d) => d.rs3).filter((v) => v > 0);
  const totalVals = osrsPoints
    .map((d, i) => {
      const rs3Match = rs3Points[i];
      if (d.osrs > 0 && rs3Match?.rs3 > 0) return d.osrs + rs3Match.rs3;
      return null;
    })
    .filter(Boolean);

  const rows = [
    { label: "Total", dotColor: "bg-gold", color: "text-gold", stats: computeStats(totalVals) },
    { label: "OSRS", dotColor: "bg-osrs", color: "text-osrs", stats: computeStats(osrsVals) },
    { label: "RS3", dotColor: "bg-rs3", color: "text-rs3", stats: computeStats(rs3Vals) },
  ];

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-5 shadow-md">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Range Statistics</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-muted text-xs uppercase tracking-wide bg-black/20">
            <th className="text-left pb-3 pt-2 px-3 font-medium rounded-tl-md">Metric</th>
            <th className="text-right pb-3 pt-2 px-3 font-medium">Min</th>
            <th className="text-right pb-3 pt-2 px-3 font-medium">Avg</th>
            <th className="text-right pb-3 pt-2 px-3 font-medium rounded-tr-md">Max</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, dotColor, color, stats }) => (
            <tr key={label} className="border-t border-border hover:bg-white/[0.04] transition-colors">
              <td className={`py-2.5 px-3 font-semibold ${color} flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                {label}
              </td>
              <td className="py-2.5 px-3 text-right text-text-secondary">{formatCount(stats.min)}</td>
              <td className="py-2.5 px-3 text-right text-text-secondary">{formatCount(stats.avg)}</td>
              <td className="py-2.5 px-3 text-right text-text-secondary">{formatCount(stats.max)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
