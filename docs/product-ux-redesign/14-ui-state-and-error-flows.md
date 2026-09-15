# 14 — UI State Design, Error Recovery & Trust Architecture

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Deterministic State Models, Zero-Dead-End Recovery & High-Stakes Decision Safeguards

---

## 1. Deterministic UX State Architecture

Every component, card, drawer, and table in FieldForge implements a deterministic 11-state lifecycle model. Blank screens, raw error traces, and dead ends are strictly forbidden.

```
+-------------------------------------------------------------------------------+
|                       DETERMINISTIC UX STATE LIFECYCLE                        |
+-------------------------------------------------------------------------------+
  1. INITIAL / FIRST-USE -> Explains purpose + clear single-step activation CTA
  2. LOADING / SKELETON  -> Geometry-matched shimmer; 0 layout shift (CLS = 0)
  3. EMPTY               -> What it is + Why empty + Immediate recommended action
  4. POPULATED           -> Real-time data with micro-pulse status indicators
  5. PARTIAL DATA        -> Degraded mode (e.g. cached telemetry while GPS syncs)
  6. ERROR / FAILED      -> Human-readable explanation + 1-click recovery trigger
  7. NO RESULTS          -> Search/filter mismatch + 1-click "Reset Filters"
  8. PERMISSION DENIED   -> Explains required role + escalation or contact path
  9. EXPIRED SESSION     -> Non-destructive inline re-auth (preserves form state)
  10. OFFLINE QUEUED     -> Local write confirmation + background sync indicator
  11. TERMINAL SUCCESS   -> Visual checkmark + next contextual action
```

---

### 1.1 Empty State Specification Standard

An empty state must never simply display _"No records found"_. It must follow a strict 3-part formula:

1. **What this area is**: Clear explanation of the operational surface.
2. **Why it is empty**: Contextual reason (e.g. no orders placed, active filters too narrow).
3. **Actionable recovery**: Single primary CTA that immediately resolves the emptiness.

_Example (Nearby Gigs Feed Empty)_:

- **Headline**: "No Work Orders Found Within 10 Miles"
- **Reason**: "There are currently no open maintenance tickets broadcasted in your immediate radius."
- **Action CTA**: `[Expand Radius to 25 Miles]` or `[Turn On Arrival Alerts]`.

---

## 2. Comprehensive Error Recovery Matrix

