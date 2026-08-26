import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { SummaryService } from "@/lib/services/summary.service";

const updateSummarySchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  doctorEditedMarkdown: z.string().min(1, "doctorEditedMarkdown is required"),
  status: z.enum(["DRAFT", "ACCEPTED", "REJECTED", "REVISED"]).default("ACCEPTED"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = updateSummarySchema.parse(body);
    const summary = await SummaryService.updateDoctorSummary(validated as any);
    return apiSuccess(summary, 200);
  } catch (error) {
    return apiError(error);
  }
}
