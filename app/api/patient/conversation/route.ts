import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ConversationService } from "@/lib/services/conversation.service";

const recordTurnSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  role: z.enum(["PATIENT", "AI", "DOCTOR", "SYSTEM"]),
  contentText: z.string().min(1, "contentText cannot be empty"),
  contentAudioUrl: z.string().url().optional().or(z.literal("")),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = recordTurnSchema.parse(body);
    const turn = await ConversationService.recordTurn(validated as any);
    return apiSuccess(turn, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return apiSuccess({ message: "Provide ?sessionId=<id> to fetch transcript" });
    }
    const turns = await ConversationService.getHistory(sessionId);
    return apiSuccess({ sessionId, turns });
  } catch (error) {
    return apiError(error);
  }
}
