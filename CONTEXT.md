# Chiklati Bank — Context Summary

A business banking MVP built on Unit's BaaS API (sandbox: `https://api.s.unit.sh`), following the engineering rules in `CLAUDE.md` (strict TypeScript, BigInt/cents for money, Redis-backed idempotency, pessimistic-locked ledger writes, webhook ingestion with HMAC verification + audit table + async worker, PCI-DSS-conscious log redaction).

This file exists to bring a fresh session up to speed quickly. It reflects the state as of commit `68d2285`.

## Stack

- **Monorepo**: pnpm + Turborepo. `apps/api` (Fastify), `apps/web` (Next.js 16, App Router), `packages/shared` (Zod DTOs shared by both apps), `packages/db` (Prisma + Postgres).
- **Infra (local dev)**: Postgres on port 5433, Redis on port 6380, both via `docker-compose.yml` (start with `sg docker -c "docker compose up -d"` — see memory `env_local_toolchain_quirks` for why `sg docker -c` is needed). ngrok tunnels the API for Unit webhooks.
- **Auth**: NextAuth session in `apps/web`, minting a short-lived internal JWT (`apps/web/src/lib/internal-api.ts`) that `apps/api`'s `internalAuthGuard` verifies. `apps/web`'s own API routes under `app/api/*` are thin BFF proxies — they mint the JWT, forward to `apps/api`, and return the response verbatim.

## What's built (Phases 0–4, all committed)

| Phase | Commit | What it added |
|---|---|---|
| 0 | `42376ac` | Monorepo scaffold, auth round trip, base plumbing |
| 1 | `ff93b8e` | Onboarding: Individual + Business applications → Unit `applications` API, KYC/KYB, webhook-driven approval |
| 2 | `74947ce` | Accounts + ledger: deposit accounts, transactions, pessimistic-locked (`SELECT FOR UPDATE`) balance updates from `transaction.created` webhooks |
| 3 | `500cf0d` | Payments: Book (sync), ACH, Wire rails; counterparties; sandbox simulation endpoints for ACH/Wire lifecycle |
| 4 | `c10c3ad` | Cards: virtual debit card issuance (Individual + Business), freeze/unfreeze/close/report-stolen/report-lost, sandbox purchase simulation, `Transaction.cardId` linkage |
| — | `68d2285` | Bugfix (business application `ein`/`businessVertical` requirements) + dashboard rebuilt as an action hub |

### Domain modules (`apps/api/src/modules/`)

Each follows the same Controller → Service → Repository → Mapper shape:

- `applications/` — Individual/Business application submission, mapped to/from Unit.
- `customers/` — read-only list of the user's Unit customers (created via approved applications).
- `accounts/` — deposit account creation/listing, `applyTransactionCreated` (the one pessimistic-locked ledger write path everything else reuses).
- `counterparties/` — ACH counterparty creation (for ACH payments).
- `payments/` — Book/ACH/Wire payment creation, status tracking.
- `cards/` — virtual card issuance + lifecycle actions.
- `sandbox/` — wraps Unit's own `/sandbox/*` simulation endpoints (ACH transmit/clear, Wire transmit, card purchase). Registered only when `NODE_ENV !== "production"`.
- `webhooks/` — HMAC-verified ingestion, `webhook_events` audit table, BullMQ-dispatched async processing (`webhook-event.processor.ts` dispatches by event-type prefix to per-domain handlers: `account-event.handler.ts`, `transaction-event.handler.ts`, `payment-event.handler.ts`, `card-event.handler.ts`).

### Data model (`packages/db/prisma/schema.prisma`)

`User → Application → Customer → Account → Transaction`, with `Payment` and `Card` both producing `Transaction` rows (via nullable `paymentId`/`cardId` FKs) that flow through the same `applyTransactionCreated` pessimistic-locked write. `Counterparty` supports ACH payments. `WebhookEvent` is the audit trail, with nullable FKs back to whichever domain row an event applied to.

### apps/web routes

`/onboarding` (individual/business application form with sandbox-fill buttons), `/accounts/[id]`, `/payments`, `/payments/new`, `/payments/[id]`, `/cards`, `/cards/new`, `/cards/[id]`, `/dashboard` (post-login home — see below).

