import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "../../lib/echarts-theme";
import { formatPrice, COLORS } from "../../lib/chart-utils";
import type { GETimeseriesPoint } from "../../types/api";
import type { EChartsOption } from "echarts";

interface GEPriceChartProps {
  data: GETimeseriesPoint[];
  itemName?: string;
}

export default function GEPriceChart({ data, itemName }: GEPriceChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (!data || data.length === 0) return {};

    // Filter out points where both prices are null
    const filtered = data.filter(
      (d) => d.avgHighPrice !== null || d.avgLowPrice !== null
    );

    if (filtered.length === 0) return {};

    const buyData = filtered.map((d) => [
      d.timestamp * 1000,
      d.avgHighPrice,
    ]);
    const sellData = filtered.map((d) => [
      d.timestamp * 1000,
      d.avgLowPrice,
    ]);

    return {
      grid: {
        top: 16,
        right: 16,
        bottom: 64,
        left: 70,
        containLabel: false,
      },
      xAxis: {
        type: "time",
        axisLabel: {
          formatter: "{MMM} {dd}",
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => formatPrice(value),
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
            value: [number, number | null];
            seriesName: string;
            marker: string;
          }>;
          if (!Array.isArray(items) || items.length === 0) return "";

          const ts = items[0].value[0];
          const dateStr = new Date(ts).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          const buyVal = items.find((i) => i.seriesName === "Buy Price")
            ?.value[1];
          const sellVal = items.find((i) => i.seriesName === "Sell Price")
            ?.value[1];
          const spread =
            buyVal != null && sellVal != null ? buyVal - sellVal : null;

          let html = `<div style="font-weight:600;margin-bottom:6px;">`;
          if (itemName) html += `${itemName} &mdash; `;
          html += `${dateStr}</div>`;

          for (const item of items) {
            const val = item.value[1];
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">`;
            html += `${item.marker}`;
            html += `<span style="flex:1;">${item.seriesName}</span>`;
            html += `<span style="font-weight:600;">${formatPrice(val)}</span>`;
            html += `</div>`;
          }

          if (spread !== null) {
            html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;">`;
            html += `<span style="color:${COLORS.textSecondary};">Spread</span>`;
            html += `<span style="font-weight:600;color:${spread >= 0 ? COLORS.green : COLORS.red};">${formatPrice(Math.abs(spread))}</span>`;
            html += `</div>`;
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
          name: "Buy Price",
          type: "line",
          data: buyData,
          smooth: false,
          symbol: "none",
          sampling: "lttb",
          lineStyle: { width: 2, color: COLORS.green },
          itemStyle: { color: COLORS.green },
          emphasis: {
            focus: "series",
            lineStyle: { width: 3 },
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: COLORS.green + "20" },
              { offset: 1, color: COLORS.green + "00" },
            ]),
          },
          connectNulls: true,
          z: 2,
        },
        {
          name: "Sell Price",
          type: "line",
          data: sellData,
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
              { offset: 0, color: COLORS.gold + "20" },
              { offset: 1, color: COLORS.gold + "00" },
            ]),
          },
          connectNulls: true,
          z: 1,
        },
      ],
    };
  }, [data, itemName]);

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-text-muted py-8">
        No price data available.
      </p>
    );
  }

  return (
    <ReactECharts
      echarts={echarts}
      option={option}
      theme="rs-dark"
      opts={{ renderer: "canvas" }}
      style={{ height: "380px", width: "100%" }}
      notMerge
    />
  );
}
