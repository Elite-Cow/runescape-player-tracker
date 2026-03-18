import React from "react";
import { Trophy } from "lucide-react";

function formatNumber(n) {
  if (n == null) return "\u2014";
  return n.toLocaleString();
}

const MEDAL_COLORS = {
  1: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  2: { bg: "bg-gray-300/10", text: "text-gray-300", border: "border-gray-300/20" },
  3: { bg: "bg-amber-600/15", text: "text-amber-500", border: "border-amber-600/20" },
};

export default function LeaderboardTable({ data, game }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-text-muted py-12">No ranking data available.</div>;
  }

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/30">
              <th className="px-4 py-3 text-left text-xs text-text-muted uppercase font-medium w-16">Rank</th>
              <th className="px-4 py-3 text-left text-xs text-text-muted uppercase font-medium">Player</th>
              <th className="px-4 py-3 text-right text-xs text-text-muted uppercase font-medium">Level</th>
              <th className="px-4 py-3 text-right text-xs text-text-muted uppercase font-medium">XP</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, i) => {
              const rank = entry.rank || i + 1;
              const medal = MEDAL_COLORS[rank];
              return (
                <tr
                  key={`${entry.name}-${rank}`}
                  className={`
                    border-b border-border/30 hover:bg-white/[0.04] transition-colors
                    ${i % 2 === 1 ? "bg-white/[0.01]" : ""}
                    ${medal ? `${medal.bg}` : ""}
                  `}
                >
                  <td className="px-4 py-2.5">
                    {medal ? (
                      <span className={`inline-flex items-center gap-1 text-sm font-bold ${medal.text}`}>
                        <Trophy size={14} />
                        {rank}
                      </span>
                    ) : (
                      <span className="text-text-muted text-sm">#{rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">
                    {entry.name || "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gold">
                    {entry.level ?? "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">
                    {formatNumber(entry.xp)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
