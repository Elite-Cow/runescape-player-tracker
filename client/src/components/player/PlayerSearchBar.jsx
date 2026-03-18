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
      <div className="flex rounded-md overflow-hidden border border-border shrink-0">
        {["osrs", "rs3"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGame(g)}
            className={`
              px-4 py-2 text-sm font-semibold transition-colors
              ${game === g
                ? g === "osrs"
                  ? "bg-osrs text-white"
                  : "bg-gold text-bg-dark"
                : "bg-bg-card text-text-muted hover:text-text-primary"
              }
            `}
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
              focus:outline-none focus:border-gold/50
              transition-colors
            "
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim() || loading}
          className="
            px-5 py-2 rounded-md text-sm font-semibold
            bg-gold text-bg-dark
            hover:bg-gold/90 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {loading ? "Searching..." : "Look Up"}
        </button>
      </div>
    </form>
  );
}
