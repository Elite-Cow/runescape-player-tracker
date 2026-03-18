const { Router } = require("express");
const https = require("https");
const cache = require("../_lib/cache");

const router = Router();

const TTL_5M = 5 * 60 * 1000;
const TTL_10M = 10 * 60 * 1000;
const TTL_1H = 60 * 60 * 1000;

const GE_BASES = {
  osrs: "https://services.runescape.com/m=itemdb_oldschool",
  rs3: "https://services.runescape.com/m=itemdb_rs",
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "RS-Player-Tracker/1.0" } }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`GE API returned ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error("Invalid JSON from GE API")); }
        });
      })
      .on("error", reject);
  });
}

function pipeImage(url, res) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "RS-Player-Tracker/1.0" } }, (upstream) => {
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

// GET /api/ge/item/:id?game=osrs|rs3
router.get("/item/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const game = req.query.game === "rs3" ? "rs3" : "osrs";
    const cacheKey = `ge:item:${game}:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `${GE_BASES[game]}/api/catalogue/detail.json?item=${encodeURIComponent(id)}`;
    const data = await fetchJson(url);
    cache.set(cacheKey, data, TTL_5M);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ge/graph/:id?game=osrs|rs3  — 180-day price history
router.get("/graph/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const game = req.query.game === "rs3" ? "rs3" : "osrs";
    const cacheKey = `ge:graph:${game}:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `${GE_BASES[game]}/api/graph/${encodeURIComponent(id)}.json`;
    const data = await fetchJson(url);
    cache.set(cacheKey, data, TTL_1H);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ge/search?q=&cat=1&page=1&game=osrs|rs3
router.get("/search", async (req, res) => {
  try {
    const { q, cat = 1, page = 1, game: g } = req.query;
    const game = g === "rs3" ? "rs3" : "osrs";
    if (!q) return res.status(400).json({ error: "Missing search query 'q'" });

    const cacheKey = `ge:search:${game}:${q}:${cat}:${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `${GE_BASES[game]}/api/catalogue/items.json?category=${encodeURIComponent(cat)}&alpha=${encodeURIComponent(q)}&page=${encodeURIComponent(page)}`;
    const data = await fetchJson(url);
    cache.set(cacheKey, data, TTL_10M);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ge/image/:id?game=osrs|rs3  — pipe item image
router.get("/image/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const game = req.query.game === "rs3" ? "rs3" : "osrs";
    const url = `${GE_BASES[game]}/obj_big.gif?id=${encodeURIComponent(id)}`;
    await pipeImage(url, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
