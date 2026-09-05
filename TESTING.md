# Automated Testing Suite & CI Verification

**AyurSetu Clinical Platform**

---

## 🧪 1. Test Harness Overview

The platform includes a deterministic automated test harness verifying all clinical, diagnostic, and compliance services:

| Suite | Component Tested | Core Invariants Verified |
|---|---|---|
| **1. Adaptive Question Engine** | `AdaptiveEngineService` | State machine traversal, dynamic branching, fact aggregation. |
| **2. Red-Flag Safety Rules** | `CLINICAL_RED_FLAG_REGISTRY` | All 12 emergency detection rules and severity escalation (`CRITICAL`). |
| **3. Clinical Summary Lifecycle** | `SummaryService` | Non-diagnostic prompt enforcement, section presence, version increments (`DRAFT` → `REVISED` → `ACCEPTED`). |
| **4. AYUSH Dashavidha Pariksha** | `AyurvedaAssessmentService` | Charaka Samhita 10-fold parameter capture & formatted summary blocks. |
| **5. HL7 FHIR R4 Bundle** | `FhirService` | `Composition`, `Patient`, `Encounter`, `Condition`, `MedicationStatement`, `Observation`, `AllergyIntolerance`. |
| **6. Cryptography & Security** | `FieldEncryptionService` | AES-256-GCM authenticated encryption roundtrip & PII masking. |
| **7. Laboratory Detection** | `MedicalTimelineService` | ICMR/NABL reference range comparison and flag assignment (`HIGH`, `LOW`). |

---

## 🚀 2. Running the Test Suite

```bash
# Run complete test harness
npm test

# Run TypeScript static typecheck
npm run typecheck

# Run full Next.js production build verification
npm run build
```
