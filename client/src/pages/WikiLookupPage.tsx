import { useState, useRef, useEffect, useCallback } from "react";
import { Search, BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import type { GameType, WikiPage } from "../types/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WikiResult {
  title: string;
  extract: string | null;
  thumbnail: string | null;
  fullurl: string | null;
}

// MediaWiki page response shape
interface MediaWikiPage {
  title?: string;
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  fullurl?: string;
}

interface MediaWikiQueryResponse {
  query?: {
    pages?: Record<string, MediaWikiPage>;
  };
}

// OpenSearch response: [query, [titles], [descriptions], [urls]]
type OpenSearchResponse = [string, string[], string[], string[]];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 500;
const MIN_SEARCH_CHARS = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wikiBaseUrl(game: GameType): string {
  return game === "osrs"
    ? "https://oldschool.runescape.wiki/w/"
    : "https://runescape.wiki/w/";
}

function apiPrefix(game: GameType): string {
  return game === "osrs" ? "/api/wiki/osrs" : "/api/wiki";
}

function buildWikiUrl(title: string, game: GameType): string {
  return `${wikiBaseUrl(game)}${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

// ---------------------------------------------------------------------------
// Wiki Result Card
// ---------------------------------------------------------------------------

interface WikiCardProps {
  result: WikiResult;
  game: GameType;
}

function WikiResultCard({ result, game }: WikiCardProps) {
  const url = result.fullurl || buildWikiUrl(result.title, game);

  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-5 flex gap-4 flex-1">
        {result.thumbnail && (
          <img
            src={result.thumbnail}
            alt={result.title}
            className="w-16 h-16 rounded-lg object-cover shrink-0 bg-black/20"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#c8a84b] mb-1 truncate">
            {result.title}
          </h3>
          <p className="text-sm text-[#888888] leading-relaxed line-clamp-3">
            {result.extract || "No description available."}
          </p>
        </div>
      </CardContent>
      <div className="px-5 pb-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[#c8a84b] font-semibold no-underline hover:underline group"
        >
          Read more
          <ExternalLink
            size={13}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </a>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Grid
// ---------------------------------------------------------------------------

function WikiSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <div className="p-5 flex gap-4">
            <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wiki Lookup Page
// ---------------------------------------------------------------------------

export default function WikiLookupPage() {
  const [query, setQuery] = useState("");
  const [game, setGame] = useState<GameType>("rs3");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<WikiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const autocompleteAbortRef = useRef<AbortController | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // -----------------------------------------------------------------------
  // Close suggestions on outside click
  // -----------------------------------------------------------------------
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // -----------------------------------------------------------------------
  // Debounced autocomplete
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < MIN_SEARCH_CHARS) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query.trim(), game);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, game]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
      autocompleteAbortRef.current?.abort();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Fetch suggestions (autocomplete)
  // -----------------------------------------------------------------------
  async function fetchSuggestions(q: string, g: GameType): Promise<void> {
    autocompleteAbortRef.current?.abort();
    const controller = new AbortController();
    autocompleteAbortRef.current = controller;

    try {
      const prefix = apiPrefix(g);
      const res = await fetch(
        `${prefix}/search?q=${encodeURIComponent(q)}&limit=8`,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;

      if (res.ok) {
        const data: OpenSearchResponse = await res.json();
        if (controller.signal.aborted) return;
        const titles = data[1] || [];
        setSuggestions(titles);
        setShowSuggestions(titles.length > 0);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Silently swallow autocomplete errors
    }
  }

  // -----------------------------------------------------------------------
  // Full search
  // -----------------------------------------------------------------------
  const handleSearch = useCallback(
    async (searchQuery: string, searchGame: GameType) => {
      if (!searchQuery.trim()) return;

      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setLoading(true);
      setError(null);
      setSuggestions([]);
      setShowSuggestions(false);

      try {
        const prefix = apiPrefix(searchGame);

        // Step 1: Get titles from OpenSearch
        const searchRes = await fetch(
          `${prefix}/search?q=${encodeURIComponent(searchQuery)}&limit=10`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        if (!searchRes.ok) throw new Error("Search failed");

        const searchData: OpenSearchResponse = await searchRes.json();
        if (controller.signal.aborted) return;
        const titles = searchData[1] || [];

        if (titles.length === 0) {
          setError(`No results found for "${searchQuery}"`);
          setResults([]);
          return;
        }

        // Step 2: Fetch page details for each title (max 8)
        const pages = await Promise.all(
          titles.slice(0, 8).map(async (title): Promise<WikiResult> => {
            try {
              const pageRes = await fetch(
                `${prefix}/page/${encodeURIComponent(title)}`,
                { signal: controller.signal },
              );
              if (controller.signal.aborted) {
                return { title, extract: null, thumbnail: null, fullurl: null };
              }
              if (!pageRes.ok) {
                return { title, extract: null, thumbnail: null, fullurl: null };
              }

              const pageData: MediaWikiQueryResponse = await pageRes.json();
              if (controller.signal.aborted) {
                return { title, extract: null, thumbnail: null, fullurl: null };
              }

              const pagesMap = pageData.query?.pages || {};
              const page = Object.values(pagesMap)[0];

              return {
                title: page?.title || title,
                extract: page?.extract || null,
                thumbnail: page?.thumbnail?.source || null,
                fullurl: page?.fullurl || null,
              };
            } catch {
              return { title, extract: null, thumbnail: null, fullurl: null };
            }
          }),
        );

        if (controller.signal.aborted) return;
        setResults(pages);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim(), game);
    }
  }

  function selectSuggestion(title: string) {
    setQuery(title);
    setShowSuggestions(false);
    handleSearch(title, game);
  }

  function handleGameToggle(g: GameType) {
    setGame(g);
    setSuggestions([]);
    setShowSuggestions(false);
    // Re-search if there were previous results
    if (query.trim() && results.length > 0) {
      handleSearch(query.trim(), g);
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">
          Wiki Lookup
        </h1>
        <p className="text-sm text-[#666666] mt-1">
          Search the RuneScape and OSRS wikis
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </div>

      {/* Search area */}
      <Card className="mb-6 animate-fade-in-up stagger-1">
        <CardContent className="p-4">
          <div ref={wrapperRef} className="relative">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              {/* Game toggle */}
              <div className="flex rounded-full overflow-hidden border border-[#1a2048] shrink-0">
                {(["rs3", "osrs"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGameToggle(g)}
                    className={`
                      px-5 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer
                      ${
                        game === g
                          ? g === "osrs"
                            ? "text-white"
                            : "text-[#080d1f]"
                          : "bg-transparent text-[#666666] hover:text-[#e0e0e0]"
                      }
                    `}
                    style={
                      game === g
                        ? {
                            background:
                              g === "osrs"
                                ? "linear-gradient(135deg, #5ba3f5, #7bb8ff)"
                                : "linear-gradient(135deg, #c8a84b, #e8c86b)",
                          }
                        : undefined
                    }
                  >
                    {g.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Search input + button */}
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none"
                  />
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Search the RuneScape Wiki..."
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={!query.trim()}>
                  Search
                </Button>
              </div>
            </form>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-[#0f1535] border border-[#1a2048] rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((title) => (
                  <button
                    key={title}
                    onClick={() => selectSuggestion(title)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#e0e0e0] hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error banner */}
      {error && (
        <div className="bg-[#e05c5c]/10 border border-[#e05c5c]/30 rounded-lg p-4 text-[#e05c5c] text-sm mb-6 animate-fade-in">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <WikiSkeletonGrid />}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up stagger-2">
          {results.map((result) => (
            <WikiResultCard key={result.title} result={result} game={game} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && !error && (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c8a84b]/5 mb-4">
            <BookOpen
              size={32}
              className="text-[#c8a84b]/40"
              style={{ animation: "pulseGlow 2s ease-in-out infinite" }}
            />
          </div>
          <p className="text-lg text-[#666666] mb-2">Search anything in the RS Wiki</p>
          <p className="text-sm text-[#555555]">
            Try &quot;Dragon&quot;, &quot;Abyssal whip&quot;, or &quot;Barrows&quot;
          </p>
        </div>
      )}
    </div>
  );
}
