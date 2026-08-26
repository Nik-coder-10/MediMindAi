import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { SummaryService } from "@/lib/services/summary.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const summary = await SummaryService.getSummary(sessionId);
    return apiSuccess(summary || { sessionId, status: "NOT_FOUND" });
  } catch (error) {
    return apiError(error);
  }
}

const updateSchema = z.object({
  doctorEditedMarkdown: z.string().min(1, "doctorEditedMarkdown is required"),
  status: z.enum(["DRAFT", "ACCEPTED", "REJECTED", "REVISED"]).default("REVISED"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const body = await req.json();
    const validated = updateSchema.parse(body);
    const updated = await SummaryService.updateDoctorSummary({
      sessionId,
      doctorEditedMarkdown: validated.doctorEditedMarkdown,
      status: validated.status,
    });
    return apiSuccess(updated, 200);
  } catch (error) {
    return apiError(error);
  }
}
