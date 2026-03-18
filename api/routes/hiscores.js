const { Router } = require("express");
const https = require("https");
const { parseHiscores, computeCombatLevel } = require("../lib/hiscores-parser");

const router = Router();

// Simple in-memory cache: key -> { data, expiry }
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
  // Evict old entries if cache grows too large
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (v.expiry < now) cache.delete(k);
    }
  }
}

const URLS = {
  osrs: (name) =>
    `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=${encodeURIComponent(name)}`,
  rs3: (name) =>
    `https://secure.runescape.com/m=hiscore/index_lite.ws?player=${encodeURIComponent(name)}`,
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "RS-Player-Tracker/1.0" } }, (res) => {
        if (res.statusCode === 404) {
          return reject(new Error("Player not found"));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Hiscores returned ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

// GET /api/hiscores/:game/:player
router.get("/:game/:player", async (req, res) => {
  const { game, player } = req.params;

  if (!["osrs", "rs3"].includes(game)) {
    return res.status(400).json({ error: "Game must be 'osrs' or 'rs3'" });
  }

  if (!player || player.length > 12) {
    return res.status(400).json({ error: "Invalid player name" });
  }

  const cacheKey = `${game}:${player.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = URLS[game](player);
    const csv = await fetchUrl(url);
    const parsed = parseHiscores(csv, game);

    const overall = parsed.skills[0] || null;
    const combatLevel = computeCombatLevel(parsed.skills);

    const result = {
      player,
      game,
      overall,
      combatLevel,
      skills: parsed.skills.slice(1), // exclude "Overall" from skills list
      activities: parsed.activities,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    const status = err.message === "Player not found" ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
