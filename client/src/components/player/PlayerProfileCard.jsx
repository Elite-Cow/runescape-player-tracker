import React from "react";
import { Shield, Star, Swords, Users } from "lucide-react";
import PlayerAvatar from "./PlayerAvatar";

function formatXp(xp) {
  if (xp >= 1_000_000_000) return (xp / 1_000_000_000).toFixed(2) + "B";
  if (xp >= 1_000_000) return (xp / 1_000_000).toFixed(1) + "M";
  if (xp >= 1_000) return (xp / 1_000).toFixed(1) + "K";
  return String(xp);
}

export default function PlayerProfileCard({ data, profile, game }) {
  if (!data) return null;

  const clan = profile?.clan || null;
  const title = profile?.title || null;

  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-5 shadow-lg animate-fade-in-up">
      <div className="flex items-center gap-4 mb-5">
        {game === "rs3" && (
          <PlayerAvatar name={data.player} size={72} className="shadow-md" />
        )}
        <div>
          <h2 className="font-cinzel text-xl font-bold text-gold">{data.player}</h2>
          {title && <div className="text-xs text-text-muted mt-0.5">{title}</div>}
          {clan && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-text-secondary">
              <Users size={12} />
              {clan}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Shield, label: "Combat", value: data.combatLevel, color: game === "osrs" ? "text-osrs" : "text-gold", bg: game === "osrs" ? "bg-osrs/10" : "bg-gold/10" },
          { icon: Star, label: "Total Level", value: data.overall?.level ?? "\u2014", color: "text-green", bg: "bg-green/10" },
          { icon: Swords, label: "Total XP", value: data.overall ? formatXp(data.overall.xp) : "\u2014", color: "text-orange", bg: "bg-orange/10" },
          { icon: Star, label: "Rank", value: data.overall?.rank ? `#${data.overall.rank.toLocaleString()}` : "\u2014", color: "text-text-primary", bg: "bg-white/5" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="flex items-center gap-2.5 p-3 rounded-lg bg-black/20">
            <div className={`p-1.5 rounded-md ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <div className="text-[10px] text-text-dim uppercase tracking-wide">{label}</div>
              <div className={`text-sm font-bold ${color}`}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
