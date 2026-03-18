const { Router } = require("express");
const https = require("https");
const cache = require("../_lib/cache");

const router = Router();
const TTL_10M = 10 * 60 * 1000;
const TTL_1H = 60 * 60 * 1000;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "RS-Player-Tracker/1.0 (https://rs-player-tracker.vercel.app)" } }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Wiki API returned ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error("Invalid JSON from Wiki API")); }
        });
      })
      .on("error", reject);
  });
}

// GET /api/wiki/search?q=&limit=10
router.get("/search", async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ error: "Missing search query 'q'" });

    const cacheKey = `wiki:rs3:search:${q}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://runescape.wiki/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}&format=json`;
    const data = await fetchJson(url);
    cache.set(cacheKey, data, TTL_10M);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/wiki/page/:title
router.get("/page/:title", async (req, res) => {
  try {
    const { title } = req.params;
    const cacheKey = `wiki:rs3:page:${title}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://runescape.wiki/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=200&format=json`;
    const data = await fetchJson(url);
    cache.set(cacheKey, data, TTL_1H);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/wiki/osrs/search?q=&limit=10
router.get("/osrs/search", async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ error: "Missing search query 'q'" });

    const cacheKey = `wiki:osrs:search:${q}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://oldschool.runescape.wiki/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}&format=json`;
    const data = await fetchJson(url);
    cache.set(cacheKey, data, TTL_10M);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/wiki/osrs/page/:title
router.get("/osrs/page/:title", async (req, res) => {
  try {
    const { title } = req.params;
    const cacheKey = `wiki:osrs:page:${title}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://oldschool.runescape.wiki/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=200&format=json`;
    const data = await fetchJson(url);
    cache.set(cacheKey, data, TTL_1H);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
