import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowDown, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCount, COLORS } from "../lib/chart-utils";
import type { RecordEntry, DailyRecord } from "../types/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AllTimeRecords {
  peaks: { total: RecordEntry; osrs: RecordEntry; rs3: RecordEntry };
  lows: { total: RecordEntry; osrs: RecordEntry; rs3: RecordEntry };
}

type SortField = "date" | "peakTotal" | "lowTotal" | "avgTotal" | "peakOsrs" | "lowOsrs";
type SortDir = "asc" | "desc";

const DAY_OPTIONS = [7, 30, 90, 365] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

const PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: string | undefined): string {
  if (!ts) return "\u2014";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(ts: string | undefined): string {
  if (!ts) return "\u2014";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function safeFormat(n: number | undefined | null): string {
  if (n == null) return "\u2014";
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Record Card
// ---------------------------------------------------------------------------

interface RecordCardProps {
  label: string;
  isPeak: boolean;
  value: number | undefined;
  timestamp: string | undefined;
  variant: "default" | "osrs" | "rs3";
}

function RecordCard({ label, isPeak, value, timestamp, variant }: RecordCardProps) {
  const Icon = isPeak ? Trophy : ArrowDown;

  const colorMap: Record<string, string> = {
    default: `text-[${COLORS.gold}]`,
    osrs: `text-[${COLORS.osrs}]`,
    rs3: `text-[${COLORS.rs3}]`,
  };

  // Use explicit Tailwind classes that the JIT compiler can detect
  const valueColorClass =
    variant === "osrs"
      ? "text-[#5ba3f5]"
      : variant === "rs3"
        ? "text-[#e05c5c]"
        : "text-[#c8a84b]";

  return (
    <Card className="hover:-translate-y-1 transition-all duration-300 border-l-2 border-l-current">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon
            size={15}
            className={isPeak ? "text-[#1bb37c]" : "text-[#e05c5c]"}
          />
          <Badge variant={isPeak ? "success" : "rs3"}>
            {isPeak ? "Peak" : "Low"}
          </Badge>
          <span className="text-xs text-[#888888] uppercase tracking-wide font-medium">
            {label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-xl font-bold ${valueColorClass} mb-1`}>
          {value != null ? formatCount(value) : "\u2014"}
        </div>
        <div className="text-xs text-[#666666]">{formatTimestamp(timestamp)}</div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sort Icon
// ---------------------------------------------------------------------------

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return null;
  return sortDir === "asc" ? (
    <ChevronUp size={14} className="inline ml-0.5 text-[#c8a84b]" />
  ) : (
    <ChevronDown size={14} className="inline ml-0.5 text-[#c8a84b]" />
  );
}

// ---------------------------------------------------------------------------
// Records Page
// ---------------------------------------------------------------------------

export default function RecordsPage() {
  const [allTime, setAllTime] = useState<AllTimeRecords | null>(null);
  const [history, setHistory] = useState<DailyRecord[] | null>(null);
  const [days, setDays] = useState<DayOption>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table sort state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const abortRef = useRef<AbortController | null>(null);

  // Fetch data
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [allTimeRes, historyRes] = await Promise.all([
          fetch("/api/records/all-time", { signal: controller.signal }),
          fetch(`/api/records/history?days=${days}`, { signal: controller.signal }),
        ]);

        if (controller.signal.aborted) return;

        if (!allTimeRes.ok) throw new Error("Failed to load all-time records");
        if (!historyRes.ok) throw new Error("Failed to load daily records");

        const allTimeData: AllTimeRecords = await allTimeRes.json();
        const historyData: DailyRecord[] = await historyRes.json();

        if (controller.signal.aborted) return;

        setAllTime(allTimeData);
        setHistory(historyData);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [days]);

  // Reset page when sort or days change
  useEffect(() => {
    setPage(1);
  }, [sortField, sortDir, days]);

  // Sort handler
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField],
  );

  // Sorted and paginated data
  const sorted = useMemo(() => {
    if (!history) return [];
    return [...history].sort((a, b) => {
      const av = sortField === "date" ? new Date(a.date).getTime() : (a[sortField] ?? 0);
      const bv = sortField === "date" ? new Date(b.date).getTime() : (b[sortField] ?? 0);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [history, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // All-time record card definitions
  const recordCards: RecordCardProps[] = allTime
    ? [
        { label: "Total", isPeak: true, value: allTime.peaks.total?.total_players, timestamp: allTime.peaks.total?.timestamp, variant: "default" },
        { label: "OSRS", isPeak: true, value: allTime.peaks.osrs?.osrs, timestamp: allTime.peaks.osrs?.timestamp, variant: "osrs" },
        { label: "RS3", isPeak: true, value: allTime.peaks.rs3?.rs3, timestamp: allTime.peaks.rs3?.timestamp, variant: "rs3" },
        { label: "Total", isPeak: false, value: allTime.lows.total?.total_players, timestamp: allTime.lows.total?.timestamp, variant: "default" },
        { label: "OSRS", isPeak: false, value: allTime.lows.osrs?.osrs, timestamp: allTime.lows.osrs?.timestamp, variant: "osrs" },
        { label: "RS3", isPeak: false, value: allTime.lows.rs3?.rs3, timestamp: allTime.lows.rs3?.timestamp, variant: "rs3" },
      ]
    : [];

  // Table columns
  const columns: { key: SortField; label: string }[] = [
    { key: "date", label: "Date" },
    { key: "peakTotal", label: "Peak Total" },
    { key: "lowTotal", label: "Low Total" },
    { key: "avgTotal", label: "Avg Total" },
    { key: "peakOsrs", label: "Peak OSRS" },
    { key: "lowOsrs", label: "Low OSRS" },
  ];

  return (
    <div className="py-6">
      {/* Page header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">Records</h1>
        <p className="text-sm text-[#666666] mt-1">
          Historical player count peaks, lows, and daily records
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </motion.div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-[#e05c5c]/10 border border-[#e05c5c]/30 rounded-lg p-4 text-[#e05c5c] text-sm mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          {/* Skeleton for all-time cards */}
          <div>
            <Skeleton className="h-5 w-40 mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          </div>
          {/* Skeleton for table */}
          <Skeleton className="h-64 rounded-xl" />
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* All-Time Records */}
          {allTime && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            >
              <h3 className="font-cinzel text-base font-semibold text-[#e0e0e0] mb-3">
                All-Time Records
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {recordCards.map((card, i) => (
                  <motion.div
                    key={`${card.label}-${card.isPeak}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      delay: 0.15 + i * 0.05,
                    }}
                  >
                    <RecordCard {...card} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Daily Records */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <h3 className="font-cinzel text-base font-semibold text-[#e0e0e0]">
                Daily Records
              </h3>
              <div className="flex gap-2">
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer
                      ${
                        days === d
                          ? "text-[#080d1f] font-bold"
                          : "bg-[#0f1535] text-[#666666] hover:text-[#e0e0e0] hover:-translate-y-0.5"
                      }
                    `}
                    style={
                      days === d
                        ? {
                            background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
                            boxShadow: "0 0 12px rgba(200,168,75,0.2)",
                          }
                        : undefined
                    }
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/30">
                      {columns.map(({ key, label }) => (
                        <TableHead
                          key={key}
                          onClick={() => handleSort(key)}
                          className={`cursor-pointer select-none hover:text-[#e0e0e0] transition-colors ${
                            key !== "date" ? "text-right" : ""
                          }`}
                        >
                          {label}
                          <SortIcon field={key} sortField={sortField} sortDir={sortDir} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="text-center py-8 text-[#666666]">
                          No records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageData.map((row) => (
                        <TableRow key={row.date}>
                          <TableCell className="font-medium">
                            {formatDate(row.date)}
                          </TableCell>
                          <TableCell className="text-right text-[#c8a84b] font-semibold bg-[#c8a84b]/5">
                            {safeFormat(row.peakTotal)}
                          </TableCell>
                          <TableCell className="text-right text-[#e05c5c] bg-[#e05c5c]/5">
                            {safeFormat(row.lowTotal)}
                          </TableCell>
                          <TableCell className="text-right text-[#888888]">
                            {safeFormat(row.avgTotal)}
                          </TableCell>
                          <TableCell className="text-right text-[#5ba3f5] bg-[#5ba3f5]/5">
                            {safeFormat(row.peakOsrs)}
                          </TableCell>
                          <TableCell className="text-right text-[#888888]">
                            {safeFormat(row.lowOsrs)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 p-4 border-t border-[#1a2048]">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-[#e0e0e0] hover:bg-[#1a2048]/50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-[#888888]">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-[#e0e0e0] hover:bg-[#1a2048]/50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
