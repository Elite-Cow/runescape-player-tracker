const { Router } = require("express");
const { connectDB, PlayerCount } = require("../db");

const router = Router();
const DAY = 24 * 60 * 60 * 1000;

router.get("/", async (req, res) => {
  try {
    await connectDB();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - DAY);

    const [allTime, recentData] = await Promise.all([
      // All-time peaks and lows
      PlayerCount.aggregate([
        { $match: { osrs: { $gt: 0 }, rs3: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            peakTotal: { $max: "$total_players" },
            lowTotal: { $min: "$total_players" },
            peakOsrs: { $max: "$osrs" },
            lowOsrs: { $min: "$osrs" },
            peakRs3: { $max: "$rs3" },
            lowRs3: { $min: "$rs3" },
          },
        },
      ]),
      // Last 24h data for delta computation
      PlayerCount.find({
        timestamp: { $gte: oneDayAgo },
        osrs: { $gt: 0 },
        rs3: { $gt: 0 },
      })
        .sort({ timestamp: 1 })
        .select("-_id timestamp total_players osrs rs3")
        .lean(),
    ]);

    const stats = allTime[0] || {};
    const first = recentData[0];
    const last = recentData[recentData.length - 1];

    const delta = first && last
      ? {
          total: last.total_players - first.total_players,
          osrs: last.osrs - first.osrs,
          rs3: last.rs3 - first.rs3,
        }
      : { total: 0, osrs: 0, rs3: 0 };

    res.json({
      peaks: {
        total: stats.peakTotal || 0,
        osrs: stats.peakOsrs || 0,
        rs3: stats.peakRs3 || 0,
      },
      lows: {
        total: stats.lowTotal || 0,
        osrs: stats.lowOsrs || 0,
        rs3: stats.lowRs3 || 0,
      },
      delta,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
