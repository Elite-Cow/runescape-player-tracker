const { Router } = require("express");
const https = require("https");
const cache = require("../_lib/cache");

const router = Router();
const TTL_5M = 5 * 60 * 1000;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "RS-Player-Tracker/1.0" } }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`RuneMetrics API returned ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error("Invalid JSON from RuneMetrics")); }
        });
      })
      .on("error", reject);
  });
}

// GET /api/runemetrics/profile/:player
router.get("/profile/:player", async (req, res) => {
  try {
    const { player } = req.params;
    const cacheKey = `rm:profile:${player.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://apps.runescape.com/runemetrics/profile/profile?user=${encodeURIComponent(player)}&activities=20`;
    const data = await fetchJson(url);

    if (data.error) {
      return res.status(404).json({ error: data.error });
    }

    cache.set(cacheKey, data, TTL_5M);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/runemetrics/quests/:player
router.get("/quests/:player", async (req, res) => {
  try {
    const { player } = req.params;
    const cacheKey = `rm:quests:${player.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://apps.runescape.com/runemetrics/quests?user=${encodeURIComponent(player)}`;
    const data = await fetchJson(url);

    if (data.error) {
      return res.status(404).json({ error: data.error });
    }

    cache.set(cacheKey, data, TTL_5M);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/runemetrics/xp/:player?skill=0
router.get("/xp/:player", async (req, res) => {
  try {
    const { player } = req.params;
    const skillId = req.query.skill || "0";
    const cacheKey = `rm:xp:${player.toLowerCase()}:${skillId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://apps.runescape.com/runemetrics/xp-monthly?searchName=${encodeURIComponent(player)}&skillid=${encodeURIComponent(skillId)}`;
    const data = await fetchJson(url);

    if (data.error) {
      return res.status(404).json({ error: data.error });
    }

    cache.set(cacheKey, data, TTL_5M);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
