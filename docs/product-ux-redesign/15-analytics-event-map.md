# 15 — UX Analytics Event Map & Measurement Plan

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Event Taxonomy, Conversion Telemetry, Funnel Instrumentation & SLO Alignment

---

## 1. Analytics Telemetry Architecture

Every user interaction, state mutation, and friction point across the FieldForge Web and Mobile platforms is instrumented using an **action-oriented event taxonomy**. Events conform to the standard structure:

```json
{
  "event": "domain_entity_action",
  "properties": {
    "userId": "usr_98a1...",
    "role": "BUYER | TECHNICIAN",
    "correlationId": "c_28f01...",
    "platform": "WEB | MOBILE_IOS | MOBILE_ANDROID",
    "timestamp": "2026-09-15T13:40:00.000Z"
  }
}
```

---

## 2. Complete Event Taxonomy Matrix

| Event Name                   | Category     | Trigger Condition                                    | Key Properties / Payload                             | Funnel Stage   | Conversion / Drop-Off Significance              |
| :--------------------------- | :----------- | :--------------------------------------------------- | :--------------------------------------------------- | :------------- | :---------------------------------------------- |
| `landing_page_viewed`        | Growth       | Visitor loads public landing page.                   | `referrer`, `utmSource`, `geoCity`                   | Acquisition    | Top of funnel volume.                           |
| `radar_preview_interacted`   | Growth       | Visitor types zip/city into public radar scope.      | `searchQuery`, `radiusSelected`, `techCountFound`    | Engagement     | Measures core value proposition engagement.     |
| `sow_studio_opened`          | Buyer Funnel | User clicks "New Work Order" or landing CTA.         | `entryPoint` ("HEADER" vs "HERO"), `presetSelected`  | Intent         | Intent to create ticket.                        |
| `sow_draft_created`          | Buyer Funnel | Step 1 completed; draft stored in local state.       | `category`, `budgetType`, `estimatedBudgetMinor`     | Intent         | Drop-off indicator between scope and location.  |
| `sow_geocoded_success`       | Buyer Funnel | Valid address entered; coordinates resolved.         | `latitude`, `longitude`, `geofenceMeters` (200)      | Setup          | Address entry friction detection.               |
| `auth_modal_triggered`       | Identity     | Contextual auth gate appears on unauth user.         | `triggerSource` ("PUBLISH_WO", "SUBMIT_BID")         | Auth Gate      | Measures conversion friction of delayed auth.   |
| `signup_completed`           | Identity     | User completes `POST /auth/register`.                | `role` ("BUYER" vs "TECH"), `authProvider`           | Auth Gate      | Core signup conversion milestone.               |
| `phone_otp_verified`         | Identity     | User enters valid 6-digit SMS OTP code.              | `durationSeconds`, `attemptsCount`                   | Onboarding     | Measures SMS delivery reliability and drop-off. |
| `escrow_preauth_initiated`   | Billing      | Buyer submits card/ACH for escrow hold.              | `workOrderId`, `amountMinor`, `platformFeeMinor`     | Activation     | Critical financial commitment gate.             |
| `escrow_preauth_failed`      | Billing      | Stripe pre-auth card declined or error.              | `errorCode`, `failureReason`, `workOrderId`          | Friction       | High-priority conversion drop-off leak.         |
| `work_order_published`       | Marketplace  | Ticket transitions to `PUBLISHED` (FSM).             | `workOrderId`, `category`, `budgetMinor`, `slaHours` | **Activation** | **Primary Buyer Activation Milestone.**         |
| `gig_feed_viewed`            | Tech Funnel  | Technician opens nearby gigs screen.                 | `techLocation`, `gigsCountNearby`, `filterRadius`    | Engagement     | Marketplace liquidity and job density.          |
| `gig_preview_opened`         | Tech Funnel  | Technician taps a gig card to view SOW.              | `workOrderId`, `payoutMinor`, `distanceMiles`        | Intent         | Measures attractiveness of gig payouts.         |
| `bid_proposal_submitted`     | Tech Funnel  | Technician submits proposal (`POST .../bids`).       | `workOrderId`, `bidAmountMinor`, `etaMinutes`        | **Activation** | **Primary Technician Activation Milestone.**    |
| `bid_accepted`               | Marketplace  | Buyer accepts contractor bid.                        | `workOrderId`, `technicianId`, `acceptedAmountMinor` | Fulfillment    | Core marketplace transaction handshake.         |
| `auto_route_matched`         | Marketplace  | Buyer executes 1-click auto-dispatch $\le 5$mi.      | `workOrderId`, `technicianId`, `matchRadiusMiles`    | Fulfillment    | Measures autonomous matching adoption.          |
| `transit_started`            | Execution    | Technician taps "Start Travel" (`EN_ROUTE`).         | `workOrderId`, `technicianId`, `departureTime`       | Fulfillment    | Transition to active travel.                    |
| `geofence_checkin_success`   | Execution    | Tech arrives $\le 200\text{m}$ and confirms on-site. | `workOrderId`, `distanceMeters`, `isOffline`         | Fulfillment    | Verification of physical presence SLA.          |
| `geofence_checkin_blocked`   | Execution    | Tech attempts check-in while $> 200\text{m}$.        | `workOrderId`, `distanceMeters` ($>200$)             | Friction       | Measures GPS drift or premature check-in.       |
| `deliverable_photo_uploaded` | Evidence     | Before or After photo uploaded to S3.                | `workOrderId`, `deliverableType`, `sizeBytes`        | Execution      | Media pipeline health.                          |
| `signature_captured`         | Evidence     | Client store manager signs on-screen.                | `workOrderId`, `signerName`, `hashDigest`            | Execution      | Legal and cryptographic sign-off.               |
| `work_order_completed`       | Fulfillment  | Tech completes all tasks (`COMPLETED`).              | `workOrderId`, `executionDurationMinutes`            | Fulfillment    | Execution completion milestone.                 |
| `escrow_released_manual`     | Settlement   | Buyer approves work and releases funds.              | `workOrderId`, `disbursedAmountMinor`, `rating`      | **Retention**  | Successful transactional cycle close.           |
| `escrow_released_auto72h`    | Settlement   | 72h SLA timer expires; funds auto-release.           | `workOrderId`, `disbursedAmountMinor`                | Settlement     | Measures buyer engagement latency.              |
| `dispute_raised`             | Governance   | Buyer or Tech flags order as `DISPUTED`.             | `workOrderId`, `disputeReason`, `raisedByRole`       | Exception      | Marketplace quality breakdown monitor.          |

---

## 3. Core Funnel Metrics & Target Benchmarks

```
+-------------------------------------------------------------------------------+
|                       KEY PERFORMANCE INDICATOR (KPI) TARGETS                 |
+-------------------------------------------------------------------------------+
  FUNNEL STAGE                     BENCHMARK TARGET    MEASUREMENT
  ─────────────────────────────────────────────────────────────────────────────
  Landing to SOW Draft Started     ≥ 18.0%             sow_studio_opened / landing_page_viewed
  SOW Draft to Escrow Published    ≥ 45.0%             work_order_published / sow_draft_created
  Published WO to First Bid (<15m) ≥ 85.0%             Time to first bid_proposal_submitted
  Bids Received to Bid Accepted    ≥ 78.0%             bid_accepted / work_order_published
  Geofence Check-In Success Rate   ≥ 96.0%             geofence_checkin_success vs blocked
  Completed to Escrow Approved     ≥ 92.0%             escrow_released / work_order_completed
  Net Dispute Rate                 < 1.5%              dispute_raised / work_order_completed
```
