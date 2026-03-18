import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "../lib/echarts-theme";
import { formatCount, COLORS } from "../lib/chart-utils";
import type { HistoryPoint } from "../types/api";
import type { EChartsOption } from "echarts";

interface PlayerChartProps {
  data: HistoryPoint[];
  range: string;
}

/** Returns an appropriate date format pattern based on the selected range. */
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
      return "{MMM} {yyyy}";
    case "all":
      return "{MMM} {yyyy}";
    default:
      return "{MMM} {dd}";
  }
}

/** Returns the minimum interval in ms for the x-axis based on range. */
function getMinInterval(range: string): number {
  switch (range) {
    case "24h":
      return 3600 * 1000; // 1 hour
    case "7d":
      return 6 * 3600 * 1000; // 6 hours
    case "30d":
      return 24 * 3600 * 1000; // 1 day
    case "6m":
      return 7 * 24 * 3600 * 1000; // 1 week
    case "1y":
      return 30 * 24 * 3600 * 1000; // ~1 month
    case "all":
      return 30 * 24 * 3600 * 1000;
    default:
      return 24 * 3600 * 1000;
  }
}

function tooltipDateLabel(range: string, ts: number): string {
  const d = new Date(ts);
  if (range === "24h") {
    return d.toLocaleString("en-GB", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (range === "7d" || range === "30d") {
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

export default function PlayerChart({ data, range }: PlayerChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (!data || data.length === 0) return {};

    const timestamps = data.map((d) => new Date(d.timestamp).getTime());
    const totalValues = data.map((d) => d.total_players);
    const osrsValues = data.map((d) => d.osrs);
    const rs3Values = data.map((d) => d.rs3);

    const totalData = timestamps.map((t, i) => [t, totalValues[i]]);
    const osrsData = timestamps.map((t, i) => [t, osrsValues[i]]);
    const rs3Data = timestamps.map((t, i) => [t, rs3Values[i]]);

    return {
      grid: {
        top: 16,
        right: 16,
        bottom: 80,
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
          type: "cross",
          lineStyle: { color: COLORS.gold + "40" },
          crossStyle: { color: COLORS.gold + "20" },
          label: { show: false },
        },
        formatter: (params: unknown) => {
          const items = params as Array<{
            value: [number, number];
            seriesName: string;
            color: string;
            marker: string;
          }>;
          if (!Array.isArray(items) || items.length === 0) return "";
          const ts = items[0].value[0];
          const dateStr = tooltipDateLabel(range, ts);
          let html = `<div style="font-weight:600;margin-bottom:6px;">${dateStr}</div>`;
          for (const item of items) {
            if (item.value[1] != null && item.value[1] > 0) {
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
        show: true,
        bottom: 30,
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 24,
        textStyle: {
          fontSize: 12,
        },
      },
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          filterMode: "filter",
        },
        {
          type: "slider",
          xAxisIndex: 0,
          height: 24,
          bottom: 0,
          filterMode: "filter",
        },
      ],
      series: [
        {
          name: "Total Players",
          type: "line",
          data: totalData,
          smooth: false,
          symbol: "none",
          sampling: "lttb",
          lineStyle: { width: 2, color: COLORS.gold },
          itemStyle: { color: COLORS.gold },
          emphasis: {
            focus: "series",
            lineStyle: { width: 3 },
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: COLORS.gold + "30" },
              { offset: 1, color: COLORS.gold + "00" },
            ]),
          },
          z: 3,
        },
        {
          name: "OSRS",
          type: "line",
          data: osrsData,
          smooth: false,
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
              { offset: 0, color: COLORS.osrs + "30" },
              { offset: 1, color: COLORS.osrs + "00" },
            ]),
          },
          z: 2,
        },
        {
          name: "RS3",
          type: "line",
          data: rs3Data,
          smooth: false,
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
              { offset: 0, color: COLORS.rs3 + "30" },
              { offset: 1, color: COLORS.rs3 + "00" },
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
      style={{ height: "420px", width: "100%" }}
      notMerge
    />
  );
}
