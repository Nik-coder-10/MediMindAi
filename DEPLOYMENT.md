# Production Deployment & Operations Guide

**Smart India Hackathon 2026 – Problem ID 26047**
**Ministry of Ayush / All India Institute of Ayurveda (AIIA)**

---

## 🐳 1. One-Command Production Deployment (Docker Compose)

To launch the complete isolated production environment (Next.js Application + PostgreSQL 16 + MinIO S3 Object Store):

```bash
# Clone the repository
git clone https://github.com/Nik-coder-10/MediMindAi.git
cd MediMindAi

# Build and start all multi-container services
docker-compose up --build -d

# Verify all services are healthy
docker-compose ps
```

- **Application URL**: `http://localhost:3000`
- **MinIO S3 Console**: `http://localhost:9001` (User: `minioadmin` | Pass: `minioadmin123`)
- **PostgreSQL Database**: `localhost:5432` (`ayush_db`)

---

## 🔑 2. Pre-Seeded Demo Evaluation Accounts

| Portal Role | Email / Login | Password | Assigned Permissions / Role |
|---|---|---|---|
| 👤 **Patient** | `patient@aiia.gov.in` | `Patient@123` | Bilingual Intake, Voice Case-Taking, Consent & Document Upload. |
| 🩺 **Doctor / Vaidya** | `doctor@aiia.gov.in` | `Doctor@123` | Triage Queue, Case Dossier Review, Summary Sign-Off, HIS Export. |
| 🔒 **System Admin** | `admin@aiia.gov.in` | `Admin@123` | Question Tree Editor, Red-Flag Rules, Feature Flags, Analytics. |

---

## 🧪 3. Master CI/CD & Automated Quality Commands

```bash
# Run complete test harness (24 automated clinical invariants)
npm test

# Run TypeScript type safety verification
npm run typecheck

# Build production bundle
npm run build
```
