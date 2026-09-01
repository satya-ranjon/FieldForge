# FieldForge Agent Context

The root `AGENTS.md` is the mandatory entry point. This directory contains
supporting context, not a second source of truth.

## Directory map

- `context/` — durable domain and implementation-state references.
- `memory/ADRs/` — accepted architecture decisions. Do not edit an accepted ADR
  to change history; add a new ADR that supersedes it.
- `rules/` — focused engineering constraints by subsystem.
- `workflows/` — small, reviewable helper scripts. A workflow must fail when its
  claimed verification cannot be performed.

## Context maintenance

Keep context concise and evidence-based. Do not store chat transcripts,
speculation, credentials, access tokens, personal preferences, or transient task
notes here. Update `context/project_status.md` only after the repository state
actually changes.
