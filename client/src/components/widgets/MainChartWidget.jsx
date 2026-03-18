import React, { useEffect, useState } from "react";
import PlayerChart from "../PlayerChart";
import RangeButtons from "../RangeButtons";
import { SkeletonChart } from "../common/SkeletonLoader";
import { buildTotalData } from "../../buildTotal";

const RANGES = ["all", "1y", "6m", "30d", "7d", "24h"];

function bestRange(availability) {
  for (const range of RANGES) {
    if (availability[range]) return range;
  }
  return null;
}

export default function MainChartWidget({ onDataLoaded }) {
  const [availability, setAvailability] = useState({});
  const [selectedRange, setSelectedRange] = useState(null);
  const [loadedRange, setLoadedRange] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const availRes = await fetch("/api/availability");
        if (!availRes.ok) throw new Error("Failed to load availability");
        const avail = await availRes.json();
        setAvailability(avail);
        const range = avail["24h"] ? "24h" : bestRange(avail);
        if (range) setSelectedRange(range);
        else setError("No data available yet.");
      } catch (err) {
        setError(err.message);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedRange) return;
    let cancelled = false;

    setLoadingChart(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/history?range=${selectedRange}`);
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        if (cancelled) return;

        setChartData(data);
        setLoadedRange(selectedRange);
        if (onDataLoaded) onDataLoaded(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedRange]);

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-cinzel text-base font-semibold text-text-primary">
          Player Count History
        </h3>
      </div>

      <RangeButtons
        availability={availability}
        selected={selectedRange}
        onSelect={setSelectedRange}
      />

      <div className="mt-2">
        {error ? (
          <div className="text-center text-rs3 py-10">{error}</div>
        ) : loadingChart || loadedRange !== selectedRange ? (
          <SkeletonChart />
        ) : (
          <PlayerChart data={chartData} range={selectedRange} />
        )}
      </div>
    </div>
  );
}
