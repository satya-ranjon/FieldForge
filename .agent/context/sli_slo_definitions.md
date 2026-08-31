# Service Level Indicators (SLI) & Objectives (SLO) (Matching SRS Section 4.6)

| Service Level Metric | Target Objective (SLO) | Indicator Definition (SLI) | Threshold Bound |
| :--- | :--- | :--- | :--- |
| **API Availability** | $\\ge 99.9\\%$ Uptime | $\\frac{\\text{Successful Requests (non-5xx)}}{\\text{Total Requests}}$ | Monthly Error Budget: 43.8 mins |
| **API Latency (Read)** | $p95 < 100\\text{ms}$ | REST read endpoint duration | Max response $\\le 100\\text{ms}$ |
| **API Latency (Write)** | $p95 < 200\\text{ms}$ | REST write transaction duration | Max response $\\le 200\\text{ms}$ |
| **Dispatch Queue Latency** | $\\le 1.5\\text{s}$ | Time from WO publish to technician notification | $99\\%$ deliveries in $\\le 1.5\\text{s}$ |
| **Geofence Matching Latency** | $p95 < 120\\text{ms}$ | Redis `GEOSEARCH` technician proximity lookup | $95\\%$ searches $\\le 120\\text{ms}$ |
