# ⏱️ AyurSetu Clinical Platform — Winning Live Demonstration Script
### AyurSetu / MediMind AI • Ministry of Ayush & AIIA Case-Taking Software

**Target Duration**: 4–6 Minutes | **Target Audience**: Clinical Evaluators & Medical Jury

---

## 🎯 Quick Credentials & Setup

| Portal | URL | Demo Account / Credentials |
|---|---|---|
| 🌐 **Live Web Deployment** | `https://medi-mind-ai-eight.vercel.app/` | *(Auto-configured)* |
| 👤 **Patient Kiosk / Mobile** | `/patient/consent` or `/kiosk` | Pre-filled: Ramesh Sharma (`14-5542-8921-3410`) |
| 🩺 **Doctor Triage Desk** | `/doctor` | Pre-filled: Dr. Arvind K. Sharma (AIIA Vaidya) |
| 📊 **Admin Morbidity Analytics** | `/admin/analytics` | Pre-filled: Ministry Admin / Nodal Officer |

---

## ⏱️ Step-by-Step 5-Minute Demonstration Walkthrough

### ⏳ Minute 1: Problem Context & Patient Consent (0:00 – 1:00)
1. **Pitch**: *"Judges, in crowded government & Ayush OPDs, doctors spend up to 70% of time manually recording basic history. AyurSetu gives rural and elderly patients a multilingual voice-first intake, while keeping the physician in 100% diagnostic control."*
2. **Open** `/[locale]/patient/consent` (or `/kiosk`).
3. Select **हिंदी (Hindi)** or **English**. Tap the audio speaker icon to demonstrate bilingual voice read-out of the DPDP / ABDM consent notice.
4. Tap **"स्वीकार करें (Consent & Continue)"** (large 64px touch target).

---

### ⏳ Minute 2: Clinical Mode, Voice Complaint & Adaptive SOCRATES Intake (1:00 – 2:30)
1. **Mode Selection**: Choose **आयुर्वेद परामर्श (AYUSH Mode)** to enable Dashavidha Pariksha + modern medical SOCRATES trees.
2. **Chief Complaint**: Tap the microphone icon or quick-select *"छाती में तेज दर्द और भारीपन"* (Chest Pain & Heaviness) or *"जोड़ों में दर्द"* (Joint Pain).
3. **Adaptive Branching**: Walk through 3–4 SOCRATES questions:
   - Onset $\rightarrow$ Character $\rightarrow$ Radiation to left arm $\rightarrow$ Cold Sweating.
4. **Emergency Red Flag Hook**:
   - When radiation/dyspnea is selected, show the calm **Clinical Red Flag Warning** with the **Alert Medical Staff / Call 108** instant action button.

---

### ⏳ Minute 3: Document Scanner & Structured History (2:30 – 3:30)
1. **Document Capture**: Open `/patient/documents`.
   - Use the **Camera Document Capture** or upload a sample prescription.
   - Show instant on-device contrast enhancement + bilingual OCR extraction of medications (*Yogaraja Guggulu*, *Aspirin*) and lab tests.
2. **Structured History Modules**:
   - Showcase captured **Family History** (Parental HTN/CAD), **Social History** (Diet/Tobacco), and **Gynecological History** (when applicable).
3. **Patient Summary Preview**:
   - Review the patient-facing plain-language summary. Tap **"डॉक्टर को भेजें (Submit to Doctor)"**.
   - Note the generated OPD Token: `#AYUR-9842`.

---

### ⏳ Minute 4: Real-time Doctor Desk, Notifications & AI Dossier (3:30 – 4:45)
1. **Open** `/[locale]/doctor` in another tab.
2. **Real-time SSE Notification**: Show the high-priority red-flag banner and audio notification chime.
3. **Doctor Queue**: Highlight patient Ramesh Sharma sorted to the top under **🚨 EMERGENCY / URGENT**.
4. **Open Case Dossier** (`/doctor/case/[sessionId]`):
   - **AI-Drafted Summary**: Prominent *"AI-Drafted — Physician Reviewed"* badge.
   - **Inline Physician Editing**: Edit a recommendation, click Save, and show version incrementing.
   - **One-Click PDF Export**: Click **"Download Dossier PDF"** to generate the official branded AIIA summary dossier.
   - **Sign-Off**: Click **"स्वीकृत व हस्ताक्षर करें (Accept & Sign)"**.

---

### ⏳ Minute 5: Administrative Morbidity Analytics & FHIR Interoperability (4:45 – 5:30)
1. **Open** `/[locale]/admin/analytics`.
2. **Showcase KPIs**: Total Intakes, Red-flag rate, AYUSH adoption %, Average intake duration (3.8 min), Top 8 Chief Complaints bar chart, Red-flag rule breakdown, and 1-click **CSV Export**.
3. **Privacy Compliance**: Point out strict DPDP 2023 aggregation — zero PHI exposed on analytics views.
4. **Conclude**: *"AyurSetu delivers a safe, accessible, and standards-compliant bridge between patients and doctors for modern India."*

---

## 🏆 Key Talking Points for Evaluator Questions

- **Q: Does the AI make autonomous diagnoses?**
  *A: Absolutely not. AyurSetu drafts structured objective findings and non-diagnostic summaries. The attending physician must review, edit, and sign off on all prescriptions and diagnoses.*
- **Q: How does it work in rural areas with poor connectivity?**
  *A: The intake flow uses IndexedDB durable snapshots, auto-queues answers offline, and synchronizes automatically upon network reconnection.*
- **Q: How is patient privacy safeguarded?**
  *A: End-to-end AES-256-GCM encryption, purpose-limited ABDM consent artifacts, and strict role-based access control with tamper-evident audit trails.*

