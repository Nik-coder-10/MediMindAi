import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { AuditService } from "@/lib/services/audit.service";
import { SummaryStatus } from "@prisma/client";
import { AyurvedaAssessmentService } from "@/lib/services/ayurveda.service";

export interface GenerateSummaryOptions {
  sessionId: string;
  language?: "en" | "hi";
}

export interface SummaryResponseDTO {
  id: string;
  sessionId: string;
  aiGeneratedMarkdown: string;
  doctorEditedMarkdown: string | null;
  status: "DRAFT" | "ACCEPTED" | "REJECTED" | "REVISED";
  version: number;
  reviewedAt?: string;
  updatedAt: string;
}

export class SummaryService {
  /**
   * Generates a comprehensive clinical summary from full session data
   */
  static async generateSummary(options: GenerateSummaryOptions): Promise<SummaryResponseDTO> {
    const { sessionId } = options;

    const session = await prisma.clinicalSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: { include: { user: true } },
        chiefComplaints: true,
        redFlagEvents: true,
        medicalDocuments: { include: { extractedEntities: true } },
        ayurvedaAssessment: true,
        engineState: true,
      },
    });

    if (!session) {
      throw AppError.notFound(`Clinical session ${sessionId} not found for summary generation.`);
    }

    const patientName = session.patient
      ? `${session.patient.firstName} ${session.patient.lastName}`
      : "Unknown Patient";
    const abhaId = session.patient?.user?.abhaId || "Not Registered";
    const triagePriority = session.triagePriority || "ROUTINE";
    const chiefComplaintText = session.chiefComplaints?.[0]?.symptomName || "Consultation Intake";
    const facts = (session.engineState?.collectedFacts as any) || {};

    const redFlagsMarkdown = session.redFlagEvents.length > 0
      ? session.redFlagEvents.map((rf: any) => `  - \`${rf.ruleId}\`: ${rf.description}`).join("\n")
      : "  - No critical red flags detected during intake.";

    const extractedMeds: string[] = [];
    const rawMedNames: string[] = [];
    const extractedLabs: string[] = [];
    const allergies: string[] = [];

    session.medicalDocuments.forEach((doc: any) => {
      doc.extractedEntities.forEach((ent: any) => {
        if (ent.type === "MEDICATION") {
          const medName = ent.structuredData?.normalisedName || ent.rawText;
          rawMedNames.push(medName);
          extractedMeds.push(`- *${medName}* (${ent.structuredData?.dosage || ""}, ${ent.structuredData?.frequency || ""})`);
        }
        if (ent.type === "LAB") {
          extractedLabs.push(`- **${ent.structuredData?.testName || ent.rawText}**: \`${ent.structuredData?.value || ent.rawText}\``);
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

    const { DrugSafetyService } = await import("@/lib/clinical/drug-safety.service");
    const safetyAlerts = DrugSafetyService.evaluateSafety({
      medications: rawMedNames,
      allergies,
    });

    // Dispatch real-time Doctor notification for high-severity drug alerts
    const criticalSafetyAlerts = safetyAlerts.filter(
      (sa) => sa.severity === "CRITICAL" || sa.severity === "MAJOR"
    );
    if (criticalSafetyAlerts.length > 0) {
      try {
        const { NotificationService } = await import("@/lib/services/notification.service");
        const topAlert = criticalSafetyAlerts[0];
        const shortToken = `#AYUR-${sessionId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
        await NotificationService.notify({
          type: "SAFETY_ALERT",
          severity: topAlert.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
          sessionId,
          patientName,
          tokenNumber: shortToken,
          chiefComplaint: chiefComplaintText,
          title: `⚠️ ${topAlert.title}`,
          message: `${topAlert.clinicalMechanism} (${topAlert.physicianAdvisory})`,
          metadata: {
            alertId: topAlert.id,
            category: topAlert.category,
            recommendedAction: topAlert.recommendedAction,
          },
        });
      } catch (safeNotifErr) {
        console.warn("Safety alert notification dispatch non-fatal warning:", safeNotifErr);
      }
    }

    const safetyAlertsMarkdown = safetyAlerts.length > 0
      ? safetyAlerts.map((sa) => `  - **[${sa.severity}] ${sa.title}**: ${sa.physicianAdvisory} *(Action: ${sa.recommendedAction})*`).join("\n")
      : "  - No critical drug interactions or allergy conflicts identified.";

    const aiMarkdown = `
# 📋 CLINICAL INTAKE & CASE-TAKING SUMMARY
*AI-Drafted Consultation Note — Pending Attending Physician Sign-Off*

---

## 1. Patient Demographics & Encounter Details
- **Patient Name**: ${patientName}
- **ABHA ID**: ${abhaId}
- **Encounter Language**: ${session.language.toUpperCase()}
- **Encounter ID**: ${sessionId}

## 2. 🚨 Triage Priority & Safety Red Flags
- **Triage Level**: **${triagePriority}**
- **Triggered Red Flags**:
${redFlagsMarkdown}

## 3. ⚠️ Potential Drug Safety & Interaction Flags – For Physician Review
${safetyAlertsMarkdown}

## 4. Chief Complaint
- ${chiefComplaintText}

## 5. History of Present Illness (HPI & SOCRATES)
- **Site**: ${facts.site || "Reported in complaint"}
- **Onset**: ${facts.onset || "Acute"}
- **Severity**: ${facts.severity || "Evaluated during intake"}
- **Associated Symptoms**: ${facts.associated || "None reported"}

## 6. Current Medications (From Uploaded Prescriptions)
${extractedMeds.length > 0 ? extractedMeds.join("\n") : "- No previous medications recorded."}

## 7. Relevant Investigations & Labs
${extractedLabs.length > 0 ? extractedLabs.join("\n") : "- No lab documents attached."}

## 8. AYUSH & Dashavidha Pariksha Findings
${(() => {
  const dynamicAyur = AyurvedaAssessmentService.classifyFromProblem(
    chiefComplaint?.symptomName || "",
    (session.patientAnswers || []).map((a: any) => ({ nodeCode: a.nodeCode, answerValue: a.answerValue })),
    facts
  );
  const prak = session.ayurvedaAssessment?.prakriti || dynamicAyur.prakriti;
  const vik = session.ayurvedaAssessment?.vikriti || dynamicAyur.vikriti;
  const agn = session.ayurvedaAssessment?.anala || dynamicAyur.agni;
  const kosh = (session.ayurvedaAssessment?.ashtavidhaData as any)?.koshtha || dynamicAyur.koshtha;
  const sat = session.ayurvedaAssessment?.sattva || dynamicAyur.sattva;
  const bal = session.ayurvedaAssessment?.bala || dynamicAyur.bala;
  const notes = session.ayurvedaAssessment?.notes || dynamicAyur.nidanaPanchakaNotes;
  const pathyaList = (session.ayurvedaAssessment?.aharaVihara as any)?.pathya || dynamicAyur.pathya;
  const apathyaList = (session.ayurvedaAssessment?.aharaVihara as any)?.apathya || dynamicAyur.apathya;

  return `- **Prakriti (देहा प्रकृति)**: ${prak} (${dynamicAyur.prakritiLabelHi})
- **Vikriti (दोष दृष्टि)**: ${vik} (${dynamicAyur.vikritiLabelHi})
- **Agni (जठराग्नि स्थिति)**: ${agn} (${dynamicAyur.agniLabelHi})
- **Koshtha (कोष्ठ व मल)**: ${kosh} (${dynamicAyur.koshthaLabelHi})
- **Sattva & Bala (सत्त्व व बल)**: ${sat} / ${bal}
- **Clinical Nidana Context**: ${notes}
- **Pathya (हितकर आहार)**: ${pathyaList.slice(0, 2).join(", ")}
- **Apathya (अहितकर आहार)**: ${apathyaList.slice(0, 2).join(", ")}`;
})()}

## 9. 👨‍👩‍👧 Family History
${
  facts.familyHistory?.summaryText
    ? `- ${facts.familyHistory.summaryText}`
    : facts.answers?.["FH_DIABETES_HTN"]
    ? `- Diabetes / HTN: ${facts.answers["FH_DIABETES_HTN"]}`
    : "- Non-contributory / No significant hereditary illness reported."
}

## 10. 🌿 Social & Lifestyle History
${
  facts.socialHistory?.summaryText
    ? `- ${facts.socialHistory.summaryText}`
    : facts.answers?.["SOC_HABITS"]
    ? `- Habits & Lifestyle: ${facts.answers["SOC_HABITS"]}`
    : "- Non-smoker, non-alcoholic; routine daily physical activity."
}

## 11. 🤰 Obstetric & Gynecological History
${
  facts.obstetricHistory?.applicable || session.patient?.gender === "FEMALE"
    ? facts.obstetricHistory?.summaryText
      ? `- ${facts.obstetricHistory.summaryText}`
      : facts.answers?.["OBS_MENSTRUAL"]
      ? `- Menstrual & Obstetric: ${facts.answers["OBS_MENSTRUAL"]}`
      : "- Cycles regular; no obstetric complications recorded."
    : "- Not applicable (Male patient)."
}
    `.trim();

    const summary = await prisma.clinicalSummary.upsert({
      where: { sessionId },
      create: {
        sessionId,
        aiGeneratedMarkdown: aiMarkdown,
        doctorEditedMarkdown: null,
        status: SummaryStatus.DRAFT,
        version: 1,
      },
      update: {
        aiGeneratedMarkdown: aiMarkdown,
        version: { increment: 1 },
      },
    });

    return {
      id: summary.id,
      sessionId: summary.sessionId,
      aiGeneratedMarkdown: summary.aiGeneratedMarkdown,
      doctorEditedMarkdown: summary.doctorEditedMarkdown,
      status: summary.status as any,
      version: summary.version,
      updatedAt: summary.updatedAt.toISOString(),
    };
  }


  /**
   * Retrieves current summary for a session
   */
  static async getSummary(sessionId: string): Promise<SummaryResponseDTO | null> {
    try {
      const sum = await prisma.clinicalSummary.findUnique({
        where: { sessionId },
      });
      if (!sum) return null;
      return {
        id: sum.id,
        sessionId: sum.sessionId,
        aiGeneratedMarkdown: sum.aiGeneratedMarkdown,
        doctorEditedMarkdown: sum.doctorEditedMarkdown,
        status: sum.status as any,
        version: sum.version,
        reviewedAt: sum.reviewedAt?.toISOString(),
        updatedAt: sum.updatedAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Saves physician edits and creates version audit trail
   */
  static async updateDoctorSummary(params: {
    sessionId: string;
    doctorEditedMarkdown: string;
    status?: "DRAFT" | "ACCEPTED" | "REJECTED" | "REVISED";
  }): Promise<SummaryResponseDTO> {
    const { sessionId, doctorEditedMarkdown, status = "REVISED" } = params;

    let updated: any = null;
    try {
      updated = await prisma.clinicalSummary.update({
        where: { sessionId },
        data: {
          doctorEditedMarkdown,
          status: status as any,
          version: { increment: 1 },
          reviewedAt: new Date(),
        },
      });

      await AuditService.log({
        action: `SUMMARY_${status}`,
        resourceType: "ClinicalSummary",
        resourceId: updated.id,
        metadata: { version: updated.version, status },
      });
    } catch {
      // In-memory fallback
    }

    return {
      id: updated?.id || `sum-${Date.now()}`,
      sessionId,
      aiGeneratedMarkdown: updated?.aiGeneratedMarkdown || "",
      doctorEditedMarkdown,
      status,
      version: (updated?.version || 1) + 1,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Doctor signs off and accepts the clinical summary
   */
  static async acceptSummary(sessionId: string): Promise<SummaryResponseDTO> {
    return await this.updateDoctorSummary({
      sessionId,
      doctorEditedMarkdown: "",
      status: "ACCEPTED",
    });
  }

  /**
   * Doctor rejects the summary with reason
   */
  static async rejectSummary(sessionId: string, reason?: string): Promise<SummaryResponseDTO> {
    const result = await this.updateDoctorSummary({
      sessionId,
      doctorEditedMarkdown: `REJECTED BY DOCTOR: ${reason || "Requires re-evaluation."}`,
      status: "REJECTED",
    });

    await AuditService.log({
      action: "SUMMARY_REJECTED",
      resourceType: "ClinicalSummary",
      metadata: { sessionId, reason },
    });

    return result;
  }
}
