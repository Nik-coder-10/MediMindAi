# AyurSetu: Ayush Patient Case-Taking Software
### Smart India Hackathon 2026 – Problem ID 26047 (Ministry of Ayush / AIIA)

Production-grade, modular clinical case-taking, Prakriti assessment, and ABDM/FHIR-compliant health records management platform.

---

## 🚀 Key Architecture & Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router) + TypeScript (Strict Mode)
- **UI & Accessibility**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Accessibility**: Strict **WCAG 2.2 AA** compliant, large touch target buttons (min 44px), high contrast mode toggle, screen-reader optimized tokens.
- **Internationalization (i18n)**: [next-intl](https://next-intl-docs.vercel.app/) supporting English (`en`), Hindi (`hi`), and Marathi (`mr`).
- **State & Data Fetching**: [Zustand](https://zustand-demo.pmnd.rs/) + [TanStack React Query](https://tanstack.com/query)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Auth.js (NextAuth v5)](https://authjs.dev/) with Credentials and Mock ABDM/ABHA OAuth provider
- **Storage Layer**: Abstracted interface supporting local filesystem (`lib/storage/local-client.ts`) and AWS S3 / MinIO (`lib/storage/s3-client.ts`)
- **AI & Multimodal Services**:
  - **AI Layer** (`lib/ai`): Abstract provider for Prakriti scoring and clinical NER.
  - **Voice ASR & TTS** (`lib/voice`): Interfaces for Whisper & Speech synthesis.
  - **OCR Layer** (`lib/ocr`): Document & prescription digitization.
  - **FHIR & Consent** (`lib/fhir`, `lib/consent`): ABDM Consent Manager & Ayush FHIR Bundle generation.

---

## 📁 Repository Structure

```
SIH_2026/
├── app/
│   ├── [locale]/
│   │   ├── (patient)/dashboard/page.tsx
│   │   ├── (doctor)/consultation/page.tsx
│   │   ├── (admin)/dashboard/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── health/route.ts
│       └── abdm/consent/route.ts
├── components/
│   ├── ui/               # shadcn button, card, input
│   ├── patient/          # Patient PHR components
│   ├── doctor/           # Clinical & Prakriti components
│   └── shared/           # Navbar, Providers, LanguageSelector
├── lib/
│   ├── db/               # Prisma client singleton
│   ├── auth/             # Auth.js & ABHA provider
│   ├── ai/               # Abstract AI service layer
│   ├── voice/            # Voice ASR & TTS interfaces
│   ├── ocr/              # Document OCR extractor
│   ├── fhir/             # ABDM Ayush FHIR resource builders
│   ├── consent/          # ABDM Consent Manager
│   └── storage/          # Local & S3 storage adapters
├── prisma/
│   └── schema.prisma     # Complete Ayush clinical data model
├── messages/             # i18n localization dictionaries (en, hi, mr)
├── hooks/                # Voice recorder, High contrast hooks
├── stores/               # Zustand case-taking & theme stores
├── types/                # Strict TypeScript Ayush & ABDM domain types
├── docker/               # Initialization scripts
├── Dockerfile            # Multi-stage container build
├── docker-compose.yml    # Full stack compose (App + PostgreSQL + MinIO)
└── tsconfig.json         # Strict TypeScript config with @/* alias
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js >= 18.17.0
- Docker Desktop (for Postgres & MinIO, optional for local dev)

### 2. Installation
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```

### 4. Database Setup (Prisma)
```bash
npx prisma generate
npx prisma db push # Or npx prisma migrate dev
```

### 5. Running with Docker Compose (Recommended)
```bash
docker-compose up -d
```
This spins up:
- **PostgreSQL**: `localhost:5432`
- **MinIO Console**: `http://localhost:9001` (User: `minioadmin` / Pass: `minioadmin`)
- **Next.js Web App**: `http://localhost:3000`

### 6. Running Locally (Development Mode)
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🧪 Verification Commands

```bash
# Type check TypeScript strictness
npm run typecheck

# Generate Prisma Client
npm run prisma:generate

# Build Next.js production bundle
npm run build
```
