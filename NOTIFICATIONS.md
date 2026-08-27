# Real-Time Clinical Event & Emergency Notification Architecture

**Smart India Hackathon 2026 – Problem ID 26047 (Ministry of Ayush / AIIA)**

---

## ⚡ 1. Overview & Operational Model
The **AyurSetu Real-Time Notification System** dispatches immediate clinical alerts to attending physicians, Vaidyas, and hospital nursing triage stations whenever high-acuity events or intake milestones occur.

---

## 🚨 2. Event Types & Urgency Hierarchy

| Event Type | Priority Level | Trigger Condition | Physician Action |
|---|---|---|---|
| **`RED_FLAG_CRITICAL`** | **🚨 EMERGENCY** | Acute life-threatening red-flag detected (*e.g., ACS chest pain radiation, Stroke signs, Meningismus*). | Immediate triage escalation, audio chime, and prominent drawer alert. |
| **`NEW_SESSION_READY`** | **🟢 ROUTINE / URGENT** | Patient finished adaptive intake, OCR scan, and summary generation. | Case dossier appears in pending queue for review and sign-off. |
| **`SUMMARY_ACCEPTED`** | **🟢 ROUTINE** | Physician signed off clinical draft, generating official version. | Synchronized with hospital EMR / ABDM gateway. |
| **`CONSENT_REVOKED`** | **⚡ URGENT** | Patient withdrew data consent under DPDP Act 2023. | Immediate session lock and data purge notice. |

---

## 🛠️ 3. Delivery Channels & Acknowledgment
- **Persistent Header Badge**: Real-time counter of unacknowledged shift alerts.
- **Audible Alerts**: Optional, physician-controlled emergency chime for `CRITICAL` triage events.
- **One-Click Acknowledgment**: Mark alerts as seen (`POST /api/doctor/notifications`) to log physician receipt and timestamp.
