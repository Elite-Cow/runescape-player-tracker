const { Router } = require("express");
const { connectDB, PlayerCount } = require("../db");

const router = Router();

const DAILY_ID = {
  y: { $year: "$timestamp" },
  m: { $month: "$timestamp" },
  d: { $dayOfMonth: "$timestamp" },
};

// GET /api/records/history?days=30
router.get("/history", async (req, res) => {
  try {
    await connectDB();

    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const data = await PlayerCount.aggregate([
      { $match: { timestamp: { $gte: since }, osrs: { $gt: 0 }, rs3: { $gt: 0 } } },
      {
        $group: {
          _id: DAILY_ID,
          date: { $min: "$timestamp" },
          peakTotal: { $max: "$total_players" },
          peakOsrs: { $max: "$osrs" },
          peakRs3: { $max: "$rs3" },
          lowTotal: { $min: "$total_players" },
          lowOsrs: { $min: "$osrs" },
          lowRs3: { $min: "$rs3" },
          avgTotal: { $avg: "$total_players" },
          avgOsrs: { $avg: "$osrs" },
          avgRs3: { $avg: "$rs3" },
          samples: { $sum: 1 },
        },
      },
      { $sort: { date: -1 } },
      {
        $project: {
          _id: 0,
          date: 1,
          peakTotal: 1,
          peakOsrs: 1,
          peakRs3: 1,
          lowTotal: 1,
          lowOsrs: 1,
          lowRs3: 1,
          avgTotal: { $round: ["$avgTotal", 0] },
          avgOsrs: { $round: ["$avgOsrs", 0] },
          avgRs3: { $round: ["$avgRs3", 0] },
          samples: 1,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/records/all-time
router.get("/all-time", async (req, res) => {
  try {
    await connectDB();

    const [peaks, lows] = await Promise.all([
      // Find the documents with the highest values
      Promise.all([
        PlayerCount.findOne({ total_players: { $gt: 0 } }).sort({ total_players: -1 }).select("-_id timestamp total_players osrs rs3").lean(),
        PlayerCount.findOne({ osrs: { $gt: 0 } }).sort({ osrs: -1 }).select("-_id timestamp total_players osrs rs3").lean(),
        PlayerCount.findOne({ rs3: { $gt: 0 } }).sort({ rs3: -1 }).select("-_id timestamp total_players osrs rs3").lean(),
      ]),
      // Find the documents with the lowest values
      Promise.all([
        PlayerCount.findOne({ total_players: { $gt: 0 } }).sort({ total_players: 1 }).select("-_id timestamp total_players osrs rs3").lean(),
        PlayerCount.findOne({ osrs: { $gt: 0 } }).sort({ osrs: 1 }).select("-_id timestamp total_players osrs rs3").lean(),
        PlayerCount.findOne({ rs3: { $gt: 0 } }).sort({ rs3: 1 }).select("-_id timestamp total_players osrs rs3").lean(),
      ]),
    ]);

    res.json({
      peaks: {
        total: peaks[0],
        osrs: peaks[1],
        rs3: peaks[2],
      },
      lows: {
        total: lows[0],
        osrs: lows[1],
        rs3: lows[2],
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
