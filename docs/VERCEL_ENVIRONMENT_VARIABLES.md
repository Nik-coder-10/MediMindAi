# 🌐 VERCEL PRODUCTION ENVIRONMENT VARIABLES SPECIFICATION
**AYURSETU (MediMindAi) — Ministry of Ayush / AIIA Clinical Platform**

---

## 1. Executive Overview

This document provides the canonical specification for all environment variables used by **AyurSetu**. Every variable is classified by security visibility, runtime lifecycle, and hosting scope.

---

## 2. Comprehensive Variable Specification Table

| Environment Variable | Visibility | Required | Lifecycle | Provider | Usage in Codebase | Recommended Scope |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Server-Only** | **Required** | Runtime | Supabase Postgres (PgBouncer) | `prisma/schema.prisma`, `lib/db/prisma.ts` | Production, Preview, Dev |
| `DIRECT_URL` | **Server-Only** | **Required** | Build/Migrate | Supabase Postgres (Session) | `prisma/schema.prisma` (`directUrl`) | Production, Preview, Dev |
| `NEXT_PUBLIC_SUPABASE_URL` | **Client-Safe** | **Required** | Build & Runtime | Supabase Dashboard | `lib/auth/supabase-client.ts` | Production, Preview, Dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Client-Safe** | **Required** | Build & Runtime | Supabase Dashboard | `lib/auth/supabase-client.ts` | Production, Preview, Dev |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | **Required** | Runtime | Supabase Dashboard | `lib/auth/supabase-client.ts`, `lib/storage/supabase-storage.ts` | Production, Preview, Dev |
| `SUPABASE_STORAGE_BUCKET` | **Server-Only** | Optional (Default: `medical-documents`) | Runtime | Supabase Storage | `lib/storage/supabase-storage.ts` | Production, Preview, Dev |
| `ENCRYPTION_SECRET_KEY` | **Server-Only** | **Required** | Runtime | Self-Generated (64 hex / 256-bit) | `lib/security/crypto.ts` | Production, Preview, Dev |
| `NODE_ENV` | **Server-Only** | Automatic | Build & Runtime | Vercel / Node.js Runtime | `lib/api/response.ts`, `lib/db/prisma.ts` | Automatically set |
| `OCR_PROVIDER` | **Server-Only** | Optional (Default: `tesseract`) | Runtime | Local / Cloud Engine | `lib/ocr/ocr.providers.ts` | Production, Preview, Dev |
| `OCR_LANGS` | **Server-Only** | Optional (Default: `eng+hin`) | Runtime | Tesseract Engine | `lib/ocr/ocr.providers.ts` | Production, Preview, Dev |
| `OCR_TIMEOUT_MS` | **Server-Only** | Optional (Default: `45000`) | Runtime | OCR Pipeline | `lib/ocr/ocr.providers.ts` | Production, Preview, Dev |
| `VOICE_PROVIDER` | **Client-Safe** | Optional (Default: `web-speech`) | Runtime | Web Speech / Whisper | `components/ui/patient/VoiceInputButton.tsx` | Production, Preview, Dev |
| `OPENAI_API_KEY` | **Server-Only** | Optional | Runtime | OpenAI (Whisper fallback) | `lib/ai/provider.ts` | Production, Preview, Dev |
| `BHASHINI_API_KEY` | **Server-Only** | Optional | Runtime | Bhashini AI (Ministry of Electronics) | `lib/ai/provider.ts` | Production, Preview, Dev |
| `ABDM_GATEWAY_URL` | **Server-Only** | Optional (Default: Sandbox) | Runtime | National Health Authority (NHA) | `lib/consent/abdm-manager.ts` | Production, Preview, Dev |

---

## 3. Accidental Secrets Audit Report

A complete repository-wide audit was conducted searching for exposed private tokens, service-role secrets, and production passwords:
- **Client-Side Exposure Check (`NEXT_PUBLIC_`)**: Clean (`SEC-001` passed). Zero service-role or database credentials present in `NEXT_PUBLIC_*`.
- **Git Commit History Check**: Clean. No `.env` or `.env.local` files committed.
- **Error Response Leak Check**: Clean (`SEC-012`, `SEC-013` passed). `apiError` handler strictly masks connection strings and internal traces in production mode.

---

## 4. Copy-Paste Checklist for Vercel Dashboard

When setting up your project in **Vercel Project Settings → Environment Variables**, copy and paste these exact key-value pairs (Scope: **Production, Preview, Development**):

```bash
# 1. Supabase PostgreSQL Connection Pooler (Port 6543)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true

# 2. Supabase Direct PostgreSQL Connection for Migrations (Port 5432)
DIRECT_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres

# 3. Supabase Public Gateway URL
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co

# 4. Supabase Public Anon Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[YOUR-ANON-TOKEN]

# 5. Supabase High-Privilege Service Role Secret (Server-Only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[YOUR-SERVICE-ROLE-TOKEN]

# 6. Application Field-Level AES-256-GCM Encryption Key (64 hex characters)
ENCRYPTION_SECRET_KEY=e4d2f8a19b3c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f

# 7. Private Medical Documents Storage Bucket
SUPABASE_STORAGE_BUCKET=medical-documents
```
