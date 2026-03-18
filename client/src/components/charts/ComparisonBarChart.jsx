import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function ComparisonBarChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return;

    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext("2d");

    // Use last 7 entries (days) for bar comparison
    const recent = data.slice(-7);
    const labels = recent.map((d) =>
      new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    );

    chartRef.current = new ChartJS(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "OSRS Avg",
            data: recent.map((d) => d.avgOsrs),
            backgroundColor: "#5ba3f580",
            borderColor: "#5ba3f5",
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: "RS3 Avg",
            data: recent.map((d) => d.avgRs3),
            backgroundColor: "#e05c5c80",
            borderColor: "#e05c5c",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { labels: { color: "#e0e0e0" } },
          tooltip: {
            callbacks: {
              label: (item) => `${item.dataset.label}: ${formatCount(item.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#888" },
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
  }, [data]);

  return <canvas ref={canvasRef} />;
}
