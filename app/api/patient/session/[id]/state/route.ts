import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AdaptiveEngineService } from "@/lib/engine/adaptive-engine.service";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    await AuthService.requireSessionAccess(req, sessionId);

    const state = await AdaptiveEngineService.getCurrentState(sessionId);
    return apiSuccess(state || { sessionId, status: "NOT_FOUND" });
  } catch (error) {
    return apiError(error);
  }
}

