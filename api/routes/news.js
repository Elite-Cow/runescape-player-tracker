const { Router } = require("express");
const https = require("https");
const xml2js = require("xml2js");

const router = Router();
const parser = new xml2js.Parser({ explicitArray: false, trim: true });

const RS3_FEED  = "https://secure.runescape.com/m=news/latest_news.rss";
const OSRS_FEED = "https://secure.runescape.com/m=news/latest_news.rss?oldschool=true";

let cache = { data: null, expiresAt: 0 };

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      "User-Agent": "rs-tracker/1.0 by rs-tracker-app",
      "Accept": "application/rss+xml, application/atom+xml, text/xml",
    };
    https
      .get(url, { headers: { ...defaultHeaders, ...headers } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function stripHtml(str) {
  if (!str) return "";
  return str.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 220);
}

function extractImage(item) {
  const mc = item["media:content"];
  if (mc && mc["$"] && mc["$"].url) return mc["$"].url;
  const mt = item["media:thumbnail"];
  if (mt && mt["$"] && mt["$"].url) return mt["$"].url;
  if (item.enclosure && item.enclosure["$"] && item.enclosure["$"].url) return item.enclosure["$"].url;
  return null;
}

async function fetchOfficialFeed(url, game) {
  const sourceName = game === "rs3" ? "RS3 News" : "OSRS News";
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
      sourceType:  "official",
      sourceName,
    }));
  } catch (err) {
    console.error(`Failed to fetch official ${game} feed:`, err.message);
    return [];
  }
}

async function fetchYouTubeFeed(channelId, game, sourceName) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  try {
    const xml = await httpGet(url);
    const result = await parser.parseStringPromise(xml);
    const raw = result.feed.entry;
    if (!raw) return [];
    const entries = Array.isArray(raw) ? raw : [raw];
    return entries.map((entry) => {
      const mediaGroup = entry["media:group"] || {};
      const thumbnail = mediaGroup["media:thumbnail"];
      const image = (thumbnail && thumbnail["$"] && thumbnail["$"].url) ? thumbnail["$"].url : null;
      const descRaw = mediaGroup["media:description"];
      const description = stripHtml(Array.isArray(descRaw) ? descRaw[0] : (descRaw || ""));
      const linkEl = entry.link;
      const link = linkEl && linkEl["$"] ? linkEl["$"].href : (linkEl || "");
      return {
        title:       entry.title       || "",
        link,
        description,
        pubDate:     entry.published   || "",
        game,
        image,
        sourceType:  "youtube",
        sourceName,
      };
    });
  } catch (err) {
    console.error(`Failed to fetch YouTube feed for ${sourceName}:`, err.message);
    return [];
  }
}

async function fetchRedditFeed(subreddit, game) {
  const url = `https://www.reddit.com/r/${subreddit}/.rss`;
  const sourceName = `r/${subreddit}`;
  try {
    const xml = await httpGet(url);
    const result = await parser.parseStringPromise(xml);
    const raw = result.feed
      ? result.feed.entry
      : result.rss && result.rss.channel
        ? result.rss.channel.item
        : null;
    if (!raw) return [];
    const items = Array.isArray(raw) ? raw : [raw];
    return items.map((item) => {
      const image = extractImage(item) || null;
      const contentRaw = item.description || item.content;
      const contentStr = typeof contentRaw === "string"
        ? contentRaw
        : (contentRaw && contentRaw._ ? contentRaw._ : "");
      const description = stripHtml(contentStr);
      const linkEl = item.link;
      const link = typeof linkEl === "string"
        ? linkEl
        : linkEl && linkEl["$"] ? linkEl["$"].href : (item.id || "");
      return {
        title:       (item.title && typeof item.title === "object" ? item.title._ : item.title) || "",
        link,
        description,
        pubDate:     item.updated || item.pubDate || "",
        game,
        image,
        sourceType:  "reddit",
        sourceName,
      };
    });
  } catch (err) {
    console.error(`Failed to fetch Reddit feed for r/${subreddit}:`, err.message);
    return [];
  }
}

router.get("/", async (req, res) => {
  if (cache.data && Date.now() < cache.expiresAt) return res.json(cache.data);

  try {
    const results = await Promise.all([
      fetchOfficialFeed(RS3_FEED,  "rs3"),
      fetchOfficialFeed(OSRS_FEED, "osrs"),
      fetchYouTubeFeed("UCBMHm1nGBsZGJz80iFNnkBA", "rs3",  "RuneScape"),
      fetchYouTubeFeed("UC0j1MpbiTFHYrUjOTwifW_w", "osrs", "Old School RS"),
      fetchYouTubeFeed("UCRCAZyzIDJLwgBWh805AToQ", "rs3",  "Protoxx"),
      fetchYouTubeFeed("UC3bJPBjgzu_5OXbon8UejCQ", "rs3",  "Maikeru RS"),
      fetchYouTubeFeed("UCs-w7E2HZWwXmjt9RTvBB_A", "osrs", "Settled"),
      fetchYouTubeFeed("UC24mcJ1pow5eqFao5vKR-iA", "osrs", "B0aty"),
      fetchYouTubeFeed("UCfvX_nrQbx_8gg62twH_7hw", "osrs", "Torvesta"),
      fetchRedditFeed("runescape",  "rs3"),
      fetchRedditFeed("2007scape",  "osrs"),
      fetchRedditFeed("ironscape",  "osrs"),
    ]);

    const articles = results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    cache = { data: articles, expiresAt: Date.now() + 10 * 60 * 1000 };
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
