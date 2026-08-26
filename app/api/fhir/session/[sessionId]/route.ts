import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { FhirService } from "@/lib/fhir/fhir.service";
import { AuditService } from "@/lib/services/audit.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    const bundle = FhirService.generateEncounterBundle({
      sessionId,
      patientId: "pat-demo-001",
      patientName: "Ramesh Sharma",
      gender: "male",
      birthDate: "1984-07-14",
      abhaId: "14-5542-8921-3410",
      phone: "+91 98765 43210",
      chiefComplaint: "Severe retrosternal chest pain and joint stiffness",
      diagnoses: ["Amavata (Saama Vata)", "Amlapitta (Dyspepsia)"],
      medications: [
        { name: "Tab Yogaraj Guggulu", dosage: "500mg", frequency: "1-0-1" },
        { name: "Syp Amritarishta", dosage: "15ml", frequency: "BD" },
      ],
      labObservations: [
        { testName: "HbA1c", value: 8.9, unit: "%", flag: "HIGH" },
        { testName: "Serum Creatinine", value: 2.1, unit: "mg/dL", flag: "HIGH" },
      ],
      allergies: ["No Known Drug Allergies (NKDA)"],
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
