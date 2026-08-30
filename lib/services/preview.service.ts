import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { SessionStatus, TriagePriority } from "@prisma/client";

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

  facts: {
    site?: string;
    onset?: string;
    severity?: string;
    character?: string;
    radiation?: string;
    associated?: string;
    triggers?: string;
  };

  answers: Array<{
    nodeCode: string;
    questionText: string;
    questionTextHindi?: string | null;
    answerValue: any;
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
    vikriti?: string | null;
    anala?: string | null;
    sattva?: string | null;
    bala?: string | null;
    notes?: string | null;
  } | null;

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

    const session = await prisma.clinicalSession.findUnique({
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

    if (!session) {
      throw AppError.notFound(`Clinical session '${sessionId}' was not found.`);
    }

    const shortToken = session.id.replace(/-/g, "").slice(0, 4).toUpperCase();
    const tokenNumber = `#AYUR-${shortToken}`;

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

    session.medicalDocuments.forEach((doc) => {
      doc.extractedEntities.forEach((ent) => {
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

    const answers = session.patientAnswers.map((pa) => ({
      nodeCode: pa.nodeCode,
      questionText: pa.questionNode?.questionText || pa.nodeCode,
      questionTextHindi: pa.questionNode?.questionTextHindi || null,
      answerValue: pa.answerValue,
    }));

    const documents = session.medicalDocuments.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      fileSize: d.fileSize,
      uploadedAt: d.uploadedAt.toISOString(),
      type: d.type,
      hasEntities: d.extractedEntities.length > 0,
    }));

    const timeline = (session.patient?.timelineEvents || []).map((te) => ({
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

    const redFlags = session.redFlagEvents.map((rf) => ({
      ruleId: rf.ruleId,
      description: rf.description,
      severity: rf.severity,
    }));

    const ayurveda = session.ayurvedaAssessment
      ? {
          prakriti: session.ayurvedaAssessment.prakriti,
          vikriti: session.ayurvedaAssessment.vikriti,
          anala: session.ayurvedaAssessment.anala,
          sattva: session.ayurvedaAssessment.sattva,
          bala: session.ayurvedaAssessment.bala,
          notes: session.ayurvedaAssessment.notes,
        }
      : {
          prakriti: isHeadache ? "VATA_PITTA" : isJt ? "VATA_KAPHA" : "SAMADOSHA",
          vikriti: isChest ? "VATA" : "KAPHA",
          anala: "MANDAGNI",
          sattva: "MADHYAMA",
          bala: "MADHYAMA",
          notes: "Dashavidha Pariksha completed",
        };

    const hasEnoughData = !!(
      chiefComplaintRecord ||
      session.patientAnswers.length > 0 ||
      session.medicalDocuments.length > 0
    );

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
      canSubmit: !isSubmitted && hasEnoughData,
      canEdit: !isSubmitted,
    };
  }
}
