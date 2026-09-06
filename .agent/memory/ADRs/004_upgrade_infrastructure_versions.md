# 📝 ADR 004: Upgrade Infrastructure Versions to MySQL 8.4 LTS, Redis 8.0, and RabbitMQ 4.1

| Status       | Date           | Decision Maker         | Supersedes        |
| :----------- | :------------- | :--------------------- | :---------------- |
| **ACCEPTED** | September 2026 | Satya Ranjan Debsharma | ADR 001, 002, 003 |

---

## 1. Context

During initial development, ADRs 001, 002, and 003 specified MySQL 8.0, Redis 7.0, and RabbitMQ 3.13 respectively. As captured in `docs/ISSUES.md` (defect **M10**), the local Docker Compose configuration evolved to use modern upstream production releases: `mysql:8.4` (LTS release series), `redis:8.0-alpine`, and `rabbitmq:4.1-management-alpine`.

To eliminate version drift between architecture decision records and containerized runtime infrastructure, this ADR explicitly documents and ratifies the upgraded infrastructure baseline.

## 2. Decision

Adopt the following core infrastructure images as the canonical platform baseline across Docker Compose and Kubernetes manifests:

1. **MySQL 8.4 LTS (InnoDB Engine):**
   - Retains full compatibility with Drizzle ORM while benefiting from Long Term Support (LTS) maintenance, optimized memory management for row-level locking (`SELECT ... FOR UPDATE`), and native JSON functions.
   - Supersedes ADR 001 (MySQL 8.0).

2. **RabbitMQ 4.1:**
   - Provides native support for Khepri distributed metadata store, high-throughput AMQP 0-9-1 topic exchanges (`fieldforge.events.topic`), reliable publisher confirms, and resilient Dead Letter Queues (`fieldforge.events.dlq`).
   - Supersedes ADR 002 (RabbitMQ 3.13).

3. **Redis 8.0:**
   - Provides optimized in-memory geospatial indexes (`GEOADD`, `GEOSEARCH`) for contractor proximity matching, sub-millisecond atomic key-value operations for event deduplication (`SETNX` with 7-day TTL), and low-latency token bucket rate limiting.
   - Supersedes ADR 003 (Redis 7.0).

## 3. Consequences

- **Positive:**
  - Modern, security-patched LTS versions deployed across local developer environments and container manifests.
  - Zero documentation drift across ADRs, `docker-compose.yml`, and `README.md`.
  - Full backward compatibility maintained for existing Drizzle schemas, Redis cache keys, and AMQP topic routing keys.
- **Negative:**
  - Requires local container engines to pull updated images (managed seamlessly via `pnpm docker:up`).
