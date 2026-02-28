# Atlas Ingestion

Trigger:
*/5 * * * *
UTC timezone

Sources:
- RS3:  https://www.runescape.com/community
  <span id="playerCount" ...>206,547</span>
- OSRS: https://oldschool.runescape.com/
  "There are currently 180,038 people playing!"

total_players = rs3 + osrs (computed, not scraped)

Function Responsibilities:

1. Fetch RS3 players
2. Fetch OSRS players
3. Parse integers
4. Compute total = rs3 + osrs
5. Insert document

Abort on:
- Network error
- Parse failure (NaN)