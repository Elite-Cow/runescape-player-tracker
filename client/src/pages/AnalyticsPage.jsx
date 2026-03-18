import React, { useEffect, useState } from "react";
import AreaChart from "../components/charts/AreaChart";
import ComparisonBarChart from "../components/charts/ComparisonBarChart";
import RangeButtons from "../components/RangeButtons";

const RANGES = ["all", "1y", "6m", "30d", "7d", "24h"];

function bestRange(availability) {
  for (const range of RANGES) {
    if (availability[range]) return range;
  }
  return null;
}

export default function AnalyticsPage() {
  const [availability, setAvailability] = useState({});
  const [selectedRange, setSelectedRange] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/availability");
        if (!res.ok) throw new Error("Failed to load availability");
        const avail = await res.json();
        setAvailability(avail);
        const range = avail["7d"] ? "7d" : bestRange(avail);
        if (range) setSelectedRange(range);
      } catch (err) {
        setError(err.message);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedRange) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [historyRes, barRes] = await Promise.all([
          fetch(`/api/history?range=${selectedRange}`),
          fetch("/api/records/history?days=7"),
        ]);

        if (!cancelled) {
          if (historyRes.ok) setChartData(await historyRes.json());
          if (barRes.ok) setBarData(await barRes.json());
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedRange]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gold">Analytics</h1>
        <p className="text-sm text-text-muted mt-1">
          In-depth player count visualizations and comparisons
        </p>
      </div>

      {error && <div className="text-center text-rs3 py-4 mb-4">{error}</div>}

      <RangeButtons
        availability={availability}
        selected={selectedRange}
        onSelect={setSelectedRange}
      />

      {loading ? (
        <div className="text-center text-text-muted py-16">Loading analytics...</div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Area chart */}
          <div className="bg-bg-card rounded-lg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Player Count Area Chart
            </h3>
            {chartData ? (
              <AreaChart data={chartData} range={selectedRange} />
            ) : (
              <div className="text-center text-text-muted py-10">No data</div>
            )}
          </div>

          {/* Comparison bar chart */}
          <div className="bg-bg-card rounded-lg p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              OSRS vs RS3 — Daily Average (Last 7 Days)
            </h3>
            {barData && barData.length > 0 ? (
              <ComparisonBarChart data={barData} />
            ) : (
              <div className="text-center text-text-muted py-10">
                Not enough data for comparison
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
