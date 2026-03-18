import React, { useState } from "react";
import { GitCompareArrows, Search } from "lucide-react";
import ComparisonBar from "../components/comparison/ComparisonBar";
import ComparisonTable from "../components/comparison/ComparisonTable";
import PlayerAvatar from "../components/player/PlayerAvatar";
import LoadingSpinner from "../components/common/LoadingSpinner";

function formatXp(xp) {
  if (xp >= 1_000_000_000) return (xp / 1_000_000_000).toFixed(2) + "B";
  if (xp >= 1_000_000) return (xp / 1_000_000).toFixed(1) + "M";
  if (xp >= 1_000) return (xp / 1_000).toFixed(1) + "K";
  return String(xp);
}

export default function ComparisonPage() {
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [game, setGame] = useState("osrs");
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCompare(e) {
    e.preventDefault();
    if (!nameA.trim() || !nameB.trim()) return;

    setLoading(true);
    setError(null);
    setDataA(null);
    setDataB(null);

    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/hiscores/${game}/${encodeURIComponent(nameA.trim())}`),
        fetch(`/api/hiscores/${game}/${encodeURIComponent(nameB.trim())}`),
      ]);

      if (resA.status === 404) { setError(`Player "${nameA}" not found.`); return; }
      if (resB.status === 404) { setError(`Player "${nameB}" not found.`); return; }
      if (!resA.ok || !resB.ok) throw new Error("Failed to fetch hiscores");

      setDataA(await resA.json());
      setDataB(await resB.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">Player Comparison</h1>
        <p className="text-sm text-text-muted mt-1">
          Compare two players side-by-side
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
      </div>

      <form onSubmit={handleCompare} className="glass rounded-lg p-4 mb-6 animate-fade-in-up stagger-1">
        <div className="flex rounded-full overflow-hidden border border-border shrink-0 mb-3 w-fit">
          {["osrs", "rs3"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGame(g)}
              className={`
                px-5 py-2 text-sm font-semibold transition-all duration-200
                ${game === g
                  ? g === "osrs" ? "text-white" : "text-bg-dark"
                  : "bg-transparent text-text-muted hover:text-text-primary"
                }
              `}
              style={game === g ? {
                background: g === "osrs"
                  ? "linear-gradient(135deg, #5ba3f5, #7bb8ff)"
                  : "linear-gradient(135deg, #c8a84b, #e8c86b)",
              } : undefined}
            >
              {g.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={nameA}
              onChange={(e) => setNameA(e.target.value)}
              placeholder="Player 1..."
              maxLength={12}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-bg-card border border-border text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-osrs/50 transition-all"
            />
          </div>

          <div className="text-text-dim text-xs font-bold">VS</div>

          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={nameB}
              onChange={(e) => setNameB(e.target.value)}
              placeholder="Player 2..."
              maxLength={12}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-bg-card border border-border text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-rs3/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!nameA.trim() || !nameB.trim() || loading}
            className="px-5 py-2 rounded-md text-sm font-semibold text-bg-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg shrink-0"
            style={{ background: "linear-gradient(135deg, #c8a84b, #e8c86b)" }}
          >
            Compare
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-rs3/10 border border-rs3/30 rounded-lg p-4 text-rs3 text-sm mb-6 animate-fade-in">
          {error}
        </div>
      )}

      {loading && <LoadingSpinner className="py-16" />}

      {dataA && dataB && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { data: dataA, color: "osrs", borderColor: "border-osrs/30" },
              { data: dataB, color: "rs3", borderColor: "border-rs3/30" },
            ].map(({ data, color, borderColor }) => (
              <div key={data.player} className={`bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-4 shadow-md border-t-2 ${borderColor} flex items-center gap-4`}>
                {game === "rs3" && <PlayerAvatar name={data.player} size={48} />}
                <div>
                  <div className={`font-cinzel font-bold text-${color}`}>{data.player}</div>
                  <div className="text-xs text-text-muted">
                    Combat {data.combatLevel} | Total {data.overall?.level ?? "?"} | {data.overall ? formatXp(data.overall.xp) : "?"} XP
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary bars */}
          <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-5 shadow-md">
            <h3 className="font-cinzel text-base font-semibold text-text-primary mb-4">Overview</h3>
            <ComparisonBar label="Combat Level" valueA={dataA.combatLevel} valueB={dataB.combatLevel} nameA={dataA.player} nameB={dataB.player} />
            <ComparisonBar label="Total Level" valueA={dataA.overall?.level || 0} valueB={dataB.overall?.level || 0} nameA={dataA.player} nameB={dataB.player} />
            <ComparisonBar label="Total XP" valueA={dataA.overall?.xp || 0} valueB={dataB.overall?.xp || 0} nameA={dataA.player} nameB={dataB.player} />
          </div>

          {/* Full skill comparison */}
          <ComparisonTable
            skillsA={dataA.skills}
            skillsB={dataB.skills}
            nameA={dataA.player}
            nameB={dataB.player}
            game={game}
          />
        </div>
      )}

      {!dataA && !loading && !error && (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/5 mb-4">
            <GitCompareArrows size={32} className="text-gold/40" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
          </div>
          <p className="text-lg text-text-muted mb-2">Enter two player names to compare</p>
          <p className="text-sm text-text-dim">See who has the edge in each skill</p>
        </div>
      )}
    </div>
  );
}
