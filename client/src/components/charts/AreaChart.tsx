import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "../../lib/echarts-theme";
import { formatCount, COLORS } from "../../lib/chart-utils";
import type { HistoryPoint } from "../../types/api";
import type { EChartsOption } from "echarts";

interface AreaChartProps {
  data: HistoryPoint[];
  range: string;
}

function getDateFormatter(range: string): string {
  switch (range) {
    case "24h":
      return "{HH}:{mm}";
    case "7d":
      return "{MMM} {dd} {HH}:{mm}";
    case "30d":
      return "{MMM} {dd}";
    case "6m":
    case "1y":
    case "all":
      return "{MMM} {yyyy}";
    default:
      return "{MMM} {dd}";
  }
}

function getMinInterval(range: string): number {
  switch (range) {
    case "24h":
      return 3600 * 1000;
    case "7d":
      return 6 * 3600 * 1000;
    case "30d":
      return 24 * 3600 * 1000;
    case "6m":
      return 7 * 24 * 3600 * 1000;
    case "1y":
    case "all":
      return 30 * 24 * 3600 * 1000;
    default:
      return 24 * 3600 * 1000;
  }
}

function tooltipDateLabel(range: string, ts: number): string {
  const d = new Date(ts);
  if (range === "24h" || range === "7d" || range === "30d") {
    return d.toLocaleString("en-GB", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AreaChart({ data, range }: AreaChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (!data || data.length === 0) return {};

    const timestamps = data.map((d) => new Date(d.timestamp).getTime());
    const osrsData = timestamps.map((t, i) => [t, data[i].osrs]);
    const rs3Data = timestamps.map((t, i) => [t, data[i].rs3]);

    return {
      grid: {
        top: 16,
        right: 16,
        bottom: 16,
        left: 60,
        containLabel: false,
      },
      xAxis: {
        type: "time",
        axisLabel: {
          formatter: getDateFormatter(range),
        },
        minInterval: getMinInterval(range),
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
          type: "line",
          lineStyle: { color: COLORS.gold + "40" },
          label: { show: false },
        },
        formatter: (params: unknown) => {
          const items = params as Array<{
            value: [number, number];
            seriesName: string;
            marker: string;
          }>;
          if (!Array.isArray(items) || items.length === 0) return "";
          const ts = items[0].value[0];
          const dateStr = tooltipDateLabel(range, ts);
          let html = `<div style="font-weight:600;margin-bottom:6px;">${dateStr}</div>`;
          for (const item of items) {
            if (item.value[1] != null) {
              html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">`;
              html += `${item.marker}`;
              html += `<span style="flex:1;">${item.seriesName}</span>`;
              html += `<span style="font-weight:600;">${formatCount(item.value[1])}</span>`;
              html += `</div>`;
            }
          }
          return html;
        },
      },
      legend: {
        show: false,
      },
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          filterMode: "filter",
        },
      ],
      series: [
        {
          name: "OSRS",
          type: "line",
          data: osrsData,
          smooth: 0.3,
          symbol: "none",
          sampling: "lttb",
          lineStyle: { width: 2, color: COLORS.osrs },
          itemStyle: { color: COLORS.osrs },
          emphasis: {
            focus: "series",
            lineStyle: { width: 3 },
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: COLORS.osrs + "50" },
              { offset: 1, color: COLORS.osrs + "05" },
            ]),
          },
          z: 2,
        },
        {
          name: "RS3",
          type: "line",
          data: rs3Data,
          smooth: 0.3,
          symbol: "none",
          sampling: "lttb",
          lineStyle: { width: 2, color: COLORS.rs3 },
          itemStyle: { color: COLORS.rs3 },
          emphasis: {
            focus: "series",
            lineStyle: { width: 3 },
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: COLORS.rs3 + "50" },
              { offset: 1, color: COLORS.rs3 + "05" },
            ]),
          },
          z: 1,
        },
      ],
    };
  }, [data, range]);

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
      style={{ height: "360px", width: "100%" }}
      notMerge
    />
  );
}
