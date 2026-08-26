import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { MedicalTimelineService } from "@/lib/services/timeline.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId") || "pat-demo-001";
    const timeline = await MedicalTimelineService.getPatientTimeline(patientId);

    return apiSuccess({
      patientId,
      eventCount: timeline.length,
      timeline,
    });
  } catch (error) {
    return apiError(error);
  }
}
