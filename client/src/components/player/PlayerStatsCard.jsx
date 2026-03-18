import React from "react";
import { User, Shield, Swords, Star } from "lucide-react";

function formatXp(xp) {
  if (xp >= 1_000_000_000) return (xp / 1_000_000_000).toFixed(2) + "B";
  if (xp >= 1_000_000) return (xp / 1_000_000).toFixed(1) + "M";
  if (xp >= 1_000) return (xp / 1_000).toFixed(1) + "K";
  return String(xp);
}

const STAT_CONFIG = [
  { icon: User, label: "Player", getVal: (d) => d.player, color: "text-text-primary", iconBg: "bg-white/5", iconColor: "text-text-muted" },
  { icon: Shield, label: "Combat Level", getVal: (d) => d.combatLevel, colorFn: (d) => d.game === "osrs" ? "text-osrs" : "text-gold", iconBg: "bg-osrs/10", iconColor: "text-osrs" },
  { icon: Star, label: "Total Level", getVal: (d) => d.overall?.level ?? "\u2014", color: "text-green", iconBg: "bg-green/10", iconColor: "text-green" },
  { icon: Swords, label: "Total XP", getVal: (d) => d.overall ? formatXp(d.overall.xp) : "\u2014", color: "text-orange", iconBg: "bg-orange/10", iconColor: "text-orange" },
];

export default function PlayerStatsCard({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STAT_CONFIG.map(({ icon: Icon, label, getVal, color, colorFn, iconBg, iconColor }, i) => (
        <div
          key={label}
          className={`
            bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-4 flex items-center gap-3
            shadow-md hover:shadow-lg hover:-translate-y-1
            transition-all duration-300
            animate-fade-in-up stagger-${i + 1}
          `}
        >
          <div className={`p-2 rounded-md ${iconBg}`}>
            <Icon size={20} className={`${iconColor} drop-shadow-[0_0_4px_currentColor]`} />
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wide">{label}</div>
            <div className={`text-lg font-bold ${colorFn ? colorFn(data) : color}`}>{getVal(data)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
