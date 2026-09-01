# Service Level Indicators and Objectives

> Living specification aligned with SRS v1.0.0, FR-OBS-002 and NFR-PERF-001.

| Service category |             Target SLO | Service level indicator                | Prometheus query                                                                         | Monthly error budget |
| ---------------- | ---------------------: | -------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------: |
| API availability |                 ≥99.9% | Non-5xx requests / all requests        | `sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` |         43.2 minutes |
| Read latency     |            p95 <100 ms | REST read duration                     | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{method="GET"}[5m]))` |       5% over 100 ms |
| Write latency    |            p95 <200 ms | REST mutation duration                 | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{method=~"POST        |                  PUT | PATCH"}[5m]))` | 5% over 200 ms |
| Dispatch latency |                 ≤1.5 s | Publication to technician notification | `histogram_quantile(0.99, rate(dispatch_fanout_latency_seconds_bucket[5m]))`             |        1% over 1.5 s |
| Financial ledger | 0 dropped transactions | Unreconciled escrow transactions       | `sum(rate(billing_reconciliation_failures_total[1h])) == 0`                              |                    0 |

## Evidence rules

- Synthetic random samples are demo data, not SLO verification.
- Availability excludes only responses that the approved SLI definition excludes;
  do not change selectors to improve reported results.
- Add alert thresholds and burn-rate policy through an ADR when real metrics and
  an incident-response owner exist.
