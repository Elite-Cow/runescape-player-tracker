import type { HistoryPoint } from "./types/api";

interface TimedRs3 {
  _t: number;
  rs3: number;
}

function nearestRs3(rs3Sorted: TimedRs3[], t: number): TimedRs3 {
  let lo = 0, hi = rs3Sorted.length - 1, best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const mt = rs3Sorted[mid]._t;
    if (Math.abs(mt - t) < Math.abs(rs3Sorted[best]._t - t)) best = mid;
    if (mt < t) lo = mid + 1;
    else hi = mid - 1;
  }
  return rs3Sorted[best];
}

export function buildTotalData(
  osrsPoints: HistoryPoint[],
  rs3Points: HistoryPoint[]
): { x: Date; y: number }[] {
  const TWELVE_HOURS = 12 * 3600 * 1000;
  const rs3Sorted: TimedRs3[] = rs3Points
    .map((d) => ({ _t: new Date(d.timestamp).getTime(), rs3: d.rs3 }))
    .sort((a, b) => a._t - b._t);

  return osrsPoints.map((d) => {
    const x = new Date(d.timestamp);
    if (d.rs3 > 0) return { x, y: d.total_players };
    if (rs3Sorted.length === 0) return { x, y: d.osrs };
    const nearest = nearestRs3(rs3Sorted, x.getTime());
    const rs3Val = Math.abs(nearest._t - x.getTime()) <= TWELVE_HOURS ? nearest.rs3 : 0;
    return { x, y: d.osrs + rs3Val };
  });
}
