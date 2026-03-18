const { Router } = require("express");
const { connectDB, PlayerCount } = require("../db");

const router = Router();

const DAY = 24 * 60 * 60 * 1000;

function cutoff(days) {
  return new Date(Date.now() - days * DAY);
}

function avgProject(field) {
  return { $round: [`$${field}`, 0] };
}

async function rawQuery(since, filter) {
  return PlayerCount.find({ timestamp: { $gte: since }, ...filter })
    .sort({ timestamp: 1 })
    .select("-_id timestamp total_players osrs rs3")
    .lean();
}

async function groupedQuery(since, groupId, filter) {
  return PlayerCount.aggregate([
    { $match: { timestamp: { $gte: since }, ...filter } },
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

const OSRS_FILTER = { osrs: { $gt: 0 } };
const RS3_FILTER  = { rs3:  { $gt: 0 } };

const RANGE_CONFIG = {
  "24h": (f) => rawQuery(cutoff(1),   f),
  "7d":  (f) => rawQuery(cutoff(7),   f),
  "30d": (f) => groupedQuery(cutoff(30),  HOURLY_ID, f),
  "6m":  (f) => groupedQuery(cutoff(182), DAILY_ID,  f),
  "1y":  (f) => groupedQuery(cutoff(365), DAILY_ID,  f),
  all:   (f) => groupedQuery(new Date(0), WEEKLY_ID, f),
};

router.get("/", async (req, res) => {
  const { range } = req.query;

  if (!range || !RANGE_CONFIG[range]) {
    return res.status(400).json({ error: "Invalid or missing range. Use: 24h, 7d, 30d, 6m, 1y, all" });
  }

  try {
    await connectDB();
    const [osrs, rs3] = await Promise.all([
      RANGE_CONFIG[range](OSRS_FILTER),
      RANGE_CONFIG[range](RS3_FILTER),
    ]);
    res.json({ osrs, rs3 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
