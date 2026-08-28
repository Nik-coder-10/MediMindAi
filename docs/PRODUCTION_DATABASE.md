# 🗄️ PRODUCTION DATABASE STRATEGY — AYURSETU (MediMindAi)
**SIH 2026 Problem ID 26047 — Ministry of Ayush / AIIA Case-Taking Software**
*Date: August 2026 | Database Migration, Connection Pooling & Resilience*

---

## 1. Executive Summary

AyurSetu utilizes **Prisma ORM** coupled with **Supabase PostgreSQL**. To ensure high availability and prevent connection exhaustion in serverless Next.js environments, the database architecture strictly separates **Connection Pooling (PgBouncer)** for runtime queries from **Direct Session Connections** for schema migrations.

---

## 2. Dual-Connection String Topology

```
                  ┌───────────────────────────────┐
                  │    Next.js Serverless API     │
                  │   (Prisma Singleton Client)   │
                  └──────────────┬────────────────┘
                                 │
                   Runtime Queries (Port 6543)
                   DATABASE_URL with pgbouncer=true
                                 ▼
                  ┌───────────────────────────────┐
                  │  Supabase PgBouncer Pooler    │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │    Supabase PostgreSQL 15     │
                  └──────────────▲────────────────┘
                                 │
                   Prisma Migrations (Port 5432)
                   DIRECT_URL (Session Mode)
                                 │
                  ┌──────────────┴────────────────┐
                  │   CI/CD Deployment Pipeline   │
                  │     (prisma migrate deploy)   │
                  └───────────────────────────────┘
```

1. **`DATABASE_URL` (Runtime Query Port 6543)**: Connects to Supabase PgBouncer in transaction mode with `?pgbouncer=true`. Prevents serverless connection leaks.
2. **`DIRECT_URL` (Migration Port 5432)**: Direct connection used exclusively by Prisma CLI for `prisma migrate deploy` to execute advisory locks and DDL migrations safely.

---

## 3. Migration Lifecycle Strategy

| Stage | Command | Target Database | Description |
| :--- | :--- | :--- | :--- |
| **Development** | `npx prisma migrate dev` | Local/Dev PostgreSQL | Creates timestamped migration files in `prisma/migrations/`. |
| **Staging / CI** | `npx prisma migrate deploy` | Staging Supabase DB | Applies pending migrations in strict chronological order using `DIRECT_URL`. |
| **Production Deploy** | `npx prisma migrate deploy` | Production Supabase DB | Zero-downtime DDL execution prior to web application rollout. |

> [!CAUTION]
> **Never run `prisma db push` in production**. Production schema updates must only be applied through deterministic migration files via `prisma migrate deploy`.

---

## 4. Demo Seed Safety Lock

The database seeder (`prisma/seed.ts`) contains an automated environment check:
```typescript
if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROD_SEED) {
  console.warn("🛡️ Production seed blocked: Demo fixtures cannot run in production.");
  process.exit(0);
}
```
This guarantees that test fixtures and mock identities can never be inadvertently injected into live clinical environments.
