import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

function formatNumber(n) {
  if (n == null || n < 0) return "\u2014";
  return n.toLocaleString();
}

export default function SkillsTable({ skills, game }) {
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    if (!skills) return [];
    return [...skills].sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (sortField === "name") {
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      av = av ?? -1;
      bv = bv ?? -1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [skills, sortField, sortDir]);

  const columns = [
    { key: "name", label: "Skill", align: "text-left" },
    { key: "level", label: "Level", align: "text-right" },
    { key: "xp", label: "XP", align: "text-right" },
    { key: "rank", label: "Rank", align: "text-right" },
  ];

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  };

  return (
    <div className="bg-bg-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map(({ key, label, align }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`
                    px-4 py-3 font-medium text-text-muted text-xs uppercase tracking-wide
                    cursor-pointer hover:text-text-primary transition-colors select-none
                    ${align}
                  `}
                >
                  {label}
                  <SortIcon field={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((skill) => (
              <tr
                key={skill.name}
                className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-2.5 font-medium text-text-primary">
                  {skill.name}
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold ${
                  skill.level >= 99
                    ? game === "osrs" ? "text-osrs" : "text-gold"
                    : "text-text-secondary"
                }`}>
                  {skill.level}
                </td>
                <td className="px-4 py-2.5 text-right text-text-secondary">
                  {formatNumber(skill.xp)}
                </td>
                <td className="px-4 py-2.5 text-right text-text-muted">
                  {formatNumber(skill.rank)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
