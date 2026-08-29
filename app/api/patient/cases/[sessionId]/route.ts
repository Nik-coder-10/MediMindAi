import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/patient/cases/[sessionId]
 * Retrieves comprehensive case details for an authenticated patient's own session.
 * Strict IDOR protection via AuthService.requireSessionAccess.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    if (!sessionId) {
      throw AppError.badRequest("sessionId is required");
    }

    // 1. Strict ownership authorization check (returns 401/403 if user does not own session)
    const { session: authSession } = await AuthService.requireSessionAccess(req, sessionId);

    // 2. Fetch full clinical relation graph
    const session = await prisma.clinicalSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: {
          include: {
            user: true,
            timelineEvents: { orderBy: { eventDate: "desc" }, take: 10 },
          },
        },
        chiefComplaints: true,
        patientAnswers: {
          orderBy: { answeredAt: "asc" },
          include: { questionNode: true },
        },
        conversationTurns: {
          orderBy: { timestamp: "asc" },
        },
        medicalDocuments: {
          where: { deletedAt: null },
          include: { extractedEntities: true },
        },
        redFlagEvents: {
          orderBy: { triggeredAt: "desc" },
        },
        clinicalSummary: true,
        ayurvedaAssessment: true,
        doctor: {
          include: { user: true },
        },
      },
    });

    if (!session) {
      throw AppError.notFound(`Case '${sessionId}' was not found.`);
    }

    // 3. Deterministic token calculation
    const shortToken = session.id.replace(/-/g, "").slice(0, 4).toUpperCase();
    const tokenNumber = `#AYUR-${shortToken}`;

    // 4. Transform documents with extracted entities
    const documents = session.medicalDocuments.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      type: doc.type,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt.toISOString(),
      ocrRawSnippet: doc.ocrRawText ? doc.ocrRawText.slice(0, 200) + "..." : null,
      medications: doc.extractedEntities
        .filter((e) => e.type === "MEDICATION")
        .map((m) => ({
          name: (m.structuredData as any)?.normalisedName || m.rawText,
          dosage: (m.structuredData as any)?.dosage || "",
          frequency: (m.structuredData as any)?.frequency || "",
          duration: (m.structuredData as any)?.duration || "",
        })),
      labs: doc.extractedEntities
        .filter((e) => e.type === "LAB")
        .map((l) => ({
          testName: (l.structuredData as any)?.testName || l.rawText,
          value: (l.structuredData as any)?.value || l.rawText,
          unit: (l.structuredData as any)?.unit || "",
          referenceRange: (l.structuredData as any)?.referenceRange || "",
          flag: (l.structuredData as any)?.flag || "NORMAL",
        })),
    }));

    // 5. Transform Q&A answers
    const answers = session.patientAnswers.map((pa) => ({
      id: pa.id,
      nodeCode: pa.nodeCode,
      questionText: pa.questionNode?.questionText || pa.nodeCode,
      questionTextHindi: pa.questionNode?.questionTextHindi || null,
      clinicalDomain: pa.questionNode?.clinicalDomain || null,
      answerValue: pa.answerValue,
      answeredAt: pa.answeredAt.toISOString(),
    }));

    // 6. Transform Timeline
    const timeline = (session.patient?.timelineEvents || []).map((te) => ({
      id: te.id,
      eventDate: te.eventDate.toISOString().split("T")[0],
      title: te.title,
      description: te.description,
      category: te.category,
    }));

    // 7. Assemble patient dossier
    const caseDetails = {
      sessionId: session.id,
      tokenNumber,
      status: session.status,
      triagePriority: session.triagePriority,
      language: session.language,
      startedAt: session.startedAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      completedAt: session.completedAt ? session.completedAt.toISOString() : null,

      patient: {
        name: session.patient ? `${session.patient.firstName} ${session.patient.lastName}` : "Patient",
        gender: session.patient?.gender || "UNKNOWN",
        bloodGroup: session.patient?.bloodGroup || "N/A",
        abhaId: session.patient?.user?.abhaId || "N/A",
      },

      chiefComplaints: session.chiefComplaints.map((cc) => ({
        id: cc.id,
        symptomName: cc.symptomName,
        duration: cc.duration,
        severity: cc.severity,
        location: cc.location,
      })),

      answers,
      documents,
      timeline,

      redFlags: session.redFlagEvents.map((rf) => ({
        ruleId: rf.ruleId,
        description: rf.description,
        severity: rf.severity,
        triggeredAt: rf.triggeredAt.toISOString(),
      })),

      summary: session.clinicalSummary
        ? {
            id: session.clinicalSummary.id,
            status: session.clinicalSummary.status,
            markdown:
              session.clinicalSummary.doctorEditedMarkdown ||
              session.clinicalSummary.aiGeneratedMarkdown,
            isDoctorReviewed: session.clinicalSummary.status === "ACCEPTED" || session.clinicalSummary.status === "REVISED",
            updatedAt: session.clinicalSummary.updatedAt.toISOString(),
          }
        : null,

      doctor: session.doctor
        ? {
            name: `Dr. Vaidya (${session.doctor.specialization || "Clinical Officer"})`,
            regNumber: session.doctor.registrationNumber,
            specialization: session.doctor.specialization,
            hospital: session.doctor.hospitalAffiliation || "All India Institute of Ayurveda (AIIA)",
          }
        : null,

      ayurvedaAssessment: session.ayurvedaAssessment
        ? {
            prakriti: session.ayurvedaAssessment.prakriti,
            vikriti: session.ayurvedaAssessment.vikriti,
            agni: session.ayurvedaAssessment.anala,
            sattva: session.ayurvedaAssessment.sattva,
            bala: session.ayurvedaAssessment.bala,
          }
        : null,
    };

    return apiSuccess(caseDetails);
  } catch (error) {
    return apiError(error);
  }
}
