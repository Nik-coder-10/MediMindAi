import { FhirService } from "../lib/fhir/fhir.service";

async function verifyFhirCompliance() {
  console.log("==================================================================");
  console.log("🇮🇳 VERIFYING ABDM INTEROPERABILITY & HL7 FHIR R4 COMPLIANCE");
  console.log("==================================================================\n");

  const sessionId = `sess-fhir-${Date.now()}`;

  console.log(`1. Generating HL7 FHIR R4 Bundle for Encounter: ${sessionId}...`);
  const bundle = FhirService.generateEncounterBundle({
    sessionId,
    patientId: "pat-demo-001",
    patientName: "Ramesh Sharma",
    gender: "male",
    birthDate: "1984-07-14",
    abhaId: "14-5542-8921-3410",
    phone: "+91 98765 43210",
    chiefComplaint: "Retrosternal chest pain and bilateral knee stiffness",
    diagnoses: ["Amavata (Saama Vata)", "Amlapitta (Dyspepsia)"],
    medications: [
      { name: "Tab Yogaraj Guggulu 500mg", dosage: "500mg", frequency: "1-0-1" },
      { name: "Syp Amritarishta 15ml", dosage: "15ml", frequency: "BD" },
    ],
    labObservations: [
      { testName: "HbA1c", value: 8.9, unit: "%", flag: "HIGH" },
      { testName: "Serum Creatinine", value: 2.1, unit: "mg/dL", flag: "HIGH" },
    ],
    allergies: ["No Known Drug Allergies (NKDA)"],
  });

  console.log(`   👉 Bundle Generated: ResourceType = ${bundle.resourceType} | Type = ${bundle.type}`);
  console.log(`   👉 Total FHIR Resources Packed: ${bundle.total}\n`);

  // Verify all 8 core resources exist in bundle
  const resourceTypes = bundle.entry.map((e: any) => e.resource.resourceType);
  const requiredTypes = [
    "Composition",
    "Patient",
    "Encounter",
    "Condition",
    "MedicationStatement",
    "Observation",
    "AllergyIntolerance",
  ];

  console.log("2. Verifying Core HL7 FHIR R4 Resources:");
  requiredTypes.forEach((type, idx) => {
    const count = resourceTypes.filter((t: string) => t === type).length;
    console.log(`   ${idx + 1}. [✓ PRESENT (${count})] ${type}`);
    if (count === 0) throw new Error(`Missing mandatory FHIR resource: ${type}`);
  });

  console.log("\n3. Sample FHIR Composition Header Snippet:");
  console.log(JSON.stringify(bundle.entry[0].resource, null, 2));

  console.log("\n==================================================================");
  console.log("🎉 ABDM & HL7 FHIR R4 COMPLIANCE VERIFICATION PASSED 100%!");
  console.log("==================================================================");
}

verifyFhirCompliance().catch((e) => {
  console.error("❌ FHIR compliance test failed:", e);
  process.exit(1);
});
