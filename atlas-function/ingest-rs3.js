// MongoDB Atlas Scheduled Function — RS3 player count ingestion via RunePixels API
// Trigger: 0 * * * * (hourly UTC)
// Linked data source: mongodb-atlas → runescape_stats.player_counts
//
// Fetches RS3 player counts from the RunePixels public API:
//   https://api.runepixels.com/players/online?month=M&year=Y
//   Response: [{ createdAt: "2026-03-01T00:00:00Z", count: 24080 }, ...]
//
// Cutoff is tracked in runescape_stats.rs3_cursor (a regular collection),
// because Atlas App Services cannot reliably query Time Series measurement fields.

exports = async function () {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year  = now.getUTCFullYear();

  const URL = `https://api.runepixels.com/players/online?month=${month}&year=${year}`;

  const HEADERS = {
    "User-Agent": ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"],
    "Accept": ["application/json"],
  };

  // --- Fetch RunePixels API ---
  let data;
  try {
    const res = await context.http.get({ url: URL, headers: HEADERS });
    data = JSON.parse(res.body.text());
  } catch (err) {
    console.error("Failed to fetch RunePixels:", err.message);
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.error("No data returned from RunePixels for", year, month);
    return;
  }

  const db = context.services.get("MongoDB").db("runescape_stats");
  const collection = db.collection("player_counts");
  const cursorCol  = db.collection("rs3_cursor");

  // --- Read cutoff from dedicated cursor document ---
  const cursor = await cursorCol.findOne({ _id: "rs3_ingest_cursor" });
  const cutoff = cursor?.lastTimestamp ?? new Date(0);
  console.log("Cutoff (from rs3_cursor):", cutoff);
  console.log("Last 3 RunePixels records:", JSON.stringify(data.slice(-3)));

  const newDocs = data
    .filter((d) => new Date(d.createdAt) > cutoff)
    .map((d) => ({
      timestamp: new Date(d.createdAt),
      rs3: d.count,
      osrs: 0,
      total_players: d.count,
    }));

  console.log(`Records newer than cutoff: ${newDocs.length}`);

  if (newDocs.length === 0) {
    console.log("No new RS3 records to insert.");
    return;
  }

  let inserted = 0;
  for (const doc of newDocs) {
    try {
      await collection.insertOne(doc);
      inserted++;
    } catch (err) {
      console.error("Insert failed:", err.message);
    }
  }

  // --- Advance cursor to the latest timestamp we just inserted ---
  if (inserted > 0) {
    const lastTimestamp = newDocs[newDocs.length - 1].timestamp;
    await cursorCol.updateOne(
      { _id: "rs3_ingest_cursor" },
      { $set: { lastTimestamp } },
      { upsert: true }
    );
    console.log("Cursor advanced to:", lastTimestamp);
  }

  console.log(`Done. Inserted ${inserted} new RS3 records.`);
};
