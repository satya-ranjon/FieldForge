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

### 3. Pre-Commit Verification

Before pushing changes or creating PRs, ensure:

```bash
pnpm check
pnpm build
```

All tests, lint checks, and workspace builds must pass.
