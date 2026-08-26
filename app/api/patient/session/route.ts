import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { SessionService } from "@/lib/services/session.service";

const createSessionSchema = z.object({
  patientId: z.string().min(1, "patientId is required"),
  language: z.enum(["hi", "en", "mr"]).default("hi"),
  triagePriority: z.enum(["ROUTINE", "URGENT", "EMERGENCY"]).default("ROUTINE"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createSessionSchema.parse(body);
    const session = await SessionService.createSession(validatedData);
    return apiSuccess(session, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return apiSuccess({ message: "Provide ?sessionId=<id> to query session" });
    }
    const session = await SessionService.getSessionById(sessionId);
    return apiSuccess(session);
  } catch (error) {
    return apiError(error);
  }
}
