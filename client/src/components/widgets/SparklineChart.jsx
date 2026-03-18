import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(LinearScale, PointElement, LineElement, Filler, TimeScale);

export default function SparklineChart({ data, color }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");

    // Main gradient fill — increased opacity
    const gradient = ctx.createLinearGradient(0, 0, 0, 60);
    gradient.addColorStop(0, color + "50");
    gradient.addColorStop(1, color + "00");

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        datasets: [
          // Glow shadow line (behind)
          {
            data,
            borderColor: color + "40",
            backgroundColor: "transparent",
            borderWidth: 4,
            pointRadius: 0,
            tension: 0.3,
            fill: false,
          },
          // Main line (on top)
          {
            data,
            borderColor: color,
            backgroundColor: gradient,
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false, type: "time" },
          y: { display: false },
        },
        layout: { padding: 0 },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, color]);

  return (
    <div className="h-[60px] w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
