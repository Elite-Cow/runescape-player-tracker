import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Users, TrendingUp, TrendingDown, Clock, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import SparklineChart from "../components/widgets/SparklineChart";
import PlayerChart from "../components/PlayerChart";
import RangeButtons from "../components/RangeButtons";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCount, COLORS } from "../lib/chart-utils";
import type {
  PlayerCountData,
  HistoryPoint,
  AvailabilityMap,
  TimeRange,
  SparklinePoint,
  RecordsResponse,
} from "../types/api";

// ---------------------------------------------------------------------------
// Types for API responses
// ---------------------------------------------------------------------------

interface AccountTotalResponse {
  total: number;
  fetchedAt: string;
}

/** /api/records returns peaks/lows as plain numbers, delta object */
interface RecordsAPIResponse {
  peaks: { total: number; osrs: number; rs3: number };
  lows: { total: number; osrs: number; rs3: number };
  delta: { total: number; osrs: number; rs3: number };
}

/** /api/history returns separate arrays */
interface HistoryAPIResponse {
  osrs: HistoryPoint[];
  rs3: HistoryPoint[];
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
 * HistoryPoint[] suitable for the ECharts PlayerChart component.
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

// ---------------------------------------------------------------------------
// Animated counter (eased count-up)
// ---------------------------------------------------------------------------

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!value) return;
    const duration = 1500;
    const start = display;
    const diff = value - start;
    const startTime = performance.now();

    let rafId: number;
    function tick(now: number) {
      const elapsed = now - startTime;
      const pct = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3); // ease-out cubic
      setDisplay(Math.round(start + diff * eased));
      if (pct < 1) rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}

// ---------------------------------------------------------------------------
// Stat card config
// ---------------------------------------------------------------------------

interface StatCardConfig {
  label: string;
  color: string;
  badgeVariant: "default" | "osrs" | "rs3" | "success";
  getValue: (data: PlayerCountData) => number;
  getDelta: (records: RecordsAPIResponse) => number;
  getSparkline: (data: SparklinePoint[]) => { x: Date | string; y: number }[];
}

