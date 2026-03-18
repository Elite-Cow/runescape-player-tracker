const { Router } = require("express");
const { connectDB, PlayerCount } = require("../db");

const router = Router();

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const doc = await PlayerCount.findOne({
      osrs: { $gt: 0 },
      rs3: { $gt: 0 },
    }).sort({ timestamp: -1 }).lean();

    if (!doc) return res.status(404).json({ error: "No data found" });

    res.json({
      timestamp:     doc.timestamp,
      osrs:          doc.osrs,
      rs3:           doc.rs3,
      total_players: doc.total_players,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
