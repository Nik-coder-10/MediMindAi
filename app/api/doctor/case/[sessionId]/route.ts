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
    const { formatAyurToken } = await import("@/lib/utils");
    const tokenNumber = formatAyurToken(session.id);

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

    // Extract intakeMode from session notes or collected facts
    let intakeMode: "AYURVEDA" | "GENERAL" = "AYURVEDA";
    try {
      if (session.notes) {
        const parsed = JSON.parse(session.notes);
        if (parsed.intakeMode) intakeMode = parsed.intakeMode;
      }
    } catch {}
    if (!intakeMode && (session.engineState?.collectedFacts as any)?.intakeMode) {
      intakeMode = (session.engineState?.collectedFacts as any).intakeMode;
    }

    const chiefText = session.chiefComplaints?.[0]?.symptomName || "";
    const lowerChief = chiefText.toLowerCase();

    // Mode-specific AI recommendations for physician review
    const aiRecommendations = intakeMode === "AYURVEDA"
      ? {
          mode: "AYURVEDA",
          title: "आयुर्वेदिक शामक व शोधन चिकित्सा परामर्श (AYUSH Recommendations)",
          differentials: lowerChief.includes("chest") || lowerChief.includes("seena") || chiefText.includes("छाती")
            ? [
                { name: "Hridroga (Vata-Kaphaja / Saama)", namasteCode: "AYU-HR-003", icd11: "BA41.Z", urgency: "HIGH", description: "Hridaya Avarana with retrosternal stiffness. Advise Stat ECG & cardiac workup alongside Mridu Vatanulomana." },
                { name: "Amlapitta with Urdhwaga Pitta Dushti", namasteCode: "AYU-AP-009", icd11: "DA42.Z", urgency: "MEDIUM", description: "Acid regurgitation and burning chest discomfort. Deepana-Pachana indicated." }
              ]
            : lowerChief.includes("knee") || lowerChief.includes("ghutn") || lowerChief.includes("joint") || chiefText.includes("जोड़") || chiefText.includes("घुटने")
            ? [
                { name: "Janu Sandhigata Vata (Osteoarthritis / Degenerative)", namasteCode: "AYU-SG-014", icd11: "FA00.Z", urgency: "MEDIUM", description: "Dhatu Kshaya janya Vata prakopa with joint crepitus. Snehana & Janu Basti recommended." },
                { name: "Amavata (Rheumatoid / Inflammatory Joint Arthropathy)", namasteCode: "AYU-AV-012", icd11: "FA20.Z", urgency: "MEDIUM", description: "Saama Vata accumulation in Sandhi with morning stiffness. Langhana & Valuka Sweda indicated." }
              ]
            : [
                { name: "Vataja / Pittaja Shoola (Generalized Doshic Imbalance)", namasteCode: "AYU-SH-001", icd11: "MG30.Z", urgency: "MEDIUM", description: "Localized Doshic vitiation. Shamana chikitsa and Pathya Ahara advised." }
              ],
          prescriptions: lowerChief.includes("knee") || lowerChief.includes("joint") || chiefText.includes("जोड़") || chiefText.includes("घुटने")
            ? [
                { name: "Tab Yogaraj Guggulu 500mg", dosage: "1 Tab", frequency: "1-0-1 (BD)", duration: "15 Days", instructions: "After meals with warm water" },
                { name: "Ksheerabala Taila 101", dosage: "10 drops", frequency: "1-0-1 (BD)", duration: "15 Days", instructions: "With warm milk before bedtime" },
                { name: "Mahanarayana Taila (Local)", dosage: "External application", frequency: "0-1-0 (Noon)", duration: "21 Days", instructions: "Gentle local Abhyanga followed by hot water fomentation" }
              ]
            : [
                { name: "Tab Yogaraj Guggulu 500mg", dosage: "1 Tab", frequency: "1-0-1 (BD)", duration: "15 Days", instructions: "With lukewarm water after meals" },
                { name: "Syp Amritarishta 15ml", dosage: "15ml (2 tsp)", frequency: "1-0-1 (BD)", duration: "15 Days", instructions: "Mixed with equal water after food" },
                { name: "Avipattikar Churna 3g", dosage: "3g (1/2 tsp)", frequency: "0-0-1 (HS)", duration: "10 Days", instructions: "At bedtime with lukewarm water" }
              ],
          investigations: lowerChief.includes("chest") || chiefText.includes("छाती")
            ? "12-Lead ECG (Stat), Cardiac Troponin I, Lipid Profile, Fasting Blood Glucose."
            : "X-Ray bilateral joints (AP/Lateral view), Serum Uric Acid, ESR, CRP, HbA1c.",
          dietAdvice: "Pathya: Mudga Yusha (light green gram soup), ginger-cumin boiled water, boiled vegetables. Apathya: Strictly avoid curd, heavy fried foods, fermented batter, and refrigerated drinks.",
          followUp: "After 7-10 days for assessment of Agni and symptom remission (SOS if acute symptoms escalate)."
        }
      : {
          mode: "GENERAL",
          title: "मानक चिकित्सा OPD क्लिनिकल परामर्श (General Medicine Recommendations)",
          differentials: lowerChief.includes("chest") || lowerChief.includes("seena") || chiefText.includes("छाती")
            ? [
                { name: "Acute Coronary Syndrome / Unstable Angina", namasteCode: "N/A", icd11: "BA41.Z", urgency: "HIGH", description: "Retrosternal chest discomfort requiring immediate cardiac evaluation and biomarker triage." },
                { name: "Gastroesophageal Reflux Disease (GERD)", namasteCode: "N/A", icd11: "DA42.Z", urgency: "MEDIUM", description: "Acid reflux and non-cardiac retrosternal burning. Trial of PPI indicated." }
              ]
            : lowerChief.includes("knee") || lowerChief.includes("ghutn") || lowerChief.includes("joint") || chiefText.includes("जोड़") || chiefText.includes("घुटने")
            ? [
                { name: "Primary Osteoarthritis of Knee (Bilateral/Unilateral)", namasteCode: "N/A", icd11: "FA00.Z", urgency: "MEDIUM", description: "Degenerative joint disease with weight-bearing discomfort and crepitus." },
                { name: "Inflammatory Polyarthritis / Crystal Arthropathy (Gout)", namasteCode: "N/A", icd11: "FA20.Z", urgency: "MEDIUM", description: "Joint effusion with elevated inflammatory markers or hyperuricemia." }
              ]
            : [
                { name: "Acute Clinical Symptom Presentation (Under Evaluation)", namasteCode: "N/A", icd11: "MG30.Z", urgency: "MEDIUM", description: "Symptomatic presentation requiring physical examination and basic metabolic laboratory workup." }
              ],
          prescriptions: lowerChief.includes("knee") || lowerChief.includes("joint") || chiefText.includes("जोड़") || chiefText.includes("घुटने")
            ? [
                { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "1-0-1 (BD)", duration: "5 Days", instructions: "After meals (symptomatic pain relief)" },
                { name: "Tab Pantoprazole 40mg", dosage: "1 Tab", frequency: "1-0-0 (OD)", duration: "7 Days", instructions: "Empty stomach in the morning (Gastroprotection)" },
                { name: "Diclofenac Gel (Topical)", dosage: "Thin layer", frequency: "1-0-1 (BD)", duration: "10 Days", instructions: "Apply locally on affected joints without vigorous rubbing" }
              ]
            : [
                { name: "Cap Omeprazole 20mg", dosage: "1 Cap", frequency: "1-0-0 (OD)", duration: "10 Days", instructions: "Empty stomach in the morning" },
                { name: "Tab Paracetamol 650mg", dosage: "1 Tab", frequency: "1 SOS", duration: "3 Days", instructions: "After food only when severe pain occurs" },
                { name: "Multivitamin & Mineral Tab", dosage: "1 Tab", frequency: "0-1-0 (Post Lunch)", duration: "15 Days", instructions: "After lunch with a glass of water" }
              ],
          investigations: lowerChief.includes("chest") || chiefText.includes("छाती")
            ? "12-Lead ECG Stat, Serum Troponin I / CK-MB, Chest X-Ray (PA), Fasting Lipid Profile."
            : "Complete Blood Count (CBC), ESR, Serum Uric Acid, X-ray of affected joint (Weight bearing AP & Lat).",
          dietAdvice: "Well-balanced diet, maintain optimal hydration (2-2.5L water/day), low sodium, avoid excessive caffeine, tobacco, and alcohol.",
          followUp: "Review after 5-7 days with investigation reports (SOS visit if severe red-flag pain develops)."
        };

    // 4. Assemble genuine case data
    const caseData = {
      sessionId,
      tokenNumber,
      intakeMode,
      aiRecommendations,
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
        intakeMode,
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

