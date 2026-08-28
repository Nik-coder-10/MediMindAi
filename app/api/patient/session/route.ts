import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { SessionService } from "@/lib/services/session.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";
import { AppError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const createSessionSchema = z.object({
  patientId: z.string().optional(),
  language: z.enum(["hi", "en", "mr"]).default("hi"),
  triagePriority: z.enum(["ROUTINE", "URGENT", "EMERGENCY"]).default("ROUTINE"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireUser(req);
    const body = await req.json();
    const validatedData = createSessionSchema.parse(body);

    let effectivePatientId = user.patientProfile?.id;
    if (user.role === Role.DOCTOR || user.role === Role.ADMIN) {
      effectivePatientId = validatedData.patientId || user.patientProfile?.id;
    }

    if (!effectivePatientId) {
      throw AppError.badRequest("A valid Patient Profile is required to initiate a clinical case session.");
    }

    const session = await SessionService.createSession({
      patientId: effectivePatientId,
      language: validatedData.language,
      triagePriority: validatedData.triagePriority,
      notes: validatedData.notes,
      actorId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1",
    });

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
      throw AppError.badRequest("Provide ?sessionId=<id> parameter.");
    }

    await AuthService.requireSessionAccess(req, sessionId);
    const session = await SessionService.getSessionById(sessionId);
    return apiSuccess(session);
  } catch (error) {
    return apiError(error);
  }
}

