import React, { useEffect, useState } from "react";
import PlayerChart from "./components/PlayerChart";
import RangeButtons from "./components/RangeButtons";

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
  const [chartData, setChartData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState(null);

  // Load availability + latest on mount
  useEffect(() => {
    async function init() {
      try {
        const [availRes, latestRes] = await Promise.all([
          fetch("/api/availability"),
          fetch("/api/latest"),
        ]);

        if (!availRes.ok) throw new Error("Failed to load availability");
        const avail = await availRes.json();
        setAvailability(avail);

        if (latestRes.ok) {
          setLatest(await latestRes.json());
        }

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

    async function loadHistory() {
      setLoadingChart(true);
      setError(null);
      try {
        const res = await fetch(`/api/history?range=${selectedRange}`);
        if (!res.ok) throw new Error("Failed to load history");
        setChartData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingChart(false);
      }
    }
    loadHistory();
  }, [selectedRange]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.title}>RuneScape Player Tracker</div>
        <div style={styles.subtitle}>Live data updated every 5 minutes</div>
      </div>

      {latest && (
        <div style={styles.latest}>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Total</div>
            <div style={styles.statValue("#c8a84b")}>{formatCount(latest.total_players)}</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>OSRS</div>
            <div style={styles.statValue("#5ba3f5")}>{formatCount(latest.osrs)}</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>RS3</div>
            <div style={styles.statValue("#e05c5c")}>{formatCount(latest.rs3)}</div>
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
        ) : loadingChart ? (
          <div style={styles.loading}>Loading...</div>
        ) : (
          <PlayerChart data={chartData} range={selectedRange} />
        )}
      </div>
    </div>
  );
}
