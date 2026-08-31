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
  intakeMode: z.enum(["AYURVEDA", "GENERAL"]).default("AYURVEDA").optional(),
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
    let session: any = null;
    if (validated.sessionId) {
      session = await prisma.clinicalSession.findUnique({ where: { id: validated.sessionId } });
    }

    if (!session) {
      session = await prisma.clinicalSession.create({
        data: {
          patientId: patientProfile!.id,
          language: validated.language || "hi",
          triagePriority: TriagePriority.ROUTINE,
          status: SessionStatus.IN_PROGRESS,
        },
      });
    } else if (session.patientId !== patientProfile!.id) {
      session = await prisma.clinicalSession.update({
        where: { id: session.id },
        data: { patientId: patientProfile!.id },
      });
    }

    // Persist chief complaint in database
    const existingComplaint = await prisma.chiefComplaint.findFirst({
      where: { sessionId: session.id },
    });
    if (!existingComplaint) {
      await prisma.chiefComplaint.create({
        data: {
          sessionId: session.id,
          symptomName: validated.chiefComplaint,
          duration: "2-3 days",
          severity: "MODERATE",
          location: "General",
        },
      });
    }

    // Mirror to inMemoryClinicalStore for resilient persistence across pages
    const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
    const existingStored = inMemoryClinicalStore.getSession(session.id);
    if (!existingStored) {
      inMemoryClinicalStore.upsertSession({
        id: session.id,
        patientId: patientProfile!.id,
        doctorId: null,
        status: "IN_PROGRESS",
        triagePriority: "ROUTINE",
        language: validated.language || "hi",
        startedAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        redFlagTriggered: false,
        patient: {
          id: patientProfile!.id,
          userId: user.id,
          firstName: (patientProfile as any)!.firstName || "Patient",
          lastName: (patientProfile as any)!.lastName || "",
          dateOfBirth: (patientProfile as any)!.dateOfBirth || new Date("1985-01-01"),
          gender: (patientProfile as any)!.gender || "MALE",
          bloodGroup: (patientProfile as any)!.bloodGroup || "B+",
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            preferredLanguage: user.preferredLanguage,
          },
          timelineEvents: [],
          consentRecords: [],
        },
        doctor: null,
        chiefComplaints: [
          {
            id: `cc-${Date.now()}`,
            sessionId: session.id,
            symptomName: validated.chiefComplaint,
            duration: "2-3 days",
            severity: "MODERATE",
            location: "General",
          }
        ],
        patientAnswers: [],
        conversationTurns: [
          {
            id: `ct-${Date.now()}`,
            sessionId: session.id,
            role: "PATIENT",
            contentText: validated.chiefComplaint,
            timestamp: new Date(),
          }
        ],
        medicalDocuments: [],
        redFlagEvents: [],
        clinicalSummary: null,
        ayurvedaAssessment: null,
      });
    } else {
      inMemoryClinicalStore.addChiefComplaint(session.id, {
        symptomName: validated.chiefComplaint,
      });
    }

    // 3. Start engine with the authoritative session.id
    const result = await AdaptiveEngineService.startSession(
      session.id,
      validated.chiefComplaint,
      (validated.language as any) || "hi",
      (validated.intakeMode as any) || "AYURVEDA"
    );

    return apiSuccess({
      ...result,
      sessionId: session.id,
    }, 200);
  } catch (error) {
    return apiError(error);
  }
}

