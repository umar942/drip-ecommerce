# DRIP — Premium Streetwear Store

A full-stack e-commerce platform for a premium streetwear brand. Customers can browse products, manage a cart and wishlist, place orders, and track their order history. Admins get a full dashboard with analytics, product/order/user management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/shop run dev` — run the storefront (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, Recharts, Wouter (routing)
- **API**: Express 5, JWT auth (jsonwebtoken + bcryptjs)
- **DB**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild (CJS bundle for API server)

## Where things live

- `artifacts/shop/` — React + Vite storefront
- `artifacts/api-server/` — Express API server
- `lib/db/src/schema/index.ts` — Drizzle ORM schema (source of truth for DB shape)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Orval-generated React Query hooks + Zod schemas (do not edit)

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → typed hooks + schemas used by both client and server
- JWT stored in `localStorage` under key `drip_token`; injected via `setAuthTokenGetter` in `artifacts/shop/src/lib/api.ts`
- `SESSION_SECRET` env var is the JWT signing secret
- `numeric` columns in Postgres (prices) must be `parseFloat()`-ed when building API responses
- All imports from the generated API client use `@workspace/api-client-react` (the package index) — never sub-path imports like `/src/generated/api`

## Product

- **Storefront**: Home with hero + featured products, product listing with category/price filters, product detail page, cart, wishlist, checkout, orders, order detail, profile
- **Admin panel** (at `/admin`): dashboard with revenue/order charts, product CRUD, order status management, user role management
- **Auth**: register, login, JWT-gated routes; admin role gates the admin panel

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any `lib/*` schema change, run `pnpm run typecheck:libs` before artifact typechecks — stale lib declarations cause confusing import errors
- Never import sub-paths from `@workspace/api-client-react/src/...` — always import from the package root `@workspace/api-client-react`
- Admin seed credentials: `admin@drip.store` / `password`
- Products use `numeric` in DB — parseFloat price fields in all API route responses

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
