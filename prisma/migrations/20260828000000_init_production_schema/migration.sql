-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'NURSE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'WAITING_FOR_DOCTOR', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TriagePriority" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "TurnRole" AS ENUM ('PATIENT', 'AI', 'DOCTOR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RedFlagSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PRESCRIPTION', 'LAB', 'DISCHARGE', 'IMAGING', 'OTHER');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('MEDICATION', 'DIAGNOSIS', 'LAB', 'PROCEDURE', 'ALLERGY', 'VITAL', 'AYUSH_FORMULATION');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'SCALE', 'YES_NO');

-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('DRAFT', 'ACCEPTED', 'REJECTED', 'REVISED');

-- CreateEnum
CREATE TYPE "DoshaDominance" AS ENUM ('VATA', 'PITTA', 'KAPHA', 'VATA_PITTA', 'PITTA_KAPHA', 'VATA_KAPHA', 'SAMADOSHA');

-- CreateEnum
CREATE TYPE "AbhaStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'DEACTIVATED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "supabaseUserId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "abhaId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "bloodGroup" TEXT,
    "address" TEXT,
    "emergencyContact" JSONB,
    "baselinePrakriti" "DoshaDominance",
    "medicalHistory" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "department" TEXT,
    "hospitalAffiliation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'hi',
    "audioConsentUrl" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "version" TEXT NOT NULL DEFAULT '1.0',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_sessions" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorId" UUID,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "language" TEXT NOT NULL DEFAULT 'hi',
    "triagePriority" "TriagePriority" NOT NULL DEFAULT 'ROUTINE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "redFlagTriggered" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engine_states" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "currentNodeId" TEXT,
    "collectedFacts" JSONB NOT NULL DEFAULT '{}',
    "questionHistory" JSONB NOT NULL DEFAULT '[]',
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "maxQuestions" INTEGER NOT NULL DEFAULT 12,
    "triageLevel" "TriagePriority" NOT NULL DEFAULT 'ROUTINE',
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engine_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_nodes" (
    "id" UUID NOT NULL,
    "chiefComplaintCategory" TEXT NOT NULL,
    "nodeCode" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionTextHindi" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "options" JSONB,
    "redFlagTriggers" JSONB,
    "nextNodeLogic" JSONB,
    "clinicalDomain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_answers" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "questionNodeId" UUID,
    "nodeCode" TEXT NOT NULL,
    "answerValue" JSONB NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_turns" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "role" "TurnRole" NOT NULL,
    "contentText" TEXT NOT NULL,
    "contentAudioUrl" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "conversation_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chief_complaints" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "symptomName" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "location" TEXT,
    "aggravatingFactors" TEXT,
    "relievingFactors" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chief_complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adaptive_answers" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "answerAudioUrl" TEXT,
    "clinicalContext" TEXT,
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adaptive_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "red_flag_events" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "ruleId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "RedFlagSeverity" NOT NULL DEFAULT 'HIGH',
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "actionTaken" TEXT,

    CONSTRAINT "red_flag_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_documents" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'PRESCRIPTION',
    "originalFileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "ocrRawText" TEXT,
    "language" TEXT DEFAULT 'en',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "medical_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_medical_entities" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "type" "EntityType" NOT NULL,
    "rawText" TEXT NOT NULL,
    "structuredData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isVerifiedByDoctor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extracted_medical_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_timeline_events" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "sourceDocumentId" UUID,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_summaries" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "aiGeneratedMarkdown" TEXT NOT NULL,
    "doctorEditedMarkdown" TEXT,
    "status" "SummaryStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ayurveda_assessments" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "prakriti" "DoshaDominance" NOT NULL,
    "vikriti" "DoshaDominance" NOT NULL,
    "dushya" TEXT,
    "desha" TEXT,
    "bala" TEXT,
    "kala" TEXT,
    "anala" TEXT,
    "sara" TEXT,
    "samhanana" TEXT,
    "pramana" TEXT,
    "satmya" TEXT,
    "sattva" TEXT,
    "aharaShakti" TEXT,
    "vyayamaShakti" TEXT,
    "vaya" TEXT,
    "ashtavidhaData" JSONB,
    "aharaVihara" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ayurveda_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" UUID,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abha_links" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "abhaNumber" TEXT NOT NULL,
    "abhaAddress" TEXT NOT NULL,
    "status" "AbhaStatus" NOT NULL DEFAULT 'ACTIVE',
    "kycVerified" BOOLEAN NOT NULL DEFAULT true,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "abha_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fhir_resources" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "sessionId" UUID,
    "resourceType" TEXT NOT NULL,
    "resourceJson" JSONB NOT NULL,
    "versionId" TEXT NOT NULL DEFAULT '1',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fhir_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseUserId_key" ON "users"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_abhaId_key" ON "users"("abhaId");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_supabaseUserId_idx" ON "users"("supabaseUserId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_abhaId_idx" ON "users"("abhaId");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_userId_key" ON "patient_profiles"("userId");

