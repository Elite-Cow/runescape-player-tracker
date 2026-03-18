const { Router } = require("express");
const https = require("https");

const router = Router();

router.get("/", (req, res) => {
  const url = "https://www.runescape.com/player_count.js?varname=iPlayerCount&callback=cb&_=" + Date.now();

  const options = {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Referer": "https://www.runescape.com/community",
    },
  };

  https.get(url, options, (rs3res) => {
    let data = "";
    rs3res.on("data", (chunk) => (data += chunk));
    rs3res.on("end", () => res.json({ status: rs3res.statusCode, body: data.slice(0, 200) }));
  }).on("error", (err) => res.json({ error: err.message }));
});

module.exports = router;
