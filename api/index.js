require("dotenv").config();
const express = require("express");
const cors = require("cors");

const latestRouter = require("./routes/latest");
const historyRouter = require("./routes/history");
const availabilityRouter = require("./routes/availability");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/latest", latestRouter);
app.use("/api/history", historyRouter);
app.use("/api/availability", availabilityRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server when run directly (local dev); export for Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

module.exports = app;
