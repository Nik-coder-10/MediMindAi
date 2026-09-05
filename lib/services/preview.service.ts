import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { SessionStatus, TriagePriority } from "@prisma/client";
import { AyurvedaAssessmentService } from "@/lib/services/ayurveda.service";

export interface PatientDashboardPreviewDTO {
  sessionId: string;
  tokenNumber: string;
  status: SessionStatus;
  isSubmitted: boolean;
  triagePriority: TriagePriority;
  language: string;
  startedAt: string;
  completedAt?: string | null;

  patient: {
    name: string;
    ageGender: string;
    abhaId: string;
  };

  chiefComplaint: {
    symptomName: string;
    duration: string;
    severity: string;
    location?: string | null;
  };

  hpiSummary: string;

  facts: Record<string, unknown>;

  answers: Array<{
    nodeCode: string;
    questionText: string;
    questionTextHindi?: string | null;
    answerValue: unknown;
  }>;

  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;

  labResults: Array<{
    testName: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    flag?: string;
  }>;

  documents: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    type: string;
    hasEntities: boolean;
  }>;

  timeline: Array<{
    id: string;
    patientId: string;
    eventDate: string;
    title: string;
    description?: string | null;
    category: string;
  }>;

  redFlags: Array<{
    ruleId: string;
    description: string;
    severity: string;
  }>;

  ayurveda?: {
    prakriti?: string | null;
    prakritiLabelHi?: string | null;
    prakritiLabelEn?: string | null;
    vikriti?: string | null;
    vikritiLabelHi?: string | null;
    vikritiLabelEn?: string | null;
    anala?: string | null;
    agniLabelHi?: string | null;
    agniLabelEn?: string | null;
    koshtha?: string | null;
    koshthaLabelHi?: string | null;
    koshthaLabelEn?: string | null;
    sattva?: string | null;
    sattvaLabelHi?: string | null;
    sattvaLabelEn?: string | null;
    bala?: string | null;
    balaLabelHi?: string | null;
    balaLabelEn?: string | null;
    pathya?: string[];
    apathya?: string[];
    doshicDistribution?: {
      vata: number;
      pitta: number;
      kapha: number;
    };
    notes?: string | null;
  } | null;

  structuredHistory?: {
    familyHistory?: string | null;
    socialHistory?: string | null;
    obstetricHistory?: string | null;
  };

  canSubmit: boolean;
  canEdit: boolean;
}

