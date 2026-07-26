# Chiklati Bank

A business banking proof-of-concept built on [Unit](https://unit.co)'s Banking-as-a-Service API. It lets a business (or individual) apply for an account, get approved through real KYC/KYB, open a deposit account, move money three ways (internal transfer, ACH, wire), and issue virtual debit cards — all backed by Unit's live sandbox, not mocked data.

This is a portfolio/POC project, not a production bank. It exists to demonstrate a realistic, correctly-modeled integration with a BaaS provider: idempotent APIs, webhook-driven state reconciliation, pessimistic-locked ledger writes, and PCI-conscious handling of card data.

## Table of contents

- [What it does](#what-it-does)
- [Functional coverage](#functional-coverage)
- [Non-functional coverage](#non-functional-coverage)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Known limitations](#known-limitations)
- [License](#license)

## What it does

A user signs up, submits an application (Individual or Business) that goes through Unit's real KYC/KYB decisioning, and — once approved — can open a deposit account, send and receive money, and issue and manage debit cards, all from a web dashboard.

## Functional coverage

- **Onboarding**: Individual and Business application submission, mapped to Unit's `applications` API, with async status updates (`AwaitingDocuments` → `PendingReview`/`Approved`/`Denied`) driven by real Unit webhooks.
- **Accounts**: deposit account creation per approved customer; live balance and transaction history.
- **Payments**: three transfer rails —
  - **Book**: instant transfer between the user's own accounts.
  - **ACH**: push/pull transfers to an external counterparty (with counterparty management).
  - **Wire**: outbound wire transfer with an inline counterparty + address.
- **Cards**: virtual debit card issuance for both Individual and Business customers, with full lifecycle management — freeze, unfreeze, close, report stolen, report lost — and card-driven purchase transactions that post to the same ledger as everything else.
- **Dashboard**: a single home screen surfacing every action above (send money, issue a card, open an account) plus inline card actions and recent activity, so nothing requires hunting through menus.
- **Sandbox tooling**: dev-only endpoints (never registered in production) that trigger Unit's own sandbox simulators — advancing an ACH/wire payment's lifecycle, or simulating a card purchase — so the whole system can be exercised end-to-end without real money movement.

## Non-functional coverage

Enforced project-wide per `CLAUDE.md`:

- **Correct money handling**: all amounts are `BigInt` cents in the database and API layer — never floating-point. DTOs carry money as regex-validated numeric strings since JSON can't represent `BigInt`.
- **Idempotency**: every state-changing endpoint requires an `Idempotency-Key` header, enforced by a Redis-backed lock (`processing` → `409`, `completed` → cached replay, `new` → execute once).
- **Concurrency safety**: every ledger write goes through one function (`applyTransactionCreated`) that takes a `SELECT ... FOR UPDATE` row lock and a staleness guard, so concurrent or out-of-order webhook deliveries can never corrupt a balance.
- **Webhook security & reliability**: inbound Unit webhooks are HMAC-verified against the raw request body, persisted to an audit table before processing, and handled asynchronously by a BullMQ worker — so a slow handler can never block Unit's webhook delivery, and every event is replayable from the audit log.
- **PCI-conscious card handling**: the app never stores or handles a full card number, CVV, or PIN — only `unit_card_id` and masked fields (`last4Digits`, `expirationDate`). Full card-data reveal is Unit's own hosted, cross-origin surface, deliberately not built here.
- **Structured, redacted logging**: JSON logs (Pino) with sensitive field names (`ssn`, `ein`, `password`, `token`, `cardNumber`, `cvv`, `accountNumber`) automatically scrubbed.
- **Fail-fast configuration**: all environment variables are validated with Zod at startup; the process crashes immediately on a missing/malformed secret rather than limping along.
- **Type safety**: strict TypeScript throughout, no `any`, shared Zod schemas as the single source of truth for both request validation and inferred types.

## Architecture

```
apps/
  api/      Fastify API — Controller → Service → Repository → Mapper per domain module
  web/      Next.js 16 (App Router) — server components fetch via a thin internal-JWT client;
            apps/web/src/app/api/* are BFF proxy routes for client-side mutations
packages/
  db/       Prisma schema + generated client, shared by apps/api
  shared/   Zod DTOs shared by both apps (request/response schemas, inferred types)
```

Money movement (Book/ACH/Wire payments, card purchases) all converges on one pessimistic-locked write path in `accounts.repository.ts`. Everything else — application status, account status, card status, payment status — updates through the same shape: a Unit webhook arrives, gets HMAC-verified and persisted, then an async worker resolves the relevant local row and applies the update only if the event is newer than what's already recorded.

See `CONTEXT.md` for a fuller phase-by-phase breakdown of what's been built and the patterns to follow when extending it.

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict, no `any`) |
| API | Fastify 5 |
| Web | Next.js 16 (App Router), React 19 |
| Auth | Auth.js (NextAuth) v5, service-to-service via short-lived HS256 JWTs |
| Database | PostgreSQL + Prisma ORM |
| Cache / locks / queue | Redis (ioredis) + BullMQ |
| Validation | Zod (env vars, request bodies, webhook signatures) |
| Testing | Vitest |
| Monorepo | pnpm workspaces + Turborepo |
| Banking provider | [Unit](https://unit.co) (sandbox) |

## Prerequisites

- Node.js `>=20.19.0 <21`, `>=22.13.0`, or `>=24` (see `package.json#engines`)
- [pnpm](https://pnpm.io) `10.34.5` (pinned via `packageManager`)
- Docker (for local Postgres + Redis)
- A [Unit](https://unit.co) sandbox account (org API token + webhook secret)
- [ngrok](https://ngrok.com) or similar, to expose your local API for Unit's webhooks

## Getting started

```bash
# 1. Install dependencies (also generates the Prisma client and builds packages/db + packages/shared)
pnpm install

# 2. Start local Postgres + Redis
docker compose up -d

# 3. Configure environment
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# then edit both files — see "Environment variables" below

# 4. Apply the database schema
pnpm --filter @chiklati/db run migrate:dev

# 5. (optional) seed a dev user
pnpm --filter @chiklati/db run seed
```

## Environment variables

`.env.example` at the repo root documents every variable; copy it to `apps/api/.env` and `apps/web/.env.local` (each app only reads what it needs — unused vars are harmless).

| Variable | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | api | Points at the local Postgres container (port `5433`, not the default `5432`) |
| `REDIS_URL` | api | Local Redis container (port `6380`, not the default `6379`) |
| `PORT` | api | API listen port (default `4000`) |
| `LOG_LEVEL` | api | Pino log level |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | web | Auth.js session config |
| `UNIT_API_BASE_URL` | api | `https://api.s.unit.sh` for sandbox |
| `UNIT_API_TOKEN` | api | Your Unit sandbox org token — **never commit this** |
| `UNIT_WEBHOOK_SECRET` | api | From the Unit dashboard, after registering your webhook URL |
| `UNIT_DEFAULT_DEPOSIT_PRODUCT` | api | Deposit product name configured on your Unit org (e.g. `checking`) |
| `INTERNAL_API_SECRET` | api + web | Shared secret for the web→api service JWT — must match on both sides |
| `API_URL` | web | Where `apps/web` reaches `apps/api` (`http://localhost:4000` locally) |

Postgres/Redis run on non-default ports (`5433`/`6380`) specifically to avoid colliding with other local Docker stacks — don't "fix" this to `5432`/`6379`.

## Running the app

Local development needs four processes running side by side:

```bash
# Terminal 1 — API server
pnpm --filter @chiklati/api run dev        # http://localhost:4000

# Terminal 2 — webhook worker (processes the async queue)
pnpm --filter @chiklati/api run worker

# Terminal 3 — web app
pnpm --filter @chiklati/web run dev        # http://localhost:3000

# Terminal 4 — tunnel for Unit's webhooks
ngrok http 4000
```

After starting ngrok, register (or update) the webhook subscription in your Unit dashboard to point at `https://<your-ngrok-domain>/webhooks/unit`, and copy the resulting signing secret into `UNIT_WEBHOOK_SECRET`.

From the repo root, `pnpm dev` (via Turborepo) starts the API and web dev servers together, but the worker and ngrok tunnel still need to be started separately.

## Testing

```bash
pnpm lint        # ESLint, all packages
pnpm typecheck   # tsc --noEmit, all packages
pnpm test        # Vitest (apps/api); other packages currently have no tests
pnpm build       # full production build, all packages
```

Run all four before considering any change complete — `apps/web`'s typecheck alone is not sufficient proof a change builds cleanly, since Next.js's Turbopack bundler is stricter about module resolution than `tsc` is on its own.

## Project structure

```
apps/api/src/
  config/           env schema + validation
  lib/
    unit/           typed Unit API client, one *.resource.ts + *.types.ts per Unit resource family
    auth/           internal JWT guard
    idempotency/    Redis-backed idempotency middleware
  modules/          one folder per domain: applications, customers, accounts, counterparties,
                    payments, cards, sandbox, webhooks — each Controller/Service/Repository/Mapper
apps/web/src/app/
  <feature>/        server-component pages
  api/<feature>/    BFF proxy routes (mint JWT, forward to apps/api, return verbatim)
packages/db/prisma/ schema.prisma, migrations/, seed.ts
packages/shared/src/ one folder per domain, *.schema.ts pairs (input schema + response schema)
```

## Known limitations

- **Card PAN/CVV/PIN reveal** is not implemented — Unit only exposes raw card data through their own hosted iframe with a 2FA-elevated customer token, a distinct sub-project deliberately left out of scope.
- **Physical cards** are not implemented — virtual debit cards only.
- **Individual card issuance** currently fails in this specific sandbox org because its deposit product has no card BIN assigned for Individual/sole-proprietor customers — a Unit dashboard configuration matter, not an application bug. Business card issuance is unaffected.
- **CI/CD and cloud deployment** are not yet built (planned as a future phase — see `CONTEXT.md`).

## License

No license has been chosen yet for this project. All rights reserved unless/until one is added.
