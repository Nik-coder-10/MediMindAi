# 🌿 AyurSetu / MediMind AI – Project Summary for Evaluators

**AyurSetu Clinical Platform**
**Ministry of Ayush / All India Institute of Ayurveda (AIIA)**

---

## 🌟 Executive Summary
**AyurSetu** is an intelligent, accessible, voice-first clinical case-taking and decision-support platform designed for high-density Outpatient Departments (OPDs) and rural primary health centers across India.

It transforms patient intake by capturing structured histories in Hindi, English, and Marathi, screening for 12 life-threatening red-flag emergencies, extracting medications and lab reports via OCR, administering Charaka Samhita *Dashavidha Pariksha*, and generating non-diagnostic clinical summaries for physician sign-off.

---

## 🚀 Live Access & Demo Credentials

- **Patient Portal**: `http://localhost:3000/patient` *(Voice & Touch Kiosk)*
- **Doctor Workspace**: `http://localhost:3000/doctor` *(User: `doctor@aiia.gov.in` \| Pass: `Doctor@123`)*
- **Admin Console**: `http://localhost:3000/admin-dashboard` *(User: `admin@aiia.gov.in` \| Pass: `Admin@123`)*
- **FHIR Export**: `http://localhost:3000/api/fhir/session/demo-case-01-emergency`

---

## 🏛️ Core Architectural Highlights

1. **Accessibility**: Touch targets $\ge 56$px (80px voice button), high contrast, bilingual audio prompts, and PWA offline sync.
2. **Clinical Safety**: 12 Red-Flag rules, non-diagnostic AI posture, and physician sign-off authority.
3. **National Standards**: ABDM M1/M2/M3 consent artifacts, HL7 FHIR R4 Bundle compliance, and DPDP Act 2023 encryption.
4. **Master Test Harness**: 24/24 automated unit and integration tests passing (`npm test`).
