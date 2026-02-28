# Deployment Plan

1. Create MongoDB Atlas cluster
2. Create database runescape_stats
3. Create Time Series collection player_counts
   - timeField: timestamp
   - metaField: (leave blank)
   - granularity: minutes
   - expireAfterSeconds: (leave blank)
   - Do NOT add a manual index on timestamp
4. Add Atlas Function
5. Add Scheduled Trigger
6. Deploy Express API to Vercel
7. Deploy frontend to Vercel
8. Configure environment variables
9. Connect domain