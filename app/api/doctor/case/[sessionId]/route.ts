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
    let session: any = null;
    try {
      session = await prisma.clinicalSession.findUnique({
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
          patientAnswers: {
            orderBy: { answeredAt: "asc" },
            include: { questionNode: true },
          },
          conversationTurns: {
            orderBy: { timestamp: "asc" },
          },
          redFlagEvents: { orderBy: { triggeredAt: "desc" } },
          medicalDocuments: {
            where: { deletedAt: null },
            include: { extractedEntities: true },
          },
          clinicalSummary: true,
          ayurvedaAssessment: true,
        },
      });
    } catch (dbErr) {
      console.warn("Doctor individual case fetch DB fallback:", (dbErr as any)?.message);
    }

    if (!session) {
      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      session = inMemoryClinicalStore.getSession(sessionId);
    }

    if (!session) {
      return apiError(AppError.notFound(`Clinical case session '${sessionId}' was not found.`));
    }

    // Deterministic token matching patient portal
    const shortToken = session.id.replace(/-/g, "").slice(0, 4).toUpperCase();
    const tokenNumber = `#AYUR-${shortToken}`;

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

    // 3b. Evaluate Drug Interactions and Allergies
    const { DrugSafetyService } = await import("@/lib/clinical/drug-safety.service");
    const rawMedNames: string[] = [];
    const allergies: string[] = [];
    session.medicalDocuments.forEach((doc: any) => {
      doc.extractedEntities.forEach((ent: any) => {
        if (ent.type === "MEDICATION") {
          rawMedNames.push(ent.structuredData?.normalisedName || ent.rawText);
        }
        if (ent.type === "ALLERGY") {
          allergies.push(ent.rawText);
        }
      });
    });
    if (session.patient?.medicalHistory && (session.patient.medicalHistory as any).allergies) {
      const histAllergies = (session.patient.medicalHistory as any).allergies;
      if (Array.isArray(histAllergies)) allergies.push(...histAllergies);
      else if (typeof histAllergies === "string") allergies.push(histAllergies);
    }
    const drugSafetyAlerts = DrugSafetyService.evaluateSafety({
      medications: rawMedNames,
      allergies,
    });

    // 3c. Synthesize Longitudinal Comparison & Trajectories
    let longitudinalComparison = null;
    let symptomTrajectories: any[] = [];
    try {
      const { LongitudinalIntelligenceService } = await import("@/lib/clinical/longitudinal.service");
      longitudinalComparison = await LongitudinalIntelligenceService.compareConsultations(sessionId);
      if (session.patient?.id) {
        symptomTrajectories = await LongitudinalIntelligenceService.buildPatientTrajectories(session.patient.id);
      }
    } catch (longErr) {
      console.warn("Longitudinal comparison computation deferred:", (longErr as any)?.message);
    }

    // 3d. Synthesize Explainable AYUSH Knowledge Contexts
    const knowledgeContexts: any[] = [];
    try {
      const { KnowledgeGraphService } = await import("@/lib/knowledge/knowledge-graph.service");
      const symptomsToResolve = [
        ...(session.chiefComplaints || []).map((c: any) => ({ code: `symptom.${c.symptomName.toLowerCase().replace(/\s+/g, "_")}`, name: c.symptomName })),
        ...(session.clinicalObservations || []).map((o: any) => ({ code: o.code || o.name, name: o.name })),
      ];

      for (const sym of symptomsToResolve) {
        const ctx = await KnowledgeGraphService.getExplainableKnowledgeContext(
          sym.code,
          sym.code,
          sym.name
        );
        if (ctx && !knowledgeContexts.some((k) => k.matchedConceptKey === ctx.matchedConceptKey)) {
          knowledgeContexts.push(ctx);
        }
      }
    } catch (kgErr) {
      console.warn("Knowledge context lookup deferred:", (kgErr as any)?.message);
    }

    // 3e. Synthesize Structured Clinical Insights with Provenance
    let clinicalInsights: any[] = [];
    try {
      const { ClinicalInsightService } = await import("@/lib/clinical/insight.service");
      clinicalInsights = await ClinicalInsightService.generateSessionInsights(sessionId);
    } catch (insErr) {
      console.warn("Clinical insights generation deferred:", (insErr as any)?.message);
    }

    // 4. Assemble genuine case data
    const caseData = {
      sessionId,
      tokenNumber,
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
        tokenNumber,
        triagePriority: session.triagePriority,
        redFlagTriggered: session.redFlagTriggered,
        startedAt: session.startedAt.toISOString(),
        chiefComplaint: session.chiefComplaints?.[0]?.symptomName || "Consultation Intake",
        status: session.status,
      },
      answers: session.patientAnswers.map((pa: any) => ({
        id: pa.id,
        nodeCode: pa.nodeCode,
        questionText: pa.questionNode?.questionText || pa.nodeCode,
        questionTextHindi: pa.questionNode?.questionTextHindi || null,
        clinicalDomain: pa.questionNode?.clinicalDomain || null,
        answerValue: pa.answerValue,
        answeredAt: pa.answeredAt ? new Date(pa.answeredAt).toISOString() : new Date().toISOString(),
      })),
      conversationTurns: session.conversationTurns.map((t: any) => ({
        id: t.id,
        role: t.role,
        contentText: t.contentText,
        timestamp: t.timestamp ? new Date(t.timestamp).toISOString() : new Date().toISOString(),
      })),
      redFlags: session.redFlagEvents.map((rf: any) => ({
        ruleId: rf.ruleId,
        description: rf.description,
        severity: rf.severity,
        triggeredAt: rf.triggeredAt.toISOString(),
      })),
      drugSafetyAlerts,
      longitudinalComparison,
      symptomTrajectories,
      knowledgeContexts,
      clinicalInsights,
      summary,
      timeline,
      abnormalLabs,
      ayurveda: (() => {
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
      documents: await Promise.all(
        session.medicalDocuments.map(async (doc: any) => {
          let temporaryAccessUrl = "";
          if (doc.originalFileUrl && !doc.originalFileUrl.startsWith("/uploads/")) {
            const objectKey = doc.originalFileUrl.replace(/^medical-documents\//, "");
            const { supabaseStorage } = await import("@/lib/storage/supabase-storage");
            temporaryAccessUrl = await supabaseStorage.createTemporaryAccessUrl(objectKey, 300);
          }
          return {
            id: doc.id,
            fileName: doc.fileName,
            type: doc.type,
            uploadedAt: doc.uploadedAt.toISOString(),
            temporaryAccessUrl,
            medications: doc.extractedEntities.filter((e: any) => e.type === "MEDICATION").map((m: any) => ({
              id: m.id,
              name: m.structuredData?.normalisedName || m.rawText,
              dosage: m.structuredData?.dosage || "",
              frequency: m.structuredData?.frequency || "",
              duration: m.structuredData?.duration || "",
              confidence: m.confidence ?? 0.9,
              isVerifiedByDoctor: m.isVerifiedByDoctor || false,
            })),
            labResults: doc.extractedEntities.filter((e: any) => e.type === "LAB").map((l: any) => ({
              id: l.id,
              testName: l.structuredData?.testName || l.rawText,
              value: l.structuredData?.value || l.rawText,
              unit: l.structuredData?.unit || "",
              referenceRange: l.structuredData?.referenceRange || "",
              flag: l.structuredData?.flag || "NORMAL",
              confidence: l.confidence ?? 0.9,
              isVerifiedByDoctor: l.isVerifiedByDoctor || false,
            })),
          };
        })
      ),

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

