import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AdaptiveEngineService } from "@/lib/engine/adaptive-engine.service";
import { defaultQuestionProvider } from "@/lib/engine/question-provider";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return apiSuccess({ state: null, question: null });
    }

    const state = await AdaptiveEngineService.getCurrentState(sessionId);
    if (!state || !state.currentNodeCode) {
      return apiSuccess({ state: null, question: null });
    }

    const question = await defaultQuestionProvider.getNodeByCode(state.currentNodeCode);
    return apiSuccess({ state, question });
  } catch (error) {
    return apiError(error);
  }
}
