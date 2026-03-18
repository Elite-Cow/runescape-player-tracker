const { Router } = require("express");
const { connectDB, PlayerCount } = require("../db");

const router = Router();
const DAY = 24 * 60 * 60 * 1000;

const HOURLY_ID = {
  y: { $year: "$timestamp" },
  m: { $month: "$timestamp" },
  d: { $dayOfMonth: "$timestamp" },
  h: { $hour: "$timestamp" },
};

router.get("/", async (req, res) => {
  try {
    await connectDB();

    const since = new Date(Date.now() - DAY);

    const data = await PlayerCount.aggregate([
      { $match: { timestamp: { $gte: since }, osrs: { $gt: 0 }, rs3: { $gt: 0 } } },
      {
        $group: {
          _id: HOURLY_ID,
          timestamp: { $min: "$timestamp" },
          total_players: { $avg: "$total_players" },
          osrs: { $avg: "$osrs" },
          rs3: { $avg: "$rs3" },
        },
      },
      { $sort: { timestamp: 1 } },
      {
        $project: {
          _id: 0,
          timestamp: 1,
          total_players: { $round: ["$total_players", 0] },
          osrs: { $round: ["$osrs", 0] },
          rs3: { $round: ["$rs3", 0] },
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
