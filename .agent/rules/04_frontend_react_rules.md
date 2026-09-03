# 🌐 Frontend & React 19 Directives

> **Rule ID:** `RULE-FE-04` • **Priority:** `HIGH`

> **Scope.** These directives apply to React code in both clients. The buyer
> portal is a **Next.js 16 App Router** app (not Vite, not a plain SPA) — read
> [`08_nextjs_web_buyer_portal_rules.md`](./08_nextjs_web_buyer_portal_rules.md)
> alongside this file before touching `apps/web-buyer-portal`, since server/client
> component boundaries and the PostCSS Tailwind setup are governed there. The
> mobile app is React Native + Expo; see
> [`05_mobile_react_native_rules.md`](./05_mobile_react_native_rules.md).

---

### 1. State Management & RTK Query

- Use Redux Toolkit (RTK) for client state and RTK Query for server state caching and optimistic UI updates.

### 2. Component Structure

- Adhere to atomic component organization under `components/work-orders`, `components/dispatch`, `components/billing`.
- Use Tailwind CSS with `@fieldforge/ui` primitives.
