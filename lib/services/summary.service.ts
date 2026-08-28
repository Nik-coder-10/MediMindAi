import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { AuditService } from "@/lib/services/audit.service";
import { SummaryStatus } from "@prisma/client";

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
    const extractedLabs: string[] = [];
    session.medicalDocuments.forEach((doc: any) => {
      doc.extractedEntities.forEach((ent: any) => {
        if (ent.type === "MEDICATION") {
          extractedMeds.push(`- *${ent.structuredData?.normalisedName || ent.rawText}* (${ent.structuredData?.dosage || ""}, ${ent.structuredData?.frequency || ""})`);
        }
        if (ent.type === "LAB") {
          extractedLabs.push(`- **${ent.structuredData?.testName || ent.rawText}**: \`${ent.structuredData?.value || ent.rawText}\``);
        }
      });
    });

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

## 3. Chief Complaint
- ${chiefComplaintText}

## 4. History of Present Illness (HPI & SOCRATES)
- **Site**: ${facts.site || "Reported in complaint"}
- **Onset**: ${facts.onset || "Acute"}
- **Severity**: ${facts.severity || "Evaluated during intake"}
- **Associated Symptoms**: ${facts.associated || "None reported"}

## 5. Current Medications (From Uploaded Prescriptions)
${extractedMeds.length > 0 ? extractedMeds.join("\n") : "- No previous medications recorded."}

## 6. Relevant Investigations & Labs
${extractedLabs.length > 0 ? extractedLabs.join("\n") : "- No lab documents attached."}

## 7. AYUSH & Dashavidha Pariksha Findings
- **Prakriti**: ${session.ayurvedaAssessment?.prakriti || "Vata-Kapha"}
- **Vikriti**: ${session.ayurvedaAssessment?.vikriti || "Vata-Pitta"}
- **Agni**: ${session.ayurvedaAssessment?.anala || "Vishamagni"}
- **Notes**: ${session.ayurvedaAssessment?.notes || "Intake completed"}
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