-- CreateIndex
CREATE INDEX "patient_profiles_userId_idx" ON "patient_profiles"("userId");

-- CreateIndex
CREATE INDEX "patient_profiles_baselinePrakriti_idx" ON "patient_profiles"("baselinePrakriti");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_userId_key" ON "doctor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_registrationNumber_key" ON "doctor_profiles"("registrationNumber");

-- CreateIndex
CREATE INDEX "doctor_profiles_userId_idx" ON "doctor_profiles"("userId");

-- CreateIndex
CREATE INDEX "doctor_profiles_registrationNumber_idx" ON "doctor_profiles"("registrationNumber");

-- CreateIndex
CREATE INDEX "consent_records_patientId_idx" ON "consent_records"("patientId");

-- CreateIndex
CREATE INDEX "consent_records_grantedAt_idx" ON "consent_records"("grantedAt");

-- CreateIndex
CREATE INDEX "consent_records_revokedAt_idx" ON "consent_records"("revokedAt");

-- CreateIndex
CREATE INDEX "clinical_sessions_patientId_idx" ON "clinical_sessions"("patientId");

-- CreateIndex
CREATE INDEX "clinical_sessions_doctorId_idx" ON "clinical_sessions"("doctorId");

-- CreateIndex
CREATE INDEX "clinical_sessions_status_idx" ON "clinical_sessions"("status");

-- CreateIndex
CREATE INDEX "clinical_sessions_triagePriority_idx" ON "clinical_sessions"("triagePriority");

-- CreateIndex
CREATE INDEX "clinical_sessions_redFlagTriggered_idx" ON "clinical_sessions"("redFlagTriggered");

-- CreateIndex
CREATE UNIQUE INDEX "engine_states_sessionId_key" ON "engine_states"("sessionId");

-- CreateIndex
CREATE INDEX "engine_states_sessionId_idx" ON "engine_states"("sessionId");

-- CreateIndex
CREATE INDEX "engine_states_category_idx" ON "engine_states"("category");

-- CreateIndex
CREATE UNIQUE INDEX "question_nodes_nodeCode_key" ON "question_nodes"("nodeCode");

-- CreateIndex
CREATE INDEX "question_nodes_chiefComplaintCategory_idx" ON "question_nodes"("chiefComplaintCategory");

-- CreateIndex
CREATE INDEX "question_nodes_nodeCode_idx" ON "question_nodes"("nodeCode");

-- CreateIndex
CREATE INDEX "patient_answers_sessionId_idx" ON "patient_answers"("sessionId");

-- CreateIndex
CREATE INDEX "patient_answers_questionNodeId_idx" ON "patient_answers"("questionNodeId");

-- CreateIndex
CREATE INDEX "patient_answers_nodeCode_idx" ON "patient_answers"("nodeCode");

-- CreateIndex
CREATE INDEX "conversation_turns_sessionId_idx" ON "conversation_turns"("sessionId");

-- CreateIndex
CREATE INDEX "conversation_turns_timestamp_idx" ON "conversation_turns"("timestamp");

-- CreateIndex
CREATE INDEX "chief_complaints_sessionId_idx" ON "chief_complaints"("sessionId");

-- CreateIndex
CREATE INDEX "adaptive_answers_sessionId_idx" ON "adaptive_answers"("sessionId");

