# 02. Database & MySQL / Drizzle ORM Rules

- **Database Engine**: MySQL 8.0 InnoDB engine with UTF8MB4 character set.
- **ORM**: Drizzle ORM for typed queries and declarative migrations.
- **Transactions**: State changes spanning multiple tables (e.g. Work Order assignment + Escrow hold) must be wrapped in \`db.transaction()\`.
- **Indexing**: Always index foreign keys, status columns used in FSM queries, and composite keys for time-range queries (\`(status, created_at)\`).
- **Soft Deletes**: Use \`deleted_at\` timestamp where historical record auditability is required.
