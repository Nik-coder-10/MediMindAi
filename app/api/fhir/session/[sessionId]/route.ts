import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { FhirService } from "@/lib/fhir/fhir.service";
import { AuditService } from "@/lib/services/audit.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const { session } = await AuthService.requireSessionAccess(req, sessionId);

    const fullSession = await prisma.clinicalSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: { include: { user: true, abhaLink: true } },
        chiefComplaints: true,
        medicalDocuments: { include: { extractedEntities: true } },
      },
    });

    const patientName = fullSession?.patient
      ? `${fullSession.patient.firstName} ${fullSession.patient.lastName}`
      : "Patient";

    const extractedMeds = fullSession?.medicalDocuments.flatMap((d: any) =>
      d.extractedEntities
        .filter((e: any) => e.type === "MEDICATION")
        .map((m: any) => ({
          name: m.structuredData?.normalisedName || m.rawText,
          dosage: m.structuredData?.dosage || "Standard",
          frequency: m.structuredData?.frequency || "OD",
        }))
    ) || [];

    const extractedLabs = fullSession?.medicalDocuments.flatMap((d: any) =>
      d.extractedEntities
        .filter((e: any) => e.type === "LAB")
        .map((l: any) => ({
          testName: l.structuredData?.testName || l.rawText,
          value: l.structuredData?.value || l.rawText,
          unit: l.structuredData?.unit || "",
          flag: "EVALUATED",
        }))
    ) || [];

    const rawGender = fullSession?.patient?.gender?.toLowerCase();
    const gender: "male" | "female" | "other" | "unknown" =
      rawGender === "male" || rawGender === "female" || rawGender === "other"
        ? rawGender
        : "unknown";

    const bundle = FhirService.generateEncounterBundle({
      sessionId,
      patientId: fullSession?.patientId || "pat-001",
      patientName,
      gender,
      birthDate: fullSession?.patient?.dateOfBirth ? fullSession.patient.dateOfBirth.toISOString().split("T")[0] : "1990-01-01",
      abhaId: fullSession?.patient?.user?.abhaId || fullSession?.patient?.abhaLink?.abhaNumber || "14-5542-8921-3410",
      phone: fullSession?.patient?.user?.phone || "+91 98765 43210",
      chiefComplaint: fullSession?.chiefComplaints?.[0]?.symptomName || "Clinical Consultation",
      diagnoses: ["Ayush Case Consultation"],
      medications: extractedMeds,
      labObservations: extractedLabs,
      allergies: ["NKDA"],
    });



    // Log compliance export event
    await AuditService.log({
      action: "FHIR_BUNDLE_EXPORT",
      resourceType: "FhirResource",
      resourceId: sessionId,
      metadata: { totalResources: bundle.total, fhirVersion: "R4" },
    });

    return apiSuccess({
      sessionId,
      fhirVersion: "R4",
      bundle,
    });
  } catch (error) {
    return apiError(error);
  }
}
