// One-time backfill script: imports historical OSRS player counts from TempleOSRS.
// Populates rs3 from their eocPlayerCount array as well.
//
// Usage (from the api/ directory):
//   1. Create a .env file in api/ with: MONGODB_URI=your_connection_string
//   2. node backfill.js

require("dotenv").config();
const https = require("https");
const mongoose = require("mongoose");

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

// Parse "DD/MM/YYYY HH:MM:SS" → Date (UTC)
function parseDate(str) {
  const [datePart, timePart = "00:00:00"] = str.trim().split(" ");
  const [dd, mm, yyyy] = datePart.split("/");
  return new Date(`${yyyy}-${mm}-${dd}T${timePart}Z`);
}

async function main() {
  console.log("Fetching TempleOSRS page...");
  const html = await httpGet("https://templeosrs.com/players/overview.php");

  const osrsMatch = html.match(/var\s+osrsPlayerCount\s*=\s*(\[[\d,\s]+\])/);
  const datesMatch = html.match(/var\s+osrsDates\s*=\s*(\[(?:"[^"]*"(?:,\s*"[^"]*")*)?\])/);
  const eocMatch   = html.match(/var\s+eocPlayerCount\s*=\s*(\[[\d,\s]+\])/);

  if (!osrsMatch || !datesMatch) {
    console.error("Could not find data arrays in page — the page structure may have changed.");
    console.error("osrsPlayerCount found:", !!osrsMatch);
    console.error("osrsDates found:", !!datesMatch);
    process.exit(1);
  }

  const osrsCounts = JSON.parse(osrsMatch[1]);
  const dates      = JSON.parse(datesMatch[1]);
  const eocCounts  = eocMatch ? JSON.parse(eocMatch[1]) : null;

  console.log(`Parsed ${osrsCounts.length} OSRS records, ${dates.length} dates${eocCounts ? `, ${eocCounts.length} RS3 records` : ", no RS3 data"}`);

  if (osrsCounts.length !== dates.length) {
    console.error(`Array length mismatch: ${osrsCounts.length} counts vs ${dates.length} dates`);
    process.exit(1);
  }

  // Build documents
  const docs = [];
  for (let i = 0; i < osrsCounts.length; i++) {
    const timestamp = parseDate(dates[i]);
    if (isNaN(timestamp.getTime())) {
      console.warn(`Skipping invalid date at index ${i}: "${dates[i]}"`);
      continue;
    }
    const osrs = osrsCounts[i];
    const rs3  = eocCounts ? (eocCounts[i] ?? 0) : 0;
    docs.push({ timestamp, osrs, rs3, total_players: osrs + rs3 });
  }

  console.log(`Built ${docs.length} documents. Connecting to MongoDB...`);

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Create api/.env with your connection string.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const collection = mongoose.connection.db.collection("player_counts");

  // Insert in batches
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);
    try {
      const result = await collection.insertMany(batch, { ordered: false });
      inserted += result.insertedCount;
    } catch (err) {
      // ordered: false continues past duplicate key errors
      const count = err.result?.insertedCount ?? 0;
      inserted += count;
    }
    process.stdout.write(`\rProgress: ${Math.min(i + BATCH, docs.length)}/${docs.length}`);
  }

  console.log(`\nDone. Inserted ${inserted} new records.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
