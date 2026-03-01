const { Router } = require("express");
const { connectDB, PlayerCount } = require("../db");

const router = Router();

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const [osrsDoc, rs3Doc] = await Promise.all([
      PlayerCount.findOne({ osrs: { $gt: 0 } }).sort({ timestamp: -1 }).lean(),
      PlayerCount.findOne({ rs3:  { $gt: 0 } }).sort({ timestamp: -1 }).lean(),
    ]);

    if (!osrsDoc) return res.status(404).json({ error: "No data found" });

    res.json({
      timestamp:    osrsDoc.timestamp,
      osrs:         osrsDoc.osrs,
      total_players: osrsDoc.total_players,
      rs3:          rs3Doc ? rs3Doc.rs3 : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
