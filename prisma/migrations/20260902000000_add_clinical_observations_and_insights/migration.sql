-- Migration: 20260902000000_add_clinical_observations_and_insights
-- Author: Kumkum <kumkumsan567@gmail.com>
-- Purpose: Add structured clinical observations, explainable evidence links, insights, and doctor verification tables

-- 1. Create Enums
CREATE TYPE "ObservationType" AS ENUM (
    'SYMPTOM',
    'SIGN',
    'VITAL',
    'HISTORY',
    'MEDICATION',
    'ALLERGY',
    'LIFESTYLE',
    'DIET',
    'SLEEP',
    'MENTAL_WELLBEING',
    'AYURVEDA_PRAKRITI',
    'AYURVEDA_AGNI',
    'AYURVEDA_AMA',
    'AYURVEDA_DOSHA',
    'HOMEOPATHY_GENERAL',
    'HOMEOPATHY_MIASM',
    'HOMEOPATHY_MODALITY',
    'DOCUMENT_EXTRACTED',
    'PATIENT_REPORTED',
    'DOCTOR_RECORDED'
);

CREATE TYPE "ObservationSource" AS ENUM (
    'PATIENT_INPUT',
    'DOCTOR_INPUT',
    'OCR_EXTRACTED',
    'VOICE_TRANSCRIPT',
    'QUESTION_RESPONSE',
    'DOCUMENT',
    'SYSTEM_INFERENCE',
    'IMPORTED_RECORD'
);

CREATE TYPE "ObservationStatus" AS ENUM (
    'PRELIMINARY',
    'RECORDED',
    'VERIFIED',
    'REFUTED',
    'AMENDED'
);

CREATE TYPE "InsightStatus" AS ENUM (
    'DRAFT',
    'REVIEW_REQUIRED',
    'VERIFIED',
    'REJECTED',
    'OVERRIDDEN'
);

CREATE TYPE "DoctorReviewDecision" AS ENUM (
    'CONFIRMED',
    'MODIFIED',
    'REJECTED',
    'OVERRIDDEN'
);

-- 2. Create Table: clinical_observations
CREATE TABLE "clinical_observations" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "category" "ObservationType" NOT NULL DEFAULT 'SYMPTOM',
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "numericValue" DOUBLE PRECISION,
    "unit" TEXT,
    "bodySite" TEXT,
    "laterality" TEXT,
    "severity" TEXT,
    "duration" TEXT,
    "frequency" TEXT,
    "modality" TEXT,
    "rawText" TEXT NOT NULL,
    "status" "ObservationStatus" NOT NULL DEFAULT 'RECORDED',
    "source" "ObservationSource" NOT NULL DEFAULT 'PATIENT_INPUT',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "observedAt" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "sourceQuestionNodeId" TEXT,
    "sourceDocumentId" TEXT,
    "sourceEntityId" TEXT,
    "verifiedById" UUID,
    "doctorNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_observations_pkey" PRIMARY KEY ("id")
);

-- 3. Create Table: clinical_insights
CREATE TABLE "clinical_insights" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "InsightStatus" NOT NULL DEFAULT 'DRAFT',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "ruleOrModelVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "reviewedById" UUID,
    "doctorDecision" "DoctorReviewDecision",
    "doctorOverrideText" TEXT,
    "doctorReviewReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_insights_pkey" PRIMARY KEY ("id")
);

-- 4. Create Table: clinical_evidence
CREATE TABLE "clinical_evidence" (
    "id" UUID NOT NULL,
    "insightId" UUID NOT NULL,
    "observationId" UUID NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'SUPPORTING',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_evidence_pkey" PRIMARY KEY ("id")
);

-- 5. Create Unique Constraints & Indexes
CREATE UNIQUE INDEX "clinical_evidence_insightId_observationId_key" ON "clinical_evidence"("insightId", "observationId");

CREATE INDEX "clinical_observations_patientId_idx" ON "clinical_observations"("patientId");
CREATE INDEX "clinical_observations_sessionId_idx" ON "clinical_observations"("sessionId");
CREATE INDEX "clinical_observations_category_idx" ON "clinical_observations"("category");
CREATE INDEX "clinical_observations_code_idx" ON "clinical_observations"("code");
CREATE INDEX "clinical_observations_status_idx" ON "clinical_observations"("status");
CREATE INDEX "clinical_observations_reportedAt_idx" ON "clinical_observations"("reportedAt");
CREATE INDEX "clinical_observations_observedAt_idx" ON "clinical_observations"("observedAt");
CREATE INDEX "clinical_observations_verifiedById_idx" ON "clinical_observations"("verifiedById");

CREATE INDEX "clinical_insights_patientId_idx" ON "clinical_insights"("patientId");
CREATE INDEX "clinical_insights_sessionId_idx" ON "clinical_insights"("sessionId");
CREATE INDEX "clinical_insights_insightType_idx" ON "clinical_insights"("insightType");
CREATE INDEX "clinical_insights_status_idx" ON "clinical_insights"("status");
CREATE INDEX "clinical_insights_reviewedById_idx" ON "clinical_insights"("reviewedById");
CREATE INDEX "clinical_insights_generatedAt_idx" ON "clinical_insights"("generatedAt");

CREATE INDEX "clinical_evidence_insightId_idx" ON "clinical_evidence"("insightId");
CREATE INDEX "clinical_evidence_observationId_idx" ON "clinical_evidence"("observationId");
CREATE INDEX "clinical_evidence_relationship_idx" ON "clinical_evidence"("relationship");

-- 6. Add Foreign Key Constraints
ALTER TABLE "clinical_observations" ADD CONSTRAINT "clinical_observations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinical_observations" ADD CONSTRAINT "clinical_observations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinical_observations" ADD CONSTRAINT "clinical_observations_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clinical_insights" ADD CONSTRAINT "clinical_insights_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinical_insights" ADD CONSTRAINT "clinical_insights_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinical_insights" ADD CONSTRAINT "clinical_insights_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clinical_evidence" ADD CONSTRAINT "clinical_evidence_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "clinical_insights"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinical_evidence" ADD CONSTRAINT "clinical_evidence_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "clinical_observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
