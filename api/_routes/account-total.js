const { Router } = require("express");
const https = require("https");
const cache = require("../_lib/cache");

const router = Router();
const TTL_1H = 60 * 60 * 1000;

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "RS-Player-Tracker/1.0" } }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Account total API returned ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

// GET /api/accounts/total
router.get("/total", async (req, res) => {
  try {
    const cacheKey = "accounts:total";
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = "https://secure.runescape.com/m=account-creation-reports/rsusertotal.ws";
    const text = await fetchText(url);

    // Response contains a number (total accounts created)
    const match = text.match(/(\d[\d,]*)/);
    if (!match) {
      return res.status(500).json({ error: "Failed to parse account total" });
    }

    const total = parseInt(match[1].replace(/,/g, ""), 10);
    const data = { total, fetchedAt: new Date().toISOString() };
    cache.set(cacheKey, data, TTL_1H);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
