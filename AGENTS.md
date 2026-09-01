# FieldForge Agent Guide

This file is the entry point for every coding agent working in this repository.
Read it before editing code.

## Source-of-truth order

When documents disagree, use this order:

1. The user's current task and acceptance criteria.
2. `docs/SRS.md` for product requirements.
3. Accepted ADRs in `.agent/memory/ADRs/` for architecture decisions.
4. Rules in `.agent/rules/` for implementation constraints.
5. Shared contracts and database migrations for the currently implemented shape.
6. `README.md` and other descriptive documents.

Do not silently resolve a conflict. Record it in `docs/ISSUES.md`, and create or
supersede an ADR when the resolution changes architecture or a public contract.

## Current phase

FieldForge is an early scaffold, not a production-ready marketplace. Read
`.agent/context/project_status.md` before planning feature work. Placeholder
services, sample UI, simulated metrics, and `--passWithNoTests` are not evidence
that an SRS requirement is implemented.

Unless the task explicitly requests product behavior, keep changes limited to
repository foundations, documentation, tests, or developer experience. Do not
turn a setup task into feature implementation.

## Architecture boundaries

- Keep each service inside its bounded context. A service must not query another
  service's private data directly.
- Put cross-service DTOs, validators, enums, and event envelopes in
  `@fieldforge/contracts`.
- Use Drizzle with parameterized queries. Money/state mutations must be
  transactional, idempotent where required, and concurrency-safe.
- Use RabbitMQ topic events for asynchronous cross-service effects. Consumers
  must account for duplicate delivery, bounded retries, and dead letters.
- Propagate `x-correlation-id` across HTTP and AMQP boundaries and avoid logging
  credentials, tokens, banking data, signatures, or personal data.
- Enforce authorization and anti-fraud rules on the server. Client checks are
  user experience, not a security boundary.
- Never commit real secrets. `.env.example` and `*.example.yaml` may contain
  development-only placeholders; real values stay in ignored local files or a
  secrets manager.

Detailed rules live in `.agent/rules/`. Read only the rules relevant to the
files being changed, but always apply the architecture and security boundaries
above.

## Working method

1. Inspect the affected workspace, nearby tests, contracts, migrations, and the
   relevant SRS requirement IDs.
2. State assumptions when the SRS does not decide a material behavior.
3. Prefer the smallest complete change. Avoid drive-by refactors.
4. Add or update tests with behavior changes. A test command that finds no tests
   is not a successful feature verification.
5. Update living context only when the durable project state changes:
   - `.agent/context/project_status.md` for implementation status;
   - `docs/ISSUES.md` for unresolved defects or specification drift;
   - `.agent/memory/ADRs/` for accepted architectural decisions.
6. Run the checks listed below and report any check that could not run.

## Standard commands

Use Node.js 24 and the pnpm version pinned in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm infra:config
```

Useful focused commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm --filter <workspace-name> <script>
```

Database commands require local infrastructure and a populated `.env` copied
from `.env.example`.

## Definition of done

- The requested scope is complete and no unrelated behavior was added.
- Formatting, linting, and type checking pass.
- Relevant tests pass and the result is described honestly.
- Generated outputs, caches, local environment files, and secrets are untracked.
- Public contracts, migrations, docs, and ADRs agree with the change.
- Operational or security assumptions are visible rather than embedded as
  unexplained constants.
