# 📋 SIH 2026 Problem ID 26047 – Judge Evaluation Quick-Reference Handout
### AyurSetu / MediMind AI • Ministry of Ayush & AIIA Case-Taking Software

---

## 🌐 Live System Deployment & Demo Credentials

| Role / Portal | Live URL | Demo Login / Account | Key Highlights to Inspect |
|---|---|---|---|
| 👤 **Patient Intake (Mobile/Kiosk)** | [Live App](https://medi-mind-ai-eight.vercel.app/hi/patient/consent) | Auto-filled: Ramesh Sharma (`14-5542-8921-3410`) | Hindi/English TTS, 80px touch buttons, SOCRATES trees, Red-Flag 108 Hook, Camera OCR, IndexedDB offline resume. |
| 🩺 **Doctor Triage Desk** | [Doctor Portal](https://medi-mind-ai-eight.vercel.app/hi/doctor) | `dr.rajesh.vaidya@aiia.gov.in` / Pre-filled | Real-time SSE alert banner, triage priority sorting, AI-Drafted summary editor, 1-click branded PDF dossier export. |
| 📊 **Admin Morbidity Analytics** | [Analytics](https://medi-mind-ai-eight.vercel.app/hi/admin/analytics) | `director.ayush@nic.in` / Pre-filled | 10 KPI cards, Top 8 Complaints bar chart, Red-flag rule breakdown, Date filters (TODAY/7D/30D/ALL), CSV export, DPDP compliance. |
| 🖥️ **OPD Kiosk Mode** | [Kiosk Mode](https://medi-mind-ai-eight.vercel.app/hi/kiosk) | Direct touch interface | 10-minute inactivity auto-reset, multi-lingual audio guidance, zero-login intake. |

---

## 🏆 Problem 26047 Evaluation Criteria Mapping

| Evaluation Metric | AyurSetu Technical Implementation | Code Reference |
|---|---|---|
| **1. Zero-Training Accessibility** | Touch targets $\ge 56$–80px, Web Speech API & Indian-accented TTS, auto-resuming IndexedDB storage, bilingual Hindi/English. | [`components/ui/patient/`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/components/ui/patient/) |
| **2. Non-Diagnostic Clinical Safety** | 12 hardcoded Red-Flag rules, calm 108 Emergency Call / Staff Alert hook, non-diagnostic AI drafts with prominent *"AI-Drafted — Physician Reviewed"* badge. | [`lib/engine/red-flag-rules.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/engine/red-flag-rules.ts) |
| **3. Classical AYUSH & Dashavidha Integration** | Full Charaka Samhita *Dashavidha Pariksha* (Prakriti, Vikriti, Agni, Koshtha, Sattva, Bala) integrated seamlessly with modern SOCRATES history. | [`lib/engine/ayush-trees.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/engine/ayush-trees.ts) |
| **4. Document Intelligence & OCR** | Mobile camera capture with on-device canvas contrast enhancement, bilingual Tesseract OCR, confidence scoring, and drug-interaction warnings. | [`lib/ocr/ocr.service.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/ocr/ocr.service.ts) |
| **5. ABDM & FHIR Interoperability** | Full HL7 FHIR R4 Bundle generation, ABHA KYC linking, purpose-limited digital consent artifacts, and printable vector PDF dossiers. | [`lib/fhir/fhir.service.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/fhir/fhir.service.ts) |
| **6. Security & DPDP Compliance** | Application-level AES-256-GCM field encryption, tamper-evident audit logging, and strictly aggregated, non-identifiable analytics. | [`lib/security/crypto.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/security/crypto.ts) |

---

## 🧪 Verification Commands

```bash
# 1. Master Clinical Test Suite (154 automated assertions across 22 suites)
npm test

# 2. Strict Static TypeScript Typecheck
npm run typecheck

# 3. Next.js Production Build
npm run build
```

