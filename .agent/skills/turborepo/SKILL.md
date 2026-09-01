---
name: turborepo
description: Design, diagnose, and validate FieldForge Turborepo task graphs and internal-package ordering. Use when changing turbo.json, workspace scripts, package entrypoints, CI task ordering, caching, type checking, builds, or clean-CI failures involving @fieldforge packages.
---

# FieldForge Turborepo

Use the repository's actual package strategy to design the task graph. Do not
assume a warm workspace represents CI.

## Inspect before changing

Read these files before editing task configuration:

- `turbo.json` and the root `package.json`;
- `pnpm-workspace.yaml`;
- affected workspace `package.json` and `tsconfig.json` files;
- `.github/workflows/ci-pipeline.yml` when the failure is in CI.

Check every affected internal package's `main`, `types`, and `exports` fields.
Determine whether it is compiled, just-in-time, or source-exported before adding
task dependencies.

## FieldForge invariant

`@fieldforge/common`, `contracts`, `database`, and `ui` are compiled packages.
Their package metadata resolves JavaScript and declarations from `dist`.
Therefore, on a clean checkout, applications cannot type-check imports from
those packages until their dependency builds have emitted `dist/*.d.ts`.

Maintain this task relationship while that package strategy remains in place:

```json
"typecheck": {
  "dependsOn": ["^build", "^typecheck"],
  "outputs": []
}
```

- `^build` runs builds in package dependencies before the dependent type check.
- `^typecheck` validates dependency packages and supports correctly ordered
  filtered type-check runs.
- A task name without `^` refers to the same package. Do not substitute `build`
  for `^build` unless the current package itself must build first.

If package entrypoints are deliberately changed to TypeScript source, project
references, or another just-in-time strategy, reassess this invariant rather
than retaining it mechanically.

## Validation

Never declare a task-graph or module-resolution fix successful using existing
`dist` folders or Turbo cache alone.

1. Run `scripts/validate-clean-typecheck.sh` from this skill. It temporarily
   moves known generated outputs and `.turbo` aside, runs an uncached type check,
   and restores the prior local outputs on exit.
2. Run `pnpm check`.
3. Run `pnpm build`.
4. Report empty Jest suites honestly; `--passWithNoTests` is not coverage.

When diagnosing logs, distinguish informational Turbo telemetry messages from
the actual failing task and first compiler error.

## Boundaries

- Prefer task-graph or package-entrypoint corrections supported by evidence.
  Do not upgrade dependencies merely to hide an ordering problem.
- Preserve unrelated workspace changes and generated-output conventions.
- Keep `build.outputs` aligned with actual emitted directories so cached builds
  can restore the declarations required by consumers.
- For a CI-only failure, reproduce the absence of local outputs before changing
  TypeScript paths, module resolution, or package exports.
