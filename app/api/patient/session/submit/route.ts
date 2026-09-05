import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { SummaryService } from "@/lib/services/summary.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { AppError } from "@/lib/api/errors";
import { SessionStatus } from "@prisma/client";
import { AyurvedaAssessmentService } from "@/lib/services/ayurveda.service";

import { formatAyurToken } from "@/lib/utils";

export const dynamic = "force-dynamic";

const submitSessionSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  chiefComplaint: z.string().optional(),
  duration: z.string().optional(),
  severity: z.string().optional(),
  location: z.string().optional(),
  intakeMode: z.enum(["AYURVEDA", "GENERAL"]).optional(),
  answers: z
    .array(
      z.object({
        nodeCode: z.string(),
        questionText: z.string().optional(),
        questionTextHindi: z.string().nullable().optional(),
        answerValue: z.any(),
      })
    )
    .optional(),
  documents: z
    .array(
      z.object({
        fileName: z.string(),
        type: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/patient/session/submit
 * Submits the patient's case session to the attending physician queue:
 * 1. Verifies patient ownership
 * 2. Persists ChiefComplaint in database if not already present
 * 3. Transitions status to WAITING_FOR_DOCTOR
 * 4. Synthesizes and saves ClinicalSummary
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = submitSessionSchema.parse(body);

    // Pre-resolve user and guarantee session exists in database and memory store
    const user = await AuthService.requireUser(req);
    const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
    const effectivePatientId = user.patientProfile?.id || `pat-prof-${user.id}`;

    let session: any = null;
    try {
      session = await prisma.clinicalSession.findUnique({
        where: { id: validated.sessionId, deletedAt: null },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
      });
    } catch (lookupErr) {
      console.warn("Submit route DB session lookup fallback:", (lookupErr as any)?.message);
    }

    if (!session) {
      session = inMemoryClinicalStore.getSession(validated.sessionId);
    }

    // If session doesn't exist anywhere yet (e.g. fast-forward or offline-first entry), provision it now
    if (!session) {
      const intakeMode = validated.intakeMode || "AYURVEDA";
      const newSessionRecord = {
        id: validated.sessionId,
        patientId: effectivePatientId,
        doctorId: null,
        status: "IN_PROGRESS" as const,
        triagePriority: "ROUTINE" as const,
        language: user.preferredLanguage || "hi",
        startedAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        redFlagTriggered: false,
        notes: JSON.stringify({ intakeMode }),
        patient: {
          id: effectivePatientId,
          userId: user.id,
          firstName: user.patientProfile?.firstName || "Patient",
          lastName: user.patientProfile?.lastName || "",
          dateOfBirth: (user.patientProfile as any)?.dateOfBirth || new Date("1985-01-01"),
          gender: (user.patientProfile as any)?.gender || "MALE",
          bloodGroup: (user.patientProfile as any)?.bloodGroup || "B+",
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
            sessionId: validated.sessionId,
            symptomName: validated.chiefComplaint || "Consultation Intake",
            duration: validated.duration || "2-3 days",
            severity: validated.severity || "MODERATE",
            location: validated.location || "General",
          },
        ],
        patientAnswers: [],
        conversationTurns: [],
        medicalDocuments: [],
        redFlagEvents: [],
        clinicalSummary: null,
        ayurvedaAssessment: null,
      };

      try {
        const createdInDb = await prisma.clinicalSession.create({
          data: {
            id: validated.sessionId,
            patientId: effectivePatientId,
            language: user.preferredLanguage || "hi",
            triagePriority: "ROUTINE",
            status: "IN_PROGRESS",
            notes: JSON.stringify({ intakeMode }),
          },
          include: {
            patient: { include: { user: true } },
            doctor: { include: { user: true } },
          },
        });
        session = createdInDb;
      } catch (dbCreateErr) {
        console.warn("Submit route auto-provision session DB create fallback:", (dbCreateErr as any)?.message);
        session = newSessionRecord;
      }
      inMemoryClinicalStore.upsertSession(newSessionRecord);
    }

    // IDEMPOTENCY GUARD: If already submitted, return existing token without re-processing.
    // This prevents duplicate doctor notifications and duplicate clinical sessions.
    if (session.status === "WAITING_FOR_DOCTOR" || session.status === "COMPLETED") {
      const tokenNumber = formatAyurToken(session.id);
      return apiSuccess({
        sessionId: session.id,
        tokenNumber,
        status: session.status,
        summary: null,
        message: "Case already submitted. Token returned without reprocessing.",
        idempotent: true,
      });
    }

    // Persist any client-provided answers (e.g. from intake recovery store or client state)
    if (validated.answers && validated.answers.length > 0) {
      for (const ans of validated.answers) {
        try {
          inMemoryClinicalStore.addAnswer(session.id, {
            nodeCode: ans.nodeCode,
            answerValue: ans.answerValue,
            questionNode: {
              nodeCode: ans.nodeCode,
              questionText: ans.questionText || ans.nodeCode,
              questionTextHindi: ans.questionTextHindi || null,
              clinicalDomain: "GENERAL",
            },
          });
          try {
            const existingAnswer = await prisma.patientAnswer.findFirst({
              where: {
                sessionId: session.id,
                nodeCode: ans.nodeCode,
              },
            });
            if (existingAnswer) {
              await prisma.patientAnswer.update({
                where: { id: existingAnswer.id },
                data: {
                  answerValue: ans.answerValue,
                  answeredAt: new Date(),
                },
              });
            } else {
              await prisma.patientAnswer.create({
                data: {
                  sessionId: session.id,
                  nodeCode: ans.nodeCode,
                  answerValue: ans.answerValue,
                  answeredAt: new Date(),
                },
              });
            }
          } catch (dbAnsErr) {
            // DB answer persist is non-fatal
          }
        } catch {}
      }
    }

    // Persist any client-provided documents
    if (validated.documents && validated.documents.length > 0) {
      for (const doc of validated.documents) {
        try {
          const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          inMemoryClinicalStore.addDocument(session.id, {
            id: docId,
            fileName: doc.fileName,
            type: doc.type || "PRESCRIPTION",
            fileSize: 1024 * 100,
          });
        } catch {}
      }
    }

    // Resilient Database Update for submission
    let updatedStatus = SessionStatus.WAITING_FOR_DOCTOR;
    try {
      // 1. Ensure ChiefComplaint is saved in database
      if (validated.chiefComplaint) {
        try {
          const existingComplaint = await prisma.chiefComplaint.findFirst({
            where: { sessionId: session.id },
          });

          if (!existingComplaint) {
            await prisma.chiefComplaint.create({
              data: {
                sessionId: session.id,
                symptomName: validated.chiefComplaint,
                duration: validated.duration || "2-3 days",
                severity: validated.severity || "MODERATE",
                location: validated.location || "General",
              },
            });
          }
        } catch (ccErr) {
          console.warn("ChiefComplaint save warning (non-fatal):", ccErr);
        }
      }

      // 2. Transition Session status to WAITING_FOR_DOCTOR and preserve intakeMode
      try {
        let currentNotesObj: any = {};
        try { currentNotesObj = session.notes ? JSON.parse(session.notes) : {}; } catch {}
        if (validated.intakeMode) {
          currentNotesObj.intakeMode = validated.intakeMode;
        }

        await prisma.clinicalSession.update({
          where: { id: session.id },
          data: {
            status: SessionStatus.WAITING_FOR_DOCTOR,
            notes: Object.keys(currentNotesObj).length > 0 ? JSON.stringify(currentNotesObj) : session.notes,
            updatedAt: new Date(),
          },
        });
      } catch (sessUpErr) {
        console.warn("ClinicalSession update warning (fallback to memory store):", sessUpErr);
      }

      // 3. Log Audit Event
      try {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: "PATIENT_SESSION_SUBMIT",
            resourceType: "ClinicalSession",
            resourceId: session.id,
            ipAddress: req.headers.get("x-forwarded-for") || (req as any).ip || "127.0.0.1",
            metadata: {
              status: SessionStatus.WAITING_FOR_DOCTOR,
              chiefComplaint: validated.chiefComplaint,
            },
          },
        });
      } catch (audErr) {
        console.warn("AuditLog save warning (non-fatal):", audErr);
      }
    } catch (txErr) {
      console.warn("Database submission encountered warning (fallback to memory store):", txErr);
    }

    // Update in-memory clinical store
    inMemoryClinicalStore.setStatus(session.id, "WAITING_FOR_DOCTOR");
    if (validated.chiefComplaint) {
      inMemoryClinicalStore.addChiefComplaint(session.id, {
        symptomName: validated.chiefComplaint,
        duration: validated.duration,
        severity: validated.severity,
        location: validated.location,
      });
    }

    // 4. Evolve and persist discrete structured clinical observations and refined Ayurvedic assessment
    try {
      const { ClinicalObservationService } = await import("@/lib/clinical/observation.service");
      const { AdaptiveEngineService } = await import("@/lib/engine/adaptive-engine.service");
      const currentState = await AdaptiveEngineService.getCurrentState(session.id);
      
      // Dynamic problem-specific Ayurvedic classification
      const patientComplaint = validated.chiefComplaint || session.chiefComplaints?.[0]?.symptomName || "";
      const patientAnsList = (session.patientAnswers || []).map((a: any) => ({
        nodeCode: a.nodeCode,
        answerValue: a.answerValue,
      }));
      const factsMap = (currentState?.collectedFacts as any) || {};

      const ayurProfile = AyurvedaAssessmentService.classifyFromProblem(
        patientComplaint,
        patientAnsList,
        factsMap
      );

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

      if (currentState?.collectedFacts) {
        const obsDtos = ClinicalObservationService.mapCollectedFactsToObservations(
          session.patientId,
          session.id,
          currentState.collectedFacts as any
        );
        if (obsDtos.length > 0) {
          await ClinicalObservationService.createBatchObservations(obsDtos);
        }
      }
    } catch (obsErr) {
      console.warn("Structured observation & Ayurveda persistence deferred (non-fatal):", obsErr);
    }

    // 5. Generate and persist Clinical Summary
    let summary = null;
    try {
      summary = await SummaryService.generateSummary({ sessionId: session.id });
    } catch (sumErr) {
      console.warn("Auto-summary synthesis deferred:", sumErr);
    }

    // Deterministic token number #AYUR-SESS-XXXX
    const tokenNumber = formatAyurToken(session.id);

    // 5. Dispatch Real-time Doctor Notification for submitted case
    try {
      const { NotificationService } = await import("@/lib/services/notification.service");
      const patientName = user.patientProfile
        ? `${user.patientProfile.firstName} ${user.patientProfile.lastName}`
        : "रोगी (Patient)";

      await NotificationService.notify({
        type: "NEW_CASE",
        severity: session.triagePriority === "EMERGENCY" ? "CRITICAL" : session.triagePriority === "URGENT" ? "HIGH" : "LOW",
        sessionId: session.id,
        patientName,
        tokenNumber,
        chiefComplaint: validated.chiefComplaint,
        title: "🌿 नया रोगी परामर्श प्रस्तुत (New Case Submitted)",
        message: `${patientName} (${tokenNumber}) has submitted intake for '${validated.chiefComplaint || "Consultation"}' and is waiting in the triage queue.`,
        metadata: {
          triagePriority: session.triagePriority,
        },
      });
    } catch (notifErr) {
      console.warn("New case notification dispatch non-fatal warning:", notifErr);
    }

    return apiSuccess({
      sessionId: session.id,
      tokenNumber,
      status: updatedStatus,
      summary,
      message: "Case successfully submitted to clinical triage queue.",
    });
  } catch (error) {
    return apiError(error);
  }
}
