import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AuthService } from "@/lib/auth/auth-guard";
import { AppError } from "@/lib/api/errors";
import { UncertaintyDrivenQuestionEngine } from "@/lib/clinical/uncertainty-engine.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    if (!sessionId) {
      throw AppError.badRequest("sessionId is required");
    }

    // 1. Authorize patient or attending doctor
    await AuthService.requireSessionAccess(req, sessionId);

    // 2. Parse optional query options
    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get("mode") as any) || "AYURVEDA";
    const language = (searchParams.get("lang") as any) || "hi";

    // 3. Run Uncertainty & Completeness Engine
    const evaluation = await UncertaintyDrivenQuestionEngine.evaluateSession({
      sessionId,
      mode,
      language,
    });

    return apiSuccess({
      sessionId: evaluation.sessionId,
      mode: evaluation.mode,
      overallCompleteness: evaluation.completeness.overall,
      categoryCompleteness: evaluation.completeness.categoryCompleteness,
      missingImportantFacets: evaluation.gaps.map((g) => ({
        dimension: g.dimension,
        facet: g.facet,
        description: g.description,
        importance: g.importance,
        safetyRelevance: g.safetyRelevance,
        blocking: g.blocking,
        reason: g.reason,
      })),
      blockingGapsCount: evaluation.completeness.blockingGaps.length,
      stopCondition: evaluation.stopCondition,
      stopReasonExplanation: evaluation.stopReasonExplanation,
      recommendedNextQuestion: evaluation.recommendedQuestion,
      evaluatedAt: evaluation.evaluatedAt,
      fingerprint: evaluation.fingerprint,
      clinicalNotice: "Case information completeness, not diagnostic certainty. AyurSetu AI Decision Support.",
    });
  } catch (error) {
    return apiError(error);
  }
}
