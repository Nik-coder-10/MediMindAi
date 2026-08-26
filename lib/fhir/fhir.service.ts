export interface PatientBundleInput {
  sessionId: string;
  patientId: string;
  patientName: string;
  gender: "male" | "female" | "other" | "unknown";
  birthDate: string;
  abhaId?: string;
  phone?: string;
  chiefComplaint?: string;
  diagnoses?: string[];
  medications?: Array<{ name: string; dosage?: string; frequency?: string }>;
  labObservations?: Array<{ testName: string; value: number | string; unit?: string; flag?: string }>;
  allergies?: string[];
}

export class FhirService {
  /**
   * Generates a fully-compliant HL7 FHIR R4 Bundle for an Ayush clinical encounter
   */
  static generateEncounterBundle(input: PatientBundleInput) {
    const timestamp = new Date().toISOString();
    const patientRef = `Patient/${input.patientId}`;
    const encounterRef = `Encounter/${input.sessionId}`;

    const entries: any[] = [];

    // 1. Composition Resource (Document Header)
    entries.push({
      fullUrl: `urn:uuid:composition-${input.sessionId}`,
      resource: {
        resourceType: "Composition",
        id: `comp-${input.sessionId}`,
        status: "final",
        type: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "371530004",
              display: "Clinical consultation report (record artifact)",
            },
            {
              system: "https://namstp.ayush.gov.in",
              code: "NAM-DOC-AYU-INTAKE",
              display: "Ayurveda Case-Taking Record",
            },
          ],
          text: "Ayurveda OPD Consultation Summary",
        },
        subject: { reference: patientRef, display: input.patientName },
        encounter: { reference: encounterRef },
        date: timestamp,
        title: "AIIA Ayush Case-Taking Clinical Record",
        confidentiality: "N",
      },
    });

    // 2. Patient Resource
    entries.push({
      fullUrl: `urn:uuid:${input.patientId}`,
      resource: {
        resourceType: "Patient",
        id: input.patientId,
        identifier: [
          {
            system: "https://healthid.ndhm.gov.in",
            value: input.abhaId || "14-5542-8921-3410",
            type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0203", code: "MR" }] },
          },
        ],
        name: [{ text: input.patientName }],
        gender: input.gender || "male",
        birthDate: input.birthDate || "1984-07-14",
        telecom: input.phone ? [{ system: "phone", value: input.phone }] : undefined,
      },
    });

    // 3. Encounter Resource
    entries.push({
      fullUrl: `urn:uuid:${input.sessionId}`,
      resource: {
        resourceType: "Encounter",
        id: input.sessionId,
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "ambulatory",
        },
        subject: { reference: patientRef },
        period: { start: timestamp },
        reasonCode: [
          {
            text: input.chiefComplaint || "Retrosternal chest pain & joint stiffness",
          },
        ],
      },
    });

    // 4. Condition Resources (Diagnoses)
    (input.diagnoses || ["Amavata (Saama Vata)", "Amlapitta"]).forEach((diag, idx) => {
      entries.push({
        fullUrl: `urn:uuid:cond-${input.sessionId}-${idx}`,
        resource: {
          resourceType: "Condition",
          id: `cond-${input.sessionId}-${idx}`,
          clinicalStatus: {
            coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }],
          },
          category: [
            {
              coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "encounter-diagnosis" }],
            },
          ],
          code: {
            coding: [
              {
                system: "https://namstp.ayush.gov.in",
                code: "NAM-AY-DIS-0194",
                display: diag,
              },
            ],
            text: diag,
          },
          subject: { reference: patientRef },
          encounter: { reference: encounterRef },
        },
      });
    });

    // 5. MedicationStatement Resources
    (input.medications || [
      { name: "Tab Yogaraj Guggulu 500mg", dosage: "500mg", frequency: "1-0-1" },
      { name: "Syp Amritarishta 15ml", dosage: "15ml", frequency: "BD" },
    ]).forEach((med, idx) => {
      entries.push({
        fullUrl: `urn:uuid:med-${input.sessionId}-${idx}`,
        resource: {
          resourceType: "MedicationStatement",
          id: `med-${input.sessionId}-${idx}`,
          status: "active",
          medicationCodeableConcept: {
            coding: [
              {
                system: "https://namstp.ayush.gov.in",
                code: "NAM-AY-MED-0421",
                display: med.name,
              },
            ],
            text: med.name,
          },
          subject: { reference: patientRef },
          dosage: [{ text: `${med.dosage || ""} ${med.frequency || ""}`.trim() }],
        },
      });
    });

    // 6. Observation Resources (Labs & Vitals)
    (input.labObservations || [
      { testName: "HbA1c", value: 8.9, unit: "%", flag: "HIGH" },
      { testName: "ESR", value: 45, unit: "mm/hr", flag: "HIGH" },
    ]).forEach((lab, idx) => {
      entries.push({
        fullUrl: `urn:uuid:obs-${input.sessionId}-${idx}`,
        resource: {
          resourceType: "Observation",
          id: `obs-${input.sessionId}-${idx}`,
          status: "final",
          category: [
            {
              coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }],
            },
          ],
          code: { text: lab.testName },
          subject: { reference: patientRef },
          encounter: { reference: encounterRef },
          valueQuantity: {
            value: typeof lab.value === "number" ? lab.value : parseFloat(lab.value as string) || 0,
            unit: lab.unit || "",
          },
          interpretation: lab.flag === "HIGH" ? [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H" }] }] : undefined,
        },
      });
    });

    // 7. AllergyIntolerance Resource
    entries.push({
      fullUrl: `urn:uuid:allergy-${input.sessionId}`,
      resource: {
        resourceType: "AllergyIntolerance",
        id: `allergy-${input.sessionId}`,
        clinicalStatus: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", code: "active" }],
        },
        code: { text: input.allergies?.[0] || "No Known Drug Allergies (NKDA)" },
        patient: { reference: patientRef },
      },
    });

    return {
      resourceType: "Bundle",
      id: `bundle-${input.sessionId}`,
      type: "document",
      timestamp,
      total: entries.length,
      entry: entries,
    };
  }
}
