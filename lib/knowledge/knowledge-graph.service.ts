import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import {
  KnowledgeConceptDomain,
  KnowledgeConceptCategory,
  KnowledgeRelationshipType,
  KnowledgeStatus,
  KnowledgeConcept,
  KnowledgeRelationship,
  KnowledgeSource,
  KnowledgePack,
} from "@prisma/client";
import {
  AYURVEDA_CORE_SOURCE,
  HOMEOPATHY_CORE_SOURCE,
  AYURVEDA_CORE_PACK,
  HOMEOPATHY_CORE_PACK,
  SeedKnowledgePack,
} from "./knowledge-seed.data";

// In-Memory Fast Cache for Standalone and Disconnected Database Execution
const inMemorySources = new Map<string, any>();
const inMemoryPacks = new Map<string, any>();
const inMemoryConcepts = new Map<string, any>();
const inMemoryRelationships: any[] = [];
const inMemoryObservationLinks = new Map<string, any[]>();

export interface ConceptNeighborhoodDTO {
  concept: KnowledgeConcept;
  outgoing: Array<{
    relationship: KnowledgeRelationship;
    targetConcept: KnowledgeConcept;
    sourceInfo?: KnowledgeSource | null;
  }>;
  incoming: Array<{
    relationship: KnowledgeRelationship;
    sourceConcept: KnowledgeConcept;
    sourceInfo?: KnowledgeSource | null;
  }>;
  depth: number;
}

export interface ExplainableKnowledgeContextDTO {
  observationId: string;
  observationName: string;
  matchedConceptKey: string;
  matchedConceptName: string;
  domain: KnowledgeConceptDomain;
  category: KnowledgeConceptCategory;
  resolutionMethod: string;
  confidence: number;
  knowledgeVersion: string;
  relationships: Array<{
    relationshipType: KnowledgeRelationshipType;
    targetConceptKey: string;
    targetConceptName: string;
    clinicalRationale: string;
    weight: number;
    sourceTitle: string;
    sourceReference: string;
  }>;
  clinicalDisclaimer: string;
}

export interface ConceptSearchFilter {
  domain?: KnowledgeConceptDomain;
  category?: KnowledgeConceptCategory;
  status?: KnowledgeStatus;
  version?: string;
  limit?: number;
  offset?: number;
}

