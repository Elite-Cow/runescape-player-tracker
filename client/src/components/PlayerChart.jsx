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
        data: osrsPoints.map((d) => ({ x: new Date(d.timestamp), y: d.total_players })),
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
