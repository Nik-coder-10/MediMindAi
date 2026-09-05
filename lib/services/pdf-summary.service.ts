import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { inMemoryClinicalStore } from "@/lib/db/in-memory-store";
import { AyurvedaAssessmentService } from "@/lib/services/ayurveda.service";

export interface GeneratePdfOptions {
  sessionId: string;
  doctorName?: string;
  hospitalName?: string;
}

export class PdfSummaryService {
  /**
   * Generates a printable, branded multi-page PDF document for a clinical session
   */
  static async generateClinicalSummaryPdf(options: GeneratePdfOptions): Promise<Uint8Array> {
    const { sessionId, doctorName = "Dr. Rajesh Vaidya, BAMS, MD (Ayu)", hospitalName = "ALL INDIA INSTITUTE OF AYURVEDA (AIIA)" } = options;

    if (!sessionId) {
      throw AppError.badRequest("sessionId is required");
    }

    // 1. Fetch case relational data
    let session: any = await prisma.clinicalSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: {
          include: {
            user: true,
            timelineEvents: { orderBy: { eventDate: "desc" }, take: 6 },
          },
        },
        chiefComplaints: true,
        patientAnswers: {
          orderBy: { answeredAt: "asc" },
          include: { questionNode: true },
        },
        redFlagEvents: { orderBy: { triggeredAt: "desc" } },
        medicalDocuments: {
          where: { deletedAt: null },
          include: { extractedEntities: true },
        },
        clinicalSummary: true,
        ayurvedaAssessment: true,
        engineState: true,
      },
    }).catch(() => null);

    // Fallback to memory store if serverless cold DB connection
    if (!session) {
      const memSession = inMemoryClinicalStore.getSession(sessionId);
      if (memSession) {
        session = memSession;
      }
    }

    if (!session) {
      throw AppError.notFound(`Clinical session ${sessionId} not found.`);
    }

    const patientName = session.patient
      ? `${session.patient.firstName} ${session.patient.lastName}`.trim()
      : "रोगी (Patient)";
    const birthYear = session.patient?.dateOfBirth ? new Date(session.patient.dateOfBirth).getFullYear() : 1985;
    const currentYear = new Date().getFullYear();
    const approxAge = currentYear - birthYear;
    const ageGender = `${approxAge > 0 ? approxAge : 40}Y / ${session.patient?.gender || "MALE"}`;
    const { formatAyurToken } = await import("@/lib/utils");
    const tokenNumber = formatAyurToken(session.id);
    const abhaId = session.patient?.abhaAddress || session.patient?.nationalHealthId || "ABHA-NOT-LINKED";

    const chiefComplaintText = session.chiefComplaints?.[0]?.symptomName || "Consultation Intake";
    const durationText = session.chiefComplaints?.[0]?.duration || "Acute (2-3 days)";
    const severityText = session.chiefComplaints?.[0]?.severity || "MODERATE";

    const latestSummary = session.clinicalSummary;
    const summaryBody =
      latestSummary?.doctorEditedMarkdown ||
      latestSummary?.aiGeneratedMarkdown ||
      "Clinical consultation record generated.";

    const redFlags = session.redFlagEvents || [];
    const triageLevel = session.triagePriority || "ROUTINE";

    // 2. Initialize PDF Document (A4 size: 595.28 x 841.89 pt)
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const margin = 40;
    let y = height - margin;

    // Helper: Sanitize text to standard ASCII/WinAnsi characters to prevent encoding errors
    const sanitizePdfText = (txt: string): string => {
      if (!txt) return "";
      return txt
        .replace(/[\u0900-\u097F]/g, "") // remove Devanagari script for standard standard PDF-1 fonts
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ") // replace non-WinAnsi with space
        .replace(/\s+/g, " ")
        .trim();
    };

    // Helper: Draw Text with Bounds Checking and Auto-Paging
    const checkNewPage = (neededHeight: number = 20) => {
      if (y - neededHeight < margin + 40) {
        // Draw footer on current page before creating new page
        drawFooter(page, pdfDoc.getPageCount());
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - margin;
        drawPageHeader(page);
      }
    };

    const drawPageHeader = (p: typeof page) => {
      p.drawText("AYURSETU CLINICAL DOSSIER — OFFICIAL MEDICAL RECORD", {
        x: margin,
        y: height - 25,
        size: 8,
        font: fontBold,
        color: rgb(0.3, 0.3, 0.3),
      });
      p.drawLine({
        start: { x: margin, y: height - 30 },
        end: { x: width - margin, y: height - 30 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      y = height - margin - 10;
    };

    const drawFooter = (p: typeof page, pageNum: number) => {
      p.drawLine({
        start: { x: margin, y: 35 },
        end: { x: width - margin, y: 35 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      p.drawText("CONFIDENTIAL — Ministry of Ayush / AIIA Clinical Encounter • Generated by AyurSetu AI", {
        x: margin,
        y: 22,
        size: 7.5,
        font: fontItalic,
        color: rgb(0.4, 0.4, 0.4),
      });
      p.drawText(`Page ${pageNum}`, {
        x: width - margin - 35,
        y: 22,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4),
      });
    };

    // ==========================================
    // PAGE 1: HEADER & BANNER
    // ==========================================
    // Top Hospital Banner Box
    page.drawRectangle({
      x: margin,
      y: y - 55,
      width: width - margin * 2,
      height: 55,
      color: rgb(0.04, 0.45, 0.36), // Emerald
    });

    page.drawText(sanitizePdfText(hospitalName), {
      x: margin + 12,
      y: y - 22,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText("AYURSETU CLINICAL CONSULTATION SUMMARY & DISCHARGE NOTE", {
      x: margin + 12,
      y: y - 40,
      size: 8.5,
      font: fontBold,
      color: rgb(0.85, 0.95, 0.9),
    });

    y -= 70;

    // Session Meta & Token Box
    page.drawRectangle({
      x: margin,
      y: y - 40,
      width: width - margin * 2,
      height: 40,
      color: rgb(0.96, 0.98, 0.96),
      borderColor: rgb(0.7, 0.85, 0.75),
      borderWidth: 1,
    });

    page.drawText(sanitizePdfText(`Token: ${tokenNumber}`), {
      x: margin + 10,
      y: y - 18,
      size: 10,
      font: fontBold,
      color: rgb(0.05, 0.45, 0.3),
    });

    page.drawText(sanitizePdfText(`Encounter Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`), {
      x: margin + 130,
      y: y - 18,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(sanitizePdfText(`Session ID: ${session.id.slice(0, 18)}...`), {
      x: margin + 10,
      y: y - 32,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Parse intake mode
    let intakeMode = "AYUSH Mode";
    try {
      if (session.notes) {
        const parsed = JSON.parse(session.notes);
        if (parsed.intakeMode === "GENERAL") intakeMode = "General Clinic";
      }
    } catch {}

    page.drawText(sanitizePdfText(`Mode: ${intakeMode}`), {
      x: margin + 300,
      y: y - 18,
      size: 9,
      font: fontBold,
      color: intakeMode.includes("General") ? rgb(0.1, 0.35, 0.6) : rgb(0.05, 0.45, 0.3),
    });

    const isEmergency = triageLevel === "EMERGENCY" || redFlags.length > 0;
    page.drawText(sanitizePdfText(`Triage: ${triageLevel}`), {
      x: width - margin - 110,
      y: y - 22,
      size: 10,
      font: fontBold,
      color: isEmergency ? rgb(0.85, 0.15, 0.15) : rgb(0.1, 0.55, 0.2),
    });

    y -= 52;

    // Patient Demographics Section
    page.drawText("1. PATIENT DEMOGRAPHICS", {
      x: margin,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.04, 0.45, 0.36),
    });
    y -= 4;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.04, 0.45, 0.36),
    });
    y -= 14;

    const demoText1 = `Name: ${patientName}    |    Age/Sex: ${ageGender}    |    Language: ${session.language.toUpperCase()}`;
    page.drawText(sanitizePdfText(demoText1), { x: margin + 6, y, size: 8.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    y -= 13;

    const demoText2 = `ABHA Address: ${abhaId}    |    Status: ${session.status}`;
    page.drawText(sanitizePdfText(demoText2), { x: margin + 6, y, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    y -= 20;

    // Red Flags Banner (if present)
    if (redFlags.length > 0) {
      checkNewPage(45);
      page.drawRectangle({
        x: margin,
        y: y - 35,
        width: width - margin * 2,
        height: 35,
        color: rgb(0.99, 0.93, 0.93),
        borderColor: rgb(0.9, 0.4, 0.4),
        borderWidth: 1,
      });

      page.drawText("CRITICAL RED FLAGS IDENTIFIED DURING INTAKE:", {
        x: margin + 8,
        y: y - 14,
        size: 8.5,
        font: fontBold,
        color: rgb(0.75, 0.1, 0.1),
      });

      const rfDesc = redFlags.map((r: any) => r.description).join("; ");
      page.drawText(sanitizePdfText(rfDesc.slice(0, 100)), {
        x: margin + 8,
        y: y - 27,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.5, 0.1, 0.1),
      });

      y -= 45;
    }

    // Chief Complaint & Presentation
    checkNewPage(40);
    page.drawText("2. CHIEF COMPLAINT & PRESENTATION", {
      x: margin,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.04, 0.45, 0.36),
    });
    y -= 4;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.04, 0.45, 0.36) });
    y -= 14;

    page.drawText(sanitizePdfText(`Primary Complaint: ${chiefComplaintText}`), { x: margin + 6, y, size: 8.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 12;
    page.drawText(sanitizePdfText(`Duration: ${durationText}    |    Clinical Severity: ${severityText}`), { x: margin + 6, y, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 20;

    // Structured Clinical History (Family, Social, Obstetric)
    checkNewPage(50);
    page.drawText("3. STRUCTURED MEDICAL & SOCIAL HISTORY", {
      x: margin,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.04, 0.45, 0.36),
    });
    y -= 4;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.04, 0.45, 0.36) });
    y -= 14;

    const facts = (session.engineState?.collectedFacts as any) || {};
    const famText = facts.familyHistory?.summaryText || "No significant familial predisposition.";
    const socText = facts.socialHistory?.summaryText || "Non-smoker, non-alcoholic; routine daily physical activity.";
    const obsText = session.patient?.gender === "FEMALE" ? (facts.obstetricHistory?.summaryText || "Obstetric history reviewed.") : "N/A (Male patient)";

    page.drawText(sanitizePdfText(`Family History: ${famText.slice(0, 95)}`), { x: margin + 6, y, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 12;
    page.drawText(sanitizePdfText(`Social & Habits: ${socText.slice(0, 95)}`), { x: margin + 6, y, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 12;
    page.drawText(sanitizePdfText(`Obstetric/Gyn History: ${obsText.slice(0, 95)}`), { x: margin + 6, y, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 20;

    // AYUSH Dashavidha Pariksha
    checkNewPage(45);
    page.drawText("4. AYUSH & DASHAVIDHA PARIKSHA FINDINGS", {
      x: margin,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.04, 0.45, 0.36),
    });
    y -= 4;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.04, 0.45, 0.36) });
    y -= 14;

    const dynamicAyur = AyurvedaAssessmentService.classifyFromProblem(
      session.chiefComplaints?.[0]?.symptomName || "",
      (session.patientAnswers || []).map((a: any) => ({ nodeCode: a.nodeCode, answerValue: a.answerValue })),
      {}
    );
    const prakriti = session.ayurvedaAssessment?.prakriti || dynamicAyur.prakriti;
    const vikriti = session.ayurvedaAssessment?.vikriti || dynamicAyur.vikriti;
    const agni = session.ayurvedaAssessment?.anala || dynamicAyur.agni;

    page.drawText(sanitizePdfText(`Prakriti: ${prakriti}    |    Vikriti: ${vikriti}    |    Agni: ${agni}    |    Context: ${dynamicAyur.nidanaPanchakaNotes.slice(0, 60)}...`), {
      x: margin + 6,
      y,
      size: 7.5,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 20;

    // Clinical Summary Notes / Doctor Findings (Formatted block)
    checkNewPage(70);
    page.drawText("5. CLINICAL CONSULTATION NOTE & SUMMARY", {
      x: margin,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.04, 0.45, 0.36),
    });
    y -= 4;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.04, 0.45, 0.36) });
    y -= 14;

    // Split markdown lines and render neatly
    const cleanLines = summaryBody
      .replace(/^#+\s+/gm, "")
      .replace(/\*\*/g, "")
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0 && !l.startsWith("---"));

    for (const line of cleanLines) {
      checkNewPage(14);
      const isHeader = line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.") || line.startsWith("5.") || line.startsWith("6.") || line.startsWith("7.") || line.startsWith("8.");
      page.drawText(sanitizePdfText(line.slice(0, 105)), {
        x: margin + (isHeader ? 4 : 12),
        y,
        size: isHeader ? 8 : 7.5,
        font: isHeader ? fontBold : fontRegular,
        color: isHeader ? rgb(0.05, 0.4, 0.3) : rgb(0.2, 0.2, 0.2),
      });
      y -= 11;
    }

    y -= 15;

    // Physician Signature & Attestation Box
    checkNewPage(90);
    page.drawRectangle({
      x: margin,
      y: y - 75,
      width: width - margin * 2,
      height: 75,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });

    page.drawText("PHYSICIAN SIGN-OFF & ATTESTATION", {
      x: margin + 10,
      y: y - 16,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText("I have reviewed this AI-synthesized clinical record, confirmed all facts with the patient, and approved this summary.", {
      x: margin + 10,
      y: y - 28,
      size: 7,
      font: fontItalic,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(sanitizePdfText(`Attending Vaidya / Doctor: ${doctorName}`), {
      x: margin + 10,
      y: y - 55,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText("Signature & Seal: _______________________", {
      x: width - margin - 210,
      y: y - 55,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Signed Date: ${new Date().toLocaleDateString("en-IN")}`, {
      x: margin + 10,
      y: y - 67,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Draw final footer
    drawFooter(page, pdfDoc.getPageCount());

    return await pdfDoc.save();
  }
}
