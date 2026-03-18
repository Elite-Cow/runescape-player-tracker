import React from "react";
import { User, Shield, Swords, Star } from "lucide-react";

function formatXp(xp) {
  if (xp >= 1_000_000_000) return (xp / 1_000_000_000).toFixed(2) + "B";
  if (xp >= 1_000_000) return (xp / 1_000_000).toFixed(1) + "M";
  if (xp >= 1_000) return (xp / 1_000).toFixed(1) + "K";
  return String(xp);
}

export default function PlayerStatsCard({ data }) {
  if (!data) return null;

  const stats = [
    {
      icon: User,
      label: "Player",
      value: data.player,
      color: "text-text-primary",
    },
    {
      icon: Shield,
      label: "Combat Level",
      value: data.combatLevel,
      color: data.game === "osrs" ? "text-osrs" : "text-gold",
    },
    {
      icon: Star,
      label: "Total Level",
      value: data.overall?.level ?? "\u2014",
      color: "text-green",
    },
    {
      icon: Swords,
      label: "Total XP",
      value: data.overall ? formatXp(data.overall.xp) : "\u2014",
      color: "text-orange",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="bg-bg-card rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-white/5">
            <Icon size={20} className="text-text-muted" />
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wide">{label}</div>
            <div className={`text-lg font-bold ${color}`}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
