import React, { useEffect, useState } from "react";

const styles = {
  wrapper: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 16px",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#c8a84b",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#666",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#1a1a1a",
    borderRadius: "8px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  cardImage: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    display: "block",
  },
  cardBody: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flexGrow: 1,
  },
  tagRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tag: (game) => ({
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "3px 8px",
    borderRadius: "4px",
    background: game === "rs3" ? "rgba(200,168,75,0.12)" : "rgba(91,163,245,0.12)",
    color: game === "rs3" ? "#c8a84b" : "#5ba3f5",
    border: `1px solid ${game === "rs3" ? "rgba(200,168,75,0.4)" : "rgba(91,163,245,0.4)"}`,
  }),
  date: {
    fontSize: "12px",
    color: "#555",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#e0e0e0",
    lineHeight: "1.4",
  },
  excerpt: {
    fontSize: "13px",
    color: "#888",
    lineHeight: "1.6",
    flexGrow: 1,
  },
  readMore: {
    fontSize: "13px",
    color: "#c8a84b",
    textDecoration: "none",
    fontWeight: "600",
    alignSelf: "flex-start",
  },
  loading: {
    textAlign: "center",
    color: "#666",
    padding: "80px 40px",
  },
  error: {
    textAlign: "center",
    color: "#e05c5c",
    padding: "80px 40px",
  },
  empty: {
    textAlign: "center",
    color: "#666",
    padding: "80px 40px",
  },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Failed to load news");
        setArticles(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.title}>RuneScape News</div>
        <div style={styles.subtitle}>Latest updates from RS3 and Old School RuneScape</div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading articles...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : articles.length === 0 ? (
        <div style={styles.empty}>No articles found.</div>
      ) : (
        <div style={styles.grid}>
          {articles.map((article) => (
            <div key={article.link} style={styles.card}>
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  style={styles.cardImage}
                  loading="lazy"
                />
              )}
              <div style={styles.cardBody}>
                <div style={styles.tagRow}>
                  <span style={styles.tag(article.game)}>
                    {article.game === "rs3" ? "RS3" : "OSRS"}
                  </span>
                  <span style={styles.date}>{formatDate(article.pubDate)}</span>
                </div>
                <div style={styles.cardTitle}>{article.title}</div>
                {article.description && (
                  <div style={styles.excerpt}>{article.description}</div>
                )}
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.readMore}
                >
                  Read more →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
