# 16 — Conversion, Activation & Retention Funnel Architecture

> **FieldForge Real-Time Enterprise Field Service Marketplace**  
> Two-Sided Funnel Mechanics, Psychological State Progression & Drop-Off Mitigation

---

## 1. The Two-Sided Marketplace Funnel Architecture

FieldForge operates as a synchronized double funnel. Buyer demand triggers technician supply, while technician liquidity drives buyer retention. Each stage corresponds to an evolving psychological state in the user's mind.

```
+-------------------------------------------------------------------------------+
|                       THE SEVEN-STAGE VALUE FUNNEL                            |
+-------------------------------------------------------------------------------+
  1. ACQUISITION   -> Visitor discovers platform via search, referral, or ad.
  2. ENGAGEMENT    -> Tests interactive radar preview; verifies local coverage.
  3. INTENT        -> Drafts work order SOW (Buyer) or opens gig preview (Tech).
  4. IDENTITY      -> Contextual auth gate (Email/Pass + Phone OTP).
  5. ACTIVATION    -> Escrow funded & published (Buyer) / Bid submitted (Tech).
  6. FULFILLMENT   -> Geofenced arrival (<=200m), task execution, proof of work.
  7. RETENTION     -> Escrow released, invoice generated, repeat SOW templates.
```

---

## 2. Enterprise Buyer Conversion Funnel

```
+-------------------------------------------------------------------------------------------------------+
| STAGE 1: ACQUISITION (Top of Funnel)                                                                  |
+-------------------------------------------------------------------------------------------------------+
  User Mental State  | "My retail store router is down. Can someone fix this today?"                    |
  Product Objective  | Establish instant enterprise credibility and communicate < 2-hour arrival speed.  |
  UX Requirement     | Ultra-fast load (< 1s), zero clutter, immediate interactive radar scope.         |
  Main CTA           | [Create Emergency Work Order] (Hero Primary).                                     |
  Key Measurement    | landing_page_viewed -> sow_studio_opened (Target >= 18%).                          |
  Drop-off Mitigation| Live radar lets visitor test their own zip code with zero signup barriers.        |
+-------------------------------------------------------------------------------------------------------+
| STAGE 2: ENGAGEMENT & EXPLORATION                                                                     |
+-------------------------------------------------------------------------------------------------------+
  User Mental State  | "Are there real, accredited engineers near my Dallas location?"                  |
  Product Objective  | Prove technician liquidity and showcase verified badges (Cisco CCNA, OSHA 10).    |
  UX Requirement     | Real-time radar scan showing local technician blips, average rating, and ETAs.    |
  Main CTA           | [Explore Vetted Technicians].                                                     |
  Key Measurement    | radar_preview_interacted -> sow_draft_created (Target >= 25%).                    |
  Drop-off Mitigation| Display real badge credentials and recent completed job counts.                   |
+-------------------------------------------------------------------------------------------------------+
| STAGE 3: INTENT & SOW CREATION                                                                        |
+-------------------------------------------------------------------------------------------------------+
  User Mental State  | "How hard is it to specify what I need, and how much will it cost?"              |
  Product Objective  | Enable SOW creation in < 60 seconds with pre-configured blueprint presets.        |
  UX Requirement     | 1-click templates (POS Swap, AP Install), auto-geocoding, transparent 8% fee calc|
  Main CTA           | [Proceed to Publish & Match].                                                     |
  Key Measurement    | sow_studio_opened -> sow_draft_created (Target >= 60%).                           |
  Drop-off Mitigation| Auto-save draft in localStorage; never lose typed data if browser closes.         |
+-------------------------------------------------------------------------------------------------------+
| STAGE 4: CONTEXTUAL AUTHENTICATION & SECURITY                                                         |
+-------------------------------------------------------------------------------------------------------+
  User Mental State  | "I'm ready to broadcast this. Why do I need an account?"                         |
  Product Objective  | Capture work email, company name, and phone OTP with minimum friction.           |
  UX Requirement     | Modal overlay preserving SOW draft; auto-advancing 6-digit SMS OTP input.         |
  Main CTA           | [Verify Phone & Continue].                                                        |
  Key Measurement    | auth_modal_triggered -> signup_completed (Target >= 75%).                         |
  Drop-off Mitigation| Inline re-auth modal; zero page redirects; SMS resend cooldown timer.             |
+-------------------------------------------------------------------------------------------------------+
| STAGE 5: ACTIVATION (Escrow Pre-Authorization & Broadcast)                                            |
+-------------------------------------------------------------------------------------------------------+
  User Mental State  | "Is my money safe? When does the contractor actually get paid?"                  |
  Product Objective  | Pre-authorize escrow hold and broadcast ticket to regional contractor queue.    |
  UX Requirement     | Stripe card/ACH input with clear vault copy: "Funds held in escrow until review." |
  Main CTA           | [Fund Escrow & Broadcast Work Order].                                             |
  Key Measurement    | escrow_preauth_initiated -> work_order_published (Target >= 85%).                 |
  Drop-off Mitigation| Support backup payment methods; clear failure recovery guidance on card decline.  |
+-------------------------------------------------------------------------------------------------------+
| STAGE 6: FULFILLMENT & TELEMETRY MONITORING                                                           |
+-------------------------------------------------------------------------------------------------------+
  User Mental State  | "Where is the technician? Are they on site yet?"                                 |
  Product Objective  | Provide 100% transparent live tracking without manual phone calls.                |
  UX Requirement     | Live status stepper, GPS radar distance, ETA countdown, flashing SLA breach alert|
  Main CTA           | [Inspect Live Transit / Check-In].                                                |
  Key Measurement    | work_order_published -> work_order_completed (Target >= 90%).                     |
  Drop-off Mitigation| Auto-route fallback if bids don't arrive within 15 minutes.                       |
+-------------------------------------------------------------------------------------------------------+
| STAGE 7: RETENTION & SETTLEMENT                                                                       |
+-------------------------------------------------------------------------------------------------------+
  User Mental State  | "Work looks good. How do I close this out and get an accounting invoice?"        |
  Product Objective  | Facilitate 1-click escrow release, PDF invoice download, and template re-use.    |
  UX Requirement     | Deliverable evidence gallery (before/after photos, serials, SHA-256 signature).  |
  Main CTA           | [Approve Work & Release Escrow].                                                  |
  Key Measurement    | work_order_completed -> escrow_released_manual (Target >= 92%).                   |
  Drop-off Mitigation| 72-hour auto-approval safety net prevents contractor non-payment disputes.        |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. Field Technician Activation Funnel

```
+-------------------------------------------------------------------------------------------------------+
| STAGE 1: GIG DISCOVERY (Zero-Auth Open Radar)                                                         |
+-------------------------------------------------------------------------------------------------------+
  Technician opens app -> Sees nearby tickets with prominent green payout chips ($250, $320).           |
  Motivation: "I'm already in this neighborhood. That's a fast $250."                                    |
