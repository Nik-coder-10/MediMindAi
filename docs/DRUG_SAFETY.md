# 💊 Drug Interaction & Allergy Safety Engine

**Smart India Hackathon 2026 – Problem ID 26047**  
**AyurSetu / MediMindAi Clinical Safety Layer**

---

## 1. Overview & Purpose

Clinical documentation intake and prescription OCR in high-volume Indian OPDs frequently encounter polypharmacy, multiple chronic comorbidities, and dual usage of Allopathic and Ayurvedic medicines.

AyurSetu implements an active **Drug Interaction & Allergy Cross-Check Engine** (`lib/clinical/drug-safety.service.ts`) that runs automatically upon:
1. **Document Processing & Entity Extraction** (new medications detected from prescriptions).
2. **Clinical Summary Synthesis** (generating draft consultation notes for physician sign-off).
3. **Doctor Case Dossier Retrieval** (`GET /api/doctor/case/[sessionId]`).

---

## 2. Severity Classification & Advisory Matrix

| Severity | Category | Example Interaction / Conflict | Clinical Mechanism & Physician Action |
| :--- | :--- | :--- | :--- |
| 🔴 **CRITICAL** | `DRUG_ALLERGY` | **Penicillin Allergy + Amoxicillin** | High risk of Type I IgE-mediated anaphylaxis. Contraindicated; switch to macrolides/quinolones. |
| 🔴 **CRITICAL** | `DRUG_ALLERGY` | **Aspirin / NSAID Allergy + Ibuprofen** | Risk of bronchospasm / urticaria in AERD patients. Use Paracetamol with caution. |
| 🔴 **CRITICAL** | `DRUG_DRUG` | **Warfarin + NSAIDs (Diclofenac / Aspirin)** | Severe gastrointestinal & systemic bleeding risk due to platelet impairment and mucosal injury. |
| 🟠 **MAJOR** | `DRUG_DRUG` | **Telmisartan / ACE Inhibitors + Potassium** | Risk of life-threatening hyperkalemia. Check serum electrolytes & renal function. |
| 🟠 **MAJOR** | `DRUG_DRUG` | **Metformin + Iodinated Radiocontrast** | Risk of contrast-induced acute renal failure and lactic acidosis. Withhold metformin 48h prior. |
| 🟡 **MODERATE** | `HERB_DRUG` | **Glimepiride / Metformin + Yogaraj Guggulu / Gurmar** | Additive hypoglycemic synergy. Monitor blood glucose closely; adjust allopathic dosage as required. |
| 🟡 **MODERATE** | `DRUG_DRUG` | **Clopidogrel + Omeprazole** | CYP2C19 competitive inhibition reduces clopidogrel active metabolite. Switch to Pantoprazole. |
| 🟡 **MODERATE** | `DRUG_DRUG` | **Atorvastatin + Azithromycin** | CYP3A4 inhibition increases statin concentration; risk of myopathy / rhabdomyolysis. |

---

## 3. Physician-in-the-Loop Workflow & Audit Logging

In compliance with medical clinical decision support (CDS) guidelines:
- **Never shown directly to patients**: Patients see clear summaries of what they reported without alarming or confusing interaction jargon.
- **Doctor Case Workspace**: Safety alerts appear as high-visibility colored cards with:
  - Clinical mechanism summary
  - Actionable physician advisory note
  - Involved substances
- **Acknowledgment & Dismissal Controls**:
  - `✓ समीक्षा संपन्न (Acknowledge)`: Marks alert as reviewed (No action needed).
  - `⚡ कार्रवाई की गई (Action Taken)`: Prompts doctor to record clinical change (e.g. *Switched Omeprazole to Pantoprazole*).
  - Both actions generate an immutable record via `AuditService.log()` with `DRUG_SAFETY_ALERT_REVIEWED`.

---

## 4. Extensibility & External CDS Integration

The `DrugSafetyService` is structured as a pluggable provider interface. In production environments, it can connect seamlessly to external databases via REST APIs:
- **OpenFDA / DailyMed**
- **DrugBank Clinical API**
- **First Databank (FDB) / Lexicomp**
- **Ayurvedic Pharmacopoeia of India (API) Formularies**
