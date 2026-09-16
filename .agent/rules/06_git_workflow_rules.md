# 🌿 Git Branching & Contribution Directives

> **Rule ID:** `RULE-GIT-06` • **Priority:** `HIGH`

---

### 1. Branch Hierarchy & Flow

- **`main`**: Production-ready, stable releases. Never commit directly to `main`.
- **`develop`**: Primary integration branch for active development and target for all feature PRs.
- **`feature/<name>`**: Feature branches branched from `develop`.
- **`fix/<name>`**: Bug fixes branched from `develop` (or hotfixes from `main`).

### 2. Commit Message & Description Standards (MANDATORY)

Every Git commit must follow Conventional Commits format with a **mandatory, comprehensive structured body**. Single-line commits lacking context or technical details are strictly prohibited.

#### 2.1 Commit Header Format

```text
<type>(<scope>): <concise summary in imperative mood>
```

- `<type>`: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`.
- `<scope>`: Target package or service name (e.g. `billing`, `auth`, `work-orders`, `common`, `dispatch`, `gateway`).
- Length: Under 72 characters, lowercase type and scope, no trailing period.

#### 2.2 Mandatory Commit Body Structure

Every commit must include the following sections separated by blank lines:

1. **Problem & Root Cause**:
   - Detailed explanation of the architectural or implementation defect, failure mode, and conditions under which it occurred.
   - Exact components, multi-replica hazards, memory leaks, or contract mismatches involved.
2. **What Changed & How It Fixes It**:
   - Explicit architectural and code modifications made across files/components to resolve the issue.
   - Technical mechanisms introduced (e.g. atomic Redis Lua scripts, canonical SHA-256 fingerprinting, row locking, error classification).
3. **Invariants & Safety Guarantees**:
   - Core invariants preserved (e.g. idempotency, memory bounds, concurrency safety, zero migrations if applicable).
   - Backward compatibility handling (e.g. legacy payload unwrapping).
4. **Verification**:
   - Automated test suites executed, test counts (unit, integration, E2E), and verification gates passed.

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
