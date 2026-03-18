import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "../../lib/echarts-theme";
import { formatCount, COLORS } from "../../lib/chart-utils";
import type { EChartsOption } from "echarts";

interface ComparisonBarData {
  date: string;
  osrsAvg: number;
  rs3Avg: number;
}

interface ComparisonBarChartProps {
  data: ComparisonBarData[];
}

export default function ComparisonBarChart({ data }: ComparisonBarChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (!data || data.length === 0) return {};

    const recent = data.slice(-7);
    const labels = recent.map((d) =>
      new Date(d.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    );
    const osrsValues = recent.map((d) => d.osrsAvg);
    const rs3Values = recent.map((d) => d.rs3Avg);

    return {
      grid: {
        top: 16,
        right: 16,
        bottom: 24,
        left: 60,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          fontSize: 11,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => formatCount(value),
        },
        splitNumber: 5,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
          shadowStyle: {
            color: "rgba(200, 168, 75, 0.04)",
          },
        },
        formatter: (params: unknown) => {
          const items = params as Array<{
            name: string;
            value: number;
            seriesName: string;
            marker: string;
          }>;
          if (!Array.isArray(items) || items.length === 0) return "";
          let html = `<div style="font-weight:600;margin-bottom:6px;">${items[0].name}</div>`;
          for (const item of items) {
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">`;
            html += `${item.marker}`;
            html += `<span style="flex:1;">${item.seriesName}</span>`;
            html += `<span style="font-weight:600;">${formatCount(item.value)}</span>`;
            html += `</div>`;
          }
          return html;
        },
      },
      legend: {
        show: false,
      },
      series: [
        {
          name: "OSRS Avg",
          type: "bar",
          data: osrsValues,
          barGap: "10%",
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: COLORS.osrs + "cc" },
              { offset: 1, color: COLORS.osrs + "40" },
            ]),
            borderColor: COLORS.osrs,
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: COLORS.osrs },
                { offset: 1, color: COLORS.osrs + "80" },
              ]),
            },
          },
        },
        {
          name: "RS3 Avg",
          type: "bar",
          data: rs3Values,
          barGap: "10%",
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: COLORS.rs3 + "cc" },
              { offset: 1, color: COLORS.rs3 + "40" },
            ]),
            borderColor: COLORS.rs3,
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: COLORS.rs3 },
                { offset: 1, color: COLORS.rs3 + "80" },
              ]),
            },
          },
        },
      ],
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-text-muted py-8">No data available.</p>
    );
  }

  return (
    <ReactECharts
      echarts={echarts}
      option={option}
      theme="rs-dark"
      opts={{ renderer: "canvas" }}
      style={{ height: "320px", width: "100%" }}
      notMerge
    />
  );
}
