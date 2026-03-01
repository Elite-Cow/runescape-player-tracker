// MongoDB Atlas Scheduled Function — RS3 player count ingestion
// Trigger: 0 0 * * * (daily at midnight UTC) — TempleOSRS updates weekly
// Linked data source: mongodb-atlas → runescape_stats.player_counts
//
// Scrapes RS3 (EOC) player counts from TempleOSRS's embedded historical arrays.
// Only inserts entries not already present. Does NOT touch OSRS data.

exports = async function () {
  const URL = "https://templeosrs.com/players/overview.php";

  const HEADERS = {
    "User-Agent": ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"],
    "Accept": ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"],
  };

  // --- Fetch TempleOSRS page ---
  let html;
  try {
    const res = await context.http.get({ url: URL, headers: HEADERS });
    html = res.body.text();
  } catch (err) {
    console.error("Failed to fetch TempleOSRS:", err.message);
    return;
  }

  // --- Extract arrays ---
  const eocMatch   = html.match(/var\s+eocPlayerCount\s*=\s*(\[[\d,\s]+\])/);
  const datesMatch = html.match(/var\s+osrsDates\s*=\s*(\[(?:"[^"]*"(?:,\s*"[^"]*")*)?\])/);

  if (!eocMatch || !datesMatch) {
    console.error("Could not find RS3 data arrays. eocPlayerCount found:", !!eocMatch, "osrsDates found:", !!datesMatch);
    return;
  }

  const eocCounts = JSON.parse(eocMatch[1]);
  const dates     = JSON.parse(datesMatch[1]);

  if (eocCounts.length !== dates.length) {
    console.error(`Array length mismatch: ${eocCounts.length} counts vs ${dates.length} dates`);
    return;
  }

  // --- Parse "DD/MM/YYYY HH:MM:SS" → UTC Date ---
  function parseDate(str) {
    const [datePart, timePart = "00:00:00"] = str.trim().split(" ");
    const [dd, mm, yyyy] = datePart.split("/");
    return new Date(`${yyyy}-${mm}-${dd}T${timePart}Z`);
  }

  // --- Only check the most recent 5 entries to avoid full re-scan ---
  const recent = [];
  for (let i = eocCounts.length - 5; i < eocCounts.length; i++) {
    const timestamp = parseDate(dates[i]);
    if (isNaN(timestamp.getTime())) {
      console.warn(`Skipping invalid date at index ${i}: "${dates[i]}"`);
      continue;
    }
    recent.push({ timestamp, rs3: eocCounts[i] });
  }

  const collection = context.services
    .get("MongoDB")
    .db("runescape_stats")
    .collection("player_counts");

  // --- Insert any entries not already in DB ---
  let inserted = 0;
  for (const entry of recent) {
    const existing = await collection.findOne({ timestamp: entry.timestamp, rs3: { $gt: 0 } });
    if (existing) continue;

    try {
      await collection.insertOne({
        timestamp: entry.timestamp,
        rs3: entry.rs3,
        osrs: 0,
        total_players: entry.rs3,
      });
      inserted++;
      console.log(`Inserted RS3: timestamp=${entry.timestamp.toISOString()}, rs3=${entry.rs3}`);
    } catch (err) {
      console.error("Insert failed:", err.message);
    }
  }

  console.log(`Done. Inserted ${inserted} new RS3 records.`);
};
