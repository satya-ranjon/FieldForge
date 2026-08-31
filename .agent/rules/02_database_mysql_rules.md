# 🗄️ Database & Drizzle ORM Directives
> **Rule ID:** `RULE-DB-02` • **Priority:** `CRITICAL`

---

### 1. MySQL 8.0 InnoDB Compliance
- All tables must use `ENGINE=InnoDB` with `utf8mb4` character set.
- Primary keys must be UUID v4 strings (`VARCHAR(36)`).

### 2. ACID Transactions
- Multi-table operations (e.g. Work Order state change + Escrow balance hold) must be wrapped in `db.transaction()`.
- Use row-level locking (`SELECT ... FOR UPDATE`) during atomic technician assignment.

### 3. Indexing Hygiene
- Always define composite indexes on `(status, scheduled_start_time)` for fast dashboard filtering.
- Prevent table scans on datasets with $> 100,000$ rows.
