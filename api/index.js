require("dotenv").config();
const express = require("express");
const cors = require("cors");

const latestRouter = require("./_routes/latest");
const historyRouter = require("./_routes/history");
const availabilityRouter = require("./_routes/availability");
const newsRouter = require("./_routes/news");
const recordsRouter = require("./_routes/records");
const sparklineRouter = require("./_routes/sparkline");
const hiscoresRouter = require("./_routes/hiscores");
const recordsHistoryRouter = require("./_routes/records-history");
const geRouter = require("./_routes/ge");
const runemetricsRouter = require("./_routes/runemetrics");
const playerDetailsRouter = require("./_routes/player-details");
const wikiRouter = require("./_routes/wiki");
const accountTotalRouter = require("./_routes/account-total");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/latest", latestRouter);
app.use("/api/history", historyRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/news", newsRouter);
app.use("/api/records", recordsRouter);
app.use("/api/sparkline", sparklineRouter);
app.use("/api/hiscores", hiscoresRouter);
app.use("/api/records", recordsHistoryRouter);
app.use("/api/ge", geRouter);
app.use("/api/runemetrics", runemetricsRouter);
app.use("/api/player", playerDetailsRouter);
app.use("/api/wiki", wikiRouter);
app.use("/api/accounts", accountTotalRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server when run directly (local dev); export for Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

module.exports = app;
