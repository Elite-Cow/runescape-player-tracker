import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import WikiSearchBar from "../components/wiki/WikiSearchBar";
import WikiCard from "../components/wiki/WikiCard";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function WikiLookupPage() {
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentGame, setCurrentGame] = useState("rs3");

  async function handleAutocomplete(query, game) {
    try {
      const prefix = game === "osrs" ? "/api/wiki/osrs" : "/api/wiki";
      const res = await fetch(`${prefix}/search?q=${encodeURIComponent(query)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        // OpenSearch format: [query, [titles], [descriptions], [urls]]
        setSuggestions(data[1] || []);
      }
    } catch {}
  }

  async function handleSearch(query, game) {
    setLoading(true);
    setError(null);
    setCurrentGame(game);
    setSuggestions([]);

    try {
      // First get opensearch results for titles
      const prefix = game === "osrs" ? "/api/wiki/osrs" : "/api/wiki";
      const searchRes = await fetch(`${prefix}/search?q=${encodeURIComponent(query)}&limit=10`);
      if (!searchRes.ok) throw new Error("Search failed");
      const searchData = await searchRes.json();
      const titles = searchData[1] || [];

      if (titles.length === 0) {
        setError(`No results found for "${query}"`);
        setResults([]);
        return;
      }

      // Fetch page details for each title
      const pages = await Promise.all(
        titles.slice(0, 8).map(async (title) => {
          try {
            const pageRes = await fetch(`${prefix}/page/${encodeURIComponent(title)}`);
            if (!pageRes.ok) return { title, extract: null, thumbnail: null };
            const pageData = await pageRes.json();
            const pages = pageData.query?.pages || {};
            const page = Object.values(pages)[0];
            return {
              title: page?.title || title,
              extract: page?.extract || null,
              thumbnail: page?.thumbnail?.source || null,
            };
          } catch {
            return { title, extract: null, thumbnail: null };
          }
        })
      );

      setResults(pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">Wiki Lookup</h1>
        <p className="text-sm text-text-muted mt-1">
          Search the RuneScape and OSRS wikis
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
      </div>

      <div className="glass rounded-lg p-4 mb-6 animate-fade-in-up stagger-1">
        <WikiSearchBar
          onSearch={handleSearch}
          onAutocomplete={handleAutocomplete}
          suggestions={suggestions}
        />
      </div>

      {error && (
        <div className="bg-rs3/10 border border-rs3/30 rounded-lg p-4 text-rs3 text-sm mb-6 animate-fade-in">
          {error}
        </div>
      )}

      {loading && <LoadingSpinner className="py-16" />}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up stagger-2">
          {results.map((page) => (
            <WikiCard key={page.title} {...page} game={currentGame} />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/5 mb-4">
            <BookOpen size={32} className="text-gold/40" style={{ animation: "pulseGlow 2s ease-in-out infinite" }} />
          </div>
          <p className="text-lg text-text-muted mb-2">Search anything in the RS Wiki</p>
          <p className="text-sm text-text-dim">Try "Dragon", "Abyssal whip", or "Barrows"</p>
        </div>
      )}
    </div>
  );
}
