import React from "react";
import GETrendIndicator from "./GETrendIndicator";

function parsePrice(priceStr) {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  const cleaned = String(priceStr).replace(/,/g, "");
  const match = cleaned.match(/([\d.]+)\s*([kmb])?/i);
  if (!match) return parseInt(cleaned, 10) || 0;
  const num = parseFloat(match[1]);
  const suffix = (match[2] || "").toLowerCase();
  if (suffix === "k") return Math.round(num * 1000);
  if (suffix === "m") return Math.round(num * 1000000);
  if (suffix === "b") return Math.round(num * 1000000000);
  return Math.round(num);
}

function formatGold(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function GEItemCard({ item, game, onSelect, selected }) {
  if (!item) return null;

  const current = item.current;
  const today = item.today;
  const price = current ? parsePrice(current.price) : 0;
  const todayChange = today ? parseFloat(String(today.price).replace(/[+,]/g, "")) : 0;
  const todayPct = price > 0 ? (todayChange / price) * 100 : 0;

  return (
    <button
      onClick={() => onSelect(item)}
      className={`
        w-full text-left bg-gradient-to-br from-[#1e1e1e] to-bg-card rounded-lg p-4
        flex items-center gap-4 transition-all duration-300 group cursor-pointer
        shadow-md hover:shadow-lg hover:-translate-y-1
        ${selected ? "ring-1 ring-gold/40 shadow-lg" : ""}
      `}
    >
      <img
        src={`/api/ge/image/${item.id}?game=${game}`}
        alt={item.name}
        width={48}
        height={48}
        className="shrink-0 rounded bg-black/20 p-1"
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate group-hover:text-gold transition-colors">
          {item.name}
        </div>
        <div className="text-lg font-bold text-gold mt-0.5">
          {current ? current.price : "\u2014"} gp
        </div>
        <div className="flex items-center gap-3 mt-1">
          <GETrendIndicator label="Today" change={todayPct} />
          {item.day30 && (
            <GETrendIndicator label="30d" change={parseFloat(item.day30.change?.replace("%", ""))} />
          )}
          {item.day90 && (
            <GETrendIndicator label="90d" change={parseFloat(item.day90.change?.replace("%", ""))} />
          )}
        </div>
      </div>
    </button>
  );
}
