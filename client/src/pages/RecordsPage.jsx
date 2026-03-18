import React, { useEffect, useState } from "react";
import HistoricalHighLow from "../components/records/HistoricalHighLow";
import RecordsTable from "../components/records/RecordsTable";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function RecordsPage() {
  const [allTime, setAllTime] = useState(null);
  const [history, setHistory] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [allTimeRes, historyRes] = await Promise.all([
          fetch("/api/records/all-time"),
          fetch(`/api/records/history?days=${days}`),
        ]);
        if (allTimeRes.ok) setAllTime(await allTimeRes.json());
        if (historyRes.ok) setHistory(await historyRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  const DAY_OPTIONS = [7, 30, 90, 365];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">Records</h1>
        <p className="text-sm text-text-muted mt-1">
          Historical player count peaks, lows, and daily records
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
      </div>

      {error && (
        <div className="text-center text-rs3 py-4 mb-4">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="flex flex-col gap-6">
          <HistoricalHighLow data={allTime} />

          <div className="animate-fade-in-up stagger-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <h3 className="font-cinzel text-base font-semibold text-text-primary">Daily Records</h3>
              <div className="flex gap-2">
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                      ${days === d
                        ? "text-bg-dark font-bold"
                        : "bg-bg-card text-text-muted hover:text-text-primary hover:-translate-y-0.5"
                      }
                    `}
                    style={days === d ? {
                      background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
                      boxShadow: "0 0 12px rgba(200,168,75,0.2)",
                    } : undefined}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <RecordsTable data={history} />
          </div>
        </div>
      )}
    </div>
  );
}
