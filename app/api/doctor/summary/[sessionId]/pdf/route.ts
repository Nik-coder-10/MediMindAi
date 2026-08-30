import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/auth-guard";
import { PdfSummaryService } from "@/lib/services/pdf-summary.service";
import { apiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctor/summary/[sessionId]/pdf
 * Generates and downloads a printable, multi-page branded PDF clinical dossier.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const doctor = await AuthService.requireDoctor(req);
    const sessionId = params.sessionId;

    const doctorName = (doctor as any).name || "Dr. Rajesh Vaidya, MD (Ayu)";

    const pdfBytes = await PdfSummaryService.generateClinicalSummaryPdf({
      sessionId,
      doctorName,
    });

    const shortToken = sessionId.replace(/-/g, "").slice(0, 4).toUpperCase();
    const filename = `AyurSetu_Clinical_Summary_${shortToken}_${Date.now()}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
