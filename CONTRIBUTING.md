# Contributing to FieldForge

FieldForge is currently an early scaffold. Read `AGENTS.md`, `docs/SRS.md`, and
`.agent/context/project_status.md` before starting work.

## Local setup

Use Node.js 24, pnpm 11.24.0, and Docker with Compose v2.

```bash
cp .env.example .env
pnpm setup
pnpm dev
```

`pnpm setup` installs the frozen lockfile and starts the local backing services.
Database migrations and seed data remain explicit:

```bash
pnpm db:migrate
pnpm db:seed
```

## Change workflow

1. Link behavior work to SRS requirement IDs (for example, `FR-WO-002`).
2. Keep changes within one bounded context when possible.
3. Change shared contracts before consumers and include migration compatibility
   notes for persistent data changes.
4. Add meaningful tests with behavior. The current empty Jest suites are a known
   scaffold limitation, not coverage.
5. Run `pnpm check` and `pnpm build` before requesting review.

## Commits and pull requests

Use focused commits and explain operational, migration, security, and rollback
impact in the pull request. Never commit `.env`, Kubernetes secret manifests,
cloud credentials, production data, or generated build output.
