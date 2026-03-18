const { Router } = require("express");
const https = require("https");
const cache = require("../_lib/cache");
const { parseHiscores, computeCombatLevel } = require("../_lib/hiscores-parser");

const router = Router();

const TTL_5M = 5 * 60 * 1000;
const USER_AGENT = "RS-Player-Tracker/1.0 (https://rs-player-tracker.vercel.app; rs-player-tracker@users.noreply.github.com)";

const URLS = {
  osrs: (name) =>
    `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=${encodeURIComponent(name)}`,
  rs3: (name) =>
    `https://secure.runescape.com/m=hiscore/index_lite.ws?player=${encodeURIComponent(name)}`,
};

function fetchUrl(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const req = https
      .get(url, { headers: { "User-Agent": USER_AGENT } }, (res) => {
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

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
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

  const cacheKey = `hiscores:${game}:${player.toLowerCase()}`;
  const cached = cache.get(cacheKey);
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
      skills: parsed.skills.slice(1),
      activities: parsed.activities,
    };

    cache.set(cacheKey, result, TTL_5M);
    res.json(result);
  } catch (err) {
    const status = err.message === "Player not found" ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// GET /api/hiscores/ranking/:game?table=0&size=50
router.get("/ranking/:game", async (req, res) => {
  const { game } = req.params;
  const { table = 0, size = 50 } = req.query;

  if (!["osrs", "rs3"].includes(game)) {
    return res.status(400).json({ error: "Game must be 'osrs' or 'rs3'" });
  }

  const clampedSize = Math.min(Math.max(1, parseInt(size, 10) || 50), 50);
  const cacheKey = `ranking:${game}:${table}:${clampedSize}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const base = game === "osrs"
      ? "https://secure.runescape.com/m=hiscore_oldschool"
      : "https://secure.runescape.com/m=hiscore";
    const url = `${base}/ranking.json?table=${encodeURIComponent(table)}&category=0&size=${clampedSize}`;
    const body = await fetchUrl(url);

    // Validate response is JSON before parsing
    const trimmed = body.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      throw new Error("Rankings temporarily unavailable");
    }

    const data = JSON.parse(trimmed);
    cache.set(cacheKey, data, TTL_5M);
    res.json(data);
  } catch (err) {
    if (err.message === "Rankings temporarily unavailable" || err.message === "Request timed out") {
      res.status(503).json({ error: err.message, rankings: [] });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