+-------------------------------------------------------------------------------------------------------+
| STAGE 2: INTENT & PROPOSAL                                                                            |
+-------------------------------------------------------------------------------------------------------+
  Tech taps ticket -> Reviews SOW checklist -> Taps [Submit Proposal].                                  |
  Adjusts arrival slider ("Can be there in 30 mins").                                                   |
+-------------------------------------------------------------------------------------------------------+
| STAGE 3: CONTEXTUAL AUTH & PHONE OTP                                                                  |
+-------------------------------------------------------------------------------------------------------+
  Half-height sheet captures: Phone, Name, Hourly Rate. SMS OTP auto-fills. Ready in 20 seconds.        |
+-------------------------------------------------------------------------------------------------------+
| STAGE 4: ACTIVATION (First Bid Accepted)                                                              |
+-------------------------------------------------------------------------------------------------------+
  Push alert: "🎉 Bid Accepted! Escrow locked. Tap to start travel."                                    |
  Technician experiences undeniable proof of guaranteed payment before starting truck.                   |
+-------------------------------------------------------------------------------------------------------+
| STAGE 5: RETENTION & EARNINGS                                                                         |
+-------------------------------------------------------------------------------------------------------+
  Work completed -> Escrow releases -> Available Balance credits immediately.                           |
  Tech sees: "Settled: $280.00. 1099 Payout Ledger updated." High repeat retention.                      |
+-------------------------------------------------------------------------------------------------------+
```
