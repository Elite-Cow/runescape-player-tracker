import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "../../lib/echarts-theme";
import type { EChartsOption } from "echarts";

interface SparklinePoint {
  x: Date | string;
  y: number;
}

interface SparklineChartProps {
  data: SparklinePoint[];
  color: string;
  height?: number;
}

export default function SparklineChart({
  data,
  color,
  height = 60,
}: SparklineChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (!data || data.length === 0) {
      return {};
    }

    const seriesData = data.map((d) => [
      typeof d.x === "string" ? new Date(d.x).getTime() : d.x.getTime(),
      d.y,
    ]);

    return {
      grid: {
        top: 2,
        right: 2,
        bottom: 2,
        left: 2,
      },
      xAxis: {
        type: "time",
        show: false,
      },
      yAxis: {
        type: "value",
        show: false,
      },
      tooltip: {
        show: false,
      },
      legend: {
        show: false,
      },
      animation: true,
      animationDuration: 600,
      series: [
        // Glow shadow line (behind)
        {
          type: "line",
          data: seriesData,
          smooth: 0.3,
          symbol: "none",
          lineStyle: {
            width: 4,
            color: color + "40",
          },
          areaStyle: undefined,
          silent: true,
          z: 1,
        },
        // Main line with gradient area fill
        {
          type: "line",
          data: seriesData,
          smooth: 0.3,
          symbol: "none",
          lineStyle: {
            width: 1.5,
            color: color,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + "50" },
              { offset: 1, color: color + "00" },
            ]),
          },
          z: 2,
        },
      ],
    };
  }, [data, color]);

  if (!data || data.length === 0) {
    return <div style={{ height: `${height}px` }} />;
  }

  return (
    <div style={{ height: `${height}px`, width: "100%" }}>
      <ReactECharts
        echarts={echarts}
        option={option}
        theme="rs-dark"
        opts={{ renderer: "svg", height }}
        style={{ height: `${height}px`, width: "100%" }}
        notMerge
      />
    </div>
  );
}
