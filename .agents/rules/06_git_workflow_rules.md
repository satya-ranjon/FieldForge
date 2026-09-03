# 🌿 Git Branching & Contribution Directives

> **Rule ID:** `RULE-GIT-06` • **Priority:** `HIGH`

---

### 1. Branch Hierarchy & Flow

- **`main`**: Production-ready, stable releases. Never commit directly to `main`.
- **`develop`**: Primary integration branch for active development and target for all feature PRs.
- **`feature/<name>`**: Feature branches branched from `develop`.
- **`fix/<name>`**: Bug fixes branched from `develop` (or hotfixes from `main`).

### 2. Commit Message Standards

Follow Conventional Commits format:

- `feat(...)`: New features or capabilities.
- `fix(...)`: Bug fixes or defect resolutions.
- `refactor(...)`: Code adjustments without behavior changes.
- `chore(...)`: Dependency updates, tooling, configuration.
- `docs(...)`: Documentation and markdown changes.

### 3. Pre-Push Verification Protocol (MANDATORY)

Whenever `git push` is requested (or prior to pushing any branch/PR), NEVER push immediately. Run and verify all of the following checks in sequence:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm validate:clean-typecheck
pnpm build
pnpm check
```

**Hard Invariant**:

- Only if **ALL** checks pass cleanly may `git push` proceed.
- If **ANY** check fails, `git push` is strictly prohibited. Resolve the failure and re-verify before attempting to push.