export class KnowledgeGraphService {
  /**
   * Initializes or bootstraps the in-memory fallback cache with curated seed knowledge
   */
  static initInMemorySeed() {
    if (inMemoryConcepts.size > 0) return;

    // 1. Sources
    inMemorySources.set(AYURVEDA_CORE_SOURCE.sourceKey, {
      id: "src-ayurveda-core",
      ...AYURVEDA_CORE_SOURCE,
      status: KnowledgeStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    inMemorySources.set(HOMEOPATHY_CORE_SOURCE.sourceKey, {
      id: "src-homeopathy-core",
      ...HOMEOPATHY_CORE_SOURCE,
      status: KnowledgeStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Packs
    const loadPack = (pack: SeedKnowledgePack, id: string) => {
      inMemoryPacks.set(pack.packKey, {
        id,
        packKey: pack.packKey,
        name: pack.name,
        domain: pack.domain,
        version: pack.version,
        description: pack.description,
        status: KnowledgeStatus.ACTIVE,
        sourceId: inMemorySources.get(pack.sourceKey)?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Concepts
      pack.concepts.forEach((c, idx) => {
        const cId = `c-${pack.packKey}-${idx}`;
        inMemoryConcepts.set(c.conceptKey, {
          id: cId,
          conceptKey: c.conceptKey,
          name: c.name,
          nameHindi: c.nameHindi,
          nameSanskrit: c.nameSanskrit || null,
          normalizedName: c.normalizedName.toLowerCase().trim(),
          description: c.description,
          domain: c.domain,
          category: c.category,
          status: KnowledgeStatus.ACTIVE,
          version: c.version,
          packId: id,
          sourceId: inMemorySources.get(c.sourceKey)?.id,
          sourceReference: c.sourceReference,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Relationships
      pack.relationships.forEach((r, idx) => {
        const sourceConcept = inMemoryConcepts.get(r.sourceConceptKey);
        const targetConcept = inMemoryConcepts.get(r.targetConceptKey);
        if (sourceConcept && targetConcept) {
          inMemoryRelationships.push({
            id: `rel-${pack.packKey}-${idx}`,
            sourceConceptId: sourceConcept.id,
            targetConceptId: targetConcept.id,
            sourceConceptKey: r.sourceConceptKey,
            targetConceptKey: r.targetConceptKey,
            relationshipType: r.relationshipType,
            clinicalRationale: r.clinicalRationale,
            weight: r.weight,
            status: KnowledgeStatus.ACTIVE,
            version: r.version,
            packId: id,
            sourceId: inMemorySources.get(r.sourceKey)?.id,
            sourceReference: r.sourceReference,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    };

    loadPack(AYURVEDA_CORE_PACK, "pack-ayurveda-core");
    loadPack(HOMEOPATHY_CORE_PACK, "pack-homeopathy-core");
  }

  /**
   * Seeds the PostgreSQL database with curated knowledge packs if not already present
   */
  static async seedKnowledgeGraph(): Promise<{
    sourcesCount: number;
    packsCount: number;
    conceptsCount: number;
    relationshipsCount: number;
  }> {
    this.initInMemorySeed();

    try {
      // 1. Seed Sources
      for (const src of [AYURVEDA_CORE_SOURCE, HOMEOPATHY_CORE_SOURCE]) {
        await prisma.knowledgeSource.upsert({
          where: { sourceKey: src.sourceKey },
          create: {
            sourceKey: src.sourceKey,
            title: src.title,
            publisher: src.publisher,
            sourceType: src.sourceType,
            citation: src.citation,
            version: src.version,
            language: src.language,
            status: KnowledgeStatus.ACTIVE,
          },
          update: {
            title: src.title,
            publisher: src.publisher,
            citation: src.citation,
            status: KnowledgeStatus.ACTIVE,
          },
        });
      }

      // 2. Seed Packs, Concepts, Relationships
      for (const pack of [AYURVEDA_CORE_PACK, HOMEOPATHY_CORE_PACK]) {
        const source = await prisma.knowledgeSource.findUnique({
          where: { sourceKey: pack.sourceKey },
        });

        const createdPack = await prisma.knowledgePack.upsert({
          where: { packKey: pack.packKey },
          create: {
            packKey: pack.packKey,
            name: pack.name,
            domain: pack.domain,
            version: pack.version,
            description: pack.description,
            status: KnowledgeStatus.ACTIVE,
            sourceId: source?.id,
          },
          update: {
            name: pack.name,
            status: KnowledgeStatus.ACTIVE,
          },
        });

        // Seed Concepts
        for (const c of pack.concepts) {
          await prisma.knowledgeConcept.upsert({
            where: { conceptKey: c.conceptKey },
            create: {
              conceptKey: c.conceptKey,
              name: c.name,
              nameHindi: c.nameHindi,
              nameSanskrit: c.nameSanskrit,
              normalizedName: c.normalizedName.toLowerCase().trim(),
              description: c.description,
              domain: c.domain,
              category: c.category,
              status: KnowledgeStatus.ACTIVE,
              version: c.version,
              packId: createdPack.id,
              sourceId: source?.id,
              sourceReference: c.sourceReference,
            },
            update: {
              name: c.name,
              nameHindi: c.nameHindi,
              description: c.description,
              status: KnowledgeStatus.ACTIVE,
            },
          });
        }

        // Seed Relationships
        for (const r of pack.relationships) {
          const srcConcept = await prisma.knowledgeConcept.findUnique({
            where: { conceptKey: r.sourceConceptKey },
          });
          const tgtConcept = await prisma.knowledgeConcept.findUnique({
            where: { conceptKey: r.targetConceptKey },
          });

          if (srcConcept && tgtConcept) {
            await prisma.knowledgeRelationship.upsert({
              where: {
                sourceConceptId_targetConceptId_relationshipType_version: {
                  sourceConceptId: srcConcept.id,
                  targetConceptId: tgtConcept.id,
                  relationshipType: r.relationshipType,
                  version: r.version,
                },
              },
              create: {
                sourceConceptId: srcConcept.id,
                targetConceptId: tgtConcept.id,
                relationshipType: r.relationshipType,
                clinicalRationale: r.clinicalRationale,
                weight: r.weight,
                status: KnowledgeStatus.ACTIVE,
                version: r.version,
                packId: createdPack.id,
                sourceId: source?.id,
                sourceReference: r.sourceReference,
              },
              update: {
                clinicalRationale: r.clinicalRationale,
                weight: r.weight,
                status: KnowledgeStatus.ACTIVE,
              },
            });
          }
        }
      }

      const [sourcesCount, packsCount, conceptsCount, relationshipsCount] = await Promise.all([
        prisma.knowledgeSource.count(),
        prisma.knowledgePack.count(),
        prisma.knowledgeConcept.count(),
        prisma.knowledgeRelationship.count(),
      ]);

      return { sourcesCount, packsCount, conceptsCount, relationshipsCount };
    } catch {
      return {
        sourcesCount: inMemorySources.size,
        packsCount: inMemoryPacks.size,
        conceptsCount: inMemoryConcepts.size,
        relationshipsCount: inMemoryRelationships.length,
      };
    }
  }

  /**
   * Deterministic concept lookup by canonical concept key
   */
  static async findConceptByKey(conceptKey: string): Promise<KnowledgeConcept | null> {
    if (!conceptKey) return null;
    this.initInMemorySeed();

    try {
      const concept = await prisma.knowledgeConcept.findUnique({
        where: { conceptKey },
        include: { source: true, pack: true },
      });
      if (concept) return concept;
    } catch {
      // DB offline fallback
    }

    return inMemoryConcepts.get(conceptKey) || null;
  }

  /**
   * Normalized search for concepts across English name, Hindi label, or synonyms
   */
  static async searchConcepts(
    query: string,
    filter?: ConceptSearchFilter
  ): Promise<KnowledgeConcept[]> {
    if (!query || !query.trim()) return [];
    this.initInMemorySeed();

    const normalizedQuery = query.toLowerCase().trim();
    const limit = filter?.limit && filter.limit > 0 ? Math.min(filter.limit, 50) : 20;

    try {
      const dbConcepts = await prisma.knowledgeConcept.findMany({
        where: {
          status: filter?.status || KnowledgeStatus.ACTIVE,
          ...(filter?.domain ? { domain: filter.domain } : {}),
          ...(filter?.category ? { category: filter.category } : {}),
          OR: [
            { conceptKey: { contains: normalizedQuery, mode: "insensitive" } },
            { name: { contains: normalizedQuery, mode: "insensitive" } },
            { normalizedName: { contains: normalizedQuery, mode: "insensitive" } },
            { nameHindi: { contains: query.trim() } },
          ],
        },
        take: limit,
        include: { source: true },
      });

      if (dbConcepts.length > 0) return dbConcepts;
    } catch {
      // Fallback
    }

    const matched: KnowledgeConcept[] = [];
    for (const c of Array.from(inMemoryConcepts.values())) {
      if (filter?.status && c.status !== filter.status) continue;
      if (filter?.domain && c.domain !== filter.domain) continue;
      if (filter?.category && c.category !== filter.category) continue;

      if (
        c.conceptKey.includes(normalizedQuery) ||
        c.name.toLowerCase().includes(normalizedQuery) ||
        c.normalizedName.includes(normalizedQuery) ||
        (c.nameHindi && c.nameHindi.includes(query.trim()))
      ) {
        matched.push(c);
        if (matched.length >= limit) break;
      }
    }

    return matched;
  }

  /**
   * Retrieves outgoing and incoming relationships for a concept with bounded traversal depth
   */
  static async getConceptNeighborhood(
    conceptKeyOrId: string,
    options?: { depth?: number; activeOnly?: boolean }
  ): Promise<ConceptNeighborhoodDTO | null> {
    this.initInMemorySeed();
    const depth = Math.min(options?.depth || 1, 2); // strictly bounded: max depth 2
    const activeOnly = options?.activeOnly !== false;

    let concept = await this.findConceptByKey(conceptKeyOrId);
    if (!concept) {
      // Try by ID in memory
      for (const c of Array.from(inMemoryConcepts.values())) {
        if (c.id === conceptKeyOrId) {
          concept = c;
          break;
        }
      }
    }
    if (!concept) return null;

    try {
      const [outgoingDb, incomingDb] = await Promise.all([
        prisma.knowledgeRelationship.findMany({
          where: {
            sourceConceptId: concept.id,
            ...(activeOnly ? { status: KnowledgeStatus.ACTIVE } : {}),
          },
          include: { targetConcept: true, source: true },
        }),
        prisma.knowledgeRelationship.findMany({
          where: {
            targetConceptId: concept.id,
            ...(activeOnly ? { status: KnowledgeStatus.ACTIVE } : {}),
          },
          include: { sourceConcept: true, source: true },
        }),
      ]);

      if (outgoingDb.length > 0 || incomingDb.length > 0) {
        return {
          concept,
          outgoing: outgoingDb.map((rel) => ({
            relationship: rel,
            targetConcept: rel.targetConcept,
            sourceInfo: rel.source,
          })),
          incoming: incomingDb.map((rel) => ({
            relationship: rel,
            sourceConcept: rel.sourceConcept,
            sourceInfo: rel.source,
          })),
          depth,
        };
      }
    } catch {
      // DB offline fallback
    }

    // In-Memory Neighborhood
    const outgoingMem: any[] = [];
    const incomingMem: any[] = [];

    for (const rel of inMemoryRelationships) {
      if (activeOnly && rel.status !== KnowledgeStatus.ACTIVE) continue;

      if (rel.sourceConceptId === concept.id) {
        const target = Array.from(inMemoryConcepts.values()).find((c) => c.id === rel.targetConceptId);
        if (target) {
          outgoingMem.push({
            relationship: rel,
            targetConcept: target,
            sourceInfo: inMemorySources.get(AYURVEDA_CORE_SOURCE.sourceKey),
          });
        }
      } else if (rel.targetConceptId === concept.id) {
        const source = Array.from(inMemoryConcepts.values()).find((c) => c.id === rel.sourceConceptId);
        if (source) {
          incomingMem.push({
            relationship: rel,
            sourceConcept: source,
            sourceInfo: inMemorySources.get(AYURVEDA_CORE_SOURCE.sourceKey),
          });
        }
      }
    }

    return {
      concept,
      outgoing: outgoingMem,
      incoming: incomingMem,
      depth,
    };
  }

  /**
   * Deterministically resolves a ClinicalObservation to an established KnowledgeConcept
   * Returns "UNRESOLVED" if no defensible deterministic match exists without fabricating associations.
   */
  static async resolveObservationToConcept(
    observationCodeOrName: string,
    category?: string
  ): Promise<{
    concept: KnowledgeConcept | null;
    resolutionMethod: string;
    confidence: number;
    status: "RESOLVED" | "UNRESOLVED";
  }> {
    this.initInMemorySeed();
    if (!observationCodeOrName || !observationCodeOrName.trim()) {
      return { concept: null, resolutionMethod: "NONE", confidence: 0, status: "UNRESOLVED" };
    }

    const query = observationCodeOrName.toLowerCase().trim();

    // 1. Direct concept key match
    let concept = await this.findConceptByKey(query);
    if (concept && concept.status === KnowledgeStatus.ACTIVE) {
      return {
        concept,
        resolutionMethod: "DETERMINISTIC_EXACT_KEY_MATCH",
        confidence: 1.0,
        status: "RESOLVED",
      };
    }

    // 2. Canonical mapping lookup
    const canonicalKeyMap: Record<string, string> = {
      "symptom.burning_sensation": "concept.symptom.burning_sensation",
      "symptom.epigastric_burning": "concept.symptom.burning_sensation",
      "symptom.stomach_burn": "concept.symptom.burning_sensation",
      "symptom.acidity": "concept.symptom.acid_reflux",
      "symptom.acid_reflux": "concept.symptom.acid_reflux",
      "symptom.knee_joint_pain": "concept.symptom.knee_joint_pain",
      "symptom.joint_pain": "concept.symptom.knee_joint_pain",
      "ayurveda.agni.mandagni": "concept.agni.mandagni",
      "agni.manda": "concept.agni.mandagni",
      "ayurveda.ama.present": "concept.ama.present",
      "ama.present": "concept.ama.present",
      "dosha.pitta": "concept.dosha.pitta",
      "dosha.vata": "concept.dosha.vata",
      "dosha.kapha": "concept.dosha.kapha",
      "modality.worse_cold_damp": "concept.modality.worse_cold_damp",
      "modality.worse_night": "concept.modality.worse_night",
      "miasm.psora": "concept.miasm.psora",
      "miasm.sycotic": "concept.miasm.sycotic",
    };

    const mappedKey = canonicalKeyMap[query];
    if (mappedKey) {
      concept = await this.findConceptByKey(mappedKey);
      if (concept && concept.status === KnowledgeStatus.ACTIVE) {
        return {
          concept,
          resolutionMethod: "DETERMINISTIC_CANONICAL_ALIAS",
          confidence: 0.95,
          status: "RESOLVED",
        };
      }
    }

    // 3. Normalized string search
    const results = await this.searchConcepts(query, { status: KnowledgeStatus.ACTIVE, limit: 1 });
    if (results.length > 0) {
      const top = results[0];
      return {
        concept: top,
        resolutionMethod: "NORMALIZED_SEARCH_MATCH",
        confidence: 0.85,
        status: "RESOLVED",
      };
    }

    return {
      concept: null,
      resolutionMethod: "NO_DEFENSIBLE_MATCH",
      confidence: 0,
      status: "UNRESOLVED",
    };
  }

  /**
   * Generates a structured, explainable knowledge context for a patient's observation.
   * Explains the exact relationship path and provenance without asserting medical diagnosis.
   */
  static async getExplainableKnowledgeContext(
    observationId: string,
    observationCode: string,
    observationName: string
  ): Promise<ExplainableKnowledgeContextDTO | null> {
    const resolution = await this.resolveObservationToConcept(observationCode || observationName);
    if (!resolution.concept || resolution.status !== "RESOLVED") {
      return null;
    }

    const neighborhood = await this.getConceptNeighborhood(resolution.concept.conceptKey, {
      depth: 1,
      activeOnly: true,
    });

    const relationships = (neighborhood?.outgoing || []).map((edge) => ({
      relationshipType: edge.relationship.relationshipType,
      targetConceptKey: edge.targetConcept.conceptKey,
      targetConceptName: edge.targetConcept.name,
      clinicalRationale: edge.relationship.clinicalRationale || "Recognized traditional knowledge correlation.",
      weight: edge.relationship.weight,
      sourceTitle: edge.sourceInfo?.title || "Configured AYUSH Knowledge Pack",
      sourceReference: edge.relationship.sourceReference || "Traditional Standard Reference",
    }));

    return {
      observationId,
      observationName,
      matchedConceptKey: resolution.concept.conceptKey,
      matchedConceptName: resolution.concept.name,
      domain: resolution.concept.domain,
      category: resolution.concept.category,
      resolutionMethod: resolution.resolutionMethod,
      confidence: resolution.confidence,
      knowledgeVersion: resolution.concept.version,
      relationships,
      clinicalDisclaimer:
        "AYUSH Knowledge Context represents traditional literature associations for physician decision support and does not constitute an autonomous biomedical diagnosis.",
    };
  }
}
