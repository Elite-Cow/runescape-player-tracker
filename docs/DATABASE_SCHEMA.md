# Database Schema

Database:
runescape_stats

Collection:
player_counts

Collection Type:
Time Series
- timeField: timestamp
- metaField: (none)
- granularity: minutes
- expireAfterSeconds: (none — keep all data)

Document:

{
  timestamp: Date,
  total_players: Number,
  osrs: Number,
  rs3: Number
}

Note:
Do NOT create a manual index on timestamp.
The Time Series collection manages its own internal index on the timeField.