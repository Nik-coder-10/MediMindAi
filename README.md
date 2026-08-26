# 🌿 AyurSetu / MediMind AI (SIH 2026 Problem ID 26047)
### Intelligent Multilingual Patient Case-Taking & Clinical Decision Support System
**Ministry of Ayush / All India Institute of Ayurveda (AIIA)**

---

## 🌟 Executive Summary

**AyurSetu** is an intelligent, voice-first patient case-taking system engineered for rural accessibility, clinical safety, and classical Ayurvedic diagnostic frameworks (*Charaka Samhita Dashavidha Pariksha*).

It bridges the doctor-patient gap in overcrowded Indian Outpatient Departments (OPDs) by capturing longitudinal histories, extracting medical document entities via OCR, screening for 12 life-threatening red-flag emergencies, and synthesizing structured, non-diagnostic clinical summaries for physician sign-off.

---

## 🚀 One-Command Quickstart

```bash
# Clone the repository
git clone https://github.com/Nik-coder-10/MediMindAi.git
cd MediMindAi

# 1. Run via Docker Compose (Recommended)
docker-compose up --build -d

# 2. Or Run Locally with Node.js
npm install
npm run dev
```

Visit: **`http://localhost:3000`**

---

## 🔑 Pre-Seeded Evaluation Accounts

| Role | Username / Email | Password | Access Details |
|---|---|---|---|
| 👤 **Patient** | `patient@aiia.gov.in` | `Patient@123` | Patient intake, voice interaction, document scanner |
| 🩺 **Doctor / Vaidya** | `doctor@aiia.gov.in` | `Doctor@123` | Clinical triage queue, case dossier review, summary sign-off |
| 🔒 **Admin** | `admin@aiia.gov.in` | `Admin@123` | Dynamic question tree editor, red-flag rule registry, feature flags |

---

## 🏛️ System Architecture

```
[Patient Intake (Voice / Text)] 
          ↓
[Adaptive Question Engine (SOCRATES + Dashavidha Pariksha)] 
          ↓
[Medical Document Intelligence (OCR + NER Entity Extractor)] 
          ↓
[Red-Flag Safety Layer (12 Emergency Detection Rules)]
          ↓
[AI Clinical Summary Generator (Non-Diagnostic Objective Note)]
          ↓
[Doctor Dashboard & Sign-Off Workspace] 
          ↓
[ABDM Gateway & HL7 FHIR R4 Bundle Export]
```

---

## 📚 Comprehensive Documentation Index

- 🌿 [`AYUSH.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/AYUSH.md): Classical Dashavidha Pariksha diagnostic parameters & questions.
- 🚨 [`RED_FLAGS.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/RED_FLAGS.md): 12 Emergency detection rules and triage escalation protocol.
- 🎙️ [`VOICE.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/VOICE.md): Multilingual voice pipeline (Whisper, Bhashini, Web Speech API).
- 📄 [`DOCUMENTS.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/DOCUMENTS.md): Prescription OCR and structured medical entity extraction.
- 🩺 [`DOCTOR_DASHBOARD.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/DOCTOR_DASHBOARD.md): Clinical triage queue & case review dossier.
- 🔒 [`ADMIN.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/ADMIN.md): Dynamic question trees, red flag rule tester, and feature flags.
- 🇮🇳 [`COMPLIANCE.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/COMPLIANCE.md): ABDM M1/M2/M3 readiness and HL7 FHIR R4 mappings.
- 🛡️ [`SECURITY.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/SECURITY.md): Threat model, OWASP health mitigations, and AES-256-GCM encryption.
- ⚖️ [`DPDP_COMPLIANCE.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/DPDP_COMPLIANCE.md): Digital Personal Data Protection Act 2023 compliance.
- ⚡ [`OPTIMIZATION.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/OPTIMIZATION.md): WCAG 2.2 AA accessibility and 2G/3G rural network resilience.
- 🧪 [`TESTING.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/TESTING.md): Master test harness and automated CI execution.
- 🐳 [`DEPLOYMENT.md`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/DEPLOYMENT.md): Multi-container Docker and bare-metal deployment guide.

---

## 🧪 Master Automated Test Harness

```bash
# Run all 24 automated clinical invariants (100% deterministic pass)
npm test
```
