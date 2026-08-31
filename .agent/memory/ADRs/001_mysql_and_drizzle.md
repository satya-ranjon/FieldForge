# ADR 001: Adoption of MySQL 8 and Drizzle ORM

## Context
Field service management requires strict ACID guarantees for work order state machines, financial escrow holds, and contractor compliance tracking.

## Decision
Adopt **MySQL 8.0** with InnoDB and **Drizzle ORM**.

## Rationale
- Drizzle offers zero-overhead TypeScript schema definitions and SQL-like query builder ergonomics.
- Native support for row-level locking (\`SELECT ... FOR UPDATE\`) during atomic work order assignments.
- Predictable and inspectable migration files under \`packages/database/src/migrations\`.
