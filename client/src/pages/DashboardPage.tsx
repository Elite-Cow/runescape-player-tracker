import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Clock, Wifi, Trophy } from "lucide-react";
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
} from "../types/api";

// ---------------------------------------------------------------------------
// Types for API responses
// ---------------------------------------------------------------------------

interface AccountTotalResponse {
  total: number;
  fetchedAt: string;
}

interface RecordsAPIResponse {
  peaks: { total: number; osrs: number; rs3: number };
  lows: { total: number; osrs: number; rs3: number };
  delta: { total: number; osrs: number; rs3: number };
}

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
// Animated spring counter
// ---------------------------------------------------------------------------

function SpringCounter({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

// ---------------------------------------------------------------------------
// Stagger container helper
// ---------------------------------------------------------------------------

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

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
  const [latest, setLatest] = useState<PlayerCountData | null>(null);
  const [sparkline, setSparkline] = useState<SparklinePoint[] | null>(null);
  const [records, setRecords] = useState<RecordsAPIResponse | null>(null);
  const [accountTotal, setAccountTotal] = useState<AccountTotalResponse | null>(null);

  const [availability, setAvailability] = useState<AvailabilityMap | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[] | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchSummary();
    const id = setInterval(fetchSummary, 60_000);
    return () => clearInterval(id);
  }, [fetchSummary]);

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

  const chartStats = useMemo(() => {
    if (!historyData || historyData.length === 0) return null;
    const totals = historyData.map((d) => d.total_players).filter((n) => n > 0);
    if (totals.length === 0) return null;
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const avg = Math.round(totals.reduce((s, v) => s + v, 0) / totals.length);
    return { min, max, avg };
  }, [historyData]);

  return (
    <div className="py-6">
      {/* Hero header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <h1 className="font-cinzel text-3xl font-bold gradient-text-gold">Dashboard</h1>
        <p className="text-sm text-[#888888] mt-1">
          Real-time RuneScape player count monitoring
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </motion.div>

      {error && (
        <div className="text-center text-[#e05c5c] py-4 mb-4">{error}</div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Bento Grid                                                        */}
      {/* ----------------------------------------------------------------- */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-[60px] w-full" />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          : (
            <>
              {/* Hero Total Players card with gradient border */}
              <motion.div variants={staggerItem} className="xl:col-span-2 xl:row-span-2">
                <div className="gradient-border h-full">
                  <Card className="h-full !rounded-2xl">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs uppercase tracking-wide font-medium text-[#888888]">
                            Total Players Online
                          </span>
                          {records && (
                            <Badge variant="default" className="text-[10px] gap-1">
                              {records.delta.total >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                              {records.delta.total >= 0 ? "+" : ""}{formatCount(records.delta.total)}
                            </Badge>
                          )}
                        </div>

                        <div className="text-5xl font-bold gradient-text-gold mb-4 font-cinzel">
                          {latest && latest.total_players > 0
                            ? <SpringCounter value={latest.total_players} />
                            : "\u2014"
                          }
                        </div>
                      </div>

                      {sparkline && (
                        <SparklineChart
                          data={sparkline.map((p) => ({ x: p.timestamp, y: p.total_players }))}
                          color={COLORS.gold}
                          height={100}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* OSRS card */}
              <motion.div variants={staggerItem}>
                <Card className="relative overflow-hidden h-full">
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, ${COLORS.osrs}, ${COLORS.osrs}80)` }}
                  />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wide font-medium text-[#888888]">
                        OSRS Players
                      </span>
                      {records && (
                        <Badge variant="osrs" className="text-[10px] gap-1">
                          {records.delta.osrs >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {records.delta.osrs >= 0 ? "+" : ""}{formatCount(records.delta.osrs)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold mb-3" style={{ color: COLORS.osrs }}>
                      {latest && latest.osrs > 0 ? formatCount(latest.osrs) : "\u2014"}
                    </div>
                    {sparkline && (
                      <SparklineChart
                        data={sparkline.map((p) => ({ x: p.timestamp, y: p.osrs }))}
                        color={COLORS.osrs}
                        height={60}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* RS3 card */}
              <motion.div variants={staggerItem}>
                <Card className="relative overflow-hidden h-full">
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, ${COLORS.rs3}, ${COLORS.rs3}80)` }}
                  />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wide font-medium text-[#888888]">
                        RS3 Players
                      </span>
                      {records && (
                        <Badge variant="rs3" className="text-[10px] gap-1">
                          {records.delta.rs3 >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {records.delta.rs3 >= 0 ? "+" : ""}{formatCount(records.delta.rs3)}
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold mb-3" style={{ color: COLORS.rs3 }}>
                      {latest && latest.rs3 > 0 ? formatCount(latest.rs3) : "\u2014"}
                    </div>
                    {sparkline && (
                      <SparklineChart
                        data={sparkline.map((p) => ({ x: p.timestamp, y: p.rs3 }))}
                        color={COLORS.rs3}
                        height={60}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Total accounts card */}
              <motion.div variants={staggerItem}>
                <Card className="relative overflow-hidden h-full">
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.green}80)` }}
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
                        <SpringCounter value={accountTotal.total} />
                      ) : (
                        "\u2014"
                      )}
                    </div>
                    <p className="text-xs text-[#666666] mt-1">All time accounts created</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Peak card */}
              <motion.div variants={staggerItem}>
                <Card className="relative overflow-hidden h-full">
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, ${COLORS.gold}, transparent)` }}
                  />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={14} className="text-[#c8a84b]" />
                      <span className="text-xs uppercase tracking-wide font-medium text-[#888888]">
                        All-Time Peak
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#c8a84b]">
                      {records ? formatCount(records.peaks.total) : "\u2014"}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
      </motion.div>

      {/* ----------------------------------------------------------------- */}
      {/* Main Chart                                                        */}
      {/* ----------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.3 }}
      >
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

            {chartStats && (
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-4">
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
      </motion.div>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom row: Status + Peaks                                        */}
      {/* ----------------------------------------------------------------- */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.4 }}
      >
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
      </motion.div>
    </div>
  );
}
