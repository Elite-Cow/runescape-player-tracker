import React, { useState } from "react";
import { Search } from "lucide-react";

export default function PlayerSearchBar({ onSearch, loading }) {
  const [name, setName] = useState("");
  const [game, setGame] = useState("osrs");

  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim()) onSearch(name.trim(), game);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      {/* Game toggle */}
      <div className="flex rounded-full overflow-hidden border border-border shrink-0 relative">
        {["osrs", "rs3"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGame(g)}
            className={`
              px-5 py-2 text-sm font-semibold transition-all duration-200 relative z-10
              ${game === g
                ? g === "osrs"
                  ? "text-white"
                  : "text-bg-dark"
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

      {/* Search input */}
      <div className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter player name..."
            maxLength={12}
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
          disabled={!name.trim() || loading}
          className="
            px-5 py-2 rounded-md text-sm font-semibold
            text-bg-dark transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:shadow-lg hover:-translate-y-0.5
          "
          style={{
            background: "linear-gradient(135deg, #c8a84b, #e8c86b)",
          }}
        >
          {loading ? "Searching..." : "Look Up"}
        </button>
      </div>
    </form>
  );
}
