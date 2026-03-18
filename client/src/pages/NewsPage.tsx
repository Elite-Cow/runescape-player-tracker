import { useEffect, useState, useRef, useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import type { NewsItem } from "../types/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterTab = "all" | "official" | "youtube" | "reddit";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function gameBadgeVariant(game: NewsItem["game"]): "default" | "osrs" | "rs3" {
  if (game === "osrs") return "osrs";
  if (game === "rs3") return "rs3";
  return "default";
}

function gameLabel(game: NewsItem["game"]): string {
  if (game === "osrs") return "OSRS";
  if (game === "rs3") return "RS3";
  return "General";
}

function typeLabel(type: NewsItem["type"]): string {
  if (type === "official") return "Official";
  if (type === "youtube") return "YouTube";
  if (type === "reddit") return "Reddit";
  return type;
}

// ---------------------------------------------------------------------------
// News Card
// ---------------------------------------------------------------------------

interface NewsCardProps {
  article: NewsItem;
  index: number;
}

function NewsCard({ article, index }: NewsCardProps) {
  return (
    <Card
      className={`overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-2 transition-all duration-300 group animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
    >
      {article.image && (
        <div className="overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-40 object-cover block transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <CardContent className="p-4 flex flex-col gap-2.5 grow">
        {/* Source badges + date */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Badge variant={gameBadgeVariant(article.game)}>
              {gameLabel(article.game)}
            </Badge>
            <Badge variant="outline">{typeLabel(article.type)}</Badge>
          </div>
          <span className="text-xs text-[#666666]">{formatDate(article.pubDate)}</span>
        </div>

        {/* Title */}
        <div className="text-[15px] font-bold text-[#e0e0e0] leading-snug">
          {article.title}
        </div>

        {/* Source name */}
        {article.source && (
          <div className="text-xs text-[#666666]">{article.source}</div>
        )}

        {/* Description */}
        {article.description && (
          <div className="text-[13px] text-[#888888] leading-relaxed grow line-clamp-3">
            {article.description}
          </div>
        )}

        {/* External link */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#c8a84b] font-semibold no-underline hover:underline self-start group/link"
        >
          Read more
          <ExternalLink
            size={13}
            className="transition-transform duration-200 group-hover/link:translate-x-0.5"
          />
        </a>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Grid
// ---------------------------------------------------------------------------

function NewsSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="p-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// News Page
// ---------------------------------------------------------------------------

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const abortRef = useRef<AbortController | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNews = useCallback(async (initial: boolean, signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/news", { signal });
      if (signal?.aborted) return;
      if (!res.ok) throw new Error("Failed to load news");
      const data: NewsItem[] = await res.json();
      if (signal?.aborted) return;
      setArticles(data);
      if (initial) setError(null);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (initial) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      if (initial && !signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetchNews(true, controller.signal);

    // Background refresh every 15 minutes
    refreshRef.current = setInterval(() => {
      fetchNews(false, controller.signal);
    }, REFRESH_INTERVAL_MS);

    return () => {
      controller.abort();
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [fetchNews]);

  // Filter articles based on active tab
  const filtered =
    activeTab === "all"
      ? articles
      : articles.filter((a) => a.type === activeTab);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="font-cinzel text-2xl font-bold gradient-text-gold">News</h1>
        <p className="text-sm text-[#666666] mt-1">
          Latest updates from RS3 and Old School RuneScape
        </p>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-[#c8a84b]/30 via-[#c8a84b]/10 to-transparent" />
      </div>

      {/* Filter tabs */}
      <div className="mb-6 animate-fade-in-up stagger-1">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as FilterTab)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="official">Official</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="reddit">Reddit</TabsTrigger>
          </TabsList>

          {/* Tab content areas are identical; filtering happens in the shared grid below */}
          {(["all", "official", "youtube", "reddit"] as const).map((tab) => (
            <TabsContent key={tab} value={tab}>
              {/* content rendered below outside Tabs for simplicity */}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-[#e05c5c]/10 border border-[#e05c5c]/30 rounded-lg p-4 text-[#e05c5c] text-sm mb-6 animate-fade-in">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <NewsSkeletonGrid />
      ) : filtered.length === 0 ? (
        <div className="text-center text-[#666666] py-20 animate-fade-in">
          No articles found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((article, i) => (
            <NewsCard key={article.link} article={article} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
