# Progressive Web App (PWA) & Offline Queue Architecture

**Smart India Hackathon 2026 – Problem ID 26047 (Ministry of Ayush / AIIA)**

---

## 📱 1. PWA Installation & Service Worker Caching

- **Web App Manifest ([`public/manifest.json`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/public/manifest.json))**:
  - `name`: *"आयुर्सेतु (AyurSetu) - AIIA Patient Case-Taking"*
  - `display`: `standalone` (Full-screen mobile app experience without browser URL bars)
  - `theme_color`: `#1b4332` (Ayush Forest Green)
- **Service Worker ([`public/sw.js`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/public/sw.js))**:
  - Implements **Stale-While-Revalidate** caching strategy.
  - Caches the core patient intake shell and assets, guaranteeing instant loading even with zero cellular connectivity.

---

## 💾 2. Offline Resilience & Sync Queue ([`lib/offline/offline-queue.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/offline/offline-queue.ts))

- **Temporary Client Queue**: If internet access drops during consultation, answers are queued locally.
- **Auto-Sync Upon Reconnection**: The `NetworkStatusBanner` triggers `OfflineQueueManager.syncQueue()` as soon as `navigator.onLine` fires, sending all pending answers to the backend.
- **Data Hygiene**: Once synced, temporary queues are automatically purged to prevent local data buildup.
