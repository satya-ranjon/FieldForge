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

### 4. Schema Migrations & Drizzle Kit Directives (Invariant)

- **Strict Prohibition Against Manual Migration Creation:**
  - **NEVER** manually author, edit, rename, or delete `.sql` files in `packages/database/src/migrations/`.
  - **NEVER** manually edit or manipulate `packages/database/src/migrations/meta/_journal.json` or `*_snapshot.json`.
  - Handwritten migrations bypass Drizzle Kit's snapshot diffing engine, causing desynchronization, duplicate DDL generation, and fatal migration errors (`ER_TABLE_EXISTS_ERROR`).
- **Automated Generation Protocol (`pnpm run db:generate`):**
  - Whenever schema definitions in `packages/database/src/schemas/*.ts` are added or modified, generate migrations exclusively via:
    ```bash
    pnpm run db:generate
    ```
    (or `pnpm --filter @fieldforge/database db:generate`).
  - This ensures Drizzle Kit compares TypeScript schemas against the previous snapshot in `meta/`, emits the versioned SQL migration, and writes the corresponding snapshot JSON and journal record in lockstep.
- **Migration Application Protocol (`pnpm run db:migrate`):**
  - Apply generated migrations to MySQL strictly via:
    ```bash
    pnpm run db:migrate
    ```
    (or `pnpm --filter @fieldforge/database db:migrate`).
  - Never execute manual/ad-hoc DDL queries directly on MySQL; all schema changes must be recorded through versioned Drizzle migrations tracked in `__drizzle_migrations`.
- **Database Seeding (`pnpm run db:seed`):**
  - After migrating the database, seed test data for local development using:
    ```bash
    pnpm run db:seed
    ```
