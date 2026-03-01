import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// Binary search: find the rs3Points index whose timestamp is nearest to t (ms).
function nearestRs3(rs3Sorted, t) {
  let lo = 0, hi = rs3Sorted.length - 1, best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const mt = rs3Sorted[mid]._t;
    if (Math.abs(mt - t) < Math.abs(rs3Sorted[best]._t - t)) best = mid;
    if (mt < t) lo = mid + 1;
    else hi = mid - 1;
  }
  return rs3Sorted[best];
}

// Compute total = osrs + rs3, handling two cases:
//   - Pre-2023 TempleOSRS records already have rs3 embedded → use total_players as-is.
//   - Post-2023 records have rs3=0 → add the nearest RS3 point within 12 hours.
function buildTotalData(osrsPoints, rs3Points) {
  const TWELVE_HOURS = 12 * 3600 * 1000;
  const rs3Sorted = rs3Points
    .map((d) => ({ _t: new Date(d.timestamp).getTime(), rs3: d.rs3 }))
    .sort((a, b) => a._t - b._t);

  return osrsPoints.map((d) => {
    const x = new Date(d.timestamp);
    if (d.rs3 > 0) return { x, y: d.total_players };
    if (rs3Sorted.length === 0) return { x, y: d.osrs };
    const nearest = nearestRs3(rs3Sorted, x.getTime());
    const rs3Val = Math.abs(nearest._t - x.getTime()) <= TWELVE_HOURS ? nearest.rs3 : 0;
    return { x, y: d.osrs + rs3Val };
  });
}

export default function PlayerChart({ data, range }) {
  const osrsPoints = data?.osrs ?? [];
  const rs3Points  = data?.rs3  ?? [];

  if (osrsPoints.length === 0 && rs3Points.length === 0) {
    return <p style={{ textAlign: "center", color: "#666" }}>No data available.</p>;
  }

  const chartData = {
    datasets: [
      {
        label: "Total Players",
        data: buildTotalData(osrsPoints, rs3Points),
        borderColor: "#c8a84b",
        backgroundColor: "rgba(200,168,75,0.08)",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
      },
      {
        label: "OSRS",
        data: osrsPoints.map((d) => ({ x: new Date(d.timestamp), y: d.osrs })),
        borderColor: "#5ba3f5",
        backgroundColor: "rgba(91,163,245,0.08)",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
      },
      {
        label: "RS3",
        data: rs3Points.map((d) => ({ x: new Date(d.timestamp), y: d.rs3 })),
        borderColor: "#e05c5c",
        backgroundColor: "rgba(224,92,92,0.08)",
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2,
      },
    ],
  };

  // Pick x-axis time unit based on range
  const timeUnits = {
    "24h": "hour",
    "7d": "day",
    "30d": "day",
    "6m": "month",
    "1y": "month",
    all: "month",
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: { color: "#e0e0e0" },
      },
      tooltip: {
        callbacks: {
          title: (items) => new Date(items[0].parsed.x).toLocaleString(),
          label: (item) => `${item.dataset.label}: ${formatCount(item.parsed.y)}`,
          filter: (item) => item.parsed.y > 0,
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: timeUnits[range] || "day" },
        ticks: { color: "#888", maxTicksLimit: 8 },
        grid: { color: "#222" },
      },
      y: {
        ticks: {
          color: "#888",
          callback: (v) => formatCount(v),
        },
        grid: { color: "#222" },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
