# 🛡️ PRODUCTION BACKUP & DISASTER RECOVERY PLAN
**Ministry of Ayush / AIIA Case-Taking Software**
*Date: August 2026 | Business Continuity, RTO, RPO & Data Retention*

---

## 1. Executive Summary

This plan defines the backup and disaster recovery requirements for AyurSetu's clinical database and medical document storage, ensuring compliance with **DPDP Act 2023** and **National Digital Health Blueprint (NDHB)** guidelines.

---

## 2. Recovery Objectives

| Metric | Target Objective | Strategy / Architecture |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 1 hour** (Pro plan) / **24 hours** (Free plan) | Supabase automated daily backups + WAL archiving for Point-in-Time Recovery (PITR). |
| **Recovery Time Objective (RTO)** | **< 30 minutes** | Instant database rollback via Supabase Dashboard / CLI snapshot restoration. |
| **Document Durability** | **99.999999999% (11 9's)** | Supabase Private Storage backed by multi-AZ S3-compatible cloud object storage. |

---

## 3. Database Backup & Rollback Workflow

1. **Automated Daily Backups**: Supabase automatically captures daily full database snapshots retained for 7 to 30 days depending on the active tier.
2. **Point-In-Time Recovery (PITR)**: Enables rolling back PostgreSQL state to any specific second before a catastrophic migration error or corrupted intake batch.
3. **Migration Rollback Strategy**:
   - Every Prisma migration in `prisma/migrations/` must be paired with a reverse migration script (`down.sql`) in source control.
   - In case of a failed deployment, run `prisma migrate resolve --rolled-back <migration_name>` and apply corrective DDL.

---

## 4. Medical Document Object Retention & Accidental Deletion

1. **Soft-Deletion Model**: The `MedicalDocument` Prisma model employs soft-deletion via `deletedAt DateTime?`. Documents are flagged inactive in the database before physical object removal.
2. **Atomic Rollback**: If a database transaction fails during clinical intake document indexing, `SupabaseStorageService.deleteDocument` is immediately triggered to prevent orphaned binary storage artifacts.
3. **Audit Trail**: Every document creation, access, view, and deletion is recorded in the append-only `AuditLog` table with timestamp, user ID, and IP address.
