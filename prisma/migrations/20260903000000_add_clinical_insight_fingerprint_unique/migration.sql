-- Migration: 20260903000000_add_clinical_insight_fingerprint_unique
-- Author: Kumkum <kumkumsan567@gmail.com>
-- Purpose: Add dedicated first-class fingerprint field and @@unique([sessionId, fingerprint]) to clinical_insights for atomic concurrency protection

-- 1. Add fingerprint column with default empty string for backward compatibility
ALTER TABLE "clinical_insights" ADD COLUMN "fingerprint" TEXT NOT NULL DEFAULT '';

-- 2. Backfill existing records if metadata contains fingerprint
UPDATE "clinical_insights"
SET "fingerprint" = COALESCE("metadata"->>'fingerprint', "id"::text)
WHERE "fingerprint" = '';

-- 3. Create unique index on (sessionId, fingerprint)
CREATE UNIQUE INDEX "clinical_insights_sessionId_fingerprint_key" ON "clinical_insights"("sessionId", "fingerprint");

-- 4. Create index on fingerprint
CREATE INDEX "clinical_insights_fingerprint_idx" ON "clinical_insights"("fingerprint");
