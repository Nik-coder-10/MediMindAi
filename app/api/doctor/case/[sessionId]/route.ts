import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { SummaryService } from "@/lib/services/summary.service";
import { MedicalTimelineService } from "@/lib/services/timeline.service";
import { AyurvedaAssessmentService } from "@/lib/services/ayurveda.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    // 1. Fetch Summary
    let summary = await SummaryService.getSummary(sessionId);
    if (!summary) {
      summary = await SummaryService.generateSummary({ sessionId });
    }

    // 2. Fetch Timeline & Labs
    const timeline = await MedicalTimelineService.getPatientTimeline("pat-demo-001");
    const demoLabs = [
      { testName: "HbA1c", value: 8.9 },
      { testName: "Hemoglobin", value: 9.2 },
      { testName: "Serum Creatinine", value: 2.1 },
      { testName: "ESR", value: 45 },
    ];
    const abnormalLabs = MedicalTimelineService.evaluateAbnormalLabs(demoLabs);

    // 3. Complete Aggregated Case Dossier
    const caseData = {
      sessionId,
      patient: {
        id: "pat-demo-001",
        firstName: "Ramesh",
        lastName: "Sharma",
        age: 42,
        gender: "MALE",
        bloodGroup: "B+",
        abhaId: "14-5542-8921-3410",
        phone: "+91 98765 43210",
        preferredLanguage: "hi",
      },
      encounter: {
        triagePriority: "EMERGENCY",
        redFlagTriggered: true,
        startedAt: "2026-08-26T10:30:00Z",
        chiefComplaint: "Severe retrosternal crushing chest pain radiating to left arm",
        status: "IN_PROGRESS",
      },
      redFlags: [
        {
          ruleId: "RF_ACS_RADIATION",
          description: "Chest pain radiating to left arm, neck, or jaw. Possible Acute Coronary Syndrome.",
          severity: "CRITICAL",
          triggeredAt: "2026-08-26T10:34:00Z",
        },
        {
          ruleId: "RF_CARDIAC_AUTONOMIC_SIGNS",
          description: "Associated cold sweating (diaphoresis) and shortness of breath.",
          severity: "CRITICAL",
          triggeredAt: "2026-08-26T10:36:00Z",
        },
      ],
      summary,
      timeline,
      abnormalLabs,
      ayurveda: {
        prakriti: "Vata-Kapha",
        vikriti: "Vata-Pitta Dushti",
        agni: "Vishamagni (Irregular)",
        koshtha: "Krura (Hard / Constipated)",
        sattva: "Madhyama",
        bala: "Madhyama",
      },
      documents: [
        {
          fileName: "AIIA_Prescription_Opd.pdf",
          type: "PRESCRIPTION",
          uploadedAt: "2026-08-26T10:32:00Z",
          medications: [
            { name: "Tab Yogaraj Guggulu 500mg", frequency: "1-0-1", duration: "15 days" },
            { name: "Syp Amritarishta 15ml", frequency: "BD", duration: "15 days" },
          ],
        },
      ],
      consent: {
        status: "ACTIVE",
        grantedAt: "2026-08-26T10:28:00Z",
        purposes: ["HISTORY_TAKING", "DOCTOR_SHARING", "ABDM"],
        ipAddress: "103.21.14.88",
      },
    };

    return apiSuccess(caseData);
  } catch (error) {
    return apiError(error);
  }
}
