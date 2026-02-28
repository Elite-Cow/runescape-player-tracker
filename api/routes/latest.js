const { Router } = require("express");
const { connectDB, PlayerCount } = require("../db");

const router = Router();

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const doc = await PlayerCount.findOne().sort({ timestamp: -1 }).lean();
    if (!doc) return res.status(404).json({ error: "No data found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
