import React, { useEffect, useState } from "react";

const FILTER_OPTIONS = [
  { key: "official", label: "Official" },
  { key: "youtube",  label: "YouTube" },
  { key: "reddit",   label: "Reddit"  },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function NewsPage() {
  const [articles, setArticles]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [activeFilters, setActiveFilters] = useState(new Set(["official", "youtube", "reddit"]));

  useEffect(() => {
    async function load(initial = false) {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Failed to load news");
        setArticles(await res.json());
        if (initial) setError(null);
      } catch (err) {
        if (initial) setError(err.message);
      } finally {
        if (initial) setLoading(false);
      }
    }

    load(true);
    const id = setInterval(() => load(false), 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  function toggleFilter(key) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const filtered = articles.filter((a) => activeFilters.has(a.sourceType));

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-[28px] font-bold text-gold mb-1.5">
          RuneScape News
        </h1>
        <p className="text-[13px] text-text-muted">
          Latest updates from RS3 and Old School RuneScape
        </p>
      </div>

      <div className="flex gap-2.5 mb-6 flex-wrap justify-center">
        {FILTER_OPTIONS.map(({ key, label }) => {
          const active = activeFilters.has(key);
          return (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={`
                px-4 py-1.5 rounded-full text-[13px] font-semibold
                border transition-all duration-150 cursor-pointer
                ${active
                  ? "border-gold bg-gold text-bg-sidebar"
                  : "border-border-light bg-transparent text-text-muted hover:border-border-mid hover:text-text-primary"
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center text-text-muted py-20">Loading articles...</div>
      ) : error ? (
        <div className="text-center text-rs3 py-20">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-text-muted py-20">No articles found.</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {filtered.map((article) => (
            <div key={article.link} className="bg-bg-card rounded-lg overflow-hidden flex flex-col">
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-40 object-cover block"
                  loading="lazy"
                />
              )}
              <div className="p-4 flex flex-col gap-2.5 grow">
                <div className="flex items-center justify-between">
                  <span
                    className={`
                      text-[11px] font-bold uppercase tracking-wider
                      px-2 py-0.5 rounded border
                      ${article.game === "rs3"
                        ? "bg-gold-dim text-gold border-gold/40"
                        : "bg-osrs-dim text-osrs border-osrs/40"
                      }
                    `}
                  >
                    {article.game === "rs3" ? "RS3" : "OSRS"}
                  </span>
                  <span className="text-xs text-border-mid">{formatDate(article.pubDate)}</span>
                </div>
                <div className="text-[15px] font-bold text-text-primary leading-snug">
                  {article.title}
                </div>
                {article.sourceName && (
                  <div className="text-xs text-border-mid">{article.sourceName}</div>
                )}
                {article.description && (
                  <div className="text-[13px] text-text-secondary leading-relaxed grow">
                    {article.description}
                  </div>
                )}
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-gold font-semibold no-underline hover:underline self-start"
                >
                  Read more &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