| Failure Scenario                    | Error Code / Boundary                                                    | System Behavior                                                                              | User-Facing Guidance                                                                                          | Recovery Path                                                                                                       |
| :---------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------ |
| **Geofence Boundary Violation**     | `400 Bad Request` (`EN_ROUTE -> ON_SITE`)                                | Server Haversine calculation verifies distance $> 200\text{ m}$. Mutation rejected.          | Alert: _"Geofence Check-In Prohibited. You are 380m from the job site. You must be within 200m to check in."_ | Radar highlights site perimeter in red with route guidance. Unlocks automatically upon entering the 200m perimeter. |
| **Escrow Pre-Auth Decline**         | `402 Payment Required` (`/billing/escrow/preauth`)                       | Stripe payment intent declined (insufficient funds, expired card, fraud trigger).            | Inline Alert: _"Corporate card pre-authorization failed (Card Declined). Escrow could not be funded."_        | Work order remains safely in `DRAFT`. Form highlights payment field with `[Update Payment Method]` trigger.         |
| **Presigned S3 Upload Timeout**     | `408 Request Timeout` / Network drop                                     | Media stream fails during binary S3 PUT.                                                     | Toast: _"Photo upload interrupted by signal drop. Image safely cached locally."_                              | Deliverable saved to local device sandbox; queued in `syncServiceInstance` for automatic background retry.          |
| **Concurrency State Conflict**      | `409 Conflict` (e.g. bid accepted by another buyer, or ticket cancelled) | MySQL `SELECT ... FOR UPDATE` detects prior status mutation.                                 | Modal: _"This ticket has already been assigned to another contractor."_                                       | Automatically refetches latest ticket aggregate; returns user smoothly to the Operations Board.                     |
| **JWT Access Token Expiration**     | `401 Unauthorized`                                                       | API Gateway rejects expired access token.                                                    | Background: Intercepted silently by `baseQueryWithReauth`.                                                    | Issues `POST /auth/refresh`. Replays original request seamlessly. Zero disruption to the user.                      |
| **Refresh Token Revoked / Expired** | `401 Unauthorized` on `/auth/refresh`                                    | Refresh token expired (7 days) or revoked.                                                   | Modal: _"Your session has expired. Enter your password to continue without losing your draft."_               | Non-destructive inline login modal. On success, closes and finishes original action.                                |
| **Network Signal Loss (Basement)**  | Browser / OS Offline Event                                               | Native NetInfo detects disconnection.                                                        | Top Banner: _"⚠️ Offline Mode Active. All actions and photos are queued locally."_                            | UI remains fully operational. Mutations enqueue in durable SQLite queue; auto-syncs on reconnect.                   |
| **Duplicate Bid Submission**        | `409 Conflict` (`submitBidSchema`)                                       | Technician taps bid button twice rapidly.                                                    | Client throttles UI; backend detects duplicate payload with `idempotency-key`.                                | Returns existing bid record safely. User sees: _"Proposal already submitted."_                                      |
| **Mandatory Deliverable Missing**   | Client-side validation gate                                              | Technician taps "Complete Work Order" with an unchecked checklist item or missing signature. | Form highlights missing items with red border: _"Store manager signature is required before completing job."_ | Smoothly scrolls to the missing signature field. "Complete" button remains disabled until 100% fulfilled.           |
| **Deleted / Missing Resource**      | `404 Not Found`                                                          | Buyer follows an outdated deep link to a purged ticket.                                      | Screen: _"Work Order Unavailable. This ticket may have been deleted or archived."_                            | Button: `[Return to Live Operations Board]`.                                                                        |

---

## 3. High-Stakes Decision & Trust UX

Marketplace participants experience acute hesitation when real money, sensitive hardware, or physical safety are involved. FieldForge deploys specific trust safeguards at every critical friction point:

```
+-------------------------------------------------------------------------------+
|                       HIGH-STAKES TRUST & DECISION SAFEGUARDS                 |
+-------------------------------------------------------------------------------+
  CRITICAL MOMENT          POTENTIAL HESITATION        UX TRUST SAFEGUARD
  ─────────────────────────────────────────────────────────────────────────────
  1. Escrow Pre-Auth       "Am I being billed now?"    Transparent vault explainer:
                                                       "Funds held in escrow; not
                                                       released until you inspect work."

  2. Bid Acceptance        "Can the tech back out?"    Binding FSM confirmation:
                                                       "Tech must start travel within
                                                       45m or ticket re-broadcasts."

  3. Geofence Check-In     "Are they really there?"    Live Haversine verification badge
                                                       with timestamp + meter distance.

  4. Escrow Release        "What if work is broken?"   Irreversible release modal with
                                                       before/after side-by-side review
                                                       + store manager signature proof.

  5. Ticket Cancellation   "Will I lose my money?"     Instant refund guarantee:
                                                       "100% of held escrow credited
                                                       back to your account immediately."
```

### 3.1 The Cryptographic Proof-of-Work Standard

To prevent fraudulent claims and invoice disputes, the Deliverables Inspection Gallery provides undeniable technical validation:

- **S3 HeadObject Verification**: Every photo confirms authentic file byte size, mime-type, and server timestamp directly from AWS S3.
- **SHA-256 Signature Audit Digest**: The client SVG signature is cryptographically hashed (`sha256:...`). The hash is displayed on the invoice and inspection modal as permanent evidence of store manager approval.
- **72-Hour Auto-Release Countdown**: A prominent, non-aggressive countdown timer informs the buyer: _"72-Hour Auto-Approval Active: Escrow will disburse to technician in 48h 12m unless a dispute is raised."_ This prevents dishonest buyers from withholding technician pay indefinitely.
