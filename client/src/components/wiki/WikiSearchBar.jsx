import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

export default function WikiSearchBar({ onSearch, onAutocomplete, suggestions = [] }) {
  const [query, setQuery] = useState("");
  const [game, setGame] = useState("rs3");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        onAutocomplete(query.trim(), game);
        setShowSuggestions(true);
      }, 300);
    } else {
      setShowSuggestions(false);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, game]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), game);
      setShowSuggestions(false);
    }
  }

  function selectSuggestion(title) {
    setQuery(title);
    setShowSuggestions(false);
    onSearch(title, game);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-full overflow-hidden border border-border shrink-0">
          {["rs3", "osrs"].map((g) => (
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
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              placeholder="Search the RuneScape Wiki..."
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
            disabled={!query.trim()}
            className="
              px-5 py-2 rounded-md text-sm font-semibold text-bg-dark
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:shadow-lg hover:-translate-y-0.5
            "
            style={{ background: "linear-gradient(135deg, #c8a84b, #e8c86b)" }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((title) => (
            <button
              key={title}
              onClick={() => selectSuggestion(title)}
              className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-white/[0.06] transition-colors"
            >
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
