import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, entityId, originalValue, correctedValue, doctorId } = body;

    // Log correction for audit and training feedback loop
    console.log(`[OCR_CORRECTION_LOG] Doc: ${documentId} | Entity: ${entityId} | Old: "${originalValue}" -> New: "${correctedValue}" | By: ${doctorId || "Doctor"}`);

    return apiSuccess({
      success: true,
      message: "संशोधन सफलतापूर्वक दर्ज किया गया (Correction Logged Successfully)",
      correctedValue,
    });
  } catch (error) {
    return apiError(error);
  }
}
