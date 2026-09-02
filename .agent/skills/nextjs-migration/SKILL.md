---
name: nextjs-migration
description: Guide, standards, and validation workflows for migrating and maintaining Next.js applications in the FieldForge monorepo (such as apps/web-buyer-portal). Covers App Router patterns, Redux client boundaries, Tailwind v4 PostCSS setup, Turborepo caching, and Playwright verification.
---

# FieldForge Next.js Migration & Engineering Skill

Use this skill when migrating applications from Vite/CRA to Next.js or developing Next.js App Router applications within the FieldForge monorepo.

---

## 1. Monorepo Integration Checklist

Before migrating an application to Next.js in FieldForge:

1. **Verify Turbo Task Outputs**:
   Ensure `turbo.json` includes `.next/**` and `!.next/cache/**` under `tasks.build.outputs`.
2. **ESLint Ignores**:
   Ensure `packages/eslint-config/index.js` includes `'**/.next/**'` in its `ignores` array.
3. **Internal Workspace Packages**:
   In `next.config.mjs`, declare:
   ```javascript
   transpilePackages: ['@fieldforge/contracts', '@fieldforge/ui'];
   ```
4. **Port Allocation & E2E Consistency**:
   Keep dev and preview ports aligned with existing tooling (e.g., `web-buyer-portal` dev server on port `5173`) to prevent breaking Playwright `playwright.config.ts`.

---

## 2. App Router Architecture Patterns

### A. Client Boundaries for State & Browser APIs

Next.js App Router defaults all components to React Server Components (RSC).

- **Redux Toolkit Providers**: Wrap in a `'use client'` component (`src/app/providers.tsx`):
  ```tsx
  'use client';
  import { Provider } from 'react-redux';
  import { store } from '@/store';

  export function Providers({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  ```
- **Component Directives**: Any component accessing `useState`, `useEffect`, `useRef`, or Redux hooks (`useSelector`, `useDispatch`) must declare `'use client'` at the top.
- **Browser APIs**: Guard any direct access to `localStorage` or `window` with `typeof window !== 'undefined'`.

### B. Tailwind CSS v4 in Next.js

Next.js does not use `@tailwindcss/vite`. Instead:

1. Install `@tailwindcss/postcss` and `postcss`.
2. Configure `postcss.config.mjs`:
   ```javascript
   export default {
     plugins: {
       '@tailwindcss/postcss': {}
     }
   };
   ```
3. Import in `src/app/globals.css`:
   ```css
   @import 'tailwindcss';
   ```

### C. Proxying Backend API Calls

In `next.config.mjs`, preserve API routing to the API gateway:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@fieldforge/contracts', '@fieldforge/ui'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*'
      }
    ];
  }
};
export default nextConfig;
```

---

## 3. Step-by-Step Migration Execution

1. **Update `package.json`**:
   - Add `next` (latest compatible with React 19, e.g. `^16.3.4` or `^15.3.9`).
   - Remove `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`.
   - Add `@tailwindcss/postcss` and `postcss`.
   - Update scripts:
     - `"dev": "next dev --port 5173"`
     - `"build": "next build"`
     - `"start": "next start --port 5173"`
     - `"typecheck": "tsc --noEmit"`
2. **Setup Configuration Files**:
   - `next.config.mjs`
   - `postcss.config.mjs`
   - Update `tsconfig.json` with Next.js plugin and jsx preserve.
   - Update `.gitignore` for `.next/`.
3. **Migrate Entry & Routing**:
   - Delete `index.html`, `src/main.tsx`, and `src/vite-env.d.ts`.
   - Create `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/providers.tsx`, and `src/app/globals.css`.
   - Add `'use client'` to interactive components.
4. **Update Dockerfile**:
   - Adjust container build for Next.js (either standalone node server or production runner).

---

## 4. Verification & Validation Protocol

Always run these verification steps after migration:

```bash
# 1. Type check
pnpm --filter @fieldforge/web-buyer-portal typecheck

# 2. Next.js build
pnpm --filter @fieldforge/web-buyer-portal build

# 3. Monorepo-wide checks
pnpm check

# 4. End-to-end tests (optional or focused)
pnpm --filter @fieldforge/web-buyer-portal test:e2e
```
