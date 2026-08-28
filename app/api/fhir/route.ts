import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AyushFHIRBuilder } from "@/lib/fhir/ayush-resource";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || `sess-${Date.now()}`;
    const patientId = searchParams.get("patientId") || "pat-anonymous";
    const patientName = searchParams.get("name") || "Patient Record";
    const abhaId = searchParams.get("abhaId") || "ABHA-PENDING";
    const diagnosis = searchParams.get("diagnosis") || "General Ayurvedic Consultation";

    const bundle = AyushFHIRBuilder.createAyushEncounterBundle({
      patientId,
      patientName,
      abhaId,
      gender: "unknown",
      birthDate: "1990-01-01",
      diagnosis,
      namasteCode: "NAM-AY-DIS-0194",
    });

    return apiSuccess({
      sessionId,
      fhirBundle: bundle,
    });
  } catch (error) {
    return apiError(error);
  }
}