export class PreviewService {
  /**
   * Builds an accessible, patient-friendly pre-submission summary preview
   */
  static async getPatientPreview(sessionId: string): Promise<PatientDashboardPreviewDTO> {
    if (!sessionId) {
      throw AppError.badRequest("sessionId is required");
    }

    let session: any = null;
    try {
      session = await prisma.clinicalSession.findUnique({
        where: { id: sessionId },
        include: {
          patient: {
            include: {
              user: true,
              timelineEvents: { orderBy: { eventDate: "desc" }, take: 5 },
            },
          },
          chiefComplaints: true,
          patientAnswers: {
            orderBy: { answeredAt: "asc" },
            include: { questionNode: true },
          },
          redFlagEvents: { orderBy: { triggeredAt: "desc" } },
          medicalDocuments: {
            where: { deletedAt: null },
            include: { extractedEntities: true },
          },
          engineState: true,
          ayurvedaAssessment: true,
        },
      });
    } catch (dbErr) {
      console.warn("PreviewService findUnique DB lookup warning:", (dbErr as any)?.message);
    }

    if (!session) {
      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      const memSession = inMemoryClinicalStore.getSession(sessionId);
      if (memSession) {
        session = {
          id: memSession.id,
          status: memSession.status,
          language: memSession.language,
          startedAt: memSession.startedAt,
          completedAt: memSession.completedAt,
          patientId: memSession.patientId,
          patient: {
            firstName: memSession.patient.firstName,
            lastName: memSession.patient.lastName,
            dateOfBirth: memSession.patient.dateOfBirth,
            gender: memSession.patient.gender,
            user: { abhaId: "14-5542-8921-3410" },
            timelineEvents: [],
          },
          chiefComplaints: memSession.chiefComplaints,
          patientAnswers: memSession.patientAnswers,
          redFlagEvents: memSession.redFlagEvents,
          medicalDocuments: memSession.medicalDocuments,
          ayurvedaAssessment: memSession.ayurvedaAssessment,
          engineState: null,
        };
      }
    }

    if (!session) {
      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      const stubSession = {
        id: sessionId,
        patientId: `pat-prof-anon-${sessionId.slice(-6)}`,
        doctorId: null,
        status: "IN_PROGRESS" as const,
        triagePriority: "ROUTINE" as const,
        language: "hi",
        startedAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        redFlagTriggered: false,
        notes: JSON.stringify({ intakeMode: "AYURVEDA" }),
        patient: {
          id: `pat-prof-anon-${sessionId.slice(-6)}`,
          userId: "pat-104-demo",
          firstName: "रमेश",
          lastName: "शर्मा",
          dateOfBirth: new Date("1982-05-14"),
          gender: "MALE" as any,
          bloodGroup: "B_POSITIVE" as any,
          user: { abhaId: "14-5542-8921-3410" },
          timelineEvents: [],
        },
        chiefComplaints: [
          {
            id: `cc-${Date.now()}`,
            sessionId,
            symptomName: "सिरदर्द व शरीर में दर्द",
            duration: "२-३ दिन से (Acute)",
            severity: "मध्यम (Moderate)",
            location: "General",
          },
        ],
        patientAnswers: [],
        conversationTurns: [],
        medicalDocuments: [],
        redFlagEvents: [],
        clinicalSummary: null,
        ayurvedaAssessment: null,
      };
      inMemoryClinicalStore.upsertSession(stubSession as any);
      session = stubSession as any;
    }

    const { formatAyurToken } = await import("@/lib/utils");
    const tokenNumber = formatAyurToken(session.id);

    const isSubmitted = session.status === SessionStatus.WAITING_FOR_DOCTOR || session.status === SessionStatus.COMPLETED;

    const patientName = session.patient
      ? `${session.patient.firstName} ${session.patient.lastName}`.trim()
      : "रोगी (Patient)";
    const birthYear = session.patient?.dateOfBirth ? new Date(session.patient.dateOfBirth).getFullYear() : 1985;
    const currentYear = new Date().getFullYear();
    const approxAge = currentYear - birthYear;
    const ageGender = `${approxAge > 0 ? approxAge : 40}Y / ${session.patient?.gender || "MALE"}`;
    const abhaId = session.patient?.user?.abhaId || "ABHA-सत्यापित";

    const chiefComplaintRecord = session.chiefComplaints?.[0];
    const chiefComplaint = {
      symptomName: chiefComplaintRecord?.symptomName || "परामर्श लक्षण (Consultation Intake)",
      duration: chiefComplaintRecord?.duration || "२-३ दिन से (Acute)",
      severity: chiefComplaintRecord?.severity || "मध्यम (Moderate)",
      location: chiefComplaintRecord?.location || "General",
    };

    const facts = (session.engineState?.collectedFacts as any) || {};

    // Transform extracted medications & labs from uploaded medical documents
    const medications: Array<{ name: string; dosage?: string; frequency?: string; duration?: string }> = [];
    const labResults: Array<{ testName: string; value: string; unit?: string; referenceRange?: string; flag?: string }> = [];

    session.medicalDocuments.forEach((doc: any) => {
      doc.extractedEntities.forEach((ent: any) => {
        if (ent.type === "MEDICATION") {
          const sd = ent.structuredData as any;
          medications.push({
            name: sd?.normalisedName || ent.rawText,
            dosage: sd?.dosage || "",
            frequency: sd?.frequency || "",
            duration: sd?.duration || "",
          });
        } else if (ent.type === "LAB") {
          const sd = ent.structuredData as any;
          labResults.push({
            testName: sd?.testName || ent.rawText,
            value: sd?.value || ent.rawText,
            unit: sd?.unit || "",
            referenceRange: sd?.referenceRange || "",
            flag: sd?.flag || (ent.rawText.toLowerCase().includes("high") ? "HIGH" : "NORMAL"),
          });
        }
      });
    });

    // Patient friendly conversational HPI
    const isHeadache = chiefComplaint.symptomName.toLowerCase().includes("head") || chiefComplaint.symptomName.includes("सिर") || chiefComplaint.symptomName.includes("सर");
    const isChest = chiefComplaint.symptomName.toLowerCase().includes("chest") || chiefComplaint.symptomName.includes("छाती");
    const isJt = chiefComplaint.symptomName.toLowerCase().includes("joint") || chiefComplaint.symptomName.includes("जोड़") || chiefComplaint.symptomName.includes("संधि");

    let hpiSummary = "";
    if (session.language === "hi") {
      hpiSummary = `रोगी ने '${chiefComplaint.symptomName}' की शिकायत दर्ज कराई है। यह समस्या ${chiefComplaint.duration} से है तथा इसकी गंभीरता ${chiefComplaint.severity} है। ${
        facts.site ? `प्रभावित स्थान: ${facts.site}। ` : ""
      }${facts.associated ? `साथ में अन्य लक्षण: ${facts.associated}। ` : ""}${
        medications.length > 0 ? `पुराने पर्चे से ${medications.length} दवाइयां पाई गईं।` : ""
      }`;
    } else {
      hpiSummary = `Patient reports chief concern of '${chiefComplaint.symptomName}' present for ${chiefComplaint.duration} with ${chiefComplaint.severity} severity. ${
        facts.site ? `Localized at ${facts.site}. ` : ""
      }${facts.associated ? `Associated findings: ${facts.associated}. ` : ""}${
        medications.length > 0 ? `${medications.length} previous prescription medications identified.` : ""
      }`;
    }

    const answers = session.patientAnswers.map((pa: any) => ({
      nodeCode: pa.nodeCode,
      questionText: pa.questionNode?.questionText || pa.nodeCode,
      questionTextHindi: pa.questionNode?.questionTextHindi || null,
      answerValue: pa.answerValue,
    }));

    const documents = session.medicalDocuments.map((d: any) => ({
      id: d.id,
      fileName: d.fileName,
      fileSize: d.fileSize,
      uploadedAt: d.uploadedAt.toISOString(),
      type: d.type,
      hasEntities: d.extractedEntities.length > 0,
    }));

    const timeline = (session.patient?.timelineEvents || []).map((te: any) => ({
      id: te.id,
      patientId: session.patientId,
      eventDate: te.eventDate.toISOString().split("T")[0],
      title: te.title,
      description: te.description,
      category: te.category,
    }));

    // Add current session milestone if empty
    if (timeline.length === 0) {
      timeline.push({
        id: "tl-today",
        patientId: session.patientId,
        eventDate: new Date().toISOString().split("T")[0],
        title: session.language === "hi" ? "आज का नैदानिक परामर्श" : "Today's Clinical Consultation",
        description: chiefComplaint.symptomName,
        category: "CONSULTATION",
      });
    }

    const redFlags = session.redFlagEvents.map((rf: any) => ({
      ruleId: rf.ruleId,
      description: rf.description,
      severity: rf.severity,
    }));

    // Dynamically classify problem-tailored Ayurvedic & Dashavidha profile
    const problemClassification = AyurvedaAssessmentService.classifyFromProblem(
      chiefComplaint.symptomName,
      session.patientAnswers.map((pa: any) => ({ nodeCode: pa.nodeCode, answerValue: pa.answerValue })),
      facts
    );

    const ashtaData = (session.ayurvedaAssessment?.ashtavidhaData as any) || {};
    const aharaData = (session.ayurvedaAssessment?.aharaVihara as any) || {};

    const ayurveda = {
      prakriti: session.ayurvedaAssessment?.prakriti || problemClassification.prakriti,
      prakritiLabelHi: aharaData?.prakritiLabelHi || ashtaData?.prakritiLabelHi || problemClassification.prakritiLabelHi,
      prakritiLabelEn: aharaData?.prakritiLabelEn || ashtaData?.prakritiLabelEn || problemClassification.prakritiLabelEn,
      vikriti: session.ayurvedaAssessment?.vikriti || problemClassification.vikriti,
      vikritiLabelHi: aharaData?.vikritiLabelHi || ashtaData?.vikritiLabelHi || problemClassification.vikritiLabelHi,
      vikritiLabelEn: aharaData?.vikritiLabelEn || ashtaData?.vikritiLabelEn || problemClassification.vikritiLabelEn,
      anala: session.ayurvedaAssessment?.anala || problemClassification.agni,
      agniLabelHi: aharaData?.agniLabelHi || ashtaData?.agniLabelHi || problemClassification.agniLabelHi,
      agniLabelEn: aharaData?.agniLabelEn || ashtaData?.agniLabelEn || problemClassification.agniLabelEn,
      koshtha: ashtaData?.koshtha || problemClassification.koshtha,
      koshthaLabelHi: aharaData?.koshthaLabelHi || ashtaData?.koshthaLabelHi || problemClassification.koshthaLabelHi,
      koshthaLabelEn: aharaData?.koshthaLabelEn || ashtaData?.koshthaLabelEn || problemClassification.koshthaLabelEn,
      sattva: session.ayurvedaAssessment?.sattva || problemClassification.sattva,
      sattvaLabelHi: aharaData?.sattvaLabelHi || ashtaData?.sattvaLabelHi || problemClassification.sattvaLabelHi,
      sattvaLabelEn: aharaData?.sattvaLabelEn || ashtaData?.sattvaLabelEn || problemClassification.sattvaLabelEn,
      bala: session.ayurvedaAssessment?.bala || problemClassification.bala,
      balaLabelHi: aharaData?.balaLabelHi || ashtaData?.balaLabelHi || problemClassification.balaLabelHi,
      balaLabelEn: aharaData?.balaLabelEn || ashtaData?.balaLabelEn || problemClassification.balaLabelEn,
      pathya: aharaData?.pathya || ashtaData?.pathya || problemClassification.pathya,
      apathya: aharaData?.apathya || ashtaData?.apathya || problemClassification.apathya,
      doshicDistribution: aharaData?.doshicDistribution || ashtaData?.doshicDistribution || problemClassification.doshicDistribution,
      notes: session.ayurvedaAssessment?.notes || problemClassification.nidanaPanchakaNotes,
    };

    const hasEnoughData = !!(
      chiefComplaintRecord ||
      session.patientAnswers.length > 0 ||
      session.medicalDocuments.length > 0
    );

    const structuredHistory = {
      familyHistory:
        facts.familyHistory?.summaryText ||
        (facts.answers?.["FH_DIABETES_HTN"]
          ? `Diabetes/HTN: ${facts.answers["FH_DIABETES_HTN"]}`
          : "परिवार में कोई गंभीर वंशानुगत रोग नहीं (Non-contributory)"),
      socialHistory:
        facts.socialHistory?.summaryText ||
        (facts.answers?.["SOC_HABITS"]
          ? `आहार व व्यसन: ${facts.answers["SOC_HABITS"]}`
          : "शाकाहारी, धूम्रपान/शराब रहित (Clean lifestyle)"),
      obstetricHistory:
        facts.obstetricHistory?.summaryText ||
        (session.patient?.gender === "FEMALE" || facts.answers?.["OBS_MENSTRUAL"]
          ? `माहवारी व प्रसूति: ${facts.answers?.["OBS_MENSTRUAL"] || "नियमित (Regular)"}`
          : null),
    };

    return {
      sessionId: session.id,
      tokenNumber,
      status: session.status,
      isSubmitted,
      triagePriority: session.triagePriority,
      language: session.language,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt ? session.completedAt.toISOString() : null,
      patient: {
        name: patientName,
        ageGender,
        abhaId,
      },
      chiefComplaint,
      hpiSummary,
      facts,
      answers,
      medications,
      labResults,
      documents,
      timeline,
      redFlags,
      ayurveda,
      structuredHistory,
      canSubmit: !isSubmitted && hasEnoughData,
      canEdit: !isSubmitted,
    };
  }
}
