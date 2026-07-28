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
- [Data model](#data-model)
- [Architectural patterns](#architectural-patterns)
- [Deployment (AWS)](#deployment-aws)
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

### Domain modules (`apps/api/src/modules/`)

Each follows the same Controller → Service → Repository → Mapper shape:

- `applications/` — Individual/Business application submission, mapped to/from Unit.
- `customers/` — read-only list of the user's Unit customers (created via approved applications).
- `accounts/` — deposit account creation/listing, `applyTransactionCreated` (the one pessimistic-locked ledger write path everything else reuses).
- `counterparties/` — ACH counterparty creation (for ACH payments).
- `payments/` — Book/ACH/Wire payment creation, status tracking.
- `cards/` — virtual card issuance + lifecycle actions.
- `sandbox/` — wraps Unit's own `/sandbox/*` simulation endpoints (ACH transmit/clear, Wire transmit, card purchase). Registered only when `ENABLE_SANDBOX_ROUTES=true` (independent of `NODE_ENV`, so a production-mode deployment can still opt in for demo purposes).
- `webhooks/` — HMAC-verified ingestion, `webhook_events` audit table, BullMQ-dispatched async processing (`webhook-event.processor.ts` dispatches by event-type prefix to per-domain handlers: `account-event.handler.ts`, `transaction-event.handler.ts`, `payment-event.handler.ts`, `card-event.handler.ts`).

### apps/web routes

`/onboarding` (individual/business application form with sandbox-fill buttons), `/accounts/[id]`, `/payments`, `/payments/new`, `/payments/[id]`, `/cards`, `/cards/new`, `/cards/[id]`, `/dashboard` (post-login home).

**`/dashboard`** is the action hub: Quick actions (open account / send payment / issue card), Your cards (inline freeze/unfreeze/close/report actions via the same `CardActions` component the card detail page uses), Customers & accounts, Recent payments.

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
| Infra | Terraform, AWS (ECS on EC2, RDS, ElastiCache, ECR, SSM) |
| CI/CD | GitHub Actions (OIDC to AWS, no long-lived keys) |

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

## Data model

`User → Application → Customer → Account → Transaction`, with `Payment` and `Card` both producing `Transaction` rows (via nullable `paymentId`/`cardId` FKs) that flow through the same `applyTransactionCreated` pessimistic-locked write. `Counterparty` supports ACH payments. `WebhookEvent` is the audit trail, with nullable FKs back to whichever domain row an event applied to.

## Architectural patterns

Conventions established across the codebase — follow these when extending it:

- **Money**: always `BigInt`/cents in the DB and API layer; DTOs carry money as regex-validated numeric strings (`z.string().regex(/^\d+$/)`) since BigInt doesn't JSON-serialize; `Number(...)` conversion happens only at the Unit-request-building boundary.
- **Idempotency**: every state-changing POST uses `createIdempotencyHooks(scope)` (Redis-backed, keyed by `scope:userId:Idempotency-Key`). Give each distinct route its own scope.
- **Ledger writes**: only `applyTransactionCreated` (in `accounts.repository.ts`) touches balances, always inside `SELECT ... FOR UPDATE` + a `lastEventAt` staleness guard. Never add a second balance-mutation path — new money-producing features (a new payment rail, a new card action) get their transactions linked via a new nullable FK on `Transaction`, not a new write path.
- **Webhooks**: subscription uses `includeResources: false`, so handlers fetch full resources from Unit rather than trusting event payload attributes. Every handler follows the same shape: resolve the relationship id via `getRelationshipId`, look up the local row, apply with a `lastEventAt` guard, return `{ <entity>Id?, applied: boolean }` for `webhook-event.processor.ts` to record.
- **Sandbox-only actions**: live under the `sandbox` module, gated by `ENABLE_SANDBOX_ROUTES`, never mutate local state directly — they only trigger Unit's simulation; the resulting webhook is what updates local rows. This keeps mutation to one path even for test tooling.
- **Empirical-first**: Unit's docs have repeatedly been incomplete or wrong (missing required fields, wrong JSON:API `type` strings, endpoints not fully documented). The working pattern: attempt a real sandbox call, let a 400 reveal the next missing field, and when an enum is involved, deliberately send an invalid value — Unit's error response lists the full allowed set verbatim.
- **Full pipeline before considering anything done**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Build matters specifically for `apps/web` — its `tsconfig` (`moduleResolution: "Bundler"`) is more lenient than Next.js's actual Turbopack bundler, so `tsc --noEmit` passing does not guarantee `next build` passes. For Docker/deployment changes, an actual `docker build` + container run against real local Postgres/Redis is the only thing that catches container-specific gaps (see the OpenSSL, Prisma-engine-tracing, Turborepo env-filtering, and NextAuth `trustHost` issues below — none of them showed up in local `pnpm dev`/`pnpm build`).
- **Verification standard**: every feature is verified against the *real* Unit sandbox (curl) and walked through in a real browser, not just unit-tested. Webhook delivery in particular has been observed to batch/delay significantly, which is why the system is built to reconcile from webhooks rather than trust synchronous API responses.

## Deployment (AWS)

Deployed to a single AWS free-tier-eligible EC2 instance running ECS (EC2 launch type, not Fargate — Fargate has no free-tier allowance). Infra is in `infra/` (Terraform); CI/CD is in `.github/workflows/`.

- **Compute**: one `t3.micro` EC2 instance is the ECS cluster's only container instance, running the `api`, `worker`, and `web` tasks (all `network_mode = "host"`, since there's only ever one instance). Caddy runs natively on the host (not as an ECS task), terminating TLS on 80/443 via the instance's own AWS-assigned public DNS name and a free Let's Encrypt certificate — this avoids needing an ALB (no free tier) or a purchased domain.
- **Data layer**: RDS Postgres (`db.t3.micro`) and ElastiCache Redis (`cache.t3.micro`), both free-tier-eligible, in the default VPC's public subnets but not internet-reachable (`publicly_accessible = false` + security groups scoped to the EC2 host only — no NAT Gateway, to stay free).
- **Secrets**: SSM Parameter Store (`SecureString`, default AWS-managed KMS key — free) referenced by ARN in ECS task definitions, not Secrets Manager (which bills per secret).
- **CI** (`ci.yml`): lint, typecheck, test (against Postgres/Redis service containers matching the local dev ports), build, audit — on every PR and push to `main`.
- **CD** (`deploy.yml`): authenticates to AWS via GitHub OIDC (no long-lived AWS keys in GitHub), builds and pushes both images to ECR, runs `prisma migrate deploy` as a one-off ECS task (the only way to reach RDS from outside the VPC, since GitHub-hosted runners aren't in it), then registers new task-definition revisions and rolls the three services.
- **Images**: `apps/api/Dockerfile` ships the full built monorepo (not a `pnpm deploy`-flattened image) so the same image can serve the api server, the worker, *and* the migration task via command/working-directory overrides — flattening broke `pnpm --filter` and dropped the `prisma` CLI's bin symlink. `apps/web/Dockerfile` uses Next's `output: "standalone"`, with an explicit `COPY` of `@chiklati/db`/`@chiklati/shared` into the image's `node_modules` since Next's file-tracer doesn't follow pnpm workspace symlinks for local packages (confirmed empirically — real npm deps like `@prisma/client` trace fine, local workspace packages don't).
- **Known cost realities**: EC2/RDS/ElastiCache free tier is 12 months only; the EC2 root volume must be ≥30GB (the ECS-optimized AMI's snapshot floor) which combined with RDS's 20GB exceeds the free tier's 30GB combined EBS allowance by ~$1.60/month; ECR image sizes (api ~830MB, web ~350MB) likely exceed the 500MB/12mo free tier by a few cents/month. None of these were worth trading Dockerfile robustness for.

See `infra/terraform.tfvars.example` for the variables a fresh `terraform apply` needs.

## Known limitations

- **Card PAN/CVV/PIN reveal** is not implemented — Unit only exposes raw card data through their own hosted iframe with a 2FA-elevated customer token, a distinct sub-project deliberately left out of scope.
- **Physical cards** are not implemented — virtual debit cards only.
- **Individual card issuance** currently fails in this specific sandbox org because its deposit product has no card BIN assigned for Individual/sole-proprietor customers — a Unit dashboard configuration matter, not an application bug. Business card issuance is unaffected.
- **Programmatic card authorization** (`/sandbox/authorization-requests/card-transaction`, real-time auth webhooks) is not built — would need its own webhook registration.

## License

No license has been chosen yet for this project. All rights reserved unless/until one is added.
