const mongoose = require("mongoose");

let connected = false;

async function connectDB() {
  if (connected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  connected = true;
}

const schema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true },
    total_players: { type: Number, required: true },
    osrs: { type: Number, required: true },
    rs3: { type: Number, required: true },
  },
  { collection: "player_counts" }
);

const PlayerCount = mongoose.models.PlayerCount || mongoose.model("PlayerCount", schema);

module.exports = { connectDB, PlayerCount };
