# ⏱️ SIH 2026 Problem 26047 Winning Live Demonstration Script
### AI-Powered Patient Case-Taking Software (Ministry of Ayush / AIIA)

**Total Duration**: 12 Minutes | **Target Audience**: SIH Technical & Medical Evaluators

---

## 🎯 Timing & Stage Breakdown

### ⏳ Phase 1: Problem Positioning & Core Stance (0:00 – 2:00)
- **Opening Line**: *"Honorable Judges, in overcrowded OPDs, doctors spend up to 70% of consultation time manually asking repetitive questions and deciphering old handwritten papers. AyurSetu transforms this by serving as an intelligent multilingual clinical case-taking assistant where the doctor is always in complete diagnostic control."*
- **Key Differentiators**:
  1. Zero-training usability for elderly and rural citizens (large touch targets $\ge 56$px, bilingual voice-first).
  2. Classical Charaka Samhita *Dashavidha Pariksha* embedded for Ministry of Ayush.
  3. Strict non-diagnostic safety guardrails with 12 real-time emergency red-flag triggers.

---

### ⏳ Phase 2: Live Patient Voice Flow & Emergency Safety (2:00 – 6:00)
- **Action**: Open `/patient` on mobile simulation (or laptop browser).
- **Step 1: Language & Consent**: Select **हिंदी (Hindi)**. Show the ABDM-style audio prompt reading the consent purpose.
- **Step 2: AYUSH Clinical Mode**: Tap **"आयुर्वेद परामर्श (AYUSH Mode)"**.
- **Step 3: Voice Intake**: Tap the huge 80px microphone button and speak in Hindi:
  - *Say*: *"कल रात से मेरी छाती में बहुत तेज दर्द और भारीपन हो रहा है, जो बाएं हाथ में जा रहा है।"*
- **Step 4: Adaptive SOCRATES Branching**:
  - Show how the engine dynamically adapts next questions (Duration $\rightarrow$ Severity $\rightarrow$ Radiation $\rightarrow$ Cold Sweating).
- **Step 5: Emergency Red-Flag Alert**:
  - Point out the **Calm Emergency Modal** (`RF_ACS_RADIATION` detected) offering instant 108 emergency escalation.
- **Step 6: Document Scanner**:
  - Upload `sample_prescription_aiia.txt` and showcase instant OCR NER extraction of *Tab Yogaraj Guggulu* and *Syp Amritarishta*.
- **Step 7: Final Summary Preview**:
  - Show the plain-language *"What the Doctor Will See"* screen and tap **"डॉक्टर को भेजें (Submit to Doctor)"**. Show OPD Token `#AIIA-104`.

---

### ⏳ Phase 3: Doctor Triage Dashboard & Clinical Review (6:00 – 9:00)
- **Action**: Switch to `/doctor`.
- **Triage Queue**:
  - Show live sorting: **🚨 EMERGENCY** patient (Ramesh Sharma) pulsing at the top of the queue.
- **Open Patient Case Dossier (`/doctor/case/[id]`)**:
  - **Top Bar**: Demographics, ABHA ID, and prominent Red-Flag Alert banner (never below the fold).
  - **Tab 1 - AI Clinical Summary**: Show structured 9-section markdown draft. Demonstrate live inline physician editing and version increment from `DRAFT (v1)` to `REVISED (v2)`.
  - **Tab 2 - Longitudinal Timeline**: Multi-year history (*Diabetes 2019 $\rightarrow$ Metformin 2024 $\rightarrow$ Chest Pain 2026*).
  - **Tab 3 - Abnormal Labs**: Color-coded out-of-range indicators (*HbA1c 8.9% HIGH, Serum Creatinine 2.1 HIGH*).
  - **Action**: Click **"स्वीकृत व हस्ताक्षर करें (Accept & Sign)"**.

---

### ⏳ Phase 4: AYUSH Mode & ABDM / FHIR Interoperability (9:00 – 10:30)
- **Ayush Dashavidha Pariksha Tab**:
  - Showcase structured capture of *Prakriti (Vata-Kapha)*, *Vikriti*, *Agni (Vishamagni)*, *Koshtha (Krura)*, and *Sattva*.
- **Interoperability & FHIR Export**:
  - Demonstrate instant export of full **HL7 FHIR R4 Bundle** at `/api/fhir/session/:sessionId` containing `Composition`, `Patient`, `Encounter`, `Condition`, `MedicationStatement`, and `Observation`.
  - Click **"Send to Hospital HIS"** and show cryptographic audit trail.

---

### ⏳ Phase 5: Admin Panel & Security Governance (10:30 – 11:30)
- **Action**: Open `/admin-dashboard`.
- **Dynamic Content Manager**:
  - Show how Ministry administrators can add new question nodes or modify safety red-flag rules without touching source code.
- **Security & DPDP 2023**:
  - Mention application-level **AES-256-GCM** encryption at rest, secure HTTP headers, and tamper-evident `AuditLog`.

---

### ⏳ Phase 6: Conclusion & Impact Summary (11:30 – 12:00)
- **Closing**: *"AyurSetu delivers a clinically safe, culturally grounded, ABDM-compliant case-taking solution that saves valuable physician time while ensuring zero diagnostic errors in primary healthcare."*
- **Open for Evaluator Q&A**.
