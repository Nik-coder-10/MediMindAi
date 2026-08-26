import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { MedicalTimelineService } from "@/lib/services/timeline.service";

export async function GET(req: NextRequest) {
  try {
    const demoLabs = [
      { testName: "HbA1c", value: 8.9 },
      { testName: "Hemoglobin", value: 9.2 },
      { testName: "Serum Creatinine", value: 2.1 },
      { testName: "ESR", value: 45 },
      { testName: "Platelets", value: 2.4 }, // Normal
    ];

    const abnormalLabs = MedicalTimelineService.evaluateAbnormalLabs(demoLabs);

    return apiSuccess({
      abnormalCount: abnormalLabs.length,
      abnormalLabs,
      disclaimer: "Non-diagnostic indicators for physician review only.",
    });
  } catch (error) {
    return apiError(error);
  }
}
