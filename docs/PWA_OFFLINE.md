# 📶 PWA Offline & Session Recovery

**AyurSetu / MediMindAi (SIH 2026 Problem ID 26047)**

---

## Storage & Sync Strategy

AyurSetu uses a **dual-layer durable client store** to guarantee zero data loss across any network interruption, device power failure, or browser restart:

| Layer | Technology | Purpose |
|---|---|---|
| **Primary** | IndexedDB (`AyurSetu_OfflineDB_v1`) | Survives browser restart, tab close, device sleep |
| **Fallback** | `localStorage` (JSON serialised) | Backup when IndexedDB is unavailable (private mode, quota errors) |
| **Pointer** | `localStorage` key `ayursetu_active_session_pointer` | Fast O(1) lookup of active session ID |

### Why IndexedDB?
- Structured, transactional, unlimited quota storage (vs ~5MB localStorage).
- Survives full browser restart and operating-system sleep/hibernation.
- Asynchronous — never blocks the main thread or UI rendering.

---

## What Works Fully Offline ✅

| Feature | Offline Behavior |
|---|---|
| **Chief Complaint entry** | Saved to IndexedDB snapshot immediately |
| **SOCRATES / clinical question answers** | Each answer persisted to IndexedDB snapshot before network dispatch |
| **Offline answer queueing** | If `!navigator.onLine`, answer is enqueued in `mutation_queue` IndexedDB store |
| **Session snapshot recovery** | Full resume from last saved snapshot on any page refresh or restart |
| **Resume intake modal** | Auto-detects incomplete session on any page load |
| **Kiosk inactivity timeout** | Fully client-side, works without server |
| **Audio prompts** | Web Speech API works offline |
| **Document capture / camera** | Camera and photo crop fully offline |

## Requires Connectivity 🔗

| Feature | Why Connectivity is Required |
|---|---|
| **Answer sync to server** | Adaptive engine next-question depends on server state |
| **Document upload (OCR)** | Tesseract/Azure OCR runs on server |
| **AI Clinical Summary generation** | LLM call requires server |
| **Final "Submit to Doctor"** | Hard-blocked with bilingual error if `!navigator.onLine` |
| **PDF download** | Server-side `pdf-lib` rendering |

---

## Session Recovery Flow

```
App Load
  └─ SessionRecoveryStore.getActiveSessionSnapshot()
      ├─ Try IndexedDB → return snapshot if step != SUBMITTED and age < 24h
      └─ Fallback: localStorage snapshot
          ↓
  ResumeSessionModal displayed (if snapshot found)
      ├─ "Resume" → navigate to last step (QUESTIONS / DOCUMENTS / SUMMARY_PREVIEW)
      └─ "Start Fresh" → clearActiveSession() → language selector
```

On every answered question:
1. Existing snapshot retrieved from IndexedDB.
2. New answer appended to `collectedAnswers[]`.
3. Snapshot immediately re-persisted (`saveActiveSessionSnapshot`).
4. If offline: action pushed to `mutation_queue` IndexedDB store.
5. `OfflineBannerSync` shows pending count → auto-syncs on `online` event.

---

## Kiosk Mode (`/[locale]/kiosk`)

Accessible at: `https://medi-mind-ai-eight.vercel.app/en/kiosk`

| Feature | Details |
|---|---|
| **Touch targets** | 80px minimum height buttons |
| **Navigation guard** | `beforeunload` event blocks accidental tab close |
| **Resume vs New patient** | Big dual-CTA based on active snapshot detection |
| **Inactivity timeout** | 10-minute idle → 30-second countdown warning → auto-reset |
| **Session auto-clear** | On timeout or "Start Fresh": `clearActiveSession()` + redirect to `/language` |

---

## Components & Files

| File | Role |
|---|---|
| [`lib/offline/session-recovery.store.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/offline/session-recovery.store.ts) | Core IndexedDB / localStorage dual-layer store |
| [`components/ui/patient/OfflineBannerSync.tsx`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/components/ui/patient/OfflineBannerSync.tsx) | Floating offline status banner with auto-sync |
| [`components/ui/patient/ResumeSessionModal.tsx`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/components/ui/patient/ResumeSessionModal.tsx) | Modal shown on app load when incomplete session detected |
| [`app/[locale]/kiosk/page.tsx`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/app/%5Blocale%5D/kiosk/page.tsx) | Kiosk launcher with inactivity timeout and navigation guard |
| [`app/[locale]/patient/complaint/page.tsx`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/app/%5Blocale%5D/patient/complaint/page.tsx) | Saves initial snapshot on chief complaint entry |
| [`app/[locale]/patient/questions/page.tsx`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/app/%5Blocale%5D/patient/questions/page.tsx) | Per-answer snapshot + offline queue on `!navigator.onLine` |
| [`app/[locale]/patient/summary-preview/page.tsx`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/app/%5Blocale%5D/patient/summary-preview/page.tsx) | Hard offline block on submit; clears store on success |

---

## Self-Verification Results

| Check | Result |
|---|---|
| Start intake → refresh page → Resume modal appears | ✅ |
| Go offline mid-intake → answers queued | ✅ |
| Come back online → queue auto-syncs | ✅ |
| Submit while offline → clear bilingual error | ✅ |
| `npm run typecheck` | ✅ 0 errors |
| `npm test` | ✅ **144 PASSED / 0 FAILED** |
| `npx next build` | ✅ Production build succeeds |
