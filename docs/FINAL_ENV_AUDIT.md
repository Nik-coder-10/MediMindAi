# 🔍 FINAL PRE-DEPLOYMENT ENVIRONMENT & DEPENDENCY AUDIT
**AYURSETU (MediMindAi) — SIH 2026 Problem ID 26047 (Ministry of Ayush / AIIA)**
*Audit Date: August 2026 | Engine: Prisma 5.22.0 / Next.js 14 / PostgreSQL 16*

---

## 1. Complete Environment Variable Inventory

| Variable Name | Classification | Target Scope | Code Usage / Location | Description & Impact |
| :--- | :--- | :--- | :--- | :--- |
| **`DATABASE_URL`** | **A. REQUIRED / E. SECRET** | Server Only | `prisma/schema.prisma` | Supabase Transaction Pooler URI (port 6543, `?pgbouncer=true`) for serverless API queries. |
| **`DIRECT_URL`** | **A. REQUIRED / E. SECRET** | Server Only | `prisma/schema.prisma` | Supabase Direct Session URI (port 5432) for executing DDL migrations (`prisma migrate deploy`). |
| **`NEXT_PUBLIC_SUPABASE_URL`** | **A. REQUIRED / F. PUBLIC** | Client & Server | `lib/auth/supabase-client.ts` | Supabase project HTTPS REST gateway endpoint. |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | **A. REQUIRED / F. PUBLIC** | Client & Server | `lib/auth/supabase-client.ts` | Public anonymous API key for client-side Auth and session handling. |
| **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** | **B. OPTIONAL / F. PUBLIC** | Client & Server | `lib/auth/supabase-client.ts` | Public publishable key alias. |
| **`SUPABASE_SERVICE_ROLE_KEY`** | **A. REQUIRED / E. SECRET** | Server Only | `lib/auth/supabase-client.ts`, `lib/storage/supabase-storage.ts` | High-privilege administrative secret for signed URL creation and server-side RBAC sync. |
| **`SUPABASE_STORAGE_BUCKET`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/storage/supabase-storage.ts` | Name of private object storage bucket (Defaults to `medical-documents`). |
| **`ENCRYPTION_SECRET_KEY`** | **A. REQUIRED / E. SECRET** | Server Only | `lib/security/crypto.ts` | 64-hex char AES-256-GCM encryption key for sensitive demographic and ABHA tokens. |
| **`OCR_PROVIDER`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/ocr/ocr.providers.ts` | Primary OCR engine selector (Defaults to embedded `tesseract`). |
| **`OCR_LANGS`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/ocr/ocr.providers.ts` | Language dictionary string (Defaults to `eng+hin`). |
| **`OCR_TIMEOUT_MS`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/ocr/ocr.providers.ts` | Maximum execution time in ms (Defaults to `45000`). |
| **`OCR_PDF_PAGES`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/ocr/ocr.providers.ts` | Maximum PDF pages rasterized per upload (Defaults to `2`). |
| **`VOICE_PROVIDER`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/ai/voice.ts` | Speech provider switch (Defaults to browser `web-speech`). |
| **`OPENAI_API_KEY`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/ai/provider.ts` | Optional external LLM key; fallback operates via embedded deterministic clinical engine. |
| **`GROK_API_KEY` / `AI_BASE_URL`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/ai/provider.ts` | Alternative cloud model gateway endpoints. |
| **`AZURE_DI_ENDPOINT` / `AZURE_DI_KEY`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/ocr/ocr.providers.ts` | Optional Azure Document Intelligence credentials. |
| **`ABDM_GATEWAY_URL`** | **B. OPTIONAL / E. SECRET** | Server Only | `lib/consent/abdm-manager.ts` | NHA ABDM sandbox gateway endpoint (Defaults to sandbox URL). |
| **`NODE_ENV`** | **A. REQUIRED / E. SECRET** | System Level | Multiple (`prisma.ts`, `apiError`, `auth-guard.ts`) | Environment switch (production enforces sanitized errors and seed locks). |
| **`ALLOW_PROD_SEED`** | **C. DEV ONLY / E. SECRET** | CLI / Scripts | `prisma/seed.ts` | Override lock to prevent accidental production database wipes. |

---

## 2. Dead & Obsolete Variables Verification

- **Eliminated Unused Variables**: Removed obsolete NextAuth (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`) references since authentication is 100% powered by Supabase Auth and stateless JWTs.
- **S3 vs Supabase Storage**: MinIO / S3 variables (`S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`) are isolated strictly in `lib/storage/s3-client.ts` as an alternate local docker engine and are overridden by default by `SupabaseStorageService`.
- **Clean `.env.example`**: `.env.example` has been updated with clear, sanitized instructions without exposing real keys.

