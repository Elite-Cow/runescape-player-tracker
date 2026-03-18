import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

import { buildTotalData } from "../buildTotal";

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const COLORS = {
  total: { line: "#c8a84b", glow: "rgba(200,168,75,0.3)" },
  osrs: { line: "#5ba3f5", glow: "rgba(91,163,245,0.3)" },
  rs3: { line: "#e05c5c", glow: "rgba(224,92,92,0.3)" },
};

const timeUnits = {
  "24h": "hour",
  "7d": "day",
  "30d": "day",
  "6m": "month",
  "1y": "month",
  all: "month",
};

export default function PlayerChart({ data, range }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const osrsPoints = data?.osrs ?? [];
  const rs3Points = data?.rs3 ?? [];

  useEffect(() => {
    if (!canvasRef.current) return;
    if (osrsPoints.length === 0 && rs3Points.length === 0) return;

    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext("2d");

    const createGradient = (color) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color + "30");
      gradient.addColorStop(1, color + "00");
      return gradient;
    };

    const totalData = buildTotalData(osrsPoints, rs3Points);
    const osrsData = osrsPoints.map((d) => ({ x: new Date(d.timestamp), y: d.osrs }));
    const rs3Data = rs3Points.map((d) => ({ x: new Date(d.timestamp), y: d.rs3 }));

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Total Players",
            data: totalData,
            borderColor: COLORS.total.line,
            backgroundColor: createGradient(COLORS.total.line),
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: COLORS.total.line,
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
            borderWidth: 2,
            tension: 0.2,
            fill: true,
          },
          {
            label: "OSRS",
            data: osrsData,
            borderColor: COLORS.osrs.line,
            backgroundColor: createGradient(COLORS.osrs.line),
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: COLORS.osrs.line,
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
            borderWidth: 2,
            tension: 0.2,
            fill: true,
          },
          {
            label: "RS3",
            data: rs3Data,
            borderColor: COLORS.rs3.line,
            backgroundColor: createGradient(COLORS.rs3.line),
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: COLORS.rs3.line,
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
            borderWidth: 2,
            tension: 0.2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15,15,15,0.95)",
            borderColor: "rgba(200,168,75,0.2)",
            borderWidth: 1,
            titleColor: "#e0e0e0",
            bodyColor: "#aaa",
            padding: 12,
            cornerRadius: 8,
            titleFont: { weight: "600" },
            boxPadding: 4,
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
            grid: { color: "rgba(255,255,255,0.04)" },
          },
          y: {
            ticks: {
              color: "#888",
              callback: (v) => formatCount(v),
            },
            grid: { color: "rgba(255,255,255,0.04)" },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, range]);

  if (osrsPoints.length === 0 && rs3Points.length === 0) {
    return <p className="text-center text-text-muted">No data available.</p>;
  }

  return (
    <div>
      {/* Custom legend */}
      <div className="flex items-center justify-center gap-6 mb-3">
        {[
          { label: "Total Players", color: COLORS.total.line },
          { label: "OSRS", color: COLORS.osrs.line },
          { label: "RS3", color: COLORS.rs3.line },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-text-secondary">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
            />
            {label}
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}
