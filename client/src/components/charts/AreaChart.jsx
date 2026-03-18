import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend, TimeScale);

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function AreaChart({ data, range }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext("2d");

    const createGradient = (color) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color + "50");
      gradient.addColorStop(1, color + "05");
      return gradient;
    };

    const osrsPoints = data.osrs ?? [];
    const rs3Points = data.rs3 ?? [];

    const timeUnits = {
      "24h": "hour", "7d": "day", "30d": "day",
      "6m": "month", "1y": "month", all: "month",
    };

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "OSRS",
            data: osrsPoints.map((d) => ({ x: new Date(d.timestamp), y: d.osrs })),
            borderColor: "#5ba3f5",
            backgroundColor: createGradient("#5ba3f5"),
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#5ba3f5",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
          },
          {
            label: "RS3",
            data: rs3Points.map((d) => ({ x: new Date(d.timestamp), y: d.rs3 })),
            borderColor: "#e05c5c",
            backgroundColor: createGradient("#e05c5c"),
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#e05c5c",
            borderWidth: 2,
            tension: 0.3,
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
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            titleColor: "#e0e0e0",
            bodyColor: "#aaa",
            padding: 12,
            cornerRadius: 8,
            boxPadding: 4,
            callbacks: {
              title: (items) => new Date(items[0].parsed.x).toLocaleString(),
              label: (item) => `${item.dataset.label}: ${formatCount(item.parsed.y)}`,
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
            ticks: { color: "#888", callback: (v) => formatCount(v) },
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

  return (
    <div>
      <div className="flex items-center justify-center gap-6 mb-3">
        {[
          { label: "OSRS", color: "#5ba3f5" },
          { label: "RS3", color: "#e05c5c" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
            {label}
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}
