import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AyushFHIRBuilder } from "@/lib/fhir/ayush-resource";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || "sess-demo-001";
    const patientId = searchParams.get("patientId") || "pat-demo-001";

    const bundle = AyushFHIRBuilder.createAyushEncounterBundle({
      patientId,
      patientName: "Ramesh Sharma",
      abhaId: "14-5542-8921-3410",
      gender: "male",
      birthDate: "1982-07-14",
      diagnosis: "Amavata (Saama Vata-Kaphaja)",
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
