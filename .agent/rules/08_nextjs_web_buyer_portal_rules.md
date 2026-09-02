# ⚡ Next.js & Web Buyer Portal Directives

> **Rule ID:** `RULE-NEXTJS-08` • **Priority:** `HIGH`

---

### 1. Next.js Architecture & App Router Conventions

- Use the modern Next.js App Router under `apps/web-buyer-portal/src/app/`.
- Ensure clean separation between React Server Components (RSC) and Client Components:
  - Mark any component utilizing React hooks (`useState`, `useEffect`, `useRef`), browser APIs (`window`, `localStorage`), or Redux hooks (`useSelector`, `useDispatch`) with `'use client'`.
  - Isolate client providers (such as Redux `<Provider store={store}>`) inside a dedicated client wrapper component (e.g. `src/app/providers.tsx`) rather than wrapping the root layout directly in client mode.
- Maintain route hierarchy adhering to domain scopes (e.g., `/` for command center, or modular nested routes if tabs transition to routes).

### 2. Monorepo & Turborepo Compatibility

- Preserve port parity: Next.js dev server must run on `--port 5173` to prevent breaking existing Playwright E2E configurations and proxy setups.
- Configure `next.config.mjs` with `transpilePackages: ['@fieldforge/ui', '@fieldforge/contracts']` to support internal workspace packages smoothly.
- Configure API rewrites in `next.config.mjs` matching the previous Vite reverse proxy (`/api/:path*` -> `http://localhost:8000/:path*`).
- In `turbo.json`, preserve output cache directories: `.next/**`, `!.next/cache/**`.
- In ESLint configuration (`packages/eslint-config/index.js`), ensure `**/.next/**` is ignored to prevent linting generated build artifacts.

### 3. Styling & Tailwind CSS v4

- Tailwind CSS v4 in Next.js must be integrated using `@tailwindcss/postcss` and `postcss.config.mjs` (replacing `@tailwindcss/vite`).
- All styling tokens must adhere strictly to `DESIGN.md` tokens and the custom theme defined in `src/styles/index.css` (or `src/app/globals.css`).
- Retain custom keyframes (`animate-radar-sweep`, `animate-radar-ripple`) and design system utility classes (`glow-blue`, `glow-emerald`, `glow-cyan`, `glow-amber`).

### 4. Verification & Testing Guardrails

- Playwright tests under `e2e/` must remain passing against the Next.js dev server.
- Must pass `pnpm --filter @fieldforge/web-buyer-portal typecheck`.
- Must pass `pnpm --filter @fieldforge/web-buyer-portal build`.
- Must pass monorepo-wide `pnpm check`.
