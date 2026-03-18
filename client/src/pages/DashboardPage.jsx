import React, { useEffect, useState, useCallback } from "react";
import LiveStatCard from "../components/widgets/LiveStatCard";
import StatusIndicator from "../components/widgets/StatusIndicator";
import MainChartWidget from "../components/widgets/MainChartWidget";
import StatsPanel from "../components/widgets/StatsPanel";

export default function DashboardPage() {
  const [latest, setLatest] = useState(null);
  const [sparkline, setSparkline] = useState(null);
  const [records, setRecords] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [latestRes, sparklineRes, recordsRes] = await Promise.all([
        fetch("/api/latest"),
        fetch("/api/sparkline"),
        fetch("/api/records"),
      ]);

      if (latestRes.ok) setLatest(await latestRes.json());
      if (sparklineRes.ok) setSparkline(await sparklineRes.json());
      if (recordsRes.ok) setRecords(await recordsRes.json());
    } catch (err) {
      setError(err.message);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gold">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">
          Real-time RuneScape player count monitoring
        </p>
      </div>

      {error && (
        <div className="text-center text-rs3 py-4 mb-4">{error}</div>
      )}

      {/* Row 1: Live stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        <LiveStatCard
          label="Total Players"
          value={latest?.total_players}
          sparklineData={totalSparkline}
          delta={records?.delta?.total ?? 0}
          color="#c8a84b"
        />
        <LiveStatCard
          label="OSRS Players"
          value={latest?.osrs}
          sparklineData={osrsSparkline}
          delta={records?.delta?.osrs ?? 0}
          color="#5ba3f5"
        />
        <LiveStatCard
          label="RS3 Players"
          value={latest?.rs3}
          sparklineData={rs3Sparkline}
          delta={records?.delta?.rs3 ?? 0}
          color="#e05c5c"
        />
      </div>

      {/* Row 2: Main chart (full width) */}
      <div className="mb-4">
        <MainChartWidget onDataLoaded={setChartData} />
      </div>

      {/* Row 3: Stats panel + status indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <StatsPanel chartData={chartData} />
        </div>
        <StatusIndicator timestamp={latest?.timestamp} />
      </div>
    </div>
  );
}
