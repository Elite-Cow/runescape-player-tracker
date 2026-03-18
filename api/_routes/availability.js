const { Router } = require("express");
const { connectDB, PlayerCount } = require("../db");

const router = Router();

const DAY = 24 * 60 * 60 * 1000;

const THRESHOLDS = {
  "24h": 0,
  "7d": 7 * DAY,
  "30d": 30 * DAY,
  "6m": 182 * DAY,
  "1y": 365 * DAY,
  all: 0,
};

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const oldest = await PlayerCount.findOne().sort({ timestamp: 1 }).select("timestamp").lean();

    if (!oldest) {
      const disabled = Object.fromEntries(Object.keys(THRESHOLDS).map((k) => [k, false]));
      return res.json(disabled);
    }

    const age = Date.now() - new Date(oldest.timestamp).getTime();

    const availability = Object.fromEntries(
      Object.entries(THRESHOLDS).map(([range, threshold]) => [
        range,
        threshold === 0 ? true : age >= threshold,
      ])
    );

    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
