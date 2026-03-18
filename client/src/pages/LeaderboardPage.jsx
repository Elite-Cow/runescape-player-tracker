import React, { useState, useEffect } from "react";
import { Crown } from "lucide-react";
import SkillSelector from "../components/leaderboard/SkillSelector";
import LeaderboardTable from "../components/leaderboard/LeaderboardTable";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function LeaderboardPage() {
  const [game, setGame] = useState("osrs");
  const [skillIndex, setSkillIndex] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/hiscores/ranking/${game}?table=${skillIndex}&size=50`);
        if (!res.ok) throw new Error("Failed to load rankings");
        const json = await res.json();
        if (cancelled) return;
        setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [game, skillIndex]);

  // Parse ranking data — different API formats
  const entries = React.useMemo(() => {
    if (!data) return [];
    // Try various response formats
    if (Array.isArray(data)) return data;
    if (data.rankings) return data.rankings;
    if (data.content) return data.content;
    return [];
  }, [data]);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">Leaderboard</h1>
        <p className="text-sm text-text-muted mt-1">
          Top 50 players by skill
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
      </div>

      {/* Game toggle */}
      <div className="flex rounded-full overflow-hidden border border-border w-fit mb-4 animate-fade-in-up stagger-1">
        {["osrs", "rs3"].map((g) => (
          <button
            key={g}
            onClick={() => { setGame(g); setSkillIndex(0); }}
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

      {/* Skill selector */}
      <div className="mb-6 animate-fade-in-up stagger-2">
        <SkillSelector game={game} selected={skillIndex} onSelect={setSkillIndex} />
      </div>

      {error && (
        <div className="bg-rs3/10 border border-rs3/30 rounded-lg p-4 text-rs3 text-sm mb-6">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : entries.length > 0 ? (
        <div className="animate-fade-in-up stagger-3">
          <LeaderboardTable data={entries} game={game} />
        </div>
      ) : !error ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/5 mb-4">
            <Crown size={32} className="text-gold/40" />
          </div>
          <p className="text-lg text-text-muted">No ranking data available</p>
          <p className="text-sm text-text-dim mt-1">The ranking API may not be available for this skill</p>
        </div>
      ) : null}
    </div>
  );
}
