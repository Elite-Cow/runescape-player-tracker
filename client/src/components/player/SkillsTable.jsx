import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { getSkillIconUrl, getSkillColor } from "../../lib/skillIcons";

function formatNumber(n) {
  if (n == null || n < 0) return "\u2014";
  return n.toLocaleString();
}

export default function SkillsTable({ skills, game }) {
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [failedIcons, setFailedIcons] = useState(new Set());

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
      <ChevronUp size={14} className="inline ml-1 text-gold" />
    ) : (
      <ChevronDown size={14} className="inline ml-1 text-gold" />
    );
  };

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-black/30">
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
            {sorted.map((skill, i) => {
              const iconUrl = getSkillIconUrl(skill.name, game);
              const skillColor = getSkillColor(skill.name);
              const is99 = skill.level >= 99;
              return (
                <tr
                  key={skill.name}
                  className={`
                    border-b border-border/50 hover:bg-white/[0.06] transition-colors
                    ${i % 2 === 1 ? "bg-white/[0.01]" : ""}
                  `}
                >
                  <td className="px-4 py-2.5 font-medium text-text-primary">
                    <div className="flex items-center gap-2.5">
                      {iconUrl && !failedIcons.has(skill.name) ? (
                        <img
                          src={iconUrl}
                          alt={skill.name}
                          width={18}
                          height={18}
                          className="shrink-0"
                          loading="lazy"
                          onError={() => setFailedIcons((s) => new Set(s).add(skill.name))}
                        />
                      ) : (
                        <span
                          className="w-[18px] h-[18px] rounded-full shrink-0"
                          style={{ backgroundColor: skillColor }}
                        />
                      )}
                      {skill.name}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {is99 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gold/15 text-gold">
                        {skill.level}
                      </span>
                    ) : (
                      <span className="font-semibold text-text-secondary">{skill.level}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">
                    {formatNumber(skill.xp)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-muted">
                    {formatNumber(skill.rank)}
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
