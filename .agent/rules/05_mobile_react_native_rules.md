# Mobile and React Native Directives

> **Rule ID:** `RULE-MOB-05` • **Priority:** `HIGH`

## Offline-first architecture

- Persist active-gig deliverables locally when network connectivity drops.
- Flush queued mutations automatically when connectivity returns.
- Remove a queued mutation only after the server confirms success.

## GPS geofencing verification

- `ON_SITE` requires server-authoritative Haversine verification within 200
  metres of the stored work-site coordinates (FR-MOB-001).
- Mobile verification improves the user experience but is not an authorization
  or anti-fraud boundary.
