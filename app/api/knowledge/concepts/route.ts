import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { KnowledgeGraphService } from "@/lib/knowledge/knowledge-graph.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { KnowledgeConceptDomain, KnowledgeConceptCategory, KnowledgeStatus } from "@prisma/client";

/**
 * GET /api/knowledge/concepts
 * Query knowledge graph concepts with pagination, domain/category filtering, and normalized query search.
 * Accessible to authenticated users (DOCTOR, ADMIN, PATIENT with bounded read permissions).
 */
export async function GET(req: NextRequest) {
  try {
    await AuthService.requireUser(req);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const domain = searchParams.get("domain") as KnowledgeConceptDomain | undefined;
    const category = searchParams.get("category") as KnowledgeConceptCategory | undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    let concepts;
    if (query.trim()) {
      concepts = await KnowledgeGraphService.searchConcepts(query, {
        domain,
        category,
        status: KnowledgeStatus.ACTIVE,
        limit,
      });
    } else {
      // Default to returning active curated ontology concepts
      concepts = await KnowledgeGraphService.searchConcepts("concept", {
        domain,
        category,
        status: KnowledgeStatus.ACTIVE,
        limit,
      });
    }

    return apiSuccess({
      total: concepts.length,
      concepts,
      knowledgeVersion: "v1.0",
      activePacks: ["AYURVEDA_CORE_PACK_V1", "HOMEOPATHY_CORE_PACK_V1"],
    });
  } catch (error) {
    return apiError(error);
  }
}
