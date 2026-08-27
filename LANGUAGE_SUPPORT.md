# Multilingual Support & Regional Voice Localization

**Smart India Hackathon 2026 – Problem ID 26047 (Ministry of Ayush / AIIA)**

---

## 🌐 1. Supported Languages & Coverage

| Language | Locale Code | Translation Dictionary | ASR Code | Default Neural TTS Voice |
|---|---|---|---|---|
| **हिंदी (Hindi - Primary)** | `hi` | [`messages/hi.json`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/messages/hi.json) | `hi-IN` | `hi-IN-SwaraNeural` (Bhashini / Azure) |
| **English (Secondary)** | `en` | [`messages/en.json`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/messages/en.json) | `en-IN` | `en-IN-NeerjaNeural` |
| **मराठी (Marathi - Regional)** | `mr` | [`messages/mr.json`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/messages/mr.json) | `mr-IN` | `mr-IN-AarohiNeural` |
| **தமிழ் (Tamil)** | `ta` | Prepared in Voice Registry | `ta-IN` | `ta-IN-PallaviNeural` |
| **বাংলা (Bengali)** | `bn` | Prepared in Voice Registry | `bn-IN` | `bn-IN-TanishaaNeural` |

---

## 🛠️ 2. Step-by-Step: Adding a New Scheduled VIII Indian Language
1. Create `messages/<locale_code>.json` with the required keys (`common`, `patient`, `emergency`).
2. Add the locale configuration in [`lib/voice/locale-map.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/voice/locale-map.ts) linking the Bhashini ASR and Neural TTS voice identifiers.
3. Update `i18n.ts` supported locales list.
