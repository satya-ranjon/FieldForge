## 📋 Pull Request Summary

### 🧩 Affected Workspaces & Services
- [ ] `apps/api-gateway`
- [ ] `apps/auth-service`
- [ ] `apps/work-order-service`
- [ ] `apps/dispatch-matching-service`
- [ ] `apps/billing-service`
- [ ] `apps/notification-service`
- [ ] `apps/web-buyer-portal`
- [ ] `apps/mobile-tech-app`
- [ ] `packages/contracts`
- [ ] `packages/database`
- [ ] `packages/common`
- [ ] `packages/ui`
- [ ] `infra/*`

---

### 🛡️ Quality & Verification Checklist
- [ ] **Type Safety:** Monorepo builds cleanly with zero TypeScript errors (`pnpm build`).
- [ ] **Automated Tests:** Unit & integration tests pass with $\ge 90\%$ coverage (`pnpm test`).
- [ ] **Schema Migrations:** Database migrations tested with backward-compatible rollback scripts.
- [ ] **SLI/SLO Compliance:** No regressions against latency ($p95 < 100	ext{ms}$) or availability bounds.
- [ ] **Security:** Zero hardcoded credentials or unparameterized queries.
