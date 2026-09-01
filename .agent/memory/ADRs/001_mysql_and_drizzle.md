# 📝 ADR 001: Adoption of MySQL 8.0 and Drizzle ORM

| Status       | Date        | Decision Maker         |
| :----------- | :---------- | :--------------------- |
| **ACCEPTED** | August 2026 | Satya Ranjan Debsharma |

---

## 1. Context

Field service management requires ACID transactional integrity for financial escrow holds, work order state machines, and contractor compliance tracking.

## 2. Decision

Adopt **MySQL 8.0 (InnoDB Engine)** as the primary relational database with **Drizzle ORM** for type-safe query generation and migration management.

## 3. Consequences

- **Positive:** Zero runtime overhead, end-to-end TypeScript type inference, deterministic SQL migrations.
- **Negative:** Requires disciplined indexing and connection pool configuration for high write concurrency.
