### Project Structure

This document outlines the repository structure and the purpose of key directories/files. It complements `README.md` without duplicating setup details.

#### Root Overview

```
/
├─ app/                 # Next.js App Router (routes, layouts, API routes)
├─ components/          # Reusable UI components
├─ constants/           # App-wide constants and enums
├─ features/            # Feature/domain modules (DTOs, services, actions, UI)
├─ funcs/               # Project-specific utility functions
├─ helpers/             # Generic helpers (formatting, parsing, etc.)
├─ hooks/               # Reusable React hooks
├─ i18n/                # Internationalization setup and resources
├─ icons/               # SVG/icon components
├─ lib/                 # Cross-cutting libs (API client, errors, env)
├─ messages/            # Message catalogs / copy blocks
├─ prisma/              # Prisma schema and migrations
├─ public/              # Static assets (served as-is)
├─ types/               # Shared TypeScript types and DTOs
├─ Dockerfile           # Container image definition
├─ README.md            # Project overview and setup
├─ compose.yml          # Docker Compose stack
├─ eslint.config.mjs    # ESLint configuration
├─ next.config.ts       # Next.js configuration
├─ package.json         # Package manifest and scripts
├─ pnpm-lock.yaml       # Dependency lockfile
├─ postcss.config.mjs   # PostCSS/Tailwind config
├─ proxy.ts             # Proxy/edge helpers
├─ tsconfig.json        # TypeScript configuration
└─ vercel.json          # Vercel deployment config
```

#### app/

Next.js App Router root. Contains route groups, pages, layouts, and API route handlers.
- `layout.tsx` — Root layout
- `not-found.tsx` — Global 404
- `globals.css`, `theme-custom.css` — Global styles
- `toaster-wrapper.tsx` — Toast provider wrapper

Common route groups and folders (examples):
- `(auth)/`, `(public)/`, `(seller)/`
- `dashboard/`, `manager/`, `messages/`, `success/`, `cancel/`, `data/`
- `api/` — HTTP route handlers, e.g.:
  - `api/search/route.ts`
  - `api/reviews/route.ts`
  - `api/vouchers/route.ts`
  - `api/seller/shops/route.ts`
  - `api/seller/vouchers/route.ts`
  - `api/manager/voucher/route.ts`
  - `api/seller/order-stats/route.ts`

#### features/

Feature-first organization. Each feature can bundle its DTOs, services, actions, and UI.
- `features/voucher/`
  - `voucher.dto.ts` — Input/validation DTOs
  - `voucher.service.ts` — Voucher domain service layer
  - `voucher.action.ts` — Server/client actions for voucher workflows
- `features/order/`
  - `order.service.ts` — Order domain services

Guideline: Place domain-specific logic/types close to their feature.

#### lib/

Cross-cutting utilities used across features:
- `client-fetch.ts` — Typed fetch wrapper (client-side)
- `api-response.ts` — Standard API response helpers
- `service-error.ts` — Custom error for service layer
- `env.ts` — Environment validation (referenced in `README.md`)

#### types/

Shared TypeScript contracts used between features and APIs.
- `api.ts` — Common API request/response types

#### prisma/

Prisma ORM files:
- `schema.prisma` — Data model
- `migrations/` — Migration history

#### public/

Static assets (served from site root). Example:
- `public/readme/home.png` — README screenshot

#### helpers/, funcs/, hooks/

- `helpers/` — Generic helper utilities
- `funcs/` — Project-specific functions
- `hooks/` — Reusable React hooks (client/server as needed)

#### constants/, messages/

- `constants/` — Role enums, route names, config constants
- `messages/` — Message catalogs or copy blocks (may complement i18n)

#### icons/

SVG/icon React components. Prefer consistent naming and tree-shakable exports.

### Conventions

- Use feature-first organization inside `features/` for better cohesion.
- Keep cross-cutting primitives in `lib/` with small, documented APIs.
- Re-export public APIs via `index.ts` files where it improves DX.

### How to Extend

- Add a feature:
  1) Create `features/<name>/` with `*.dto.ts`, `*.service.ts`, and actions/UI as needed.
  2) Add routes or API handlers in `app/` (e.g., `app/api/<name>/route.ts`).
  3) Place shared contracts in `types/` when reused broadly.

- Add an API route:
  1) Create `app/api/<route>/route.ts`.
  2) Use `lib/api-response.ts` for consistent responses and `lib/service-error.ts` for errors.

### Related

- See `README.md` for setup, features, and tech stack. Keep this file updated when structure changes.
