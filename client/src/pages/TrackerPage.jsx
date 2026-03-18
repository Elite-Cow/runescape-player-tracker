import React, { useEffect, useState } from "react";
import PlayerChart from "../components/PlayerChart";
import RangeButtons from "../components/RangeButtons";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { buildTotalData } from "../buildTotal";

const RANGES = ["all", "1y", "6m", "30d", "7d", "24h"];

function formatCount(n) {
  if (n == null) return "\u2014";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function bestRange(availability) {
  for (const range of RANGES) {
    if (availability[range]) return range;
  }
  return null;
}

const PEAK_CONFIG = [
  { key: "total", label: "Peak Total", color: "text-gold", borderColor: "border-gold/30" },
  { key: "osrs", label: "Peak OSRS", color: "text-osrs", borderColor: "border-osrs/30" },
  { key: "rs3", label: "Peak RS3", color: "text-rs3", borderColor: "border-rs3/30" },
];

export default function TrackerPage() {
  const [availability, setAvailability] = useState({});
  const [selectedRange, setSelectedRange] = useState(null);
  const [loadedRange, setLoadedRange] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [peaks, setPeaks] = useState(null);
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
        else setError("No data available yet. Check back soon.");
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
        const osrsPoints  = data.osrs ?? [];
        const rs3Points   = data.rs3  ?? [];
        const totalPoints = buildTotalData(osrsPoints, rs3Points);
        setPeaks({
          total: totalPoints.length ? Math.max(...totalPoints.map((d) => d.y)) : 0,
          osrs:  osrsPoints.length  ? Math.max(...osrsPoints.map((d) => d.osrs)) : 0,
          rs3:   rs3Points.length   ? Math.max(...rs3Points.map((d) => d.rs3))  : 0,
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedRange]);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <div className="text-center mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-[28px] font-bold gradient-text-gold mb-1.5">
          RuneScape Player Tracker
        </h1>
        <p className="text-[13px] text-text-muted">
          Live data updated every hour
        </p>
        <div className="mt-3 mx-auto w-32 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>

      {peaks && (
        <div className="flex justify-center gap-4 mb-7 flex-wrap animate-fade-in-up stagger-2">
          {PEAK_CONFIG.map(({ key, label, color, borderColor }) => (
            <div
              key={key}
              className={`text-center bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg px-5 py-3 shadow-md border-l-2 ${borderColor}`}
            >
              <div className="text-xs text-text-muted uppercase tracking-wide">{label}</div>
              <div className={`text-[22px] font-bold ${color}`}>{formatCount(peaks[key])}</div>
            </div>
          ))}
        </div>
      )}

      <RangeButtons
        availability={availability}
        selected={selectedRange}
        onSelect={setSelectedRange}
      />

      <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-6 shadow-lg animate-fade-in-up stagger-3">
        {error ? (
          <div className="text-center text-rs3 py-10">{error}</div>
        ) : loadingChart || loadedRange !== selectedRange ? (
          <LoadingSpinner className="py-16" />
        ) : (
          <PlayerChart data={chartData} range={selectedRange} />
        )}
      </div>
    </div>
  );
}
