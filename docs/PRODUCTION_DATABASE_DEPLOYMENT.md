# 🗄️ PRODUCTION DATABASE DEPLOYMENT SPECIFICATION
**AYURSETU (MediMindAi) — SIH 2026 Problem ID 26047 (Ministry of Ayush / AIIA)**
*Database Engine: PostgreSQL 16 (Supabase Managed) | ORM: Prisma 5.22.0*

---

## 1. Executive Summary & Migration Strategy

AyurSetu utilizes a strictly version-controlled, declarative migration workflow. 

### Mandatory Production Directives
- **Zero Data-Loss Rule**: `npx prisma db push` is strictly prohibited for production environments.
- **Migration Deployment**: Schema upgrades are executed exclusively via `npx prisma migrate deploy` using committed migration SQL files in `prisma/migrations/`.
- **Dual-Connection Pooling**:
  - `DATABASE_URL` (Port 6543, `?pgbouncer=true`): High-throughput transaction pooling for serverless Next.js API route execution.
  - `DIRECT_URL` (Port 5432): Direct TCP session connection for running migrations, index creation, and DDL schema modifications.
- **Seed Lockout Guard**: Production environments automatically reject seed executions unless explicitly overridden via `ALLOW_PROD_SEED=true`.

---

## 2. Committed Schema Migrations Inventory

The initial canonical migration file is committed under:
[`prisma/migrations/20260828000000_init_production_schema/migration.sql`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/prisma/migrations/20260828000000_init_production_schema/migration.sql)

This migration defines all 18 clinical models:
1. `users` (Identity & auth mapping)
2. `patient_profiles` (Ayush patient demographics)
3. `doctor_profiles` (Verified medical registrations)
4. `consent_records` (ABDM / DPDP consent artifacts)
5. `clinical_sessions` (Adaptive consultation sessions)
6. `engine_states` (SOCRATES question state machine)
7. `question_nodes` (Clinical symptom inquiry nodes)
8. `patient_answers` (Recorded symptom responses)
9. `conversation_turns` (Dialogue transcripts)
10. `chief_complaints` (Presenting illness records)
11. `adaptive_answers` (Adaptive symptom facts)
12. `red_flag_events` (Critical safety alerts)
13. `medical_documents` (Multimodal document records)
14. `extracted_medical_entities` (OCR prescription entities)
15. `medical_timeline_events` (Longitudinal timeline)
16. `clinical_summaries` (Physician case summaries)
17. `ayurveda_assessments` (Dashavidha Pariksha & Prakriti)
18. `audit_logs` (Security & compliance audit trails)
19. `abha_links` (ABDM health ID linkage)
20. `fhir_resources` (HL7 FHIR R4 Encounter bundles)

---

## 3. Step-by-Step Command Guide by Environment

### A. Local Development Workflow
```powershell
# 1. Start local PostgreSQL & MinIO
docker compose up -d postgres minio

# 2. Apply pending migrations to local development DB
npm run prisma:migrate

# 3. (Optional) Seed development fixtures
npm run prisma:seed
```

### B. Staging Environment Workflow
```powershell
# 1. Set staging direct database URI
$env:DIRECT_URL="postgresql://postgres.[STAGING-REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 2. Deploy schema migrations
npm run prisma:deploy

# 3. Generate Prisma client
npx prisma generate
```

### C. Live Production Deployment Workflow
```powershell
# 1. Set live Supabase direct session connection (Port 5432)
$env:DIRECT_URL="postgresql://postgres.[PROD-REF]:[DB-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 2. Apply all unapplied versioned migrations safely
npx prisma migrate deploy

# 3. Verify migration status
npx prisma migrate status

# 4. Generate optimized production Prisma Client
npx prisma generate
```

---

## 4. Verification & Health Monitoring

### Checking Database Migration Status
```bash
npx prisma migrate status
```
Expected output:
```text
Database schema is up to date!
1 migration found in prisma/migrations
```

### Serverless Health Probe
Hit the production endpoint:
```text
GET https://[YOUR-PRODUCTION-DOMAIN]/api/health
```
Response:
```json
{
  "status": "healthy",
  "service": "AyurSetu Clinical Platform (SIH 2026 Problem ID 26047)",
  "version": "1.0.0",
  "database": "connected",
  "abdmInteroperability": "ready",
  "wcagCompliance": "2.2 AA"
}
```