const STAT_CARDS: StatCardConfig[] = [
  {
    label: "Total Players",
    color: COLORS.gold,
    badgeVariant: "default",
    getValue: (d) => d.total_players,
    getDelta: (r) => r.delta.total,
    getSparkline: (s) => s.map((p) => ({ x: p.timestamp, y: p.total_players })),
  },
  {
    label: "OSRS Players",
    color: COLORS.osrs,
    badgeVariant: "osrs",
    getValue: (d) => d.osrs,
    getDelta: (r) => r.delta.osrs,
    getSparkline: (s) => s.map((p) => ({ x: p.timestamp, y: p.osrs })),
  },
  {
    label: "RS3 Players",
    color: COLORS.rs3,
    badgeVariant: "rs3",
    getValue: (d) => d.rs3,
    getDelta: (r) => r.delta.rs3,
    getSparkline: (s) => s.map((p) => ({ x: p.timestamp, y: p.rs3 })),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  // Data state
  const [latest, setLatest] = useState<PlayerCountData | null>(null);
  const [sparkline, setSparkline] = useState<SparklinePoint[] | null>(null);
  const [records, setRecords] = useState<RecordsAPIResponse | null>(null);
  const [accountTotal, setAccountTotal] = useState<AccountTotalResponse | null>(null);

  // Chart state
  const [availability, setAvailability] = useState<AvailabilityMap | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[] | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);

  // Global state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----- Fetch summary data (latest, sparkline, records, accounts) ---------
  const fetchSummary = useCallback(async () => {
    try {
      const [latestRes, sparklineRes, recordsRes, accountsRes] = await Promise.all([
        fetch("/api/latest"),
        fetch("/api/sparkline"),
        fetch("/api/records"),
        fetch("/api/accounts/total").catch(() => null),
      ]);

      if (latestRes.ok) setLatest(await latestRes.json());
      if (sparklineRes.ok) setSparkline(await sparklineRes.json());
      if (recordsRes.ok) setRecords(await recordsRes.json());
      if (accountsRes?.ok) setAccountTotal(await accountsRes.json());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll summary every 60s
  useEffect(() => {
    fetchSummary();
    const id = setInterval(fetchSummary, 60_000);
    return () => clearInterval(id);
  }, [fetchSummary]);

  // ----- Fetch availability (once) -----------------------------------------
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
        if (range) setSelectedRange(range);
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load availability";
          setError(message);
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
          const message = err instanceof Error ? err.message : "Failed to load history";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedRange]);

  // ----- Computed chart stats (min / max / avg) ----------------------------
  const chartStats = useMemo(() => {
    if (!historyData || historyData.length === 0) return null;
    const totals = historyData.map((d) => d.total_players).filter((n) => n > 0);
    if (totals.length === 0) return null;
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const avg = Math.round(totals.reduce((s, v) => s + v, 0) / totals.length);
    return { min, max, avg };
  }, [historyData]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Hero header */}
      <div className="mb-8">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">Dashboard</h1>
        <p className="text-sm text-[#888888] mt-1">
          Real-time RuneScape player count monitoring
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </div>

      {error && (
        <div className="text-center text-[#e05c5c] py-4 mb-4">{error}</div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Row 1: 4 stat cards                                               */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-[60px] w-full" />
                </CardContent>
              </Card>
            ))
          : (
            <>
              {STAT_CARDS.map((cfg) => {
                const value = latest ? cfg.getValue(latest) : 0;
                const delta = records ? cfg.getDelta(records) : 0;
                const sparkData = sparkline ? cfg.getSparkline(sparkline) : [];
                const isUp = delta >= 0;

                return (
                  <Card key={cfg.label} className="relative overflow-hidden">
                    {/* Top accent bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{
                        background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}80)`,
                      }}
                    />
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wide font-medium text-[#888888]">
                          {cfg.label}
                        </span>
                        <Badge variant={cfg.badgeVariant} className="text-[10px] gap-1">
                          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isUp ? "+" : ""}{formatCount(delta)}
                        </Badge>
                      </div>

                      <div
                        className="text-2xl font-bold mb-3"
                        style={{ color: cfg.color }}
                      >
                        {value > 0 ? formatCount(value) : "\u2014"}
                      </div>

                      {sparkData.length > 0 && (
                        <SparklineChart data={sparkData} color={cfg.color} height={60} />
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Total accounts card */}
              <Card className="relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.green}80)`,
                  }}
                />
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={14} style={{ color: COLORS.green }} />
                    <span className="text-xs uppercase tracking-wide font-medium text-[#888888]">
                      Total RS Accounts
                    </span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: COLORS.green }}>
                    {accountTotal?.total ? (
                      <AnimatedCounter value={accountTotal.total} />
                    ) : (
                      "\u2014"
                    )}
                  </div>
                  <p className="text-xs text-[#666666] mt-1">All time accounts created</p>
                </CardContent>
              </Card>
            </>
          )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Row 2: Main chart with range buttons + stats                      */}
      {/* ----------------------------------------------------------------- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Player Count History</CardTitle>
        </CardHeader>
        <CardContent>
          {availability && selectedRange && (
            <RangeButtons
              availability={availability}
              selected={selectedRange}
              onSelect={setSelectedRange}
            />
          )}

          <div className="mt-2 min-h-[420px]">
            {loadingChart ? (
              <LoadingSpinner className="py-20" />
            ) : historyData && historyData.length > 0 && selectedRange ? (
              <PlayerChart data={historyData} range={selectedRange} />
            ) : (
              <p className="text-center text-[#666666] py-16">No data available.</p>
            )}
          </div>

          {/* Small stats bar beneath chart */}
          {chartStats && (
            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-[#1a2048] pt-4">
              {[
                { label: "Min", value: chartStats.min, color: COLORS.rs3 },
                { label: "Avg", value: chartStats.avg, color: COLORS.gold },
                { label: "Max", value: chartStats.max, color: COLORS.green },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-xs text-[#888888] uppercase tracking-wide mb-1">
                    {s.label}
                  </div>
                  <div className="text-lg font-semibold" style={{ color: s.color }}>
                    {formatCount(s.value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Row 3: Status card + Quick records                                */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Wifi size={16} style={{ color: COLORS.green }} />
              <Badge variant="success">Live</Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#888888]">
              <Clock size={14} />
              <span>Last update: </span>
              <span className="text-[#e0e0e0]">
                {latest?.timestamp
                  ? new Date(latest.timestamp).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "\u2014"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick records */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All-Time Peaks</CardTitle>
          </CardHeader>
          <CardContent>
            {records ? (
              <div className="space-y-3">
                {[
                  { label: "Peak Total", value: records.peaks.total, color: COLORS.gold },
                  { label: "Peak OSRS", value: records.peaks.osrs, color: COLORS.osrs },
                  { label: "Peak RS3", value: records.peaks.rs3, color: COLORS.rs3 },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-sm text-[#888888]">{r.label}</span>
                    <span className="text-sm font-semibold" style={{ color: r.color }}>
                      {formatCount(r.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
