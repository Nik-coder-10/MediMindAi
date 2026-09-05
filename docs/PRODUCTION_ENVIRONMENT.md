# 🔐 PRODUCTION ENVIRONMENT VARIABLES — AYURSETU (MediMindAi)
**Ministry of Ayush / AIIA Clinical Platform**
*Date: August 2026 | Phase 6 Security & Deployment Specification*

---

## 1. Executive Summary

This document establishes the strict classification, boundary, and visibility requirements for all environment variables utilized across AyurSetu. All variables are classified into:
* **PUBLIC**: Safe for browser bundles (prefixed with `NEXT_PUBLIC_`).
* **SERVER-ONLY SECRET**: Strictly restricted to Node.js/Serverless runtime (never exposed to browser or client JS).
* **DATABASE SECRET**: High-privilege credentials for Supabase PostgreSQL connection pooling & migrations.
* **THIRD-PARTY SECRET**: API keys for external health gateways and AI services.

---

## 2. Environment Variable Master Matrix

| Variable Name | Classification | Required / Optional | Scope | Description & Security Boundary |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **DATABASE SECRET** | **REQUIRED** | Server-Only | Transaction-pooled connection string (port 6543) for runtime Prisma queries with `pgbouncer=true`. |
| `DIRECT_URL` | **DATABASE SECRET** | **REQUIRED** | Server-Only | Direct session connection string (port 5432) for Prisma migration deployment (`prisma migrate deploy`). |
| `NEXT_PUBLIC_SUPABASE_URL` | **PUBLIC** | **REQUIRED** | Universal | Supabase project API gateway endpoint (`https://<project-ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **PUBLIC** | **REQUIRED** | Universal | Public client anon key for browser authentication sessions. |
| `SUPABASE_SERVICE_ROLE_KEY` | **SERVER-ONLY SECRET** | **REQUIRED** | Server-Only | High-privilege service-role key for backend storage bucket management, OCR attachment, and audit operations. **NEVER expose to client**. |
| `ENCRYPTION_SECRET_KEY` | **SERVER-ONLY SECRET** | **REQUIRED** | Server-Only | 256-bit (64 hex character) secret key for AES-256-GCM application-level cryptographic field encryption (e.g. ABHA/Aadhaar masks). |
| `NEXTAUTH_SECRET` | **SERVER-ONLY SECRET** | Optional | Server-Only | JWT signature seed for auxiliary NextAuth sessions. |
| `NEXTAUTH_URL` | **SERVER-ONLY SECRET** | Optional | Server-Only | Base canonical application domain URL (`https://ayursetu.aiia.gov.in`). |
| `VOICE_PROVIDER` | **SERVER-ONLY SECRET** | Optional | Server-Only | Voice synthesis/ASR engine selector (`web-speech`, `whisper`, `bhashini`). Defaults to browser-native `web-speech`. |
| `OPENAI_API_KEY` | **THIRD-PARTY SECRET** | Optional | Server-Only | API key for Whisper speech transcription and AI assistant features. |
| `BHASHINI_API_KEY` | **THIRD-PARTY SECRET** | Optional | Server-Only | Ministry of Electronics & IT (MeitY) Bhashini multilingual translation key. |
| `OCR_PROVIDER` | **SERVER-ONLY SECRET** | Optional | Server-Only | OCR pipeline selector (`tesseract`, `azure-form-recognizer`, `google-document-ai`). Defaults to native `tesseract`. |
| `ABDM_CLIENT_ID` | **THIRD-PARTY SECRET** | Optional | Server-Only | NHA ABDM sandbox client ID for Ayush Health Information Exchange. |
| `ABDM_CLIENT_SECRET` | **THIRD-PARTY SECRET** | Optional | Server-Only | NHA ABDM sandbox gateway secret for mTLS authentication. |

---

## 3. Git Secret Scan & Exclusion Rules

1. `.env` and `.env*.local` are explicitly listed in `.gitignore` and **must never be committed**.
2. `.env.example` contains sanitized placeholders only.
3. No secret keys (`service_role`, `postgresql://`, `sk-`, `private_key`) are present in client-side bundles or repository code.
