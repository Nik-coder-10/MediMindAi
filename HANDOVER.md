# 📦 Technical Handover & Architecture Extension Package

**AyurSetu / MediMind AI • AyurSetu Clinical Platform**

---

## 📂 1. Production Codebase Organization

```
├── app/                        # Next.js App Router (Bilingual [locale] pages & REST APIs)
│   ├── [locale]/
│   │   ├── patient/            # Language -> Consent -> Complaint -> Questions -> Documents -> Summary
│   │   ├── doctor/             # Triage Queue & Individual Case Review Workspace
│   │   └── admin-dashboard/    # Dynamic Tree Manager & Rule Registry
│   └── api/                    # 12 REST API route groups (ABDM, FHIR, Voice, Admin, Doctor, Patient)
├── components/ui/              # Atomic UI & Accessibility components
│   ├── patient/                # ExtraLargeButton, VoiceInputButton, AudioPrompt, EmergencyModal
│   ├── clinical/               # MedicalTimelineView, LabIndicatorBadge
│   └── common/                 # NetworkStatusBanner, SkeletonCard, EmptyStateCard, ErrorStateModal
├── lib/
│   ├── engine/                 # Adaptive SOCRATES engine & Charaka Samhita Dashavidha Pariksha
│   ├── services/               # Decoupled Service Layer (Summary, Timeline, RedFlag, Ayurveda, Consent)
│   ├── ocr/                    # Multimodal OCR & NER Medical Entity Extractor
│   ├── fhir/                   # HL7 FHIR R4 Bundle generator
│   └── security/               # AES-256-GCM field encryption & DPDP consent guards
├── messages/                   # Translation dictionaries (hi.json, en.json, mr.json)
├── prisma/                     # Database schema, migrations, and seed scripts
└── tests/                      # Master automated clinical test harness
```

---

## 🔌 2. How to Plug in Production Cloud AI Services

1. **ASR (Speech-to-Text)**: Set `VOICE_PROVIDER="bhashini"` or `"whisper"` in `.env`.
2. **OCR (Prescription Intelligence)**: Set `OCR_PROVIDER="azure-form-recognizer"` or `"google-document-ai"`.
3. **ABDM Gateway**: Connect credentials in `ABDM_CLIENT_ID` and `ABDM_CLIENT_SECRET` pointing to the live NHA Gateway.

---

## 🛡️ 3. Clinical Safety Guarantee
- The application strictly operates as an **objective medical intake and documentation tool**. It never delivers automated differential diagnoses to patients, ensuring that the attending physician remains the sole clinical authority.
