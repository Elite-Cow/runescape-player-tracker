import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "../../lib/echarts-theme";
import { formatXp, COLORS } from "../../lib/chart-utils";
import type { EChartsOption } from "echarts";

interface MonthlyXPData {
  month: string;
  xp: number;
}

interface MonthlyXPChartProps {
  data: MonthlyXPData[];
  skillName?: string;
}

export default function MonthlyXPChart({ data, skillName }: MonthlyXPChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (!data || data.length === 0) return {};

    const labels = data.map((d) => d.month);
    const values = data.map((d) => d.xp);

    return {
      grid: {
        top: 16,
        right: 16,
        bottom: 24,
        left: 70,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          fontSize: 11,
          rotate: labels.length > 8 ? 45 : 0,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => formatXp(value),
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
            marker: string;
          }>;
          if (!Array.isArray(items) || items.length === 0) return "";
          const item = items[0];
          let html = `<div style="font-weight:600;margin-bottom:6px;">${item.name}</div>`;
          html += `<div style="display:flex;align-items:center;gap:6px;">`;
          html += `${item.marker}`;
          html += `<span style="flex:1;">${skillName ?? "XP Gained"}</span>`;
          html += `<span style="font-weight:600;color:${COLORS.gold};">${formatXp(item.value)} XP</span>`;
          html += `</div>`;
          return html;
        },
      },
      legend: {
        show: false,
      },
      series: [
        {
          name: skillName ?? "XP Gained",
          type: "bar",
          data: values,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: COLORS.gold },
              { offset: 1, color: COLORS.gold + "30" },
            ]),
            borderColor: COLORS.gold,
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: COLORS.gold },
                { offset: 1, color: COLORS.gold + "60" },
              ]),
            },
          },
          barMaxWidth: 40,
        },
      ],
    };
  }, [data, skillName]);

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-text-muted py-8">
        No monthly XP data available.
      </p>
    );
  }

  return (
    <ReactECharts
      echarts={echarts}
      option={option}
      theme="rs-dark"
      opts={{ renderer: "canvas" }}
      style={{ height: "300px", width: "100%" }}
      notMerge
    />
  );
}
