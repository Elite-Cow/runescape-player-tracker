// One-time backfill script: pulls RS3 player counts from RunePixels API (2023–now).
// Also deletes stale rs3-only records (osrs=0) from the old TempleOSRS ingest.
//
// Usage (from the api/ directory):
//   node backfill-rs3.js

require("dotenv").config();
const https = require("https");
const mongoose = require("mongoose");

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Ensure api/.env exists with your connection string.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const collection = mongoose.connection.db.collection("player_counts");

  // --- Delete stale rs3-only records from old TempleOSRS ingest ---
  const { deletedCount } = await collection.deleteMany({ osrs: 0, rs3: { $gt: 0 } });
  console.log(`Deleted ${deletedCount} stale RS3-only records (osrs=0).`);

  // --- Backfill RunePixels data from Jan 2023 to current month ---
  const now = new Date();
  let totalInserted = 0;
  let month = new Date(Date.UTC(2023, 0, 1)); // Jan 2023

  while (month <= now) {
    const m = month.getUTCMonth() + 1;
    const y = month.getUTCFullYear();
    const label = `${y}-${String(m).padStart(2, "0")}`;

    process.stdout.write(`Fetching ${label}... `);

    try {
      const body = await httpGet(`https://api.runepixels.com/players/online?month=${m}&year=${y}`);
      const data = JSON.parse(body);

      if (!Array.isArray(data) || data.length === 0) {
        console.log("no data");
      } else {
        const docs = data.map((d) => ({
          timestamp: new Date(d.createdAt),
          rs3: d.count,
          osrs: 0,
          total_players: d.count,
        }));

        let inserted = 0;
        try {
          const result = await collection.insertMany(docs, { ordered: false });
          inserted = result.insertedCount;
        } catch (err) {
          inserted = err.result?.insertedCount ?? 0;
        }

        totalInserted += inserted;
        console.log(`${inserted}/${data.length} inserted`);
      }
    } catch (err) {
      console.log(`error: ${err.message}`);
    }

    month.setUTCMonth(month.getUTCMonth() + 1);
    await sleep(200); // be polite to the API
  }

  console.log(`\nDone. Total RS3 records inserted: ${totalInserted}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
