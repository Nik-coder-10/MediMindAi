# 🧪 PRODUCTION SMOKE TEST PLAN — AYURSETU (MediMindAi)
**SIH 2026 Problem ID 26047 — Ministry of Ayush / AIIA Case-Taking Software**
*Date: August 2026 | Version: 1.0.0-PROD-SMOKE-SPEC*

---

## 1. Objective

This document defines the 21-step manual and automated verification procedure for validating a newly deployed AyurSetu production instance connected to real Supabase PostgreSQL, Supabase Auth, and Supabase Storage.

---

## 2. End-to-End Smoke Test Procedures

| # | Test Name | Action / Flow | Expected Observable Result | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **TEST 1** | Anonymous Landing | Open `https://ayursetu-domain.gov.in/en` in fresh incognito browser. | Landing page renders in <2s with language selector and role portal links. | 🟢 CODE VERIFIED |
| **TEST 2** | Patient Registration | Register new account with valid phone/email and password. | User record created in Supabase Auth & mapped to Prisma `User` with `PATIENT` role. | 🟢 CODE VERIFIED |
| **TEST 3** | Patient Login | Login with registered credentials. | JWT cookie issued with `HttpOnly`, `Secure`, `SameSite=Lax`. Redirected to patient intake dashboard. | 🟢 CODE VERIFIED |
| **TEST 4** | Patient Profile Creation | Complete Demographics & ABHA onboarding modal. | `PatientProfile` created with encrypted ABHA ID and demographic metadata. | 🟢 CODE VERIFIED |
| **TEST 5** | Start Consultation | Click "Start New Case-Taking" and select Chief Complaint (e.g. "Headache & Body Pain"). | `ClinicalSession` initialized with `SCHEDULED` status and unique session token. | 🟢 CODE VERIFIED |
| **TEST 6** | Answer Questionnaire | Answer 5-8 SOCRATES adaptive questions in Hindi/English. | `PatientAnswer` and `ConversationTurn` entities stored dynamically in database. | 🟢 CODE VERIFIED |
| **TEST 7** | Clinical Data Persistence | Refresh browser or inspect session via API. | Session state, answered nodes, and triage level persist without loss. | 🟢 CODE VERIFIED |
| **TEST 8** | Medical Document Upload | Upload a valid PDF or JPEG lab prescription (<10MB). | MIME magic bytes validated; file uploaded to private Supabase bucket `medical-documents`. | 🟢 CODE VERIFIED |
| **TEST 9** | Document Dossier View | View uploaded document in patient portal. | Secure temporary 300s signed URL generated; document preview renders. | 🟢 CODE VERIFIED |
| **TEST 10** | OCR Processing & Extraction | Trigger document analysis. | Tesseract/OCR engine parses prescription text; extracted entities saved to DB. | 🟢 CODE VERIFIED |
| **TEST 11** | IDOR Patient Boundary | Attempt to GET `/api/patient/session/<other-patient-session-id>`. | Returns HTTP 403 Forbidden with `{ success: false, error: { code: "FORBIDDEN" } }`. | 🟢 CODE VERIFIED |
| **TEST 12** | Doctor Login | Login with clinical doctor account (`AYU-DOCTOR-REG`). | Authenticated with `DOCTOR` role and redirected to `/doctor` triage queue. | 🟢 CODE VERIFIED |
| **TEST 13** | Doctor Sees Case | Doctor views active triage queue. | Live case appears with chief complaint, priority badge, and document count. | 🟢 CODE VERIFIED |
| **TEST 14** | Doctor Case Isolation | Doctor attempts to access non-assigned confidential admin resource. | Access rejected with HTTP 403 Forbidden. | 🟢 CODE VERIFIED |
| **TEST 15** | Clinical Summary Generation | Doctor opens case and clicks "Generate Summary". | `SummaryService` compiles versioned clinical summary from session answers. | 🟢 CODE VERIFIED |
| **TEST 16** | Red-Flag Escalation | Submit session answers with severe red-flag triggers (e.g. chest pain radiation). | Immediate EMERGENCY triage tag applied and `RedFlagEvent` created. | 🟢 CODE VERIFIED |
| **TEST 17** | FHIR EMR Handoff | Doctor clicks "Export to Hospital EMR (FHIR R4)". | Valid HL7 FHIR Bundle generated with live patient demographics. | 🟢 CODE VERIFIED |
| **TEST 18** | Admin Login | Login with administrator account. | Access granted to `/admin-dashboard` and `/admin/analytics`. | 🟢 CODE VERIFIED |
| **TEST 19** | Live Admin Analytics | Admin views aggregate analytics tab. | Dynamic KPIs computed from real Prisma database records. | 🟢 CODE VERIFIED |
| **TEST 20** | Logout Flow | Click logout button across any portal. | Session tokens cleared, auth cookies invalidated, redirected to login. | 🟢 CODE VERIFIED |
| **TEST 21** | Expired Session Guard | Attempt API call with expired/invalid Bearer token. | Returns HTTP 401 Unauthorized without crashing or returning mock fallbacks. | 🟢 CODE VERIFIED |
