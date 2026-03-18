const { Router } = require("express");
const https = require("https");
const cache = require("../_lib/cache");

const router = Router();
const TTL_5M = 5 * 60 * 1000;
const TTL_10M = 10 * 60 * 1000;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "RS-Player-Tracker/1.0" } }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Player details API returned ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error("Invalid JSON from player details API")); }
        });
      })
      .on("error", reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "RS-Player-Tracker/1.0" } }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`API returned ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

// GET /api/player/details/:name
router.get("/details/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const cacheKey = `player:details:${name.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://secure.runescape.com/m=website-data/playerDetails.ws?names=%5B%22${encodeURIComponent(name)}%22%5D&callback=jQuery000`;
    const text = await fetchText(url);

    // Response is JSONP: jQuery000([{...}]);
    const match = text.match(/jQuery000\((\[.*\])\)/s);
    if (!match) return res.status(404).json({ error: "Player not found" });

    const data = JSON.parse(match[1]);
    cache.set(cacheKey, data, TTL_5M);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/player/avatar/:name  — pipe avatar image
router.get("/avatar/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const url = `https://secure.runescape.com/m=avatar-rs/${encodeURIComponent(name)}/chat.png`;

    https
      .get(url, { headers: { "User-Agent": "RS-Player-Tracker/1.0" } }, (upstream) => {
        if (upstream.statusCode !== 200) {
          return res.status(upstream.statusCode).end();
        }
        const ct = upstream.headers["content-type"] || "image/png";
        res.set("Content-Type", ct);
        res.set("Cache-Control", "public, max-age=3600");
        upstream.pipe(res);
      })
      .on("error", (err) => {
        res.status(500).json({ error: err.message });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/player/clan/:clanName  — CSV→JSON
router.get("/clan/:clanName", async (req, res) => {
  try {
    const { clanName } = req.params;
    const cacheKey = `player:clan:${clanName.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://services.runescape.com/m=clan-hiscores/members_lite.ws?clanName=${encodeURIComponent(clanName)}`;
    const csv = await fetchText(url);

    const lines = csv.trim().split("\n");
    // First line is header: "Clanmate,Clan Rank,Total XP,Kills"
    const members = lines.slice(1).map((line) => {
      const [name, rank, xp, kills] = line.split(",");
      return {
        name: (name || "").replace(/\xa0/g, " ").trim(),
        rank: (rank || "").trim(),
        xp: parseInt(xp, 10) || 0,
        kills: parseInt(kills, 10) || 0,
      };
    }).filter((m) => m.name);

    const data = { clanName, memberCount: members.length, members };
    cache.set(cacheKey, data, TTL_10M);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
