# 📱 Mobile & React Native Directives
> **Rule ID:** `RULE-MOB-05` • **Priority:** `HIGH`

---

### 1. Offline First Architecture
- Cache active gig deliverables in local SQLite storage when network connectivity drops.
- Flush queued mutations automatically upon network restoration.

### 2. GPS Geofencing Verification
- Check-in transitions (`ON_SITE`) require Haversine distance verification $\le 100	ext{m}$ from the work site coordinates.
