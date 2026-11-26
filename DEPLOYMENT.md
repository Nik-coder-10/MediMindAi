# Production Deployment & Operations Guide

**AyurSetu Clinical Platform**
**Ministry of Ayush / All India Institute of Ayurveda (AIIA)**

---

## 🐳 1. One-Command Production Deployment (Docker Compose)

To launch the complete isolated production environment (Next.js Application + PostgreSQL 16 + MinIO S3 Object Store):

```bash
# Clone the repository
git clone https://github.com/Nik-coder-10/MediMindAi.git
cd MediMindAi

# Build and start all multi-container services
docker-compose up --build -d

# Verify all services are healthy
docker-compose ps
```

- **Application URL**: `http://localhost:3000`
- **MinIO S3 Console**: `http://localhost:9001` (User: `minioadmin` | Pass: `minioadmin123`)
- **PostgreSQL Database**: `localhost:5432` (`ayush_db`)

---

## 🔑 2. Pre-Seeded Demo Evaluation Accounts

| Portal Role | Email / Login | Password | Assigned Permissions / Role |
|---|---|---|---|
| 👤 **Patient** | `patient@aiia.gov.in` | `Patient@123` | Bilingual Intake, Voice Case-Taking, Consent & Document Upload. |
| 🩺 **Doctor / Vaidya** | `doctor@aiia.gov.in` | `Doctor@123` | Triage Queue, Case Dossier Review, Summary Sign-Off, HIS Export. |
| 🔒 **System Admin** | `admin@aiia.gov.in` | `Admin@123` | Question Tree Editor, Red-Flag Rules, Feature Flags, Analytics. |

---

## 🧪 3. Master CI/CD & Automated Quality Commands

```bash
# Run complete test harness (24 automated clinical invariants)
npm test

# Run TypeScript type safety verification
npm run typecheck

# Build production bundle
npm run build
```

---

## 🩺 4. Troubleshooting: submitted cases missing from "My Cases" / Doctor Queue

If `/api/health` returns `"database": "unavailable"` (HTTP 503), PostgreSQL is not
reachable from the runtime. In that state all clinical sessions fall back to a
process-local in-memory store, which is not durable on Vercel: a case submitted
by one request can be missing from the next request handled by another instance.

Checklist:

1. In **Vercel → Project → Settings → Environment Variables**, replace any
   `localhost:5432` value with the Supabase connection strings:
   - `DATABASE_URL` = Supabase **Transaction Pooler** URI (port `6543`,
     `?pgbouncer=true`)
   - `DIRECT_URL` = Supabase **Direct** URI (port `5432`)
2. Apply the schema once with `npx prisma migrate deploy` (or set
   `DIRECT_URL` correctly and re-deploy).
3. Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` are present for the Production environment.

As a resilience layer, submitted cases are also mirrored to
`case-snapshots/*.json` in the Supabase document bucket and re-merged into the
patient case list and doctor queue, so the demo remains usable even when the
Postgres connection fails. PostgreSQL is still the source of truth once restored.

Clinical session IDs must be **UUIDs**: every relational child table
(`medical_documents`, `extracted_medical_entities`, `patient_answers`, …) has a
UUID foreign key to `clinical_sessions.id`. Hand-made IDs such as `sess-…`
silently fail those inserts, which is why uploaded reports could be stored in
Supabase Storage but never appeared in the patient summary preview. Session
creation now mints UUIDs, and legacy IDs are remapped on submission.