**`/dashboard`** is the action hub: Quick actions (open account / send payment / issue card), Your cards (inline freeze/unfreeze/close/report actions via the same `CardActions` component the card detail page uses), Customers & accounts, Recent payments.

## Architectural patterns established (apply these when extending)

- **Money**: always `BigInt`/cents in the DB and API layer; DTOs carry money as regex-validated numeric strings (`z.string().regex(/^\d+$/)`) since BigInt doesn't JSON-serialize; `Number(...)` conversion happens only at the Unit-request-building boundary.
- **Idempotency**: every state-changing POST uses `createIdempotencyHooks(scope)` (Redis-backed, keyed by `scope:userId:Idempotency-Key`). Give each distinct route its own scope.
- **Ledger writes**: only `applyTransactionCreated` (in `accounts.repository.ts`) touches balances, always inside `SELECT ... FOR UPDATE` + a `lastEventAt` staleness guard. Never add a second balance-mutation path — new money-producing features (a new payment rail, a new card action) get their transactions linked via a new nullable FK on `Transaction`, not a new write path.
- **Webhooks**: subscription uses `includeResources: false`, so handlers fetch full resources from Unit rather than trusting event payload attributes. Every handler follows the same shape: resolve the relationship id via `getRelationshipId`, look up the local row, apply with a `lastEventAt` guard, return `{ <entity>Id?, applied: boolean }` for `webhook-event.processor.ts` to record.
- **Sandbox-only actions**: live under the `sandbox` module, gated by `NODE_ENV`, never mutate local state directly — they only trigger Unit's simulation; the resulting webhook is what updates local rows. This keeps mutation to one path even for test tooling.
- **Empirical-first**: Unit's docs have repeatedly been incomplete or wrong (missing required fields, wrong JSON:API `type` strings, endpoints not fully documented). The working pattern: attempt a real sandbox call, let a 400 reveal the next missing field, and when an enum is involved, deliberately send an invalid value — Unit's error response lists the full allowed set verbatim. See the `unit-api-integration-gotchas` memory for the running list of confirmed quirks (endpoint shapes, required fields, enum values, webhook delivery behavior).
- **Full pipeline before considering anything done**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Build matters specifically for `apps/web` — its `tsconfig` (`moduleResolution: "Bundler"`) is more lenient than Next.js's actual Turbopack bundler, so `tsc --noEmit` passing does not guarantee `next build` passes.
- **Verification standard**: every phase was verified against the *real* Unit sandbox (curl) and walked through in a real browser (claude-in-chrome), not just unit-tested. Webhook delivery in particular has been observed to batch/delay significantly, which is why the system is built to reconcile from webhooks rather than trust synchronous API responses.

## Known gaps / deliberately out of scope

- **PAN/CVV/PIN reveal**: not built. Unit only exposes raw card data via their own hosted iframe + a customer token elevated through 2FA — a distinct sub-project, explicitly deferred by user decision during Phase 4 planning.
- **Physical cards**: not built (virtual only, by user decision during Phase 4 planning) — no shipping address, activation flow, or replace-for-damage.
- **Individual card issuance**: currently 400s in this sandbox org — the org's "checking" deposit product has no card BIN assigned for Individual/sole-proprietor customers. This is a Unit Dashboard configuration gap, not a code bug. Business card issuance is fully working and verified.
- **Programmatic card authorization** (`/sandbox/authorization-requests/card-transaction`, real-time auth webhooks): not built, would need its own webhook registration.

## What's next

**Phase 5** (not started, not planned): CI/CD + AWS deployment (GitHub Actions: lint/typecheck/test/audit/build/deploy; ECS Fargate + RDS Postgres + ElastiCache Redis per `CLAUDE.md`). Per this project's established workflow, this should be planned in detail and approved before implementation begins — don't start it without an explicit go-ahead.

## Session/dev workflow notes

- Local dev requires 4 processes: `apps/api` (`pnpm run dev`, port 4000), the webhook worker (`pnpm run worker`), `apps/web` (`pnpm run dev`, port 3000), and an ngrok tunnel to port 4000 for Unit webhooks. Check `GET /webhooks/44366` (the org's webhook subscription) before assuming a new ngrok URL needs registering — it has repeatedly matched an existing static ngrok domain across sessions.
- See the `unit-api-integration-gotchas` and `env-local-toolchain-quirks` memory files for accumulated environment/API details not repeated here.
