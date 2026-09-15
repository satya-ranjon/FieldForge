# 05 — Authentication & Progressive Onboarding Strategy

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Contextually Gated Identity, Frictionless Trust Gates & Progressive Activation

---

## 1. Action Access Stratification Matrix

Premature authentication is the leading cause of visitor bounce in two-sided marketplaces. FieldForge adopts a **Contextual Gate Strategy**: users are encouraged to explore inventory, calculate escrow budgets, or author a complete Scope of Work _before_ being prompted to create an account. Authentication is demanded only at the precise moment a binding transaction or private data access occurs.

```
+-------------------------------------------------------------------------------+
|                       ACTION ACCESS STRATIFICATION                            |
+-------------------------------------------------------------------------------+
  [PUBLIC]              -> Browse radar, view pricing, draft SOW, calculate fees
  [CONTEXTUALLY GATED]  -> Save draft, broadcast work order, submit contractor bid
  [AUTH-GATED]          -> Fund escrow, check in with GPS, upload deliverables
  [ROLE-GATED]          -> Release escrow (Buyer), verify badges (Admin/Dispatcher)
```

| Action / Capability                              | Access Classification  | Gate Trigger Moment                                                                                           | Backend Enforcement                                                                                    |
| :----------------------------------------------- | :--------------------- | :------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------- |
| **Inspect Public Marketplace Radar**             | `[Public]`             | None (open to all visitors).                                                                                  | Public static preview / aggregated telemetry.                                                          |
| **Use SOW Scope Estimator & Pricing Calculator** | `[Public]`             | None (zero friction lead generation).                                                                         | Client-side calculations (`minorUnits` contract rules).                                                |
| **Draft a Work Order SOW**                       | `[Contextually Gated]` | Allowed without login; draft stored in `localStorage`. Gate triggers on "Save Draft" or "Proceed to Publish". | `POST /work-orders` requires `BUYER` Bearer JWT `[Backend Constraint]`.                                |
| **Browse Local Technician Directory**            | `[Public]`             | Anonymized preview (ratings, badges, distance; phone/real names masked).                                      | Masked public directory endpoint.                                                                      |
| **Browse Nearby Available Gigs (Mobile)**        | `[Public / Preview]`   | Preview titles, approximate city/radius, and payout ranges. Exact client name and street address masked.      | `GET /work-orders` query filtering `PUBLISHED`.                                                        |
| **Submit a Contractor Bid**                      | `[Contextually Gated]` | Tech can tap "Bid", adjust rate slider; gate triggers upon tapping "Confirm Proposal".                        | `POST /work-orders/:id/bids` requires `TECHNICIAN` JWT `[Backend Constraint]`.                         |
| **Lock Escrow & Publish Ticket**                 | `[Auth-Gated]`         | Immediately prior to escrow pre-auth transaction.                                                             | `POST /billing/escrow/preauth` requires `BUYER` JWT `[Backend Constraint]`.                            |
| **Geofenced Check-In & Deliverables Upload**     | `[Auth-Gated]`         | On-site execution screen.                                                                                     | `/transition` and `/deliverables/*` require authenticated JWT `[Backend Constraint]`.                  |
| **Approve Deliverables & Release Escrow**        | `[Role-Gated]`         | Post-completion sign-off.                                                                                     | `POST /billing/escrow/release` requires `BUYER` or `ADMIN` `[Backend Constraint]`.                     |
| **Verify Contractor Accreditation Badges**       | `[Role-Gated]`         | Admin vetting queue.                                                                                          | `PATCH /technicians/certifications/:id/verify` requires `ADMIN` / `DISPATCHER` `[Backend Constraint]`. |

---

## 2. Authentication UX Architecture

### 2.1 Delayed, High-Intent Conversion

1. **Never Start with "Create an Account"**: When an enterprise buyer lands on FieldForge, the primary headline and CTA invite them to **"Draft an Emergency Work Order in 60 Seconds"** or **"Explore Vetted Techs Near Your Site"**.
2. **Intent Preservation Handshake**:
   - If an unauthenticated buyer builds a draft SOW and clicks **"Publish Work Order"**, the SOW draft is serialized into temporary session storage.
   - An elegant, modal Auth Drawer opens over the draft with the message: _“Save your draft and lock escrow to broadcast to 42 nearby engineers.”_
   - Upon successful signup or login, the system **automatically re-attaches the draft** and transitions directly to the Escrow Pre-Authorization step with zero data re-entry.

### 2.2 Role-Aware Split Authentication

The registration endpoint (`POST /auth/register`) strictly requires a `role: UserRole` (`BUYER` or `TECHNICIAN`) alongside role-specific metadata (`companyName`, `billingAddress` vs. `firstName`, `lastName`, `hourlyRateMinor`) `[Backend Constraint]`.

- **UX Implementation**:
  - The Auth Modal opens with a crisp, tactile 2-way intent selector:
    - **🏢 "I Need Service" (Enterprise Buyer)**
    - **🔧 "I Want to Work" (Certified Technician)**
  - Toggling changes the form dynamically:
    - Buyer form requests: Work Email, Password, Company Name, Billing Address.
    - Technician form requests: Full Name, Mobile Phone, Standard Hourly Rate, Primary Metro.

