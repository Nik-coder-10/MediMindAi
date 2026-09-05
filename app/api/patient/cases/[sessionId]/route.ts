import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/auth/auth-guard";
import { AyurvedaAssessmentService } from "@/lib/services/ayurveda.service";

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
    let session: any = null;
    try {
      session = await prisma.clinicalSession.findUnique({
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
    } catch (dbErr) {
      console.warn("Patient individual case fetch DB fallback:", (dbErr as any)?.message);
    }

    if (!session) {
      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      session = inMemoryClinicalStore.getSession(sessionId);
    }

    if (!session) {
      throw AppError.notFound(`Case '${sessionId}' was not found.`);
    }

    // 3. Deterministic token calculation
    const { formatAyurToken } = await import("@/lib/utils");
    const tokenNumber = formatAyurToken(session.id);

    // 4. Transform documents with extracted entities
    const documents = (session.medicalDocuments || []).map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName,
      type: doc.type,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : new Date().toISOString(),
      ocrRawSnippet: doc.ocrRawText ? doc.ocrRawText.slice(0, 200) + "..." : null,
      medications: (doc.extractedEntities || [])
        .filter((e: any) => e.type === "MEDICATION")
        .map((m: any) => ({
          name: (m.structuredData as any)?.normalisedName || m.rawText,
          dosage: (m.structuredData as any)?.dosage || "",
          frequency: (m.structuredData as any)?.frequency || "",
          duration: (m.structuredData as any)?.duration || "",
        })),
      labs: (doc.extractedEntities || [])
        .filter((e: any) => e.type === "LAB")
        .map((l: any) => ({
          testName: (l.structuredData as any)?.testName || l.rawText,
          value: (l.structuredData as any)?.value || l.rawText,
          unit: (l.structuredData as any)?.unit || "",
          referenceRange: (l.structuredData as any)?.referenceRange || "",
          flag: (l.structuredData as any)?.flag || "NORMAL",
        })),
    }));

    // 5. Transform Q&A answers
    const answers = (session.patientAnswers || []).map((pa: any) => ({
      id: pa.id,
      nodeCode: pa.nodeCode,
      questionText: pa.questionNode?.questionText || pa.nodeCode,
      questionTextHindi: pa.questionNode?.questionTextHindi || null,
      clinicalDomain: pa.questionNode?.clinicalDomain || null,
      answerValue: pa.answerValue,
      answeredAt: pa.answeredAt ? new Date(pa.answeredAt).toISOString() : new Date().toISOString(),
    }));

    // 6. Transform Timeline
    const timeline = (session.patient?.timelineEvents || []).map((te: any) => ({
      id: te.id,
      eventDate: te.eventDate ? new Date(te.eventDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      title: te.title,
      description: te.description,
      category: te.category,
    }));

    // Extract intakeMode
    let intakeMode: "AYURVEDA" | "GENERAL" = "AYURVEDA";
    try {
      if (session.notes) {
        const parsed = JSON.parse(session.notes);
        if (parsed.intakeMode) intakeMode = parsed.intakeMode;
      }
    } catch {}

    // 7. Assemble patient dossier
    const caseDetails = {
      sessionId: session.id,
      tokenNumber,
      intakeMode,
      status: session.status,
      triagePriority: session.triagePriority,
      language: session.language,
      startedAt: session.startedAt ? new Date(session.startedAt).toISOString() : new Date().toISOString(),
      updatedAt: session.updatedAt ? new Date(session.updatedAt).toISOString() : new Date().toISOString(),
      completedAt: session.completedAt ? new Date(session.completedAt).toISOString() : null,

      patient: {
        name: session.patient ? `${session.patient.firstName} ${session.patient.lastName}` : "Patient",
        gender: session.patient?.gender || "UNKNOWN",
        bloodGroup: session.patient?.bloodGroup || "N/A",
        abhaId: session.patient?.user?.abhaId || "N/A",
      },

      chiefComplaints: (session.chiefComplaints || []).map((cc: any) => ({
        id: cc.id,
        symptomName: cc.symptomName,
        duration: cc.duration,
        severity: cc.severity,
        location: cc.location,
      })),

      answers,
      documents,
      timeline,

      redFlags: (session.redFlagEvents || []).map((rf: any) => ({
        ruleId: rf.ruleId,
        description: rf.description,
        severity: rf.severity,
        triggeredAt: rf.triggeredAt ? new Date(rf.triggeredAt).toISOString() : new Date().toISOString(),
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

      ayurvedaAssessment: (() => {
        const chiefText = session.chiefComplaints?.[0]?.symptomName || "";
        const ansList = (session.patientAnswers || []).map((a: any) => ({
          nodeCode: a.nodeCode,
          answerValue: a.answerValue,
        }));
        const dynamicAyur = AyurvedaAssessmentService.classifyFromProblem(chiefText, ansList, {});
        const ashtaData = (session.ayurvedaAssessment?.ashtavidhaData as any) || {};
        const aharaData = (session.ayurvedaAssessment?.aharaVihara as any) || {};

        return {
          prakriti: session.ayurvedaAssessment?.prakriti || dynamicAyur.prakriti,
          prakritiLabelHi: aharaData?.prakritiLabelHi || ashtaData?.prakritiLabelHi || dynamicAyur.prakritiLabelHi,
          prakritiLabelEn: aharaData?.prakritiLabelEn || ashtaData?.prakritiLabelEn || dynamicAyur.prakritiLabelEn,
          vikriti: session.ayurvedaAssessment?.vikriti || dynamicAyur.vikriti,
          vikritiLabelHi: aharaData?.vikritiLabelHi || ashtaData?.vikritiLabelHi || dynamicAyur.vikritiLabelHi,
          vikritiLabelEn: aharaData?.vikritiLabelEn || ashtaData?.vikritiLabelEn || dynamicAyur.vikritiLabelEn,
          agni: session.ayurvedaAssessment?.anala || dynamicAyur.agni,
          agniLabelHi: aharaData?.agniLabelHi || ashtaData?.agniLabelHi || dynamicAyur.agniLabelHi,
          agniLabelEn: aharaData?.agniLabelEn || ashtaData?.agniLabelEn || dynamicAyur.agniLabelEn,
          koshtha: ashtaData?.koshtha || dynamicAyur.koshtha,
          koshthaLabelHi: aharaData?.koshthaLabelHi || ashtaData?.koshthaLabelHi || dynamicAyur.koshthaLabelHi,
          koshthaLabelEn: aharaData?.koshthaLabelEn || ashtaData?.koshthaLabelEn || dynamicAyur.koshthaLabelEn,
          sattva: session.ayurvedaAssessment?.sattva || dynamicAyur.sattva,
          sattvaLabelHi: aharaData?.sattvaLabelHi || ashtaData?.sattvaLabelHi || dynamicAyur.sattvaLabelHi,
          sattvaLabelEn: aharaData?.sattvaLabelEn || ashtaData?.sattvaLabelEn || dynamicAyur.sattvaLabelEn,
          bala: session.ayurvedaAssessment?.bala || dynamicAyur.bala,
          balaLabelHi: aharaData?.balaLabelHi || ashtaData?.balaLabelHi || dynamicAyur.balaLabelHi,
          balaLabelEn: aharaData?.balaLabelEn || ashtaData?.balaLabelEn || dynamicAyur.balaLabelEn,
          pathya: aharaData?.pathya || ashtaData?.pathya || dynamicAyur.pathya,
          apathya: aharaData?.apathya || ashtaData?.apathya || dynamicAyur.apathya,
          doshicDistribution: aharaData?.doshicDistribution || ashtaData?.doshicDistribution || dynamicAyur.doshicDistribution,
          notes: session.ayurvedaAssessment?.notes || dynamicAyur.nidanaPanchakaNotes,
        };
      })(),
    };

    return apiSuccess(caseDetails);
  } catch (error) {
    return apiError(error);
  }
}
