import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

export default function GESearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const [game, setGame] = useState("osrs");
  const debounceRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim(), game);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 3) {
      debounceRef.current = setTimeout(() => {
        onSearch(query.trim(), game);
      }, 500);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, game]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="flex rounded-full overflow-hidden border border-border shrink-0">
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

      <div className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items (e.g. Abyssal whip)..."
            className="
              w-full pl-9 pr-4 py-2 rounded-md
              bg-bg-card border border-border
              text-text-primary text-sm
              placeholder:text-text-dim
              focus:outline-none focus:border-gold/50 focus:shadow-[0_0_12px_rgba(200,168,75,0.1)]
              transition-all duration-200
            "
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="
            px-5 py-2 rounded-md text-sm font-semibold text-bg-dark
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:shadow-glow-gold hover:-translate-y-0.5
          "
          style={{ background: "linear-gradient(135deg, #c8a84b, #e8c86b)" }}
        >
          Search
        </button>
      </div>
    </form>
  );
}
