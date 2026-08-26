import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AdaptiveEngineService } from "@/lib/engine/adaptive-engine.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const state = await AdaptiveEngineService.getCurrentState(sessionId);
    return apiSuccess(state || { sessionId, status: "NOT_FOUND" });
  } catch (error) {
    return apiError(error);
  }
}