---

## 3. Fake vs Real Credentials Audit

- **Zero Fake Production Secrets**: No placeholder API tokens are committed to source files.
- **Fail-Safe Startup**: If required keys (`DATABASE_URL`, `ENCRYPTION_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are absent at runtime, the application fails explicitly with clear configuration errors instead of silent degradation.
- **Safe Fallback Design**: All embedded engines (Tesseract OCR, Rule-based clinical triage, Web Speech API) execute locally without requiring paid third-party API subscriptions.

---

## 4. Verification of AI, OCR, and Speech Capabilities

| Feature | Execution Mode | Paid API Required? | Reliability / Constraints |
| :--- | :--- | :--- | :--- |
| **Document OCR** | Local / Embedded | ❌ **No (Free)** | Powered by `tesseract.js` + `pdfjs-dist` (Node worker). Limited to 2 pages / 45s per document on serverless. |
| **Entity Extraction** | Local / Embedded | ❌ **No (Free)** | Rule-based regex & lexical dictionary parser (`MedicalEntityExtractor`) extracts 12+ drug classes and lab ranges. |
| **Prakriti & Dosha Scoring** | Local / Embedded | ❌ **No (Free)** | Deterministic Charaka Samhita matrix calculation (`AyurvedaAssessmentService`). |
| **Voice Transcription** | Browser Native | ❌ **No (Free)** | Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) running directly on the client's browser. |
| **Voice Synthesis (TTS)** | Browser Native | ❌ **No (Free)** | Browser `window.speechSynthesis` with Hindi/English voice packs. |
| **Safety Red Flags** | Local / Embedded | ❌ **No (Free)** | 15+ acute red flag condition evaluators (`RedFlagRuleRegistry`). |
| **FHIR R4 Bundling** | Local / Embedded | ❌ **No (Free)** | Native JSON-LD serializer (`FhirService`) generates compliant `Encounter` and `Composition` bundles. |

---

## 5. Quality Gate Summary

- **Prisma Schema Validation**: ✅ `npx prisma validate` — Valid
- **Prisma Client Generation**: ✅ `npx prisma generate` — Client v5.22.0 generated
- **TypeScript Compiler**: ✅ `npm run typecheck` — 0 Errors (`tsc --noEmit`)
- **Master Test Suite**: ✅ `npm test` — **95 / 95 PASSED** (0 failures across all 12 modules)
- **Next.js Production Build**: ✅ `npm run build` — Succeeded (21 routes compiled)
- **Live Supabase Migration**: ✅ `20260828000000_init_production_schema` applied to `oxscufecwwnlaxhjbhxo`

---

## 6. Final Deployment Verdict

```text
========================================================================================
PRODUCTION DEPLOYMENT STATUS: 🟢 READY FOR VERCEL DEPLOYMENT
========================================================================================
- Database: Live and migrated on Supabase PostgreSQL (AWS ap-northeast-2)
- Storage: Private bucket `medical-documents` created
- Codebase: 0 TypeScript errors, 95/95 test assertions passing, Next.js build clean
- Hosting: Ready for one-click import into Vercel
========================================================================================
```
