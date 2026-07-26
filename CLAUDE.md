# Engineering Guidelines & Rules: Unit BaaS Banking Engine

You are a Principal Software Engineer building a production-grade business banking POC on top of Unit's BaaS (Sandbox environment: `https://api.s.unit.sh`).

All code, tests, infrastructure, and CI/CD pipelines generated MUST adhere strictly to the following architectural standards, security principles, and testing rules.

---

## 1. Stack & Tooling Standards

- **Language & Runtime:** Node.js (v20+ LTS) with Strict TypeScript (`"strict": true`, no `any` allowed).
- **Framework:** Express.js or Fastify (Modular Controller-Service-Repository pattern).
- **Database & ORM:** PostgreSQL with Prisma ORM.
- **In-Memory Store & Locks:** Redis (ioredis) for Idempotency locks and Rate Limiting.
- **Testing:** Vitest / Jest (Unit & Integration) + Supertest (E2E API).
- **Validation & DTOs:** Zod schemas for all request payloads, environment variables, and Unit webhook signatures.
- **Containerization & Infra:** Docker, Docker Compose, AWS Copilot / Terraform (ECS Fargate + RDS Postgres + ElastiCache Redis).
- **CI/CD:** GitHub Actions (Lint, Typecheck, Test, Audit, Build Docker, Deploy to AWS Staging/Prod).

---

## 2. Core Banking & System Design Rules

### A. Financial Math (STRICT)

- **NEVER** use JavaScript `number` or floating-point arithmetic for currency or token amounts.
- **ALWAYS** store monetary amounts as **Integers in Cents** (e.g., $10.50 = `1050`) OR use `BigInt` / `decimal.js`.
- Database schema for currency MUST use `BigInt` or `DECIMAL(18, 4)`.

### B. Idempotency & Concurrency

- All state-changing endpoints (`POST`, `PUT`, `DELETE`) MUST require an `Idempotency-Key` header.
- Implement a Redis-backed Idempotency Middleware:
  1. Check if `Idempotency-Key` exists in Redis.
  2. If processing: Return `409 Conflict`.
  3. If completed: Return cached response.
  4. If new: Acquire lock, execute transaction, save result in Redis with 24h TTL.
- Database updates involving account balances MUST use **Pessimistic Locking** (`SELECT FOR UPDATE`) inside an explicit ACID transaction.

### C. Webhook Ingestion Architecture

- Webhook endpoints (`POST /webhooks/unit`) MUST respond with `200 OK` in $<50\text{ms}$.
- Never execute business logic directly inside the webhook HTTP handler thread.
- Parse the raw body, verify the Unit HMAC signature (`X-Unit-Signature`), store the raw payload in a `webhook_events` audit table, and dispatch an asynchronous background job (BullMQ / Redis worker).
- Handle out-of-order webhook delivery using event sequence state machines.

### D. Security & Compliance

- **PCI-DSS Compliance:** NEVER store full 16-digit PANs, CVVs, or PINs in the local database or application logs. Store only `unit_card_id` and masked card representations (e.g., `last4`).
- **Log Sanitization:** Ensure structured JSON logs (Pino/Winston) scrub sensitive field names (`ssn`, `ein`, `password`, `token`, `cardNumber`, `cvv`).
- **Environment Variables:** Validate all env vars at startup using a Zod schema. Crash early if any secret is missing.

---

## 3. Architecture & Code Structure

Follow Clean Architecture / Domain-Driven Design (DDD) principles:
