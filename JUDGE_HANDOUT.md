# 📋 SIH 2026 Problem ID 26047 – Judge Evaluation Quick-Reference Handout
### AyurSetu / MediMind AI • Ministry of Ayush & AIIA

---

## 🌐 Live System URLs & Credentials

| Role | Portal URL | Username / Email | Password | Primary Feature to Inspect |
|---|---|---|---|---|
| 👤 **Patient Intake** | `http://localhost:3000/patient` | *(Public Kiosk / Mobile)* | *(No login required)* | Multilingual Voice Intake (Hindi/English), SOCRATES Adaptive Trees, OCR Prescription Scan. |
| 🩺 **Doctor Desk** | `http://localhost:3000/doctor` | `doctor@aiia.gov.in` | `Doctor@123` | Real-time Triage Queue, Emergency Red-Flag Banner, AI Summary Review, Edit & Sign-off. |
| 🔒 **Admin Console** | `http://localhost:3000/admin-dashboard` | `admin@aiia.gov.in` | `Admin@123` | Dynamic Question Node Editor, Red-Flag Rules Registry, Feature Flags, Morbidity Analytics. |

---

## 🏆 Key Innovation & Differentiators Matrix

| SIH Requirement | AyurSetu Implementation | Location in Codebase |
|---|---|---|
| **1. Accessibility** | Big touch targets ($\ge 56$px, 80px mic), high contrast, bilingual audio prompts, offline resilience. | [`components/ui/patient/`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/components/ui/patient/) |
| **2. Clinical Safety** | 12 Emergency Red-Flag detection rules auto-escalating triage to `EMERGENCY`; non-diagnostic objective drafts. | [`lib/engine/red-flag-rules.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/engine/red-flag-rules.ts) |
| **3. AYUSH Framework** | Charaka Samhita *Dashavidha Pariksha* (Prakriti, Vikriti, Agni, Koshtha, Sattva, Bala). | [`lib/engine/ayush-trees.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/engine/ayush-trees.ts) |
| **4. Document Intelligence** | Multimodal OCR + Medical Entity Extraction for medications, labs, vitals, and diagnoses. | [`lib/ocr/ocr.service.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/ocr/ocr.service.ts) |
| **5. Interoperability** | Full HL7 FHIR R4 Encounter Bundle export + ABDM ABHA linking and purpose-limited consent artifacts. | [`lib/fhir/fhir.service.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/fhir/fhir.service.ts) |
| **6. Security & Privacy** | Authenticated AES-256-GCM field encryption at rest, DPDP Act 2023 consent guard, tamper-evident audit trails. | [`lib/security/crypto.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/security/crypto.ts) |

---

## 🧪 Verification & Quality Commands

```bash
# Execute master test harness (24 automated clinical invariants - 100% deterministic pass)
npm test

# Static typecheck
npm run typecheck

# Production build verification
npm run build
```
