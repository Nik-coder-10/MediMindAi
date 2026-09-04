import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AdaptiveEngineService } from "@/lib/engine/adaptive-engine.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { SessionStatus, TriagePriority } from "@prisma/client";

import { AyurvedaAssessmentService } from "@/lib/services/ayurveda.service";

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
      try {
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
      } catch (profErr) {
        console.warn("Session start patientProfile resolution warning:", (profErr as any)?.message);
        patientProfile = {
          id: `pat-prof-${user.id}`,
          userId: user.id,
          firstName: "Patient",
          lastName: "User",
          dateOfBirth: new Date("1985-01-01"),
          gender: "MALE" as any,
          bloodGroup: "B_POSITIVE" as any,
        } as any;
      }
    }

    // 2. Resolve or create authoritative ClinicalSession
    let session: any = null;
    const effectivePatientId = patientProfile?.id || `pat-prof-${user.id}`;

    if (validated.sessionId) {
      try {
        session = await prisma.clinicalSession.findUnique({ where: { id: validated.sessionId } });
      } catch (lookupErr) {
        console.warn("ClinicalSession findUnique DB lookup warning:", (lookupErr as any)?.message);
      }
      if (!session) {
        const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
        session = inMemoryClinicalStore.getSession(validated.sessionId);
      }
    }

    if (!session) {
      const generatedSessionId = validated.sessionId || `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      try {
        session = await prisma.clinicalSession.create({
          data: {
            id: generatedSessionId,
            patientId: effectivePatientId,
            language: validated.language || "hi",
            triagePriority: TriagePriority.ROUTINE,
            status: SessionStatus.IN_PROGRESS,
          },
        });
      } catch (createErr) {
        console.warn("ClinicalSession create DB fallback to inMemory store:", (createErr as any)?.message);
        session = {
          id: generatedSessionId,
          patientId: effectivePatientId,
          doctorId: null,
          status: "IN_PROGRESS",
          triagePriority: "ROUTINE",
          language: validated.language || "hi",
          startedAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          redFlagTriggered: false,
        };
      }
    } else if (session.patientId && session.patientId !== effectivePatientId && session.patient?.userId !== user.id) {
      // SECURITY: Reject — this sessionId belongs to a different patient.
      // Never silently reassign ownership. Treat as 403 Forbidden (IDOR prevention).
      return new Response(JSON.stringify({ error: "Forbidden: session belongs to another patient" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Persist chief complaint in database (safely)
    try {
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
    } catch (ccErr) {
      console.warn("ChiefComplaint DB persist warning (non-fatal):", (ccErr as any)?.message);
    }

    // Mirror to inMemoryClinicalStore for resilient persistence across pages
    try {
      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      const existingStored = inMemoryClinicalStore.getSession(session.id);
      if (!existingStored) {
        inMemoryClinicalStore.upsertSession({
          id: session.id,
          patientId: effectivePatientId,
          doctorId: null,
          status: "IN_PROGRESS",
          triagePriority: "ROUTINE",
          language: validated.language || "hi",
          startedAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          redFlagTriggered: false,
          patient: {
            id: effectivePatientId,
            userId: user.id,
            firstName: (patientProfile as any)?.firstName || "Patient",
            lastName: (patientProfile as any)?.lastName || "",
            dateOfBirth: (patientProfile as any)?.dateOfBirth || new Date("1985-01-01"),
            gender: (patientProfile as any)?.gender || "MALE",
            bloodGroup: (patientProfile as any)?.bloodGroup || "B+",
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
    } catch (memErr) {
      console.warn("InMemoryClinicalStore mirror warning:", (memErr as any)?.message);
    }

    // 3. Classify and record patient-tailored Ayurvedic & Dashavidha assessment
    try {
      const ayurProfile = AyurvedaAssessmentService.classifyFromProblem(validated.chiefComplaint);
      await AyurvedaAssessmentService.recordAssessment({
        sessionId: session.id,
        prakriti: ayurProfile.prakriti,
        vikriti: ayurProfile.vikriti,
        agni: ayurProfile.agni,
        koshtha: ayurProfile.koshtha,
        sattva: ayurProfile.sattva,
        bala: ayurProfile.bala,
        notes: ayurProfile.nidanaPanchakaNotes,
        aharaVihara: {
          pathya: ayurProfile.pathya,
          apathya: ayurProfile.apathya,
          doshicDistribution: ayurProfile.doshicDistribution,
          prakritiLabelHi: ayurProfile.prakritiLabelHi,
          prakritiLabelEn: ayurProfile.prakritiLabelEn,
          vikritiLabelHi: ayurProfile.vikritiLabelHi,
          vikritiLabelEn: ayurProfile.vikritiLabelEn,
          agniLabelHi: ayurProfile.agniLabelHi,
          agniLabelEn: ayurProfile.agniLabelEn,
          koshthaLabelHi: ayurProfile.koshthaLabelHi,
          koshthaLabelEn: ayurProfile.koshthaLabelEn,
          sattvaLabelHi: ayurProfile.sattvaLabelHi,
          sattvaLabelEn: ayurProfile.sattvaLabelEn,
          balaLabelHi: ayurProfile.balaLabelHi,
          balaLabelEn: ayurProfile.balaLabelEn,
        },
      });

      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      inMemoryClinicalStore.updateAyurvedaAssessment(session.id, {
        id: `ayu-${session.id}`,
        sessionId: session.id,
        prakriti: ayurProfile.prakriti,
        vikriti: ayurProfile.vikriti,
        anala: ayurProfile.agni,
        sattva: ayurProfile.sattva,
        bala: ayurProfile.bala,
        ashtavidhaData: {
          koshtha: ayurProfile.koshtha,
          agni: ayurProfile.agni,
          sattva: ayurProfile.sattva,
          bala: ayurProfile.bala,
          doshicDistribution: ayurProfile.doshicDistribution,
          pathya: ayurProfile.pathya,
          apathya: ayurProfile.apathya,
          prakritiLabelHi: ayurProfile.prakritiLabelHi,
          prakritiLabelEn: ayurProfile.prakritiLabelEn,
          vikritiLabelHi: ayurProfile.vikritiLabelHi,
          vikritiLabelEn: ayurProfile.vikritiLabelEn,
          agniLabelHi: ayurProfile.agniLabelHi,
          agniLabelEn: ayurProfile.agniLabelEn,
          koshthaLabelHi: ayurProfile.koshthaLabelHi,
          koshthaLabelEn: ayurProfile.koshthaLabelEn,
          sattvaLabelHi: ayurProfile.sattvaLabelHi,
          sattvaLabelEn: ayurProfile.sattvaLabelEn,
          balaLabelHi: ayurProfile.balaLabelHi,
          balaLabelEn: ayurProfile.balaLabelEn,
          nidanaPanchakaNotes: ayurProfile.nidanaPanchakaNotes,
        },
      });
    } catch (ayurErr) {
      console.warn("Ayurveda assessment initial classification non-fatal warning:", (ayurErr as any)?.message);
    }

    // 4. Start engine with the authoritative session.id
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

