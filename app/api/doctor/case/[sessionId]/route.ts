import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { SummaryService } from "@/lib/services/summary.service";
import { MedicalTimelineService } from "@/lib/services/timeline.service";
import { AyurvedaAssessmentService } from "@/lib/services/ayurveda.service";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    await AuthService.requireSessionAccess(req, sessionId);

    // 1. Fetch Session with full relational graph

    const session = await prisma.clinicalSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: {
          include: {
            user: true,
            timelineEvents: { orderBy: { eventDate: "desc" }, take: 10 },
            abhaLink: true,
            consentRecords: { where: { revokedAt: null }, orderBy: { grantedAt: "desc" }, take: 1 },
          },
        },
        chiefComplaints: true,
        redFlagEvents: { orderBy: { triggeredAt: "desc" } },
        medicalDocuments: {
          where: { deletedAt: null },
          include: { extractedEntities: true },
        },
        clinicalSummary: true,
        ayurvedaAssessment: true,
      },
    });

    if (!session) {
      return apiError(AppError.notFound(`Clinical case session '${sessionId}' was not found.`));
    }

    // 2. Fetch or Generate Summary
    let summary = session.clinicalSummary;
    if (!summary) {
      summary = (await SummaryService.generateSummary({ sessionId })) as any;
    }

    // 3. Format timeline and extracted labs from real document records
    const timeline = session.patient?.timelineEvents?.map((e: any) => ({
      id: e.id,
      patientId: e.patientId,
      eventDate: e.eventDate.toISOString().split("T")[0],
      title: e.title,
      description: e.description || "",
      category: e.category,
      sourceDocumentId: e.sourceDocumentId,
      metadata: e.metadata,
    })) || [];

    const extractedLabs: any[] = [];
    session.medicalDocuments.forEach((doc: any) => {
      doc.extractedEntities.forEach((ent: any) => {
        if (ent.type === "LAB") {
          extractedLabs.push({
            testName: ent.structuredData?.testName || ent.rawText,
            value: ent.structuredData?.value || ent.rawText,
          });
        }
      });
    });
    const abnormalLabs = MedicalTimelineService.evaluateAbnormalLabs(extractedLabs);

    // 4. Assemble genuine case data
    const caseData = {
      sessionId,
      patient: session.patient ? {
        id: session.patient.id,
        firstName: session.patient.firstName,
        lastName: session.patient.lastName,
        age: Math.floor((Date.now() - new Date(session.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
        gender: session.patient.gender,
        bloodGroup: session.patient.bloodGroup,
        abhaId: session.patient.user?.abhaId || session.patient.abhaLink?.abhaNumber || "N/A",
        phone: session.patient.user?.phone || "N/A",
        preferredLanguage: session.patient.user?.preferredLanguage || session.language || "hi",
      } : null,
      encounter: {
        triagePriority: session.triagePriority,
        redFlagTriggered: session.redFlagTriggered,
        startedAt: session.startedAt.toISOString(),
        chiefComplaint: session.chiefComplaints?.[0]?.symptomName || "Consultation Intake",
        status: session.status,
      },
      redFlags: session.redFlagEvents.map((rf: any) => ({
        ruleId: rf.ruleId,
        description: rf.description,
        severity: rf.severity,
        triggeredAt: rf.triggeredAt.toISOString(),
      })),
      summary,
      timeline,
      abnormalLabs,
      ayurveda: session.ayurvedaAssessment ? {
        prakriti: session.ayurvedaAssessment.prakriti,
        vikriti: session.ayurvedaAssessment.vikriti,
        agni: session.ayurvedaAssessment.anala,
        koshtha: (session.ayurvedaAssessment.ashtavidhaData as any)?.koshtha,
        sattva: session.ayurvedaAssessment.sattva,
        bala: session.ayurvedaAssessment.bala,
      } : null,
      documents: session.medicalDocuments.map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName,
        type: doc.type,
        uploadedAt: doc.uploadedAt.toISOString(),
        medications: doc.extractedEntities.filter((e: any) => e.type === "MEDICATION").map((m: any) => ({
          name: m.structuredData?.normalisedName || m.rawText,
          frequency: m.structuredData?.frequency || "",
          duration: m.structuredData?.duration || "",
        })),
      })),
      consent: session.patient?.consentRecords?.[0] ? {
        status: "ACTIVE",
        grantedAt: session.patient.consentRecords[0].grantedAt.toISOString(),
        purpose: session.patient.consentRecords[0].purpose,
        ipAddress: session.patient.consentRecords[0].ipAddress,
      } : null,
    };

    return apiSuccess(caseData);
  } catch (error) {
    console.error(`Doctor case fetch error for sessionId '${params.sessionId}':`, error);
    return apiError(error);
  }
}

