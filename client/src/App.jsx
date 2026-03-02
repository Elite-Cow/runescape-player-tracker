import React, { useEffect, useState } from "react";
import PlayerChart from "./components/PlayerChart";
import RangeButtons from "./components/RangeButtons";
import { buildTotalData } from "./buildTotal";

const RANGES = ["all", "1y", "6m", "30d", "7d", "24h"];

const styles = {
  wrapper: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 16px",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#c8a84b",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#666",
  },
  latest: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },
  stat: {
    textAlign: "center",
  },
  statLabel: {
    fontSize: "12px",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statValue: (color) => ({
    fontSize: "22px",
    fontWeight: "700",
    color,
  }),
  chartWrap: {
    background: "#1a1a1a",
    borderRadius: "8px",
    padding: "24px",
  },
  error: {
    textAlign: "center",
    color: "#e05c5c",
    padding: "40px",
  },
  loading: {
    textAlign: "center",
    color: "#666",
    padding: "40px",
  },
};

function formatCount(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// Find the largest available range from the availability map
function bestRange(availability) {
  for (const range of RANGES) {
    if (availability[range]) return range;
  }
  return null;
}

export default function App() {
  const [availability, setAvailability] = useState({});
  const [selectedRange, setSelectedRange] = useState(null);
  const [loadedRange, setLoadedRange] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [peaks, setPeaks] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState(null);

  // Load availability on mount
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

  // Fetch chart data when range changes
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
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.title}>RuneScape Player Tracker</div>
        <div style={styles.subtitle}>Live data updated every hour</div>
      </div>

      {peaks && (
        <div style={styles.latest}>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Peak Total</div>
            <div style={styles.statValue("#c8a84b")}>{formatCount(peaks.total)}</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Peak OSRS</div>
            <div style={styles.statValue("#5ba3f5")}>{formatCount(peaks.osrs)}</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Peak RS3</div>
            <div style={styles.statValue("#e05c5c")}>{formatCount(peaks.rs3)}</div>
          </div>
        </div>
      )}

      <RangeButtons
        availability={availability}
        selected={selectedRange}
        onSelect={setSelectedRange}
      />

      <div style={styles.chartWrap}>
        {error ? (
          <div style={styles.error}>{error}</div>
        ) : loadingChart || loadedRange !== selectedRange ? (
          <div style={styles.loading}>Loading...</div>
        ) : (
          <PlayerChart data={chartData} range={selectedRange} />
        )}
      </div>
    </div>
  );
}
