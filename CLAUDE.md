# RuneScape Player Count Tracker

## Project Purpose

A website to track and visualize RuneScape player counts over time.

Data Sources:
- https://www.runescape.com/community (RS3 players — <span id="playerCount">)
- https://oldschool.runescape.com/ (OSRS players — "There are currently X people playing!")

Important:
Total player count is derived:

total_players = RS3 + OSRS

This must be computed during ingestion and stored.

---

## Tech Stack

Backend:
- Node.js
- Express
- MongoDB Atlas

Ingestion:
- MongoDB Atlas Scheduled Trigger (*/5 * * * *)
- Atlas Function (JavaScript)

Frontend:
- React
- Chart.js

Hosting:
- Vercel (API + frontend)

---

## API Routes

GET /api/latest
GET /api/history?range=
GET /api/availability

Allowed ranges:
24h
7d
30d
6m
1y
all

---

## Chart Requirements

Display 3 lines:
- Total Players
- OSRS Players
- RS3 Players

Time ranges must be disabled if insufficient data.

---

## Range Availability Logic

Enable range only if dataset age >= threshold:

24h → 1 day
7d → 7 days
30d → 30 days
6m → 182 days
1y → 365 days
all → if any data exists

---

## Aggregation Strategy

24h → Raw
7d → Raw
30d → Hourly average
6m → Daily average
1y → Daily average
all → Weekly average

Never render > 10,000 points.

---

## Data Rules

- Store timestamps in UTC
- Store integers (not strings)
- total_players >= osrs
- rs3 = total_players - osrs
- No partial inserts
- Abort on validation failure

---

## Development Commands

npm install
npm run dev
npm run build

---

## Code Standards

- Use async/await
- Use modular route structure
- Use environment variables for credentials
- Do not expose MongoDB URI to frontend
- Handle all errors explicitly