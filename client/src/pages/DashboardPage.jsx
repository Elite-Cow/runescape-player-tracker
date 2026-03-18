import React, { useEffect, useState, useCallback } from "react";
import { Users } from "lucide-react";
import LiveStatCard from "../components/widgets/LiveStatCard";
import StatusIndicator from "../components/widgets/StatusIndicator";
import MainChartWidget from "../components/widgets/MainChartWidget";
import StatsPanel from "../components/widgets/StatsPanel";
import { SkeletonCard } from "../components/common/SkeletonLoader";

function AnimatedCounter({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!value) return;
    const duration = 1500;
    const start = display;
    const diff = value - start;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const pct = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setDisplay(Math.round(start + diff * eased));
      if (pct < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}

export default function DashboardPage() {
  const [latest, setLatest] = useState(null);
  const [sparkline, setSparkline] = useState(null);
  const [records, setRecords] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [accountTotal, setAccountTotal] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const totalSparkline = sparkline?.map((d) => ({
    x: new Date(d.timestamp),
    y: d.total_players,
  }));
  const osrsSparkline = sparkline?.map((d) => ({
    x: new Date(d.timestamp),
    y: d.osrs,
  }));
  const rs3Sparkline = sparkline?.map((d) => ({
    x: new Date(d.timestamp),
    y: d.rs3,
  }));

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Hero header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">
          Real-time RuneScape player count monitoring
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
      </div>

      {error && (
        <div className="text-center text-rs3 py-4 mb-4">{error}</div>
      )}

      {/* Row 1: Live stat cards + accounts counter */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <LiveStatCard
              label="Total Players"
              value={latest?.total_players}
              sparklineData={totalSparkline}
              delta={records?.delta?.total ?? 0}
              color="#c8a84b"
              index={0}
            />
            <LiveStatCard
              label="OSRS Players"
              value={latest?.osrs}
              sparklineData={osrsSparkline}
              delta={records?.delta?.osrs ?? 0}
              color="#5ba3f5"
              index={1}
            />
            <LiveStatCard
              label="RS3 Players"
              value={latest?.rs3}
              sparklineData={rs3Sparkline}
              delta={records?.delta?.rs3 ?? 0}
              color="#e05c5c"
              index={2}
            />
            {/* Total RS accounts widget */}
            <div className="relative overflow-hidden rounded-lg p-5 flex flex-col justify-center bg-gradient-to-br from-[#1e1e1e] to-bg-card shadow-md animate-fade-in-up stagger-4">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green to-green/50" />
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-green" />
                <span className="text-xs text-text-muted uppercase tracking-wide font-medium">
                  Total RS Accounts
                </span>
              </div>
              <div className="text-2xl font-bold text-green" style={{ animation: "countUp 0.5s ease-out both" }}>
                {accountTotal?.total ? <AnimatedCounter value={accountTotal.total} /> : "\u2014"}
              </div>
              <div className="text-xs text-text-dim mt-1">All time accounts created</div>
            </div>
          </>
        )}
      </div>

      {/* Row 2: Main chart (full width) */}
      <div className="mb-4 animate-fade-in-up stagger-5">
        <MainChartWidget onDataLoaded={setChartData} />
      </div>

      {/* Row 3: Stats panel + status indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up stagger-6">
        <div className="md:col-span-2">
          <StatsPanel chartData={chartData} />
        </div>
        <StatusIndicator timestamp={latest?.timestamp} />
      </div>
    </div>
  );
}
