import React, { useEffect, useState, useMemo } from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import PlayerChart from "../components/PlayerChart";
import AreaChart from "../components/charts/AreaChart";
import ComparisonBarChart from "../components/charts/ComparisonBarChart";
import RangeButtons from "../components/RangeButtons";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCount, COLORS } from "../lib/chart-utils";
import type { HistoryPoint, AvailabilityMap, TimeRange } from "../types/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** /api/history returns separate arrays for osrs and rs3. */
interface HistoryAPIResponse {
  osrs: HistoryPoint[];
  rs3: HistoryPoint[];
}

interface ComparisonBarData {
  date: string;
  osrsAvg: number;
  rs3Avg: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RANGES_PRIORITY: TimeRange[] = ["all", "1y", "6m", "30d", "7d", "24h"];

function bestRange(availability: AvailabilityMap): TimeRange | null {
  for (const range of RANGES_PRIORITY) {
    if (availability[range]) return range;
  }
  return null;
}

/**
 * Merge separate osrs[] and rs3[] history arrays into a single flat
 * HistoryPoint[] for the ECharts chart components.
 */
function mergeHistory(osrs: HistoryPoint[], rs3: HistoryPoint[]): HistoryPoint[] {
  const map = new Map<string, HistoryPoint>();

  for (const pt of osrs) {
    const key = pt.timestamp;
    const existing = map.get(key);
    if (existing) {
      existing.osrs = pt.osrs || existing.osrs;
      existing.total_players = (pt.osrs || existing.osrs) + existing.rs3;
    } else {
      map.set(key, {
        timestamp: pt.timestamp,
        osrs: pt.osrs,
        rs3: pt.rs3 || 0,
        total_players: pt.total_players || pt.osrs,
      });
    }
  }

  for (const pt of rs3) {
    const key = pt.timestamp;
    const existing = map.get(key);
    if (existing) {
      existing.rs3 = pt.rs3 || existing.rs3;
      existing.total_players = existing.osrs + (pt.rs3 || existing.rs3);
    } else {
      map.set(key, {
        timestamp: pt.timestamp,
        osrs: pt.osrs || 0,
        rs3: pt.rs3,
        total_players: pt.total_players || pt.rs3,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Compute daily averages from a flat HistoryPoint[].
 * Groups by UTC date string, averages osrs and rs3 per day.
 */
function computeDailyAverages(data: HistoryPoint[]): ComparisonBarData[] {
  const groups = new Map<string, { osrsSum: number; rs3Sum: number; count: number }>();

  for (const pt of data) {
    const date = new Date(pt.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = groups.get(date);
    if (existing) {
      existing.osrsSum += pt.osrs;
      existing.rs3Sum += pt.rs3;
      existing.count += 1;
    } else {
      groups.set(date, { osrsSum: pt.osrs, rs3Sum: pt.rs3, count: 1 });
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, g]) => ({
      date,
      osrsAvg: Math.round(g.osrsSum / g.count),
      rs3Avg: Math.round(g.rs3Sum / g.count),
    }));
}

// ---------------------------------------------------------------------------
// Peak stat card configs
// ---------------------------------------------------------------------------

interface PeakConfig {
  key: "total" | "osrs" | "rs3";
  label: string;
  color: string;
  borderColor: string;
}

const PEAK_CONFIGS: PeakConfig[] = [
  { key: "total", label: "Peak Total", color: COLORS.gold, borderColor: `${COLORS.gold}4d` },
  { key: "osrs", label: "Peak OSRS", color: COLORS.osrs, borderColor: `${COLORS.osrs}4d` },
  { key: "rs3", label: "Peak RS3", color: COLORS.rs3, borderColor: `${COLORS.rs3}4d` },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrackerPage() {
  // Availability + range
  const [availability, setAvailability] = useState<AvailabilityMap | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange | null>(null);

  // History data (merged flat array)
  const [historyData, setHistoryData] = useState<HistoryPoint[] | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- Fetch availability on mount ---------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/availability");
        if (!res.ok) throw new Error("Failed to load availability");
        const avail: AvailabilityMap = await res.json();
        if (cancelled) return;
        setAvailability(avail);
        const range = avail["24h"] ? "24h" : bestRange(avail);
        if (range) {
          setSelectedRange(range);
        } else {
          setError("No data available yet. Check back soon.");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load availability");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ----- Fetch history when range changes ----------------------------------
  useEffect(() => {
    if (!selectedRange) return;
    let cancelled = false;
    setLoadingChart(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/history?range=${selectedRange}`);
        if (!res.ok) throw new Error("Failed to load history");
        const raw: HistoryAPIResponse = await res.json();
        if (cancelled) return;

        const merged = mergeHistory(raw.osrs ?? [], raw.rs3 ?? []);
        setHistoryData(merged);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load history");
        }
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedRange]);

  // ----- Derived: peaks for current range ----------------------------------
  const peaks = useMemo(() => {
    if (!historyData || historyData.length === 0) return null;
    let peakTotal = 0;
    let peakOsrs = 0;
    let peakRs3 = 0;
    for (const pt of historyData) {
      if (pt.total_players > peakTotal) peakTotal = pt.total_players;
      if (pt.osrs > peakOsrs) peakOsrs = pt.osrs;
      if (pt.rs3 > peakRs3) peakRs3 = pt.rs3;
    }
    return { total: peakTotal, osrs: peakOsrs, rs3: peakRs3 };
  }, [historyData]);

  // ----- Derived: daily comparison bar data --------------------------------
  const comparisonData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    return computeDailyAverages(historyData);
  }, [historyData]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const isLoading = loadingChart || (selectedRange !== null && historyData === null && !error);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">Player Tracker</h1>
        <p className="text-sm text-[#888888] mt-1">
          Track and analyze RuneScape player counts over time
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </div>

      {error && (
        <div className="text-center text-[#e05c5c] py-4 mb-4">{error}</div>
      )}

      {/* Range buttons */}
      {availability && selectedRange && (
        <RangeButtons
          availability={availability}
          selected={selectedRange}
          onSelect={setSelectedRange}
        />
      )}

      {/* Peak stat cards */}
      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        {peaks
          ? PEAK_CONFIGS.map((cfg) => (
              <Card
                key={cfg.key}
                className="min-w-[140px]"
                style={{ borderLeftWidth: 2, borderLeftColor: cfg.borderColor }}
              >
                <CardContent className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Trophy size={12} style={{ color: cfg.color }} />
                    <span className="text-xs text-[#888888] uppercase tracking-wide">
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: cfg.color }}>
                    {formatCount(peaks[cfg.key])}
                  </div>
                </CardContent>
              </Card>
            ))
          : !error && (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="min-w-[140px]">
                  <CardContent className="px-5 py-3 text-center space-y-2">
                    <Skeleton className="h-3 w-16 mx-auto" />
                    <Skeleton className="h-6 w-20 mx-auto" />
                  </CardContent>
                </Card>
              ))
            )}
      </div>

      {/* Tabs: Chart / Breakdown / Comparison */}
      <Tabs defaultValue="chart" className="w-full">
        <div className="flex justify-center mb-4">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>
        </div>

        {/* ---- Tab: Chart ---- */}
        <TabsContent value="chart">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Player Count History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[420px]">
                {isLoading ? (
                  <LoadingSpinner className="py-20" />
                ) : historyData && historyData.length > 0 && selectedRange ? (
                  <PlayerChart data={historyData} range={selectedRange} />
                ) : (
                  <p className="text-center text-[#666666] py-16">No data available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab: Breakdown (area chart) ---- */}
        <TabsContent value="breakdown">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">OSRS vs RS3 Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[360px]">
                {isLoading ? (
                  <LoadingSpinner className="py-20" />
                ) : historyData && historyData.length > 0 && selectedRange ? (
                  <AreaChart data={historyData} range={selectedRange} />
                ) : (
                  <p className="text-center text-[#666666] py-16">No data available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Tab: Comparison (bar chart) ---- */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                OSRS vs RS3 — Daily Average Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[320px]">
                {isLoading ? (
                  <LoadingSpinner className="py-20" />
                ) : comparisonData.length > 0 ? (
                  <ComparisonBarChart data={comparisonData} />
                ) : (
                  <p className="text-center text-[#666666] py-16">
                    Not enough data for daily comparison.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
