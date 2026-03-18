const { Router } = require("express");
const https = require("https");
const cache = require("../_lib/cache");

const router = Router();

const TTL_1M = 60 * 1000;
const TTL_5M = 5 * 60 * 1000;
const TTL_10M = 10 * 60 * 1000;
const TTL_1H = 60 * 60 * 1000;
const TTL_24H = 24 * 60 * 60 * 1000;

const USER_AGENT = "RS-Player-Tracker/1.0 (https://rs-player-tracker.vercel.app; rs-player-tracker@users.noreply.github.com)";

// OSRS: Wiki Real-Time Prices API (reliable)
const WIKI_PRICES_BASE = "https://prices.runescape.wiki/api/v1/osrs";

// RS3: Legacy Jagex GE API (best-effort)
const RS3_GE_BASE = "https://services.runescape.com/m=itemdb_rs";

function fetchJson(url, userAgent = USER_AGENT) {
  return new Promise((resolve, reject) => {
    const req = https
      .get(url, { headers: { "User-Agent": userAgent } }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`API returned ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error("Invalid JSON response")); }
        });
      })
      .on("error", reject);

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

function pipeImage(url, res) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": USER_AGENT } }, (upstream) => {
        if (upstream.statusCode !== 200) {
          res.status(upstream.statusCode).end();
          return resolve();
        }
        const ct = upstream.headers["content-type"] || "image/gif";
        res.set("Content-Type", ct);
        res.set("Cache-Control", "public, max-age=3600");
        upstream.pipe(res);
        upstream.on("end", resolve);
      })
      .on("error", reject);
  });
}

// ── OSRS Wiki Prices helpers ──

async function getOsrsMapping() {
  const cacheKey = "ge:osrs:mapping";
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchJson(`${WIKI_PRICES_BASE}/mapping`);
  cache.set(cacheKey, data, TTL_24H);
  return data;
}

async function getOsrsLatestPrices() {
  const cacheKey = "ge:osrs:latest";
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchJson(`${WIKI_PRICES_BASE}/latest`);
  cache.set(cacheKey, data, TTL_1M);
  return data;
}

// ── GET /api/ge/mapping?game=osrs|rs3 ──
router.get("/mapping", async (req, res) => {
  try {
    const game = req.query.game === "rs3" ? "rs3" : "osrs";

    if (game === "osrs") {
      const mapping = await getOsrsMapping();
      return res.json(mapping);
    }

    // RS3: no mapping endpoint, return empty
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/ge/search?q=&game=osrs|rs3 ──
router.get("/search", async (req, res) => {
  try {
    const { q, cat = 1, page = 1, game: g } = req.query;
    const game = g === "rs3" ? "rs3" : "osrs";
    if (!q) return res.status(400).json({ error: "Missing search query 'q'" });

    if (game === "osrs") {
      // Search against cached mapping (instant, no external call per search)
      const mapping = await getOsrsMapping();
      const query = q.toLowerCase();
      const matches = mapping
        .filter((item) => item.name.toLowerCase().includes(query))
        .slice(0, 50);

      // Enrich with latest prices
      const latestData = await getOsrsLatestPrices();
      const prices = latestData.data || {};

      const items = matches.map((item) => {
        const price = prices[item.id] || {};
        return {
          id: item.id,
          name: item.name,
          examine: item.examine,
          members: item.members,
          lowalch: item.lowalch,
          highalch: item.highalch,
          limit: item.limit,
          icon: item.icon,
          high: price.high || null,
          low: price.low || null,
          highTime: price.highTime || null,
          lowTime: price.lowTime || null,
        };
      });

      return res.json({ items, total: items.length });
    }

    // RS3: legacy Jagex API (best-effort)
    const cacheKey = `ge:rs3:search:${q}:${cat}:${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    try {
      const url = `${RS3_GE_BASE}/api/catalogue/items.json?category=${encodeURIComponent(cat)}&alpha=${encodeURIComponent(q)}&page=${encodeURIComponent(page)}`;
      const data = await fetchJson(url, "RS-Player-Tracker/1.0");
      cache.set(cacheKey, data, TTL_10M);
      res.json(data);
    } catch {
      res.json({ error: "RS3 GE data temporarily unavailable", items: [] });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/ge/item/:id?game=osrs|rs3 ──
router.get("/item/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const game = req.query.game === "rs3" ? "rs3" : "osrs";

    if (game === "osrs") {
      const cacheKey = `ge:osrs:item:${id}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const [mapping, latestData] = await Promise.all([
        getOsrsMapping(),
        getOsrsLatestPrices(),
      ]);

      const itemId = parseInt(id, 10);
      const meta = mapping.find((m) => m.id === itemId);
      if (!meta) return res.status(404).json({ error: "Item not found" });

      const prices = (latestData.data || {})[itemId] || {};
      const result = {
        item: {
          id: meta.id,
          name: meta.name,
          examine: meta.examine,
          members: meta.members,
          lowalch: meta.lowalch,
          highalch: meta.highalch,
          limit: meta.limit,
          icon: meta.icon,
          high: prices.high || null,
          low: prices.low || null,
          highTime: prices.highTime || null,
          lowTime: prices.lowTime || null,
        },
      };

      cache.set(cacheKey, result, TTL_5M);
      return res.json(result);
    }

    // RS3: legacy API (best-effort)
    const cacheKey = `ge:rs3:item:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    try {
      const url = `${RS3_GE_BASE}/api/catalogue/detail.json?item=${encodeURIComponent(id)}`;
      const data = await fetchJson(url, "RS-Player-Tracker/1.0");
      cache.set(cacheKey, data, TTL_5M);
      res.json(data);
    } catch {
      res.status(503).json({ error: "RS3 GE data temporarily unavailable" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/ge/graph/:id?game=osrs|rs3 ──
router.get("/graph/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const game = req.query.game === "rs3" ? "rs3" : "osrs";

    if (game === "osrs") {
      const cacheKey = `ge:osrs:graph:${id}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const url = `${WIKI_PRICES_BASE}/timeseries?timestep=6h&id=${encodeURIComponent(id)}`;
      const data = await fetchJson(url);
      cache.set(cacheKey, data, TTL_10M);
      return res.json(data);
    }

    // RS3: legacy API (best-effort)
    const cacheKey = `ge:rs3:graph:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    try {
      const url = `${RS3_GE_BASE}/api/graph/${encodeURIComponent(id)}.json`;
      const data = await fetchJson(url, "RS-Player-Tracker/1.0");
      cache.set(cacheKey, data, TTL_1H);
      res.json(data);
    } catch {
      res.status(503).json({ error: "RS3 GE data temporarily unavailable" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/ge/image/:id?game=osrs|rs3 ──
router.get("/image/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const game = req.query.game === "rs3" ? "rs3" : "osrs";
    const base = game === "rs3" ? RS3_GE_BASE : "https://services.runescape.com/m=itemdb_oldschool";
    const url = `${base}/obj_big.gif?id=${encodeURIComponent(id)}`;
    await pipeImage(url, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
