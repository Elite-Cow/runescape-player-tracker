// MongoDB Atlas Scheduled Function
// Trigger: */5 * * * * (UTC)
// Linked data source: mongodb-atlas → runescape_stats.player_counts
//
// OSRS player count is scraped from:
//   https://oldschool.runescape.com/  ("There are currently X people playing!")
// RS3 is stored as 0 until a reliable source is found.
// total_players = osrs (rs3 omitted for now)

exports = async function () {
  const OSRS_URL = "https://oldschool.runescape.com/";

  const HEADERS = {
    "User-Agent": ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"],
    "Accept": ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"],
    "Accept-Language": ["en-US,en;q=0.5"],
  };

  // --- Fetch OSRS homepage ---
  let osrsHtml;
  try {
    const osrsRes = await context.http.get({ url: OSRS_URL, headers: HEADERS });
    osrsHtml = osrsRes.body.text();
  } catch (err) {
    console.error("Network error fetching OSRS player count:", err.message);
    return;
  }

  // --- Parse OSRS players ---
  // The page contains a string like: "There are currently 180,038 people playing!"
  const osrsMatch = osrsHtml.match(/there are currently ([\d,]+) (?:people|players)/i);
  if (!osrsMatch) {
    console.error("Failed to parse OSRS player count from OSRS page");
    return;
  }

  const osrs = parseInt(osrsMatch[1].replace(/,/g, ""), 10);

  if (isNaN(osrs)) {
    console.error("Parsed NaN — aborting", { osrs });
    return;
  }

  // --- Insert document ---
  const collection = context.services
    .get("MongoDB")
    .db("runescape_stats")
    .collection("player_counts");

  try {
    await collection.insertOne({
      timestamp: new Date(),
      total_players: osrs,
      osrs,
      rs3: 0,
    });
    console.log(`Inserted: osrs=${osrs}`);
  } catch (err) {
    console.error("Insert failed:", err.message);
  }
};