-- CreateIndex
CREATE INDEX "adaptive_answers_questionId_idx" ON "adaptive_answers"("questionId");

-- CreateIndex
CREATE INDEX "red_flag_events_sessionId_idx" ON "red_flag_events"("sessionId");

-- CreateIndex
CREATE INDEX "red_flag_events_severity_idx" ON "red_flag_events"("severity");

-- CreateIndex
CREATE INDEX "red_flag_events_notified_idx" ON "red_flag_events"("notified");

-- CreateIndex
CREATE INDEX "medical_documents_sessionId_idx" ON "medical_documents"("sessionId");

-- CreateIndex
CREATE INDEX "medical_documents_type_idx" ON "medical_documents"("type");

-- CreateIndex
CREATE INDEX "extracted_medical_entities_documentId_idx" ON "extracted_medical_entities"("documentId");

-- CreateIndex
CREATE INDEX "extracted_medical_entities_type_idx" ON "extracted_medical_entities"("type");

-- CreateIndex
CREATE INDEX "medical_timeline_events_patientId_idx" ON "medical_timeline_events"("patientId");

-- CreateIndex
CREATE INDEX "medical_timeline_events_eventDate_idx" ON "medical_timeline_events"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_summaries_sessionId_key" ON "clinical_summaries"("sessionId");

-- CreateIndex
CREATE INDEX "clinical_summaries_sessionId_idx" ON "clinical_summaries"("sessionId");

-- CreateIndex
CREATE INDEX "clinical_summaries_status_idx" ON "clinical_summaries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ayurveda_assessments_sessionId_key" ON "ayurveda_assessments"("sessionId");

-- CreateIndex
CREATE INDEX "ayurveda_assessments_sessionId_idx" ON "ayurveda_assessments"("sessionId");

-- CreateIndex
CREATE INDEX "ayurveda_assessments_prakriti_idx" ON "ayurveda_assessments"("prakriti");

-- CreateIndex
CREATE INDEX "ayurveda_assessments_vikriti_idx" ON "ayurveda_assessments"("vikriti");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "abha_links_patientId_key" ON "abha_links"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "abha_links_abhaNumber_key" ON "abha_links"("abhaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "abha_links_abhaAddress_key" ON "abha_links"("abhaAddress");

-- CreateIndex
CREATE INDEX "abha_links_patientId_idx" ON "abha_links"("patientId");

-- CreateIndex
CREATE INDEX "abha_links_abhaNumber_idx" ON "abha_links"("abhaNumber");

-- CreateIndex
CREATE INDEX "abha_links_abhaAddress_idx" ON "abha_links"("abhaAddress");

-- CreateIndex
CREATE INDEX "fhir_resources_patientId_idx" ON "fhir_resources"("patientId");

-- CreateIndex
CREATE INDEX "fhir_resources_sessionId_idx" ON "fhir_resources"("sessionId");

-- CreateIndex
CREATE INDEX "fhir_resources_resourceType_idx" ON "fhir_resources"("resourceType");

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_states" ADD CONSTRAINT "engine_states_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_answers" ADD CONSTRAINT "patient_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_answers" ADD CONSTRAINT "patient_answers_questionNodeId_fkey" FOREIGN KEY ("questionNodeId") REFERENCES "question_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_turns" ADD CONSTRAINT "conversation_turns_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chief_complaints" ADD CONSTRAINT "chief_complaints_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptive_answers" ADD CONSTRAINT "adaptive_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "red_flag_events" ADD CONSTRAINT "red_flag_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_medical_entities" ADD CONSTRAINT "extracted_medical_entities_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "medical_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_timeline_events" ADD CONSTRAINT "medical_timeline_events_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_timeline_events" ADD CONSTRAINT "medical_timeline_events_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "medical_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_summaries" ADD CONSTRAINT "clinical_summaries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayurveda_assessments" ADD CONSTRAINT "ayurveda_assessments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abha_links" ADD CONSTRAINT "abha_links_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fhir_resources" ADD CONSTRAINT "fhir_resources_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fhir_resources" ADD CONSTRAINT "fhir_resources_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
