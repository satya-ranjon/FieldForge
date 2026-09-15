# 19 — Open Questions, Technical Assumptions & Product Recommendations

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Living Clarifications, Unconfirmed Assumptions & Architecture Alignment Record

---

## 1. Traceability & Classification Legend

To ensure complete transparency between design specifications and underlying backend reality, every open item is classified into one of:

- `[Open Question]`: Requires explicit product or executive decision before frontend implementation begins.
- `[Assumption]`: A UX decision made based on current codebase evidence, pending formal product confirmation.
- `[Backend Constraint]`: Confirmed by existing backend schema, FSM, or API implementation.
- `[Business Rule]`: Confirmed product/business requirement from SRS v1.1.0.

---

## 2. Exhaustive Open Questions & Architecture Clarifications

### 2.1 Geofence Threshold Discrepancy: 200m vs. 100m

- **Status**: `[Open Question]` / `[Backend Constraint]`
- **Context**:
  - `docs/SRS.md` FR-MOB-001 specifies: _"Verify the mobile coordinates are within 200 metres of the work site before allowing the on-site transition."_
  - `apps/work-order-service` server-side check-in validation enforces $\le 200\text{ m}$.
  - However, `docs/ARCHITECTURE.md` (§1, §13) and `apps/mobile-tech-app/src/services/geofencing.service.ts` reference a $\le 100\text{ m}$ threshold.
- **UX Recommendation**: Standardize the entire platform strictly on $\le 200\text{ m}$ (`RADIUS = 200`). A 100-meter threshold causes frequent false-positive check-in rejections in dense urban environments (skyscrapers, indoor parking structures) due to standard consumer GPS accuracy variance ($\pm 15$–$30\text{m}$).
- **Action Required**: Product sign-off to officially align mobile client constants to the server's 200m rule.

---

### 2.2 Geocoding & Address Autocomplete Provider

- **Status**: `[Open Question]` / `[Assumption]`
- **Context**: `POST /work-orders` requires both textual `addressLine: string` and numeric `latitude: number`, `longitude: number`. The backend does not currently host an internal geocoding service.
- **Assumption**: The frontend will integrate an external geocoding provider (e.g. Google Places API or Mapbox Geocoding) at the client edge to resolve street addresses into latitude/longitude coordinates before submitting the payload.
- **Action Required**: Clarify whether Google Maps Platform or Mapbox is the preferred enterprise geocoding API key in production.

---

### 2.3 Multi-Tenant Organization Teams & Buyer Sub-Roles

- **Status**: `[Open Question]`
- **Context**: The database schema currently associates a single `users` row with a single `buyer_profiles` record.
- **Problem**: Enterprise MSPs typically have multiple team members:
  - _Dispatchers_ who create tickets and assign contractors.
  - _Field Supervisors_ who review deliverables.
  - _Finance Managers_ who manage payment methods and download tax invoices.
- **UX Recommendation**: In Phase 1 of the redesign, treat all authenticated users within a buyer account as having full organizational capabilities. Design the navigation and settings architecture with an extension slot for `Team Members & RBAC Permissions` for future backend implementation.
- **Action Required**: Confirm if multi-user organizational pooling is planned for v2 or if 1 user = 1 buyer account is acceptable for the immediate release.

---

### 2.4 Dispute Resolution Timeframe & Arbitration Workflow

- **Status**: `[Open Question]` / `[Business Rule]`
- **Context**: The work order FSM supports transitioning to `DISPUTED` from `ASSIGNED`, `EN_ROUTE`, `ON_SITE`, and `COMPLETED`. While `COMPLETED -> APPROVED` has a strict 72-hour auto-approval SLA, `DISPUTED` has no automated timeout.
- **Problem**: If an order enters `DISPUTED` and an administrator fails to arbitrate, escrow funds remain locked in `HELD` indefinitely, trapping contractor earnings.
- **UX Recommendation**:
  - Implement a visible 5-business-day maximum arbitration SLA countdown on the Admin Dispute Console.
  - Provide automated email/SMS status updates to both buyer and technician every 24 hours while an order is under review.
- **Action Required**: Define the operational SLA and policy for resolving contested escrow disputes.

---

### 2.5 Partial Deliverable Uploads & S3 Presigned URL Expiration

- **Status**: `[Assumption]` / `[Backend Constraint]`
- **Context**: `POST /work-orders/:id/deliverables/presigned-url` issues an upload URL that expires in 900 seconds (15 minutes).
- **Assumption**: When a technician captures photos offline, the presigned URLs are **not requested in advance**. Instead, the local file is saved to durable sandbox storage. When the device reconnects, the `syncManager` requests a fresh presigned URL immediately prior to streaming the binary payload, preventing URL expiration errors.
- **Action Required**: Validate that the offline sync manager sequence follows this just-in-time presign protocol.

---

### 2.6 Technician Payout Instrument Integration (Stripe Connect vs. ACH)

- **Status**: `[Open Question]`
- **Context**: `billing-service` maintains an internal double-entry ledger (`payout_ledger`) with `CREDIT` and `DEBIT` rows.
- **Problem**: How does the technician physically withdraw settled funds from their FieldForge ledger to their real-world bank account?
- **Assumption**: A payment disbursement gateway (such as Stripe Connect Custom / Express or Dwolla ACH) will be integrated to handle KYC verification, debit card instant payouts, and W-9 / 1099-NEC tax compliance.
- **UX Recommendation**: For the current redesign, model the "Earnings & Payouts" screen with a clean "Withdraw Available Balance" trigger that displays linked bank accounts and settlement histories.
- **Action Required**: Clarify the external payment processor vendor selected for technician payout disbursement.

---

### 2.7 Auto-Dispatch Rule Tuning & Fallback Escalation

- **Status**: `[Open Question]` / `[Business Rule]`
- **Context**: `/dispatch/auto-route` automatically matches an available technician within a 5-mile radius based on composite scoring.
- **Question**: If no eligible contractor accepts or is found within 5 miles for an urgent emergency ticket, what should the fallback UX be?
- **UX Recommendation**:
  - Automatically widen the radius to 10 miles after 5 minutes of no match, and alert the buyer with an option to raise the proposed budget (+15%) to attract further contractors.
- **Action Required**: Approve the automated radius expansion and price surge recommendation rules.
