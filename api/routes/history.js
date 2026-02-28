const { Router } = require("express");
const { connectDB, PlayerCount } = require("../db");

const router = Router();

const DAY = 24 * 60 * 60 * 1000;

function cutoff(days) {
  return new Date(Date.now() - days * DAY);
}

const round = { $round: ["$$val", 0] };

function avgProject(field) {
  return { $round: [`$${field}`, 0] };
}

async function rawQuery(since) {
  return PlayerCount.find({ timestamp: { $gte: since } })
    .sort({ timestamp: 1 })
    .select("-_id timestamp total_players osrs rs3")
    .lean();
}

async function groupedQuery(since, groupId) {
  return PlayerCount.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: groupId,
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
        total_players: avgProject("total_players"),
        osrs: avgProject("osrs"),
        rs3: avgProject("rs3"),
      },
    },
  ]);
}

const HOURLY_ID = {
  y: { $year: "$timestamp" },
  m: { $month: "$timestamp" },
  d: { $dayOfMonth: "$timestamp" },
  h: { $hour: "$timestamp" },
};

const DAILY_ID = {
  y: { $year: "$timestamp" },
  m: { $month: "$timestamp" },
  d: { $dayOfMonth: "$timestamp" },
};

const WEEKLY_ID = {
  y: { $isoWeekYear: "$timestamp" },
  w: { $isoWeek: "$timestamp" },
};

const RANGE_CONFIG = {
  "24h": () => rawQuery(cutoff(1)),
  "7d": () => rawQuery(cutoff(7)),
  "30d": () => groupedQuery(cutoff(30), HOURLY_ID),
  "6m": () => groupedQuery(cutoff(182), DAILY_ID),
  "1y": () => groupedQuery(cutoff(365), DAILY_ID),
  all: () => groupedQuery(new Date(0), WEEKLY_ID),
};

router.get("/", async (req, res) => {
  const { range } = req.query;

  if (!range || !RANGE_CONFIG[range]) {
    return res.status(400).json({ error: "Invalid or missing range. Use: 24h, 7d, 30d, 6m, 1y, all" });
  }

  try {
    await connectDB();
    const data = await RANGE_CONFIG[range]();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
