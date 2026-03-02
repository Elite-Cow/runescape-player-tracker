const { Router } = require("express");
const https = require("https");
const xml2js = require("xml2js");

const router = Router();
const parser = new xml2js.Parser({ explicitArray: false, trim: true });

const RS3_FEED  = "https://secure.runescape.com/m=news/latest_news.rss";
const OSRS_FEED = "https://secure.runescape.com/m=news/latest_news.rss?oldschool=true";

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/rss+xml, text/xml" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function stripHtml(str) {
  if (!str) return "";
  return str.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim().slice(0, 220);
}

function extractImage(item) {
  const mc = item["media:content"];
  if (mc && mc["$"] && mc["$"].url) return mc["$"].url;
  const mt = item["media:thumbnail"];
  if (mt && mt["$"] && mt["$"].url) return mt["$"].url;
  if (item.enclosure && item.enclosure["$"] && item.enclosure["$"].url) return item.enclosure["$"].url;
  return null;
}

async function fetchFeed(url, game) {
  try {
    const xml = await httpGet(url);
    const result = await parser.parseStringPromise(xml);
    const raw = result.rss.channel.item;
    const items = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    return items.map((item) => ({
      title:       item.title       || "",
      link:        item.link        || "",
      description: stripHtml(item.description),
      pubDate:     item.pubDate     || "",
      game,
      image:       extractImage(item),
    }));
  } catch (err) {
    console.error(`Failed to fetch ${game} news feed:`, err.message);
    return [];
  }
}

router.get("/", async (req, res) => {
  try {
    const [rs3, osrs] = await Promise.all([
      fetchFeed(RS3_FEED,  "rs3"),
      fetchFeed(OSRS_FEED, "osrs"),
    ]);

    const articles = [...rs3, ...osrs].sort(
      (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
    );

    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
