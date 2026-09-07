# 📝 ADR 006: Bounded Context Data Isolation & Token-Enriched Profile Identity

| Status       | Date           | Decision Maker         |
| :----------- | :------------- | :--------------------- |
| **ACCEPTED** | September 2026 | Satya Ranjan Debsharma |

---

## 1. Context

In the initial microservice architecture:

1. Services shared database tables and executed direct cross-context SQL joins:
   - `apps/dispatch-matching-service` executed SQL joins against `technician_profiles`, `users`, and `technician_certifications` to enrich search results, and queried `buyer_profiles` to assert ownership.
   - `apps/work-order-service` queried `buyer_profiles` and `technician_profiles` directly on every lifecycle transition and deliverable upload.
   - `apps/work-order-service` automatically inserted synthetic records into `buyer_profiles` (`companyName: 'Default Buyer Co'`) if a profile was missing during work order creation.
   - `apps/billing-service` queried `buyer_profiles` and `technician_profiles` to assert ownership during escrow release and payout queries.

This violated DDD bounded context boundaries (`AGENTS.md`), created tight schema coupling, broke domain ownership invariants, and prevented services from having autonomous schemas or databases.

## 2. Decision

Decouple service data access through **Token-Enriched Profile Identity** and **Inter-Service Directory APIs**:

1. **Enriched Auth JWT Payload**:
   - Add `profileId?: string` to `AuthJwtPayload` in `@fieldforge/contracts`.
   - `apps/auth-service` populates `profileId` during user registration, login, and token refresh for both `BUYER` and `TECHNICIAN` roles.
   - `apps/api-gateway` extracts `profileId` and propagates it downstream in asserted header `x-ff-profile-id`.

2. **Decoupled Identity Resolution**:
   - `work-order-service`, `dispatch-matching-service`, and `billing-service` prioritize `callerProfileId` (from verified JWT or asserted header) to validate ownership and link domain aggregates (`buyerId`, `technicianId`) directly, bypassing foreign database lookups.
   - Dual-path fallback: If `callerProfileId` is absent (legacy tokens or unit test mocks), a read-only fallback query is preserved to guarantee zero runtime regressions.

3. **Strict Buyer Profile Onboarding**:
   - Remove synthetic profile auto-creation (`Default Buyer Co`) from `work-order-service`.
   - If an un-profiled user attempts to create a work order, reject with `NotFoundException` (requiring proper buyer onboarding).

4. **Technician Directory Service**:
   - `apps/auth-service` exposes `POST /technicians/batch` (`getTechniciansBatch`) to serve bulk technician summaries (ratings, completed job counts, hourly rates, verified certifications, status).
   - `apps/dispatch-matching-service` implements `TechnicianDirectoryService` to fetch technician enrichment data via REST rather than direct SQL joins against identity tables.

## 3. Consequences

- **Positive:**
  - Strict bounded context isolation: services no longer join or mutate tables outside their domain boundary.
  - Zero cross-service write violations: only `auth-service` mutates buyer and technician profiles.
  - High performance: Eliminates redundant database roundtrips during work order creation, transitions, and escrow checks by resolving `profileId` directly from verified cryptographic tokens.
  - Paves the way for physical database splitting per microservice without code rewrites.
- **Negative:**
  - Technicians without registered profiles cannot be returned in directory lookups until indexed in `auth-service`.
  - Directory network latency during geo-search matching (mitigated with 3s timeouts and in-memory/Redis caching potential).
