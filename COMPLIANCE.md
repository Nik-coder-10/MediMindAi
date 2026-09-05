# ABDM Interoperability, HL7 FHIR R4 & Regulatory Compliance

**National Digital Health Ecosystem Integration**
**Ministry of Ayush / AIIA – AyurSetu Clinical Platform (AyurSetu Clinical Platform)**

---

## 🇮🇳 1. Ayushman Bharat Digital Mission (ABDM) Integration

### A. ABHA ID (Ayushman Bharat Health Account)
- **Structure**: 14-digit standardized healthcare identifier (`XX-XXXX-XXXX-XXXX`).
- **Security & KYC**: Verified via OTP/Aadhaar sandbox endpoints; mapped directly into `User.abhaId` and `AbhaLink` database records.
- **National Sandbox Readiness**: Abstracted gateway ready for National Health Authority (NHA) ABDM M1, M2, and M3 milestones (Health Information Provider & User).

### B. Granular ABDM Purpose-Limited Consent
Consent artifacts are cryptographically signed JSON records tied to specific purpose codes:
- `CARE_MANAGEMENT`: Direct clinical case-taking and triage.
- `DIAGNOSTIC_DOCUMENT`: Processing prescriptions, lab PDFs, and OCR extraction.
- `HOSPITAL_HIS_TRANSFER`: Direct HL7 FHIR hand-off to Hospital Information Systems (HIS).
- `ANONYMIZED_RESEARCH`: Aggregated epidemiological and morbidity reporting.

---

## 🏥 2. HL7 FHIR R4 Resource Mapping Specification

The platform synthesizes an **HL7 FHIR R4 Bundle** (`type: "document"`) at `GET /api/fhir/session/:sessionId` containing:

| FHIR R4 Resource | Purpose / Content | Ayush / Modern Coding System |
|---|---|---|
| **`Composition`** | Clinical intake consultation summary document header | SNOMED CT (`371530004`) + NAMASTE Portal (`NAM-DOC-AYU-INTAKE`) |
| **`Patient`** | Patient demographics, ABHA ID identifier, telecom | NDHM Health ID (`https://healthid.ndhm.gov.in`) |
| **`Encounter`** | OPD clinical session metadata & triage urgency level | HL7 ActCode (`AMB` - Ambulatory) |
| **`Condition`** | Chief complaints & diagnoses (*Amavata, Amlapitta*) | NAMASTE Portal (`NAM-AY-DIS-*`) & ICD-11 / SNOMED CT |
| **`MedicationStatement`** | Ayurvedic formulations (*Yogaraj Guggulu*) & Modern Rx | NAMASTE Medicine Codes (`NAM-AY-MED-*`) |
| **`Observation`** | Diagnostic lab values (*HbA1c, ESR, Creatinine*) with abnormal flags | LOINC & NABL Laboratory Standard Codes |
| **`AllergyIntolerance`** | Documented drug/food allergies or NKDA | HL7 AllergyIntolerance Clinical Status |

---

## 🔒 3. Data Privacy, Encryption & Audit Governance

- **Encryption at Rest**: PostgreSQL database fields and MinIO/S3 object stores leverage AES-256 encryption.
- **Zero PHI in Logs**: Structured audit trails (`AuditLog`) store only entity IDs, action verbs, and hashed metadata — no raw personally identifiable medical data.
- **Audit Logging**: Every consent grant/revoke, document scan, summary review, and FHIR export is permanently logged.
