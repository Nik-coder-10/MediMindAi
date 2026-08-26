import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { MedicalEntityExtractor } from "@/lib/ocr/ocr.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const sampleRaw = `
    DIAGNOSIS: Amavata (Saama Vata-Kaphaja)
    Rx:
    1. Tab Yogaraj Guggulu 500mg - 1-0-1 - 15 days
    2. Syp Amritarishta 15ml - BD - 15 days
    LABS:
    - HbA1c: 6.8 % (Ref: 4.0 - 5.6 %) [HIGH]
    - ESR: 38 mm/hr (Ref: 0 - 15 mm/hr) [HIGH]
    `;
    const entities = MedicalEntityExtractor.extractEntities(sampleRaw);
    return apiSuccess({
      documentId,
      entities,
    });
  } catch (error) {
    return apiError(error);
  }
}
