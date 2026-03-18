import * as echarts from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  TitleComponent,
} from "echarts/components";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";

// Register only what we need for tree-shaking
echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  TitleComponent,
  CanvasRenderer,
  SVGRenderer,
]);

const RS_DARK_THEME = {
  backgroundColor: "transparent",
  textStyle: {
    color: "#888888",
    fontFamily: "Inter, Noto Sans, system-ui, sans-serif",
  },
  title: {
    textStyle: { color: "#e0e0e0", fontFamily: "Cinzel, serif" },
  },
  legend: {
    textStyle: { color: "#888888" },
    inactiveColor: "#333333",
  },
  tooltip: {
    backgroundColor: "rgba(8, 13, 31, 0.95)",
    borderColor: "rgba(200, 168, 75, 0.25)",
    borderWidth: 1,
    textStyle: {
      color: "#e0e0e0",
      fontSize: 13,
    },
    extraCssText: "backdrop-filter: blur(8px); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);",
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#1a2048" } },
    axisTick: { lineStyle: { color: "#1a2048" } },
    axisLabel: { color: "#666666" },
    splitLine: { lineStyle: { color: "rgba(26, 32, 72, 0.5)", type: "dashed" as const } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#1a2048" } },
    axisTick: { lineStyle: { color: "#1a2048" } },
    axisLabel: { color: "#666666" },
    splitLine: { lineStyle: { color: "rgba(26, 32, 72, 0.5)", type: "dashed" as const } },
  },
  line: {
    smooth: false,
    symbol: "none",
    lineStyle: { width: 2 },
  },
  bar: {
    barBorderRadius: [4, 4, 0, 0],
  },
  dataZoom: [
    {
      type: "inside" as const,
      borderColor: "#1a2048",
    },
    {
      type: "slider" as const,
      backgroundColor: "rgba(8, 13, 31, 0.8)",
      borderColor: "#1a2048",
      fillerColor: "rgba(200, 168, 75, 0.08)",
      handleStyle: { color: "#c8a84b", borderColor: "#c8a84b" },
      textStyle: { color: "#888888" },
      dataBackground: {
        lineStyle: { color: "rgba(200, 168, 75, 0.3)" },
        areaStyle: { color: "rgba(200, 168, 75, 0.05)" },
      },
    },
  ],
  color: ["#c8a84b", "#5ba3f5", "#e05c5c", "#1bb37c", "#ffab00", "#a78bfa"],
  animationDuration: 600,
  animationEasing: "cubicOut" as const,
};

echarts.registerTheme("rs-dark", RS_DARK_THEME);

export { echarts };
export default RS_DARK_THEME;
