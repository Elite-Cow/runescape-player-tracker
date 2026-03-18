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
      gradient.addColorStop(0, color + "40");
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
          legend: { labels: { color: "#e0e0e0" } },
          tooltip: {
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
            grid: { color: "#222" },
          },
          y: {
            ticks: { color: "#888", callback: (v) => formatCount(v) },
            grid: { color: "#222" },
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

  return <canvas ref={canvasRef} />;
}
