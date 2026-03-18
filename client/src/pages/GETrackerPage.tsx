import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Coins, Search, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import GEPriceChart from "../components/ge/GEPriceChart";
import { formatPrice, COLORS } from "../lib/chart-utils";
import type {
  GameType,
  GEItemOSRS,
  GEItemRS3Legacy,
  GETimeseriesPoint,
} from "../types/api";

// ---------------------------------------------------------------------------
// Types for the unified item model used by this page
// ---------------------------------------------------------------------------

interface UnifiedGEItem {
  id: number;
  name: string;
  description: string;
  icon: string;
  members: boolean;
  buyPrice: number | null;
  sellPrice: number | null;
  priceChange: number | null; // positive = up, negative = down, null = unknown
  game: GameType;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function GameToggle({
  game,
  onChange,
}: {
  game: GameType;
  onChange: (g: GameType) => void;
}) {
  return (
    <div className="flex rounded-full overflow-hidden border border-[#1a2048] w-fit">
      {(["osrs", "rs3"] as const).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
            game === g
              ? g === "osrs"
                ? "text-white"
                : "text-[#080d1f]"
              : "bg-transparent text-[#888888] hover:text-[#e0e0e0]"
          }`}
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
  );
}

function normaliseOSRS(item: GEItemOSRS): UnifiedGEItem {
  const spread =
    item.high != null && item.low != null ? item.high - item.low : null;
  return {
    id: item.id,
    name: item.name,
    description: item.examine ?? "",
    icon: item.icon ?? "",
    members: item.members,
    buyPrice: item.high,
    sellPrice: item.low,
    priceChange: spread,
    game: "osrs",
  };
}

function normaliseRS3(item: GEItemRS3Legacy): UnifiedGEItem {
  const parsePrice = (v: string | number): number | null => {
    if (typeof v === "number") return v;
    if (!v || v === "-") return null;
    const cleaned = String(v).replace(/,/g, "").trim();
    const multiplier = cleaned.endsWith("b")
      ? 1_000_000_000
      : cleaned.endsWith("m")
        ? 1_000_000
        : cleaned.endsWith("k")
          ? 1_000
          : 1;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : Math.round(num * multiplier);
  };

  const currentPrice = parsePrice(item.current?.price ?? "");
  const todayPrice = parsePrice(item.today?.price ?? "");

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    icon: item.icon ?? "",
    members: item.members === "true",
    buyPrice: currentPrice,
    sellPrice: currentPrice,
    priceChange: todayPrice,
    game: "rs3",
  };
}

function PriceChangeIndicator({ change }: { change: number | null }) {
  if (change === null) {
    return <Minus size={14} className="text-[#888888]" />;
  }
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[#4ade80] text-xs font-medium">
        <TrendingUp size={12} />+{formatPrice(change)}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[#ef4444] text-xs font-medium">
        <TrendingDown size={12} />{formatPrice(change)}
      </span>
    );
  }
  return (
    <span className="text-xs text-[#888888]">0</span>
  );
}

// ---------------------------------------------------------------------------
// OSRS mapping cache (loaded once per game switch)
// ---------------------------------------------------------------------------

interface OSRSMappingItem {
  id: number;
  name: string;
  examine: string;
  members: boolean;
  lowalch: number | null;
  highalch: number | null;
  limit: number | null;
  icon: string;
}

function useOSRSMapping(): {
  mapping: OSRSMappingItem[];
  loading: boolean;
  error: string | null;
} {
  const [mapping, setMapping] = useState<OSRSMappingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const controller = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/ge/mapping?game=osrs", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load OSRS item mapping");
        const data: OSRSMappingItem[] = await res.json();
        if (!controller.signal.aborted) {
          setMapping(data);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load mapping");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  return { mapping, loading, error };
}

// ---------------------------------------------------------------------------
// Item card
// ---------------------------------------------------------------------------

function ItemCard({
  item,
  selected,
  onSelect,
}: {
  item: UnifiedGEItem;
  selected: boolean;
  onSelect: (item: UnifiedGEItem) => void;
}) {
  return (
    <button
      onClick={() => onSelect(item)}
      className={`w-full text-left rounded-lg border p-3 transition-all duration-200 ${
        selected
          ? "border-[#c8a84b]/60 bg-[#c8a84b]/[0.08] shadow-md shadow-[#c8a84b]/10"
          : "border-[#1a2048] bg-gradient-to-br from-[#0f1535] to-[#0a1028] hover:border-[#2a3068] hover:bg-[#1a2048]/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={
            item.game === "osrs"
              ? `/api/ge/image/${item.id}?game=osrs`
              : item.icon
          }
          alt={item.name}
          width={36}
          height={36}
          className="rounded bg-black/20 p-0.5 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium truncate ${
              selected ? "text-[#c8a84b]" : "text-[#e0e0e0]"
            }`}
          >
            {item.name}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            {item.buyPrice != null && (
              <span className="text-xs text-[#4ade80]">
                Buy: {formatPrice(item.buyPrice)}
              </span>
            )}
            {item.sellPrice != null && (
              <span className="text-xs text-[#c8a84b]">
                Sell: {formatPrice(item.sellPrice)}
              </span>
            )}
          </div>
        </div>
        <PriceChangeIndicator change={item.priceChange} />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Item detail panel with chart
// ---------------------------------------------------------------------------

function ItemDetail({
  item,
  game,
}: {
  item: UnifiedGEItem;
  game: GameType;
}) {
  const [chartData, setChartData] = useState<GETimeseriesPoint[] | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setChartLoading(true);
    setChartError(null);
    setChartData(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/ge/graph/${item.id}?game=${game}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Failed to load price history");
        const json = await res.json();
        if (controller.signal.aborted) return;

        const data: GETimeseriesPoint[] = json.data ?? json ?? [];
        setChartData(data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setChartError(
          err instanceof Error ? err.message : "Failed to load chart data",
        );
      } finally {
        if (!controller.signal.aborted) setChartLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [item.id, game]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <img
            src={
              game === "osrs"
                ? `/api/ge/image/${item.id}?game=osrs`
                : item.icon
            }
            alt={item.name}
            width={40}
            height={40}
            className="rounded bg-black/20 p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <CardTitle className="text-[#c8a84b]">{item.name}</CardTitle>
            {item.description && (
              <p className="text-xs text-[#888888] mt-0.5">{item.description}</p>
            )}
          </div>
          {item.members && (
            <Badge variant="outline" className="ml-auto">
              Members
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Price summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-[#888888] uppercase tracking-wider">Buy (High)</p>
            <p className="text-lg font-semibold text-[#4ade80]">
              {formatPrice(item.buyPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#888888] uppercase tracking-wider">
              Sell (Low)
            </p>
            <p className="text-lg font-semibold text-[#c8a84b]">
              {formatPrice(item.sellPrice)}
            </p>
          </div>
          {item.buyPrice != null && item.sellPrice != null && (
            <div>
              <p className="text-xs text-[#888888] uppercase tracking-wider">Spread</p>
              <p className="text-lg font-semibold text-[#e0e0e0]">
                {formatPrice(item.buyPrice - item.sellPrice)}
              </p>
            </div>
          )}
        </div>

        {/* Chart */}
        {chartLoading && <LoadingSpinner className="py-12" />}
        {chartError && (
          <p className="text-center text-sm text-[#888888] py-8">{chartError}</p>
        )}
        {chartData && !chartLoading && (
          <GEPriceChart data={chartData} itemName={item.name} />
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Grid skeleton
// ---------------------------------------------------------------------------

function GESkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-[460px] w-full" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function GETrackerPage() {
  const [game, setGame] = useState<GameType>("osrs");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<UnifiedGEItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<UnifiedGEItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rs3Unavailable, setRs3Unavailable] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<UnifiedGEItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { mapping: osrsMapping } = useOSRSMapping();

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // OSRS client-side autocomplete
  // ---------------------------------------------------------------------------
  const filteredOSRS = useMemo(() => {
    if (game !== "osrs" || !query.trim() || osrsMapping.length === 0) return [];
    const q = query.trim().toLowerCase();
    return osrsMapping
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 10);
  }, [game, query, osrsMapping]);

  // ---------------------------------------------------------------------------
  // RS3 debounced autocomplete
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (game !== "rs3" || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const controller = new AbortController();

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/ge/search?q=${encodeURIComponent(query.trim())}&game=rs3`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (controller.signal.aborted) return;

        if (data.error) {
          setSuggestions([]);
          return;
        }

        const list = (data.items ?? []) as GEItemRS3Legacy[];
        setSuggestions(list.slice(0, 10).map(normaliseRS3));
      } catch {
        // Silently ignore autocomplete errors
      }
    }, 300);

    return () => {
      controller.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [game, query]);

  // Merge autocomplete results based on game
  const autocompleteSuggestions = useMemo(() => {
    if (game === "osrs") {
      return filteredOSRS.map((item): UnifiedGEItem => ({
        id: item.id,
        name: item.name,
        description: item.examine ?? "",
        icon: item.icon ?? "",
        members: item.members,
        buyPrice: null,
        sellPrice: null,
        priceChange: null,
        game: "osrs",
      }));
    }
    return suggestions;
  }, [game, filteredOSRS, suggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------------------------------------------------------------------------
  // Search handler
  // ---------------------------------------------------------------------------
  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setItems([]);
      setSelectedItem(null);
      setShowSuggestions(false);
      setRs3Unavailable(false);

      try {
        if (game === "osrs") {
          // OSRS: filter mapping locally, then fetch prices for matched items
          const matches = osrsMapping
            .filter((item) => item.name.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 12);

          if (matches.length === 0) {
            setError(`No items found for "${q}"`);
            return;
          }

          // Fetch detail/prices for each matched item
          const detailed = await Promise.all(
            matches.map(async (mapItem): Promise<UnifiedGEItem> => {
              try {
                const res = await fetch(
                  `/api/ge/item/${mapItem.id}?game=osrs`,
                  { signal: controller.signal },
                );
                if (res.ok) {
                  const d = await res.json();
                  const osrsItem: GEItemOSRS = d.item ?? d;
                  return normaliseOSRS({
                    ...mapItem,
                    high: osrsItem.high ?? null,
                    low: osrsItem.low ?? null,
                    highTime: osrsItem.highTime ?? null,
                    lowTime: osrsItem.lowTime ?? null,
                  });
                }
              } catch {
                // Fall through to default
              }
              return {
                id: mapItem.id,
                name: mapItem.name,
                description: mapItem.examine ?? "",
                icon: mapItem.icon ?? "",
                members: mapItem.members,
                buyPrice: null,
                sellPrice: null,
                priceChange: null,
                game: "osrs",
              };
            }),
          );

          if (controller.signal.aborted) return;
          setItems(detailed);
          if (detailed.length > 0) setSelectedItem(detailed[0]);
        } else {
          // RS3: server-side search
          const res = await fetch(
            `/api/ge/search?q=${encodeURIComponent(q)}&game=rs3`,
            { signal: controller.signal },
          );

          if (!res.ok) throw new Error("Failed to search Grand Exchange");

          const data = await res.json();
          if (controller.signal.aborted) return;

          if (data.error) {
            setRs3Unavailable(true);
            setError(data.error);
            return;
          }

          const itemList = (data.items ?? []) as GEItemRS3Legacy[];
          if (itemList.length === 0) {
            setError(`No items found for "${q}"`);
            return;
          }

          // Fetch detail for each item for full price info
          const detailed = await Promise.all(
            itemList.slice(0, 12).map(async (raw): Promise<UnifiedGEItem> => {
              try {
                const detailRes = await fetch(
                  `/api/ge/item/${raw.id}?game=rs3`,
                  { signal: controller.signal },
                );
                if (detailRes.ok) {
                  const d = await detailRes.json();
                  const item = (d.item ?? raw) as GEItemRS3Legacy;
                  return normaliseRS3(item);
                }
              } catch {
                // Fall through
              }
              return normaliseRS3(raw);
            }),
          );

          if (controller.signal.aborted) return;
          setItems(detailed);
          if (detailed.length > 0) setSelectedItem(detailed[0]);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [game, query, osrsMapping],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSuggestionClick = (item: UnifiedGEItem) => {
    setQuery(item.name);
    setShowSuggestions(false);
    handleSearch(item.name);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">
          GE Price Tracker
        </h1>
        <p className="text-sm text-[#888888] mt-1">
          Search Grand Exchange items and view price history
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </div>

      {/* RS3 unavailable banner */}
      {rs3Unavailable && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#ffab00]/30 bg-[#ffab00]/10 p-3 animate-fade-in">
          <AlertTriangle size={16} className="text-[#ffab00] shrink-0" />
          <p className="text-sm text-[#ffab00]">
            RS3 GE data temporarily unavailable. Try OSRS or check back later.
          </p>
        </div>
      )}

      {/* Search form */}
      <Card className="mb-6 animate-fade-in-up stagger-1">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <GameToggle game={game} onChange={(g) => { setGame(g); setItems([]); setSelectedItem(null); setError(null); setRs3Unavailable(false); }} />

            <div className="relative" ref={suggestionsRef}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]"
                  />
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={
                      game === "osrs"
                        ? 'Search OSRS items (e.g. "Twisted bow")'
                        : 'Search RS3 items (e.g. "Dragon bones")'
                    }
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={!query.trim() || loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>

              {/* Autocomplete dropdown */}
              {showSuggestions && autocompleteSuggestions.length > 0 && query.trim().length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-[#1a2048] bg-[#0f1535] shadow-xl">
                  {autocompleteSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#c8a84b]/10 transition-colors"
                    >
                      <img
                        src={
                          game === "osrs"
                            ? `/api/ge/image/${item.id}?game=osrs`
                            : item.icon
                        }
                        alt=""
                        width={20}
                        height={20}
                        className="rounded bg-black/20 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="text-[#e0e0e0] truncate">{item.name}</span>
                      {item.members && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto shrink-0">
                          P2P
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && !rs3Unavailable && (
        <div className="bg-[#e05c5c]/10 border border-[#e05c5c]/30 rounded-lg p-4 text-[#e05c5c] text-sm mb-6 animate-fade-in">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="animate-fade-in-up">
          <GESkeleton />
        </div>
      )}

      {/* Results */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-2">
          {/* Item list */}
          <div className="lg:col-span-1 flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={selectedItem?.id === item.id}
                onSelect={setSelectedItem}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <ItemDetail item={selectedItem} game={game} />
            ) : (
              <Card>
                <CardContent className="py-16 text-center text-[#888888]">
                  Select an item to view price history
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && !error && (
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c8a84b]/5 mb-4">
            <Coins
              size={32}
              className="text-[#c8a84b]/40"
              style={{ animation: "pulseGlow 2s ease-in-out infinite" }}
            />
          </div>
          <p className="text-lg text-[#888888] mb-2">
            Search for an item to get started
          </p>
          <p className="text-sm text-[#666666]">
            Try "Abyssal whip", "Dragon bones", or "Twisted bow"
          </p>
        </div>
      )}
    </div>
  );
}
