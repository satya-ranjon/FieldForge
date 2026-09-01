# 🎨 Design System & Stitch UI Directives

> **Rule ID:** `RULE-DESIGN-07` • **Priority:** `HIGH`

---

### 1. Source of Truth & Token Adherence

- `DESIGN.md` in the repository root is the canonical source of truth for all design tokens (colors, typography, spacing, border radii, shadows, breakpoints).
- No arbitrary, non-tokenized hex codes or ad-hoc margins may be introduced in component code. All styles must map to tokens defined in `DESIGN.md` and Tailwind classes configured across `@fieldforge/ui`, `apps/web-buyer-portal`, and `apps/mobile-tech-app`.

### 2. Component Primitives & Reusability

- All common UI building blocks (Buttons, Status Badges, Input Controls, Modal Dialogs, Skeleton Loaders) must reside in `@fieldforge/ui`.
- Domain-specific views (e.g. `SowBuilder`, `LiveDispatchBoard`, `EscrowManager`, `GpsRadar`) must compose `@fieldforge/ui` primitives rather than implementing disconnected bespoke controls.

### 3. Google Stitch & AI Canvas Synchronization

- When generating new UI screens or prototyping layouts with Google Stitch (`stitch.withgoogle.com`) or via the Stitch MCP server (`@_davideast/stitch-mcp`), prompts must explicitly ground themselves in the `DESIGN.md` token dictionary.
- Exported screens from Stitch must be mapped into TypeScript React / React Native components adhering to the project's strict typing and state management (Redux Toolkit / RTK Query).

### 4. Accessibility (A11y) Non-Negotiables

- All text and badge combinations must guarantee WCAG 2.1 AA minimum contrast (4.5:1 for body copy, 3:1 for large display headers).
- Interactive controls must provide explicit focus rings (`focus:ring-2 focus:ring-blue-500 focus:outline-none`) and accessible ARIA attributes.
- Minimum interactive touch targets on mobile surfaces must be 44x44px.
