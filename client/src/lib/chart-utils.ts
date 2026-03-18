export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

export function formatGold(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B gp`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M gp`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K gp`;
  return `${n.toLocaleString()} gp`;
}

export function formatXp(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatPrice(n: number | null): string {
  if (n === null || n === undefined) return "N/A";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export const COLORS = {
  gold: "#c8a84b",
  goldDim: "rgba(200, 168, 75, 0.12)",
  osrs: "#5ba3f5",
  osrsDim: "rgba(91, 163, 245, 0.12)",
  rs3: "#e05c5c",
  rs3Dim: "rgba(224, 92, 92, 0.12)",
  green: "#1bb37c",
  red: "#ef4444",
  orange: "#ffab00",
  textPrimary: "#e0e0e0",
  textSecondary: "#888888",
  textMuted: "#666666",
  bgDark: "#080d1f",
  bgCard: "#0f1535",
  border: "#1a2048",
} as const;
