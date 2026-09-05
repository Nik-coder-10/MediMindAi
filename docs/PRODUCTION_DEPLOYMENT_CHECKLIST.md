# 📋 PRODUCTION SUPABASE & DEPLOYMENT CHECKLIST
**Ministry of Ayush / AIIA Case-Taking Software**
*Date: August 2026 | Infrastructure, Storage, Auth & Vercel Checklist*

---

## 1. Supabase Infrastructure Setup Checklist

| Step # | Task / Target | Location / Command | Verification Classification | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | Create Supabase Production Project | Supabase Dashboard | 🟡 INFRASTRUCTURE VERIFICATION REQUIRED | Provision a new PostgreSQL instance in desired region (`ap-south-1` Mumbai recommended for Indian healthcare). |
| **1.2** | Configure PgBouncer Connection String | Settings → Database → Connection Pooling | 🟡 INFRASTRUCTURE VERIFICATION REQUIRED | Copy Connection Pooling URI (port 6543) into `DATABASE_URL` with `?pgbouncer=true`. |
| **1.3** | Configure Direct Session String | Settings → Database → Connection String | 🟡 INFRASTRUCTURE VERIFICATION REQUIRED | Copy Direct Session URI (port 5432) into `DIRECT_URL`. |
| **1.4** | Create Private Storage Bucket | Storage → Buckets | 🟡 INFRASTRUCTURE VERIFICATION REQUIRED | Create bucket named `medical-documents`. Ensure **"Public bucket" is toggled OFF (Private)**. |
| **1.5** | Configure Storage RLS Policies | Storage → Policies | 🟡 INFRASTRUCTURE VERIFICATION REQUIRED | Set bucket access to Service-Role only, as application handles signed-URL authorization server-side. |
| **1.6** | Configure Supabase Auth | Authentication → URL Configuration | 🟡 INFRASTRUCTURE VERIFICATION REQUIRED | Set Site URL to production domain (e.g. `https://ayursetu.aiia.gov.in`) and configure redirect URLs. |
| **1.7** | Deploy Prisma Migrations | Terminal / Deployment Pipeline | 🟢 CODE VERIFIED | Run `npx prisma migrate deploy` using `DIRECT_URL`. |

---

## 2. Vercel / Hosting Deployment Checklist

| Step # | Task / Target | Environment Key | Classification | Status |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | Configure Database Pooler URL | `DATABASE_URL` | 🟡 INFRASTRUCTURE REQUIRED | Add secret in Vercel Project Settings. |
| **2.2** | Configure Direct Migration URL | `DIRECT_URL` | 🟡 INFRASTRUCTURE REQUIRED | Add secret in Vercel Project Settings. |
| **2.3** | Set Supabase Public URL | `NEXT_PUBLIC_SUPABASE_URL` | 🟡 INFRASTRUCTURE REQUIRED | Add universal environment variable. |
| **2.4** | Set Supabase Public Anon Key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🟡 INFRASTRUCTURE REQUIRED | Add universal environment variable. |
| **2.5** | Set Supabase Service Role Secret | `SUPABASE_SERVICE_ROLE_KEY` | 🟡 INFRASTRUCTURE REQUIRED | Add server-only secret variable. |
| **2.6** | Set AES-256 Crypto Key | `ENCRYPTION_SECRET_KEY` | 🟡 INFRASTRUCTURE REQUIRED | Add 64-hex char secret for PII/ABHA encryption. |
| **2.7** | Next.js Build Command | `npm run build` | 🟢 CODE VERIFIED | Runs `prisma generate && next build`. |
| **2.8** | Health Check Endpoint | `/api/health` | 🟢 CODE VERIFIED | Verifies HTTP 200 `status: healthy` and database readiness. |

---

## 3. Storage Security & Access Policy Intent

```sql
-- Storage Policy Intent for Supabase Storage Bucket `medical-documents`:
-- 1. Private Bucket: Direct unauthenticated public HTTP GET requests are completely blocked.
-- 2. Server-Side Service Role: The AyurSetu backend (using SUPABASE_SERVICE_ROLE_KEY) mediates all uploads and downloads.
-- 3. Short-Lived Access: Patient and Doctor dossiers generate temporary signed URLs with 300-second (5 min) TTL.
```
