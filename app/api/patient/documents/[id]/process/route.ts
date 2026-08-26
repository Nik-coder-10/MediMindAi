import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { OCRService } from "@/lib/ocr/ocr.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const { ocr, entities } = await OCRService.processDocument(Buffer.from([]), "application/pdf");
    return apiSuccess({
      documentId,
      status: "EXTRACTED",
      ocr,
      entities,
    });
  } catch (error) {
    return apiError(error);
  }
}
