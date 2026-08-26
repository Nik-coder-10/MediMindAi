import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { DocumentService } from "@/lib/services/document.service";

const registerDocumentSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  type: z.enum(["PRESCRIPTION", "LAB", "DISCHARGE", "IMAGING", "OTHER"]).default("PRESCRIPTION"),
  originalFileUrl: z.string().min(1, "originalFileUrl is required"),
  fileName: z.string().min(1, "fileName is required"),
  mimeType: z.string().default("application/pdf"),
  fileSize: z.number().int().nonnegative().default(0),
  ocrRawText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerDocumentSchema.parse(body);
    const document = await DocumentService.registerDocument(validated as any);
    return apiSuccess(document, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return apiSuccess({ message: "Provide ?sessionId=<id> to list documents" });
    }
    const docs = await DocumentService.listSessionDocuments(sessionId);
    return apiSuccess({ sessionId, documents: docs });
  } catch (error) {
    return apiError(error);
  }
}
