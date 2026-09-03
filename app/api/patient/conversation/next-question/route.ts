import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AdaptiveEngineService } from "@/lib/engine/adaptive-engine.service";
import { defaultQuestionProvider } from "@/lib/engine/question-provider";
import { AuthService } from "@/lib/auth/auth-guard";
import { AppError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      throw AppError.badRequest("Provide ?sessionId=<id>");
    }

    await AuthService.requireSessionAccess(req, sessionId);

    const state = await AdaptiveEngineService.getCurrentState(sessionId);
    if (!state || !state.currentNodeCode) {
      return apiSuccess({ state, nextQuestion: null });
    }

    const nextQuestion = await defaultQuestionProvider.getNodeByCode(state.currentNodeCode);

    // Phase 6: Uncertainty & Case Completeness Context
    let uncertaintyContext: any = null;
    try {
      const { UncertaintyDrivenQuestionEngine } = await import("@/lib/clinical/uncertainty-engine.service");
      const evalResult = await UncertaintyDrivenQuestionEngine.evaluateSession({ sessionId });
      uncertaintyContext = {
        overallCompleteness: evalResult.completeness.overall,
        stopCondition: evalResult.stopCondition,
        missingImportantCount: evalResult.gaps.length,
        blockingGapsCount: evalResult.completeness.blockingGaps.length,
        recommendedNextQuestionId: evalResult.recommendedQuestion?.questionId || null,
        rationale: evalResult.recommendedQuestion?.rationale || null,
      };
    } catch {}

    return apiSuccess({ state, nextQuestion, uncertaintyContext });
  } catch (error) {
    return apiError(error);
  }
}

