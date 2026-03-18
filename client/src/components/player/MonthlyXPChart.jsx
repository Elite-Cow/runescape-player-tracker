import React, { useRef, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import LoadingSpinner from "../common/LoadingSpinner";

ChartJS.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, TimeScale);

function formatXp(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function MonthlyXPChart({ playerName, skillId = 0 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playerName || !canvasRef.current) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/runemetrics/xp/${encodeURIComponent(playerName)}?skill=${skillId}`);
        if (!res.ok) throw new Error("Failed to load XP data");
        const data = await res.json();
        if (cancelled) return;

        if (chartRef.current) chartRef.current.destroy();

        const monthlyXp = data.monthlyXpGain || [];
        if (monthlyXp.length === 0) {
          setError("No monthly XP data available");
          setLoading(false);
          return;
        }

        const labels = monthlyXp.map((m) => m.monthName || `Month ${m.monthId}`);
        const values = monthlyXp.map((m) => m.totalXp || 0);

        const ctx = canvasRef.current.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, "rgba(200,168,75,0.8)");
        gradient.addColorStop(1, "rgba(200,168,75,0.2)");

        chartRef.current = new ChartJS(ctx, {
          type: "bar",
          data: {
            labels,
            datasets: [{
              label: "XP Gained",
              data: values,
              backgroundColor: gradient,
              borderColor: "#c8a84b",
              borderWidth: 1,
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
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
                  label: (item) => `${formatXp(item.parsed.y)} XP`,
                },
              },
            },
            scales: {
              x: {
                ticks: { color: "#888", maxRotation: 45 },
                grid: { color: "rgba(255,255,255,0.04)" },
              },
              y: {
                ticks: { color: "#888", callback: (v) => formatXp(v) },
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
  }, [playerName, skillId]);

  if (loading) return <LoadingSpinner className="py-12" />;
  if (error) return <div className="text-center text-text-muted py-8 text-sm">{error}</div>;

  return <canvas ref={canvasRef} />;
}
