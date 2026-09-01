# 📝 ADR 003: Redis 7 GEOSEARCH for Sub-Millisecond Technician Dispatch

| Status       | Date        | Decision Maker         |
| :----------- | :---------- | :--------------------- |
| **ACCEPTED** | August 2026 | Satya Ranjan Debsharma |

---

## 1. Context

When urgent work orders are published, the platform must discover and score eligible contractors within a dynamic radius (e.g. 25 miles) with sub-120ms latency.

## 2. Decision

Utilize **Redis 7 geospatial indices (`GEOADD`, `GEOSEARCH`)** with 15-second heartbeat TTLs for active technician locations.

## 3. Consequences

- **Positive:** p95 query latency reduced from $\sim 180	ext{ms}$ in RDBMS spatial indexes to $< 10	ext{ms}$ in Redis memory.
- **Negative:** Transient location data must be refreshed continuously by mobile heartbeats.
