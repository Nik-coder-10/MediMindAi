import { PrismaClient, Role, Gender, SessionStatus, TriagePriority, TurnRole, RedFlagSeverity, DocumentType, EntityType, SummaryStatus, DoshaDominance } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROD_SEED) {
    console.error("🛑 FATAL: Database seed is disabled in production environments.");
    process.exit(1);
  }

  console.log("🌱 Seeding database with realistic Ayush clinical data (Dev/Staging only)...");

  // 1. Create Doctor User & Profile
  const doctorUser = await prisma.user.upsert({
    where: { email: "dr.rajesh.vaidya@aiia.gov.in" },
    update: {},
    create: {
      role: Role.DOCTOR,
      phone: "+919811223344",
      email: "dr.rajesh.vaidya@aiia.gov.in",
      preferredLanguage: "hi",
      doctorProfile: {
        create: {
          registrationNumber: "AYUSH-DEL-2015-8842",
          qualification: "BAMS, MD (Ayurveda - Kayachikitsa)",
          specialization: "Kayachikitsa & Panchakarma",
          department: "Ayurvedic Internal Medicine",
          hospitalAffiliation: "All India Institute of Ayurveda (AIIA), New Delhi",
        },
      },
    },
    include: { doctorProfile: true },
  });
  console.log("✅ Created Doctor:", doctorUser.email);

  // 2. Create Patient User & Profile
  const patientUser = await prisma.user.upsert({
    where: { email: "ramesh.sharma@example.com" },
    update: {},
    create: {
      role: Role.PATIENT,
      phone: "+919876543210",
      email: "ramesh.sharma@example.com",
      abhaId: "14-5542-8921-3410",
      preferredLanguage: "hi",
      patientProfile: {
        create: {
          firstName: "Ramesh",
          lastName: "Sharma",
          dateOfBirth: new Date("1982-07-14"),
          gender: Gender.MALE,
          bloodGroup: "B+",
          address: "Sector 12, Dwarka, New Delhi",
          baselinePrakriti: DoshaDominance.VATA_PITTA,
          emergencyContact: {
            name: "Sunita Sharma",
            phone: "+919876543211",
            relationship: "Spouse",
          },
          medicalHistory: {
            pastIllnesses: ["Amavata (Rheumatoid symptoms for 2 yrs)", "Amlapitta (Hyperacidity)"],
            chronicConditions: ["Hypertension (Controlled)"],
            allergies: ["Penicillin", "Dust / Parag"],
          },
          abhaLink: {
            create: {
              abhaNumber: "14-5542-8921-3410",
              abhaAddress: "ramesh.sharma@sbx",
              kycVerified: true,
            },
          },
        },
      },
    },
    include: { patientProfile: { include: { abhaLink: true } } },
  });
  console.log("✅ Created Patient:", patientUser.email);

  const patientProfile = patientUser.patientProfile!;
  const doctorProfile = doctorUser.doctorProfile!;

  // 3. Create ABDM Consent Record
  const consent = await prisma.consentRecord.create({
    data: {
      patientId: patientProfile.id,
      purpose: "Ayush OPD Consultation & Longitudinal Health Record Analysis",
      language: "hi",
      audioConsentUrl: "s3://ayush-medical-records/consent/ramesh-sharma-audio-consent.webm",
      version: "1.0",
      ipAddress: "192.168.1.45",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AyurSetu/1.0",
      metadata: {
        hiTypes: ["DiagnosticReport", "Prescription", "OPConsultation"],
        hipId: "AIIA_DELHI_HIP_01",
      },
    },
  });
  console.log("✅ Created Consent Record:", consent.id);

  // 4. Create Clinical Session
  const session = await prisma.clinicalSession.create({
    data: {
      patientId: patientProfile.id,
      doctorId: doctorProfile.id,
      status: SessionStatus.IN_PROGRESS,
      language: "hi",
      triagePriority: TriagePriority.URGENT,
      redFlagTriggered: true,
      notes: "Patient reported acute severe joint stiffness and feverish feeling.",
    },
  });
  console.log("✅ Created Clinical Session:", session.id);

  // 5. Create Conversation Turns (Voice/Text stream)
  await prisma.conversationTurn.createMany({
    data: [
      {
        sessionId: session.id,
        role: TurnRole.AI,
        contentText: "नमस्ते रमेश जी, आपको आज क्या तकलीफ हो रही है? (Namaste Ramesh ji, what issues are you facing today?)",
        timestamp: new Date(Date.now() - 15 * 60000),
      },
      {
        sessionId: session.id,
        role: TurnRole.PATIENT,
        contentText: "मुझे पिछले ५ दिनों से दोनों घुटनों और कलाइयों में बहुत तेज दर्द और जकड़न है, सुबह उठते ही चला नहीं जाता। (Severe pain and stiffness in knees and wrists for 5 days, unable to walk in morning.)",
        contentAudioUrl: "s3://ayush-medical-records/audio/turn-002-patient.webm",
        timestamp: new Date(Date.now() - 14 * 60000),
        metadata: { asrConfidence: 0.96, detectedEmotion: "distress" },
      },
      {
        sessionId: session.id,
        role: TurnRole.AI,
        contentText: "क्या आपको जोड़ों में सूजन या छूने पर गर्म महसूस होता है? और भूख कैसी लग रही है? (Is there swelling/heat in joints, and how is your appetite?)",
        timestamp: new Date(Date.now() - 13 * 60000),
      },
      {
        sessionId: session.id,
        role: TurnRole.PATIENT,
        contentText: "हाँ, जोड़ों में सूजन है और भूख बिल्कुल नहीं लग रही, पेट भारी रहता है। (Yes, swelling is present, zero appetite, abdomen feels heavy.)",
        timestamp: new Date(Date.now() - 12 * 60000),
      },
    ],
  });
  console.log("✅ Created Conversation Turns");

  // 6. Create Chief Complaints & Adaptive Question Answers
  await prisma.chiefComplaint.createMany({
    data: [
      {
        sessionId: session.id,
        symptomName: "Sandhishoola & Sandhishotha (Joint Pain and Swelling)",
        duration: "5 days",
        severity: "Severe",
        location: "Bilateral knees and wrists",
        aggravatingFactors: "Early morning, cold weather",
        relievingFactors: "Warm fomentation (Svedana)",
      },
      {
        sessionId: session.id,
        symptomName: "Agnimandya (Loss of Appetite)",
        duration: "1 week",
        severity: "Moderate",
        aggravatingFactors: "Heavy food",
      },
    ],
  });

  await prisma.adaptiveAnswer.createMany({
    data: [
      {
        sessionId: session.id,
        questionId: "AGNI_AMA_01",
        questionText: "Does the joint pain increase after eating heavy or oily meals?",
        answerText: "Yes, pain and heaviness intensify after heavy meals.",
        clinicalContext: "Ama Lakshana (Toxic metabolic residue identification)",
        confidence: 0.94,
      },
      {
        sessionId: session.id,
        questionId: "NIDRA_01",
        questionText: "How is your sleep quality?",
        answerText: "Disturbed sleep due to nocturnal throbbing pain.",
        clinicalContext: "Vata Prakopa in Asthi/Sandhi",
        confidence: 0.92,
      },
    ],
  });
  console.log("✅ Created Chief Complaints & Adaptive Answers");

  // 7. Create Red Flag Safety Event
  await prisma.redFlagEvent.create({
    data: {
      sessionId: session.id,
      ruleId: "RF_ACUTE_INFLAMMATORY_POLYARTHRITIS",
      description: "Severe acute multi-joint swelling with systemic Agnimandya and high distress.",
      severity: RedFlagSeverity.HIGH,
      notified: true,
      notifiedAt: new Date(),
      actionTaken: "Flagged for priority senior Vaidya clinical review.",
    },
  });
  console.log("✅ Created Red Flag Event");

  // 8. Create Medical Document & OCR Extracted Entities
  const document = await prisma.medicalDocument.create({
    data: {
      sessionId: session.id,
      type: DocumentType.PRESCRIPTION,
      originalFileUrl: "s3://ayush-medical-records/docs/ramesh-prior-prescription.pdf",
      fileName: "Prior_Ayush_Rx_2025.pdf",
      mimeType: "application/pdf",
      fileSize: 428900,
      language: "en",
      ocrRawText: "Rx: Yogaraja Guggulu 2 tab BD, Maharasnadi Kwatha 20ml BD with lukewarm water.",
    },
  });

  await prisma.extractedMedicalEntity.createMany({
    data: [
      {
        documentId: document.id,
        type: EntityType.MEDICATION,
        rawText: "Yogaraja Guggulu 2 tab BD",
        structuredData: {
          medicineName: "Yogaraja Guggulu",
          formulation: "Vati / Tablet",
          dosage: "2 tablets (500mg each)",
          frequency: "Twice daily",
          anupana: "Lukewarm water",
          standardCode: { namaste: "NAM-AY-FORM-0842" },
        },
        confidence: 0.98,
        isVerifiedByDoctor: true,
      },
      {
        documentId: document.id,
        type: EntityType.DIAGNOSIS,
        rawText: "Amavata (Rheumatoid Arthritis)",
        structuredData: {
          diseaseName: "Amavata",
          icd10: "M06.9",
          namaste: "NAM-AY-DIS-0194",
        },
        confidence: 0.95,
        isVerifiedByDoctor: true,
      },
    ],
  });

  await prisma.medicalTimelineEvent.create({
    data: {
      patientId: patientProfile.id,
      sourceDocumentId: document.id,
      eventDate: new Date("2025-11-10"),
      title: "Previous Ayush Consultation - Amavata Initial Phase",
      category: "PRESCRIPTION",
      description: "Prescribed classical Vata-shamana formulations (Yogaraja Guggulu).",
    },
  });
  console.log("✅ Created Medical Document, OCR Entities, and Timeline Event");

  // 9. Create Clinical Summary
  await prisma.clinicalSummary.create({
    data: {
      sessionId: session.id,
      aiGeneratedMarkdown: `### AI Clinical Summary
- **Patient**: Ramesh Sharma, 44M, ABHA: 14-5542-8921-3410
- **Prakriti**: Vata-Pitta | **Vikriti**: Vata-Kapha with Saama condition
- **Chief Complaints**: Severe bilateral Sandhishoola (Knees/Wrists), morning stiffness > 1 hour, Agnimandya.
- **Triage**: URGENT (Red Flag: Acute inflammatory polyarthritis pattern).
- **Provisional Ayush Diagnosis**: Amavata (Saama Avastha).`,
      doctorEditedMarkdown: `### Validated Clinical Summary (Dr. Rajesh Vaidya)
- **Diagnosis**: Amavata (Saama Vata-Kaphaja)
- **Principle of Treatment (Chikitsa Sutra)**: Langhana, Svedana, Tikta-Katu Deepana, and Virechana consideration after Niraama state.`,
      status: SummaryStatus.ACCEPTED,
      version: 1,
      reviewedAt: new Date(),
    },
  });

  // 10. Create Comprehensive Ayurveda Assessment (Dashavidha & Ashtavidha Pariksha)
  await prisma.ayurvedaAssessment.create({
    data: {
      sessionId: session.id,
      prakriti: DoshaDominance.VATA_PITTA,
      vikriti: DoshaDominance.VATA_KAPHA,
      dushya: "Rasa, Asthi, Sandhi, Snayu",
      desha: "Sadharana Desha (Urban Delhi NCR)",
      bala: "Madhyama (Moderate physical strength)",
      kala: "Varsha / Shishira exacerbation",
      anala: "Manda Agni (Sluggish digestion with Ama)",
      sara: "Meda & Asthi Sara - Madhyama",
      samhanana: "Madhyama",
      pramana: "Prakrita (Normal proportions)",
      satmya: "Katu-Lavana Satmya",
      sattva: "Madhyama Sattva",
      aharaShakti: "Avara (Subdued food consumption & digestion)",
      vyayamaShakti: "Avara (Severely impaired due to pain)",
      vaya: "Madhyama Vaya (44 Years)",
      ashtavidhaData: {
        nadi: "Manda, Sarpagati with Kapha-Vata anubandha",
        mutra: "Prakrita, slightly pale yellow",
        mala: "Baddha, Saama with mucus tendencies",
        jihwa: "Saama (Thick white coating present)",
        shabda: "Spashta, mildly fatigued",
        sparsha: "Sheeta-Snigdha at extremities, localized Ushnatva at joints",
        drik: "Prakrita, no scleral icterus",
        akriti: "Madhyama",
      },
      aharaVihara: {
        dietaryHabits: "Frequent cold water, oily snacks, irregular lunch times",
        sleepPattern: "6 hours, disturbed due to pain",
        stressLevel: "Moderate workplace stress",
      },
      notes: "Classical Saama Amavata presentation. Advised Pachana-Deepana prior to Brimhana.",
    },
  });
  console.log("✅ Created Ayurveda Assessment (Charaka Samhita Model)");

  // 11. Create FHIR Resource & Audit Log
  await prisma.fhirResource.create({
    data: {
      patientId: patientProfile.id,
      sessionId: session.id,
      resourceType: "Bundle",
      resourceJson: {
        resourceType: "Bundle",
        type: "document",
        identifier: { system: "https://abdm.gov.in/bundles", value: `ABDM-BUNDLE-${session.id}` },
        entry: [
          {
            resource: {
              resourceType: "Patient",
              id: patientProfile.id,
              name: [{ text: "Ramesh Sharma" }],
              gender: "male",
              birthDate: "1982-07-14",
            },
          },
          {
            resource: {
              resourceType: "Condition",
              code: {
                coding: [
                  { system: "http://namstp.ayush.gov.in", code: "NAM-AY-DIS-0194", display: "Amavata" },
                  { system: "http://hl7.org/fhir/sid/icd-10", code: "M06.9", display: "Rheumatoid arthritis" },
                ],
              },
            },
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: doctorUser.id,
      action: "CLINICAL_SESSION_CONSULTATION_SAVED",
      resourceType: "ClinicalSession",
      resourceId: session.id,
      ipAddress: "192.168.1.10",
      metadata: { role: "DOCTOR", specialty: "Kayachikitsa" },
    },
  });
  console.log("✅ Created FHIR Resource & Audit Log");

  console.log("\n🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
