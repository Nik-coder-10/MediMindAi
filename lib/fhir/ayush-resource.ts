import { FHIRBundle, FHIRPatient } from "./types";

export interface AyushEncounterFHIRInput {
  patientId: string;
  patientName: string;
  abhaId?: string;
  gender: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  diagnosis: string;
  namasteCode?: string;
  ashtavidha?: Record<string, string | null>;
}

export class AyushFHIRBuilder {
  static createPatientResource(input: AyushEncounterFHIRInput): FHIRPatient {
    return {
      resourceType: "Patient",
      id: input.patientId,
      identifier: [
        {
          system: "https://healthid.abdm.gov.in",
          value: input.abhaId || input.patientId,
        },
      ],
      name: [{ text: input.patientName }],
      gender: input.gender,
      birthDate: input.birthDate,
    };
  }

  static createAyushEncounterBundle(input: AyushEncounterFHIRInput): FHIRBundle {
    const patientResource = this.createPatientResource(input);
    return {
      resourceType: "Bundle",
      id: `bundle-${Date.now()}`,
      type: "document",
      entry: [
        {
          fullUrl: `urn:uuid:${patientResource.id}`,
          resource: patientResource,
        },
      ],
    };
  }
}
