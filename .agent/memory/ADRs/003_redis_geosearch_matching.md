# ADR 003: Redis GEOSEARCH for Sub-Millisecond Technician Proximity Matching

## Context
When a work order is published, the dispatch matching service must identify available, certified technicians within a dynamic geographic radius (e.g. 25 miles).

## Decision
Utilize **Redis 7 geospatial commands (\`GEOADD\`, \`GEOSEARCH\`)** with 15-second technician heartbeat TTLs.

## Consequences
- p95 search latency reduced from ~180ms (RDBMS spatial queries) to < 10ms in Redis in-memory index.
