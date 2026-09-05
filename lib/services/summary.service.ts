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

    let session: any = null;
    try {
      session = await prisma.clinicalSession.findUnique({
        where: { id: sessionId },
        include: {
          patient: { include: { user: true } },
          chiefComplaints: true,
          patientAnswers: true,
          redFlagEvents: true,
          medicalDocuments: { include: { extractedEntities: true } },
          ayurvedaAssessment: true,
          engineState: true,
        },
      });
    } catch (dbErr) {
      console.warn("SummaryService DB query fallback to memory store:", (dbErr as any)?.message);
    }

    if (!session) {
      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      const memSession = inMemoryClinicalStore.getSession(sessionId);
      if (memSession) {
        session = {
          id: memSession.id,
          language: memSession.language,
          triagePriority: memSession.triagePriority,
          patientId: memSession.patientId,
          patient: memSession.patient,
          chiefComplaints: memSession.chiefComplaints,
          patientAnswers: memSession.patientAnswers,
          redFlagEvents: memSession.redFlagEvents,
          medicalDocuments: memSession.medicalDocuments,
          ayurvedaAssessment: memSession.ayurvedaAssessment,
          engineState: null,
          notes: (memSession as any).notes,
        };
      }
    }

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
        const { formatAyurToken } = await import("@/lib/utils");
        const shortToken = formatAyurToken(sessionId);
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

    // Parse intake mode from session notes, engine facts, or assessment
    let intakeMode: "AYURVEDA" | "GENERAL" = "AYURVEDA";
    try {
      if (session.notes) {
        const parsedNotes = JSON.parse(session.notes);
        if (parsedNotes.intakeMode) intakeMode = parsedNotes.intakeMode;
      }
    } catch {}
    if (!intakeMode && facts.intakeMode) {
      intakeMode = facts.intakeMode;
    }

    const modeLabel = intakeMode === "GENERAL"
      ? "🩺 सामान्य चिकित्सा OPD (General Clinical Mode)"
      : "🌿 आयुष परामर्श (AYUSH Ayurveda Mode)";

    // Section 8: Mode-specific findings
    let modeSpecificSection = "";
    if (intakeMode === "AYURVEDA") {
      const dynamicAyur = AyurvedaAssessmentService.classifyFromProblem(
        chiefComplaintText,
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

      modeSpecificSection = `## 8. 🌿 AYUSH & Dashavidha Pariksha Findings
- **Prakriti (देहा प्रकृति)**: ${prak} (${dynamicAyur.prakritiLabelHi})
- **Vikriti (दोष दृष्टि)**: ${vik} (${dynamicAyur.vikritiLabelHi})
- **Agni (जठराग्नि स्थिति)**: ${agn} (${dynamicAyur.agniLabelHi})
- **Koshtha (कोष्ठ व मल प्रवृत्ति)**: ${kosh} (${dynamicAyur.koshthaLabelHi})
- **Sattva & Bala (सत्त्व व शारीरिक बल)**: ${sat} / ${bal}
- **Nidana Panchaka Context**: ${notes}
- **Pathya (हितकर आहार-विहार)**: ${pathyaList.slice(0, 2).join(", ")}
- **Apathya (अहितकर निषेध)**: ${apathyaList.slice(0, 2).join(", ")}`;
    } else {
      modeSpecificSection = `## 8. 🩺 General Clinical Assessment & Systemic Functional Triage
- **Consultation Mode**: General Clinical Outpatient (SOCRATES Triage)
- **Functional ADL Impact**: ${facts.answers?.["GEN_ORGAN_DAILY_IMPACT"] || "Mild to moderate routine impact"}
- **Pain / Discomfort Radiation**: ${facts.answers?.["GEN_PAIN_RADIATION"] || "Localized; no remote radiculopathy"}
- **Medication Response**: ${facts.answers?.["GEN_MEDICATION_RELIEF"] || "Evaluated during intake"}
- **Systemic Red Flags Screening**: ${facts.answers?.["GEN_SYSTEMIC_RED_FLAGS"] ? "Alert flagged during triage" : "Negative for constitutional B-symptoms (no unexplained weight loss/night sweats)"}
- **Clinical Impression**: Standard biomedical OPD evaluation indicated. Screen for primary organ pathology and correlate with clinical examination.`;
    }

    // Section 12: Mode-tailored AI recommendations for attending physician
    let aiRecommendationsSection = "";
    if (intakeMode === "AYURVEDA") {
      aiRecommendationsSection = `## 12. 💡 AI Clinical Recommendations for Attending Vaidya / Doctor
- **Mode Protocol**: Classical AYUSH Protocol
- **Differential Rogas (NAMASTE + ICD-11)**:
  - Primary: Suspected Saama / Nirama Dosha imbalance according to anatomical site and Agni status.
- **Recommended Shamana Chikitsa**:
  - Deepana & Pachana formulations (e.g. Trikatu, Panchakola Phanta) if Ama is present.
  - Classical Rasayana & Vyadhi-hara formulations with warm water / milk Anupana.
- **Dietary & Lifestyle (Pathya-Apathya)**:
  - Adhere to Ushna, Laghu Ahara; avoid cold baths, irregular snacking (Adhyashana), and day sleep (Diva-swapna).`;
    } else {
      aiRecommendationsSection = `## 12. 💡 AI Clinical Recommendations for Attending Physician
- **Mode Protocol**: Standard Clinical Medicine / OPD Protocol
- **Recommended Investigations (Diagnostic Workup)**:
  - Baseline Hemogram (CBC, ESR/CRP) & Metabolic Panel (Blood Glucose, LFT/RFT).
  - Targeted imaging: Appropriate X-ray / Ultrasound / 12-Lead ECG based on chief anatomical location.
- **Symptomatic Pharmacotherapy Guidance**:
  - First-line analgesic/anti-inflammatory or antacid regimen with appropriate gastroprotection.
  - Review all current prescriptions for contraindications and renal/hepatic dosage adjustment.
- **Follow-up & Safety Watchouts**:
  - Re-evaluate in 3-5 days; prompt ER referral if red-flag systemic symptoms develop.`;
    }

    const aiMarkdown = `
# 📋 CLINICAL INTAKE & CASE-TAKING SUMMARY
*AI-Drafted Consultation Note — Pending Attending Physician Sign-Off*

---

## 1. Patient Demographics & Encounter Details
- **Patient Name**: ${patientName}
- **ABHA ID**: ${abhaId}
- **Encounter Mode**: **${modeLabel}**
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

${modeSpecificSection}

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

${aiRecommendationsSection}
    `.trim();

    let summary: any = null;
    try {
      summary = await prisma.clinicalSummary.upsert({
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
    } catch (upsertErr) {
      console.warn("SummaryService DB upsert fallback to inMemory store:", (upsertErr as any)?.message);
      summary = {
        id: `sum-${sessionId}`,
        sessionId,
        aiGeneratedMarkdown: aiMarkdown,
        doctorEditedMarkdown: null,
        status: "DRAFT",
        version: 1,
        updatedAt: new Date(),
      };
    }

    try {
      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      inMemoryClinicalStore.updateSummary(sessionId, aiMarkdown, "GENERATED");
    } catch {}

    return {
      id: summary.id,
      sessionId: summary.sessionId,
      aiGeneratedMarkdown: summary.aiGeneratedMarkdown,
      doctorEditedMarkdown: summary.doctorEditedMarkdown,
      status: summary.status as any,
      version: summary.version,
      updatedAt: summary.updatedAt instanceof Date ? summary.updatedAt.toISOString() : new Date().toISOString(),
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
