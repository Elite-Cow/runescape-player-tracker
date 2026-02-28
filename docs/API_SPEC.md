# API Specification

GET /api/latest
Return latest document.

GET /api/history?range=
Return aggregated dataset.

GET /api/availability
Return enabled/disabled ranges based on earliest timestamp.

Aggregation:

30d → group by hour
6m → group by day
1y → group by day
all → group by ISO week