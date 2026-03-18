import React from "react";
import { getSkillIconUrl } from "../../lib/skillIcons";

export default function ComparisonTable({ skillsA, skillsB, nameA, nameB, game }) {
  if (!skillsA?.length || !skillsB?.length) return null;

  // Match skills by name
  const skillMap = {};
  skillsA.forEach((s) => { skillMap[s.name] = { ...skillMap[s.name], a: s }; });
  skillsB.forEach((s) => { skillMap[s.name] = { ...skillMap[s.name], b: s }; });

  const rows = Object.entries(skillMap)
    .filter(([_, v]) => v.a && v.b)
    .map(([name, { a, b }]) => ({
      name,
      levelA: a.level,
      levelB: b.level,
      xpA: a.xp || 0,
      xpB: b.xp || 0,
      winner: a.xp > b.xp ? "a" : b.xp > a.xp ? "b" : null,
    }));

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/30">
              <th className="px-4 py-3 text-left text-xs text-text-muted uppercase font-medium">Skill</th>
              <th className="px-3 py-3 text-right text-xs uppercase font-medium text-osrs">{nameA}</th>
              <th className="px-3 py-3 text-center text-xs text-text-dim">vs</th>
              <th className="px-3 py-3 text-left text-xs uppercase font-medium text-rs3">{nameB}</th>
              <th className="px-4 py-3 text-right text-xs text-text-muted uppercase font-medium">Bar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const totalXp = row.xpA + row.xpB;
              const pctA = totalXp > 0 ? (row.xpA / totalXp) * 100 : 50;
              const icon = getSkillIconUrl(row.name, game);

              return (
                <tr
                  key={row.name}
                  className={`
                    border-b border-border/30 hover:bg-white/[0.04] transition-colors
                    ${i % 2 === 1 ? "bg-white/[0.01]" : ""}
                  `}
                >
                  <td className="px-4 py-2 font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                      {icon && <img src={icon} alt="" width={16} height={16} className="shrink-0" loading="lazy" />}
                      {row.name}
                    </div>
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${row.winner === "a" ? "text-green" : "text-text-secondary"}`}>
                    {row.levelA}
                  </td>
                  <td className="px-3 py-2 text-center text-text-dim text-xs">vs</td>
                  <td className={`px-3 py-2 text-left font-semibold ${row.winner === "b" ? "text-green" : "text-text-secondary"}`}>
                    {row.levelB}
                  </td>
                  <td className="px-4 py-2">
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden flex w-full min-w-[80px]">
                      <div className="h-full rounded-l-full" style={{ width: `${pctA}%`, backgroundColor: "#5ba3f5" }} />
                      <div className="h-full rounded-r-full" style={{ width: `${100 - pctA}%`, backgroundColor: "#e05c5c" }} />
                    </div>
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
