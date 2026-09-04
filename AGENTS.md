# FieldForge Agent Guide

This file is the entry point for every coding agent working in this repository.
Read it before editing code.

## Source-of-truth order

When documents disagree, use this order:

1. The user's current task and acceptance criteria.
2. `docs/SRS.md` for product requirements.
3. `DESIGN.md` for design system tokens, visual architecture, and UI/UX invariants.
4. Accepted ADRs in `.agent/memory/ADRs/` for architecture decisions.
5. Rules in `.agent/rules/` for implementation constraints.
6. Shared contracts and database migrations for the currently implemented shape.
7. `README.md` and other descriptive documents.

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
- Never manually author or manipulate database migration SQL files or metadata
  snapshots. Whenever schemas in `packages/database/src/schemas/` change, always
  generate migrations via `pnpm run db:generate` and apply them via `pnpm run db:migrate`
  (see `RULE-DB-02`).

Detailed rules live in `.agent/rules/`. Read only the rules relevant to the
files being changed, but always apply the architecture, security, and feature
lifecycle boundaries (`RULE-FEAT-09`).

## Project-local skills

- For changes involving `turbo.json`, workspace task ordering, internal package
  entrypoints, caching, type checking, builds, or related CI failures, read and
  follow `.agent/skills/turborepo/SKILL.md` before editing. Its clean-typecheck
  validation is required for task-graph fixes.
- For UI component generation, styling, design system tokens, or Google Stitch MCP
  integrations, read and follow `.agent/skills/stitch-design/SKILL.md` and adhere to
  `DESIGN.md`.
- For Next.js applications (such as `apps/web-buyer-portal`), modern Next.js
  includes breaking changes from older conventions (APIs, conventions, and file structure).
  Read `.agent/skills/nextjs-migration/SKILL.md` and the version-matched documentation
  in `apps/web-buyer-portal/node_modules/next/dist/docs/` before writing code.
- `.agent/skills/` is the canonical, agent-neutral skills source. Tool-specific
  discovery directories may link to it, but must not contain divergent copies.

## Working method

1. Inspect the affected workspace, nearby tests, contracts, migrations, and the
   relevant SRS requirement IDs.
2. State assumptions when the SRS does not decide a material behavior.
3. Prefer the smallest complete change. Avoid drive-by refactors.
4. **Mandatory test implementation**: Every feature addition, endpoint, state
   transition, or domain behavior change MUST include automated unit and
   integration tests with real assertions. A test command that finds no tests
   (`--passWithNoTests`) or superficial assertions (`expect(true).toBe(true)`)
   is not a successful feature verification.
5. **Mandatory documentation synchronization**: When implementing any feature,
   update the following documents in lockstep with the code (see `RULE-FEAT-09`
   in `.agent/rules/09_feature_implementation_rules.md`):
   - `docs/DEVELOPMENT_PLAN.md`: Roadmap milestone progress, work package
     checklists, and active sequencing;
   - `README.md`: Feature list, port tables, environment variables, and
     quickstart/CLI usage if affected;
   - `@fieldforge/contracts` & `.agent/context/api_contracts.md`: Shared
     DTOs/validators/events and the living REST/OpenAPI endpoint catalogue;
   - `.agent/context/project_status.md`: Durable implementation status, verified
     test count, and architectural state;
   - `docs/SRS.md`: Traceability mapping to requirement IDs (`SRS-FR-*`) and
     acceptance status;
   - `docs/ISSUES.md`: Resolved defect entries closed, and newly discovered edge
     cases or technical debt logged;
   - `docs/ARCHITECTURE.md` and `.agent/memory/ADRs/`: If service topologies,
     boundaries, or architecture decisions change.
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
- Comprehensive automated tests (unit, integration, contracts) are implemented
  and pass (no `--passWithNoTests`).
- Formatting, linting, and type checking pass (`pnpm check`).
- Public contracts in `@fieldforge/contracts` and database migrations (generated
  exclusively via `pnpm run db:generate`, never handwritten) agree with the change.
- Required living documentation is updated: `docs/DEVELOPMENT_PLAN.md`,
  `README.md`, `.agent/context/api_contracts.md`,
  `.agent/context/project_status.md`, `docs/SRS.md`, and `docs/ISSUES.md` (and
  ADRs/Architecture if applicable).
- Generated outputs, caches, local environment files, and secrets are untracked.
- Operational or security assumptions are visible rather than embedded as
  unexplained constants.

## Git push guardrail (Pre-push verification gate)

Whenever the user instructs to `git push` (or before pushing to remote):
NEVER execute `git push` immediately. You MUST first execute and verify all required checks in sequence:

1. `pnpm format`
2. `pnpm format:check`
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm test`
6. `pnpm test:e2e`
7. `pnpm validate:clean-typecheck`
8. `pnpm build`
9. `pnpm check`

**Hard Invariant**: If ANY of the above checks fail, `git push` MUST NOT be executed. Block the push immediately, report the failure, and fix the defect before re-running verification.