### 2.3 Token Expiration & Transparent Mutex Refresh

- **Backend Reality**: JWT access tokens are short-lived, while refresh tokens are persisted in `refresh_tokens` `[Backend Constraint]`.
- **UX Invariant**: When an API request returns `401 Unauthorized`, the user must **never** be abruptly logged out or redirected to a blank login page while filling out a form or uploading a photo.
- **Handling**: A client-side mutex (`baseQueryWithReauth`) intercepts the 401, issues `POST /auth/refresh`, updates the tokens in memory, and replays the failed request transparently. If refresh fails (token revoked/expired), the user's form input is saved to local storage, and a non-destructive re-auth modal appears inline without refreshing the browser page.

---

## 3. Progressive Onboarding Strategy

Large, 10-step upfront onboarding forms destroy conversion rates. FieldForge separates onboarding into **Mandatory Activation Gates** (required before financial or physical actions) and **Progressive Personalization** (completed over time).

```
+-------------------------------------------------------------------------------+
|                       PROGRESSIVE ONBOARDING PROGRESSION                      |
+-------------------------------------------------------------------------------+
  STAGE 1: MINIMAL SIGNUP       -> Email, Password, Role (15 seconds)
  STAGE 2: INTENT EXECUTION     -> Buyer drafts order / Tech previews local gig
  STAGE 3: MANDATORY TRUST GATE -> Phone OTP verification (before first publish/bid)
  STAGE 4: COMPLIANCE ENRICHMENT-> Stripe payment instrument / Tech certification upload
```

---

### 3.1 Enterprise Buyer Onboarding Flow

```
Visitor drafts SOW
        ↓
Clicks "Publish Work Order"
        ↓
Quick Auth Modal (Email, Password, Company Name)
        ↓
Account Created [JWT Issued]
        ↓
Step 1: Phone OTP Verification (Inline 6-digit SMS code)
        ↓
Step 2: Add Escrow Payment Instrument (Stripe Pre-Auth Card / ACH)
        ↓
Work Order Published & Escrow Locked [Activation Success]
        ↓
(Optional Later): Setup SOW defaults & corporate billing addresses
```

- **Step 1: Phone OTP Verification (`POST /auth/phone/*`)**:
  - A 6-digit code is dispatched via SMS.
  - Auto-advancing digit input fields with 60-second resend cooldown.
  - Solves marketplace spam and ensures enterprise buyers can receive emergency SMS alerts regarding technician dispatch.
- **Step 2: Escrow Payment Pre-Authorization**:
  - Payment method is captured via secure Stripe Elements.
  - Funds for the current work order are pre-authorized and locked into escrow (`POST /billing/escrow/preauth`).
  - Buyer immediately sees the ticket transition to `PUBLISHED` on the Live Dispatch Board.

---

### 3.2 Field Technician Onboarding Flow

```
Technician downloads app / opens mobile web
        ↓
Explores nearby gig heatmap & payout rates (No login required)
        ↓
Taps "Claim Gig" or "Submit Bid"
        ↓
Quick Auth (Mobile Phone, Full Name, Password, Hourly Rate)
        ↓
Step 1: Instant Phone OTP Verification (Auto-filled on mobile)
        ↓
Step 2: Location Permission Grant ("Allow Always While Working")
        ↓
First Bid Submitted! [Aha Moment]
        ↓
Progressive Badge Upload (Prompted to upload Cisco/OSHA to unlock higher rates)
```

- **Zero-Block Exploration**: Technicians can see how many gigs exist in their zip code before creating an account.
- **Location Permission Education**: Before triggering the OS location permission dialog, a pre-permission screen explains: _"FieldForge uses background GPS to verify your physical arrival at the job site within 200m so your billable time starts automatically."_
- **Delayed Accreditation Verification**: Technicians can bid on standard low-voltage / maintenance gigs immediately. High-security enterprise tickets requiring `Cisco CCNA` or `OSHA 10` display a badge lock icon: _"Requires Verified Cisco CCNA. Upload certificate to unlock."_ This turns compliance into an aspirational progression rather than an onboarding wall.

---

## 4. UX Decision Documentation

### Decision: Delayed Authentication with Intent-Preserved Draft Handshake

- **User Problem**: Visitors abandon the site when forced to create an account before seeing if the product solves their immediate problem.
- **Reasoning**: Allowing buyers to author a complete SOW and technicians to inspect real gig payouts builds high sunk-cost and psychological commitment. By the time auth is required, the user has already experienced value.
- **Backend Compatibility**: Completely compatible. The backend endpoints (`POST /work-orders`, `POST /work-orders/:id/bids`) strictly enforce authentication. The draft state lives entirely in frontend client storage until the JWT is acquired.
- **Web Behavior**: SOW creator allows full completion; "Publish" triggers an overlay auth modal without page reload.
- **Mobile Behavior**: Gig feed is browsable; tapping "Bid" opens a half-height auth bottom sheet.
- **Alternative Considered**: Traditional "Sign Up -> Verify Email -> Onboarding Wizard -> Empty Dashboard" flow.
- **Why Rejected**: Causes an estimated 65%+ drop-off. The user is forced to invest effort before receiving any proof that competent technicians exist in their geography.
