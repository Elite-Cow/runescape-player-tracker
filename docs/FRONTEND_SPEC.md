# Frontend Specification

Use React + Chart.js.

Display 3 lines:
- Total
- OSRS
- RS3

Time Range Buttons:
24H | 7D | 30D | 6M | 1Y | ALL

On load:
1. Call /api/availability
2. Enable/disable buttons
3. Select largest available range

Tooltip:
Show timestamp + all 3 values.