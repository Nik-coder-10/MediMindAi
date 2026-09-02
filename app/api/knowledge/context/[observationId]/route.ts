import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { KnowledgeGraphService } from "@/lib/knowledge/knowledge-graph.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";

/**
 * GET /api/knowledge/context/[observationId]
 * Generates an explainable AYUSH knowledge graph context for a specific clinical observation.
 * Accessible to DOCTOR and ADMIN roles.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { observationId: string } }
) {
  try {
    await AuthService.requireRole(req, [Role.DOCTOR, Role.ADMIN]);

    const { observationId } = params;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code") || observationId;
    const name = searchParams.get("name") || code;

    const context = await KnowledgeGraphService.getExplainableKnowledgeContext(
      observationId,
      code,
      name
    );

    if (!context) {
      return apiSuccess(null);
    }

    return apiSuccess(context);
  } catch (error) {
    return apiError(error);
  }
}
