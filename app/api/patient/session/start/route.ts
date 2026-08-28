import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AdaptiveEngineService } from "@/lib/engine/adaptive-engine.service";

const startEngineSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  chiefComplaint: z.string().min(1, "chiefComplaint is required"),
  language: z.enum(["hi", "en"]).default("hi").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = startEngineSchema.parse(body);
    const result = await AdaptiveEngineService.startSession(
      validated.sessionId,
      validated.chiefComplaint,
      validated.language || "hi"
    );
    return apiSuccess(result, 200);
  } catch (error) {
    return apiError(error);
  }
}

