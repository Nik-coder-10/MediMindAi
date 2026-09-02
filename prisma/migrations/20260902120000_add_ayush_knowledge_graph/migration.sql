-- Migration: 20260902120000_add_ayush_knowledge_graph
-- Author: Kumkum <kumkumsan567@gmail.com>
-- Purpose: Add versioned AYUSH Knowledge Sources, Packs, Concepts, Relationships, and Observation Linking tables

-- 1. Create Enums
CREATE TYPE "KnowledgeConceptDomain" AS ENUM (
    'AYURVEDA',
    'HOMEOPATHY',
    'SHARED_CLINICAL'
);

CREATE TYPE "KnowledgeConceptCategory" AS ENUM (
    'SYMPTOM',
    'SIGN',
    'DOSHA',
    'GUNA',
    'PRAKRITI',
    'VIKRITI',
    'AGNI',
    'AMA',
    'DHATU',
    'SROTAS',
    'HERB',
    'FORMULATION',
    'MODALITY',
    'MIASM',
    'CONSTITUTION',
    'OTHER'
);

CREATE TYPE "KnowledgeRelationshipType" AS ENUM (
    'ASSOCIATED_WITH',
    'CHARACTERISTIC_OF',
    'HAS_MODALITY',
    'RELIEVED_BY',
    'AGGRAVATED_BY',
    'RELATED_TO',
    'SUBTYPE_OF',
    'PART_OF',
    'CONTRASTS_WITH',
    'SUPPORTS',
    'INCONSISTENT_WITH',
    'DERIVED_FROM',
    'EQUIVALENT_TO'
);

CREATE TYPE "KnowledgeStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'DEPRECATED',
    'RETIRED'
);

-- 2. Create Table: knowledge_sources
CREATE TABLE "knowledge_sources" (
    "id" UUID NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT,
    "sourceType" TEXT NOT NULL,
    "citation" TEXT,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "language" TEXT NOT NULL DEFAULT 'sa',
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- 3. Create Table: knowledge_packs
CREATE TABLE "knowledge_packs" (
    "id" UUID NOT NULL,
    "packKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" "KnowledgeConceptDomain" NOT NULL DEFAULT 'AYURVEDA',
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "description" TEXT,
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "sourceId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_packs_pkey" PRIMARY KEY ("id")
);

-- 4. Create Table: knowledge_concepts
CREATE TABLE "knowledge_concepts" (
    "id" UUID NOT NULL,
    "conceptKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHindi" TEXT,
    "nameSanskrit" TEXT,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" "KnowledgeConceptDomain" NOT NULL DEFAULT 'AYURVEDA',
    "category" "KnowledgeConceptCategory" NOT NULL DEFAULT 'OTHER',
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "packId" UUID,
    "sourceId" UUID,
    "sourceReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_concepts_pkey" PRIMARY KEY ("id")
);

-- 5. Create Table: knowledge_relationships
CREATE TABLE "knowledge_relationships" (
    "id" UUID NOT NULL,
    "sourceConceptId" UUID NOT NULL,
    "targetConceptId" UUID NOT NULL,
    "relationshipType" "KnowledgeRelationshipType" NOT NULL DEFAULT 'ASSOCIATED_WITH',
    "clinicalRationale" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "packId" UUID,
    "sourceId" UUID,
    "sourceReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_relationships_pkey" PRIMARY KEY ("id")
);

-- 6. Create Table: observation_knowledge_links
CREATE TABLE "observation_knowledge_links" (
    "id" UUID NOT NULL,
    "observationId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "resolutionMethod" TEXT NOT NULL DEFAULT 'DETERMINISTIC_KEY_MATCH',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "knowledgeVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observation_knowledge_links_pkey" PRIMARY KEY ("id")
);

-- 7. Unique Indexes
CREATE UNIQUE INDEX "knowledge_sources_sourceKey_key" ON "knowledge_sources"("sourceKey");
CREATE UNIQUE INDEX "knowledge_packs_packKey_key" ON "knowledge_packs"("packKey");
CREATE UNIQUE INDEX "knowledge_concepts_conceptKey_key" ON "knowledge_concepts"("conceptKey");
CREATE UNIQUE INDEX "knowledge_relationships_sourceConceptId_targetConceptId_relationshipType_version_key" ON "knowledge_relationships"("sourceConceptId", "targetConceptId", "relationshipType", "version");
CREATE UNIQUE INDEX "observation_knowledge_links_observationId_conceptId_key" ON "observation_knowledge_links"("observationId", "conceptId");

-- 8. Performance Query Indexes
CREATE INDEX "knowledge_sources_sourceKey_idx" ON "knowledge_sources"("sourceKey");
CREATE INDEX "knowledge_sources_status_idx" ON "knowledge_sources"("status");

CREATE INDEX "knowledge_packs_packKey_idx" ON "knowledge_packs"("packKey");
CREATE INDEX "knowledge_packs_domain_idx" ON "knowledge_packs"("domain");
CREATE INDEX "knowledge_packs_status_idx" ON "knowledge_packs"("status");

CREATE INDEX "knowledge_concepts_conceptKey_idx" ON "knowledge_concepts"("conceptKey");
CREATE INDEX "knowledge_concepts_normalizedName_idx" ON "knowledge_concepts"("normalizedName");
CREATE INDEX "knowledge_concepts_domain_idx" ON "knowledge_concepts"("domain");
CREATE INDEX "knowledge_concepts_category_idx" ON "knowledge_concepts"("category");
CREATE INDEX "knowledge_concepts_status_idx" ON "knowledge_concepts"("status");

CREATE INDEX "knowledge_relationships_sourceConceptId_idx" ON "knowledge_relationships"("sourceConceptId");
CREATE INDEX "knowledge_relationships_targetConceptId_idx" ON "knowledge_relationships"("targetConceptId");
CREATE INDEX "knowledge_relationships_relationshipType_idx" ON "knowledge_relationships"("relationshipType");
CREATE INDEX "knowledge_relationships_status_idx" ON "knowledge_relationships"("status");

CREATE INDEX "observation_knowledge_links_observationId_idx" ON "observation_knowledge_links"("observationId");
CREATE INDEX "observation_knowledge_links_conceptId_idx" ON "observation_knowledge_links"("conceptId");

-- 9. Foreign Keys
ALTER TABLE "knowledge_packs" ADD CONSTRAINT "knowledge_packs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "knowledge_concepts" ADD CONSTRAINT "knowledge_concepts_packId_fkey" FOREIGN KEY ("packId") REFERENCES "knowledge_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_concepts" ADD CONSTRAINT "knowledge_concepts_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_sourceConceptId_fkey" FOREIGN KEY ("sourceConceptId") REFERENCES "knowledge_concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_targetConceptId_fkey" FOREIGN KEY ("targetConceptId") REFERENCES "knowledge_concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_packId_fkey" FOREIGN KEY ("packId") REFERENCES "knowledge_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_relationships" ADD CONSTRAINT "knowledge_relationships_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "observation_knowledge_links" ADD CONSTRAINT "observation_knowledge_links_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "clinical_observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "observation_knowledge_links" ADD CONSTRAINT "observation_knowledge_links_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "knowledge_concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
