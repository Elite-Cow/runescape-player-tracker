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

    const recent = data.slice(-7);
    const labels = recent.map((d) =>
      new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    );

    // Create gradient fills for bars
    const osrsGrad = ctx.createLinearGradient(0, 0, 0, 300);
    osrsGrad.addColorStop(0, "#5ba3f5cc");
    osrsGrad.addColorStop(1, "#5ba3f540");

    const rs3Grad = ctx.createLinearGradient(0, 0, 0, 300);
    rs3Grad.addColorStop(0, "#e05c5ccc");
    rs3Grad.addColorStop(1, "#e05c5c40");

    chartRef.current = new ChartJS(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "OSRS Avg",
            data: recent.map((d) => d.avgOsrs),
            backgroundColor: osrsGrad,
            borderColor: "#5ba3f5",
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: "RS3 Avg",
            data: recent.map((d) => d.avgRs3),
            backgroundColor: rs3Grad,
            borderColor: "#e05c5c",
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
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
              label: (item) => `${item.dataset.label}: ${formatCount(item.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#888" },
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
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-center gap-6 mb-3">
        {[
          { label: "OSRS Avg", color: "#5ba3f5" },
          { label: "RS3 Avg", color: "#e05c5c" },
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
