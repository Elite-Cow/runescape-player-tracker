import React, { useRef, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import LoadingSpinner from "../common/LoadingSpinner";

ChartJS.register(LinearScale, PointElement, LineElement, Filler, Tooltip, TimeScale);

function formatGold(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function GEPriceChart({ itemId, game }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!itemId || !canvasRef.current) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/ge/graph/${itemId}?game=${game}`);
        if (!res.ok) throw new Error("Failed to load price history");
        const data = await res.json();
        if (cancelled) return;

        if (chartRef.current) chartRef.current.destroy();

        const daily = data.daily || {};
        const points = Object.entries(daily)
          .map(([ts, price]) => ({ x: new Date(Number(ts)), y: price }))
          .sort((a, b) => a.x - b.x);

        if (points.length === 0) {
          setError("No price data available");
          setLoading(false);
          return;
        }

        const ctx = canvasRef.current.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(200,168,75,0.3)");
        gradient.addColorStop(1, "rgba(200,168,75,0)");

        chartRef.current = new ChartJS(ctx, {
          type: "line",
          data: {
            datasets: [{
              label: "Price",
              data: points,
              borderColor: "#c8a84b",
              backgroundColor: gradient,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: "#c8a84b",
              pointHoverBorderColor: "#fff",
              pointHoverBorderWidth: 2,
              tension: 0.1,
              fill: true,
            }],
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
                bodyColor: "#c8a84b",
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                  title: (items) => new Date(items[0].parsed.x).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                  label: (item) => `${formatGold(item.parsed.y)} gp`,
                },
              },
            },
            scales: {
              x: {
                type: "time",
                time: { unit: "month" },
                ticks: { color: "#888", maxTicksLimit: 6 },
                grid: { color: "rgba(255,255,255,0.04)" },
              },
              y: {
                ticks: { color: "#888", callback: (v) => formatGold(v) },
                grid: { color: "rgba(255,255,255,0.04)" },
              },
            },
          },
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [itemId, game]);

  if (loading) return <LoadingSpinner className="py-12" />;
  if (error) return <div className="text-center text-rs3 py-8 text-sm">{error}</div>;

  return <canvas ref={canvasRef} />;
}
