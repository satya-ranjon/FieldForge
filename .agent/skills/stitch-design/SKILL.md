---
name: stitch-design
description: Design-to-code workflow and design system enforcement using Google Stitch (stitch.withgoogle.com), DESIGN.md tokens, and the Stitch MCP server. Use when creating UI components, designing screens, integrating Stitch MCP resources, or enforcing FieldForge design standards.
---

# FieldForge Stitch Design & Design-to-Code Skill

Use this skill when generating, modifying, or auditing UI components across `@fieldforge/ui`, `apps/web-buyer-portal`, and `apps/mobile-tech-app`, or when interacting with Google Stitch via the Stitch MCP server (`@_davideast/stitch-mcp`).

---

## 1. Inspect Before Generating UI

Before designing or implementing new UI components or screens:

1. **Read `DESIGN.md`** in the repository root for canonical color tokens, typography scales, spacing grids, radius standards, and status color semantics.
2. **Inspect `@fieldforge/ui`** (`packages/ui/src/index.ts`) to reuse existing primitives (e.g. `Button`, `StatusBadge`, input fields) rather than creating one-off components.
3. **Inspect the target surface**:
   - `apps/web-buyer-portal`: React 19 + Tailwind CSS + Redux Toolkit (RTK Query).
   - `apps/mobile-tech-app`: React Native + Expo + Geofencing / Offline Sync.

---

## 2. Stitch MCP Integration Workflow

When utilizing Google Stitch (`stitch.withgoogle.com`) or the Stitch MCP server:

### A. Exploring & Fetching Screens

- Use Stitch MCP tools (`screens`, `view`, `snapshot`) to retrieve high-fidelity HTML/CSS layouts and design tokens generated in Stitch.
- Inspect the design token schema emitted by Stitch and verify alignment with `DESIGN.md`.

### B. Converting Stitch Designs to Production Code

- **Decompose into Components**: Break monolithic Stitch HTML layouts into modular, reusable React components under the domain directory (e.g. `components/work-orders/`, `components/dispatch/`, `components/billing/`).
- **Bind Design Tokens**: Replace arbitrary styles with Tailwind CSS classes or CSS variables mapped directly to `DESIGN.md`.
- **Integrate State & APIs**: Bind UI elements to RTK Query hooks and `@fieldforge/contracts` DTOs/validators.

---

## 3. UI Invariants

- **Token Consistency**: Never hardcode arbitrary hex colors (e.g., `#123456`) in components. Use standard Tailwind color scales or design tokens (`slate-900`, `blue-600`, `cyan-500`, `emerald-500`, etc.).
- **Glanceable Status**: All work order and dispatch statuses must render using `@fieldforge/ui` `StatusBadge` components with deterministic semantic colors.
- **Strict A11y Standards**:
  - Minimum text contrast ratio of 4.5:1 (WCAG AA).
  - All interactive elements require visible `:focus-visible` or `focus:ring-2` focus states.
  - Interactive targets on mobile screens must meet the 44x44px minimum touch area.

---

## 4. Verification Workflow

After adding or updating UI components:

1. Run `pnpm check` to verify Prettier formatting, ESLint rules, TypeScript types, and unit tests.
2. Ensure `@fieldforge/ui` compiles successfully (`pnpm --filter @fieldforge/ui build`).
3. Validate that consuming apps (`web-buyer-portal`, `mobile-tech-app`) build without type or style errors (`pnpm --filter @fieldforge/web-buyer-portal build`).
