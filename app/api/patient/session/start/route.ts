import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AdaptiveEngineService } from "@/lib/engine/adaptive-engine.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { SessionStatus, TriagePriority } from "@prisma/client";

export const dynamic = "force-dynamic";

const startEngineSchema = z.object({
  sessionId: z.string().optional(),
  chiefComplaint: z.string().min(1, "chiefComplaint is required"),
  language: z.enum(["hi", "en", "mr"]).default("hi").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireUser(req);
    const body = await req.json();
    const validated = startEngineSchema.parse(body);

    // 1. Resolve or create PatientProfile for the authenticated user
    let patientProfile = user.patientProfile;
    if (!patientProfile) {
      patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: user.id },
      });
      if (!patientProfile) {
        patientProfile = await prisma.patientProfile.create({
          data: {
            userId: user.id,
            firstName: "Patient",
            lastName: user.id.slice(0, 4).toUpperCase(),
            dateOfBirth: new Date("1995-01-01"),
            gender: "OTHER",
            bloodGroup: "UNKNOWN",
          },
        });
      }
    }

    // 2. Resolve or create authoritative ClinicalSession in PostgreSQL
    let session = validated.sessionId
      ? await prisma.clinicalSession.findUnique({ where: { id: validated.sessionId } })
      : null;

    if (!session) {
      session = await prisma.clinicalSession.create({
        data: {
          patientId: patientProfile.id,
          language: validated.language || "hi",
          triagePriority: TriagePriority.ROUTINE,
          status: SessionStatus.IN_PROGRESS,
        },
      });
    } else if (session.patientId !== patientProfile.id) {
      // Ensure session is linked to authenticated patient
      session = await prisma.clinicalSession.update({
        where: { id: session.id },
        data: { patientId: patientProfile.id },
      });
    }

    // 3. Start engine with the authoritative session.id
    const result = await AdaptiveEngineService.startSession(
      session.id,
      validated.chiefComplaint,
      (validated.language as any) || "hi"
    );

    return apiSuccess({
      ...result,
      sessionId: session.id,
    }, 200);
  } catch (error) {
    return apiError(error);
  }
}

