# Admin Clinical Configuration Panel Documentation

**Ministry of Ayush / AIIA Clinical Platform**

---

## 🔒 1. Access Control & Role Protection
- Role-based authorization: Only authenticated users with `role: "ADMIN"` can access `/admin-dashboard` and invoke `/api/admin/*` routes.
- Tamper-evident Audit Logging: Every create, update, or toggle operation records an immutable entry in `AuditLog`.

---

## ⚙️ 2. Configurable Clinical Modules

| Module | Purpose | Live Engine Effect |
|---|---|---|
| **Question Trees (`/api/admin/nodes`)** | Add/edit question nodes, Hindi prompts, and next-node branching logic. | Instantly loaded by `AdaptiveEngineService` for subsequent patient intakes. |
| **Red-Flag Rules (`/api/admin/rules`)** | Modify emergency detection rules, trigger fields, and severity thresholds (`HIGH`/`CRITICAL`). | Real-time safety engine escalates triage to `EMERGENCY` without code redeploy. |
| **Feature Flags (`/api/admin/settings`)** | Toggle Voice Layer, AYUSH mode, and configure maximum questions per session. | Dynamically adapts patient UI and restricts session turn limits. |
| **Morbidity Analytics** | Live tracking of sessions today, red-flag rates, and intake durations. | Real-time epidemiological monitoring for hospital administration. |
