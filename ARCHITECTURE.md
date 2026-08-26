# Architecture & Backend Service Layer Documentation

**Smart India Hackathon 2026 – Problem ID 26047 (Ministry of Ayush / AIIA)**

---

## 🏛️ 1. Patient Request Flow Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                             CLIENT / PATIENT APP                             |
|  (Voice Input / Document Upload / Tap Choice / Consent Modal / ABHA Link)     |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ [HTTP JSON / Multi-part]
+-------------------------------------------------------------------------------+
|                       NEXT.JS APP ROUTER API LAYER                            |
|  (/api/patient/*, /api/doctor/*, /api/consent, /api/abha, /api/fhir, etc.)   |
|                                                                               |
|   1. Authentication & Session Verification (Auth.js v5 / JWT)                 |
|   2. Request Validation via Zod Schemas (safeParse -> 400 on error)           |
|   3. Standard Error Envelope (AppError -> apiError -> typed JSON)             |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ [Validated Pure DTO]
+-------------------------------------------------------------------------------+
|                        DECOUPLED SERVICE LAYER                                |
|                                                                               |
|   * SessionService        * ConversationService       * DocumentService       |
|   * RedFlagService        * SummaryService            * ConsentService        |
|   * AuditService          * StorageService            * AIService             |
|                                                                               |
|   - Zero HTTP dependency (isolated, testable TypeScript classes)             |
|   - Automatic tamper-evident audit logging via AuditService.log()             |
|   - Real-time safety triage and priority escalation                           |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ [Type-safe Queries]
+-------------------------------------------------------------------------------+
|                             PRISMA ORM & DB                                   |
|   PostgreSQL Database (UUID PKs, JSONB, Soft Deletes, ABDM/FHIR relations)   |
|   MinIO / S3 Object Storage (Prescriptions, Audio Transcripts)                |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ [Prisma Entities]
+-------------------------------------------------------------------------------+
|                      STANDARDIZED API RESPONSE ENVELOPE                       |
|                                                                               |
|   {                                                                           |
|     "success": true,                                                          |
|     "data": { ... },                                                          |
|     "meta": { "timestamp": "2026-08-26T11:40:00Z", "version": "v1" }         |
|   }                                                                           |
+-------------------------------------------------------------------------------+
```

---

## 🌐 2. API Route Summary & Status

| API Route | Methods | Service Binding | Description |
|---|---|---|---|
| `/api/health` | `GET` | Health check | Returns system status, DB probe, version, and WCAG compliance. |
| `/api/patient/session` | `POST`, `GET` | `SessionService` | Creates or retrieves clinical case-taking sessions. |
| `/api/patient/conversation` | `POST`, `GET` | `ConversationService` | Appends voice/text conversation turns with ASR confidence metadata. |
| `/api/patient/documents` | `POST`, `GET` | `DocumentService` | Registers uploaded prescriptions and lab investigations. |
| `/api/doctor/dashboard` | `GET` | `SessionService` / `prisma` | Fetches active patient queue with triage priorities and red flags. |
| `/api/doctor/summary` | `POST` | `SummaryService` | Updates and validates clinical consultation summaries. |
| `/api/consent` | `GET`, `POST` | `ConsentService` | Verifies active ABDM consent and records newly granted consent. |
| `/api/abha` | `POST` | `AbhaMockService` | Simulates ABHA ID creation and KYC verification. |
| `/api/fhir` | `GET` | `AyushFHIRBuilder` | Exports Ayush FHIR R4 Bundle for ABDM health information exchange. |
| `/api/admin` | `GET` | `AuditService` | Morbidity statistics and recent audit log entries. |
