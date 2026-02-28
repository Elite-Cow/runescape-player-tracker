# System Architecture

Scheduled Trigger (5 min)
    → Atlas Function
        → Fetch Total
        → Fetch OSRS
        → Validate
        → Compute RS3
        → Insert document

Express API
    → Reads MongoDB
    → Performs aggregation
    → Returns JSON

Frontend
    → Calls API
    → Renders Chart.js line graph