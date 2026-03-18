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
    { label: "Total", color: "text-gold", stats: computeStats(totalVals) },
    { label: "OSRS", color: "text-osrs", stats: computeStats(osrsVals) },
    { label: "RS3", color: "text-rs3", stats: computeStats(rs3Vals) },
  ];

  return (
    <div className="bg-bg-card rounded-lg p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Range Statistics</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-muted text-xs uppercase tracking-wide">
            <th className="text-left pb-3 font-medium">Metric</th>
            <th className="text-right pb-3 font-medium">Min</th>
            <th className="text-right pb-3 font-medium">Avg</th>
            <th className="text-right pb-3 font-medium">Max</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, color, stats }) => (
            <tr key={label} className="border-t border-border">
              <td className={`py-2.5 font-semibold ${color}`}>{label}</td>
              <td className="py-2.5 text-right text-text-secondary">{formatCount(stats.min)}</td>
              <td className="py-2.5 text-right text-text-secondary">{formatCount(stats.avg)}</td>
              <td className="py-2.5 text-right text-text-secondary">{formatCount(stats.max)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
