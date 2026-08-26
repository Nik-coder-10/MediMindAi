import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AdaptiveEngineService } from "@/lib/engine/adaptive-engine.service";

const answerSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  nodeCode: z.string().min(1, "nodeCode is required"),
  answerValue: z.unknown(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = answerSchema.parse(body);
    const result = await AdaptiveEngineService.processAnswer(
      validated.sessionId,
      validated.nodeCode,
      validated.answerValue
    );
    return apiSuccess(result, 200);
  } catch (error) {
    return apiError(error);
  }
}
