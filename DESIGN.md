# AyurSetu: Patient-Facing Design System & UI Specification

**Smart India Hackathon 2026 – Problem ID 26047 (Ministry of Ayush / AIIA)**

---

## 🌿 1. Core Design Philosophy

The AyurSetu design system is engineered specifically for **elderly, rural, low-literacy, and first-time smartphone users** accessing clinical Ayush case-taking and tele-consultation across India.

### 4 Non-Negotiable Pillars
1. **Zero-Training Usability**: Users can complete a consultation without any prior onboarding or explanation.
2. **Audio + Icon First**: Every screen has visual symbols, Hindi + English clear text, and an accessible voice instruction button (`AudioPrompt`).
3. **Large Physical Touch Targets**: Absolute minimum touch dimension is **56x56 px** (and up to 128x128 px for voice microphones and choice cards).
4. **Calm Clinical Aesthetic**: Soft forest greens, mint accents, warm golds, and sky blues that instill calm and clinical trust without anxiety-inducing alarms.

---

## 🎨 2. Design Tokens

### Color Palette
| Token | Hex / HSL | Usage |
|---|---|---|
| `ayush.green` (Primary) | `#1B5E20` / `134 61% 24%` | Main interactive actions, primary buttons, logo |
| `ayush.emerald` | `#2E7D32` | Hover & active states, progress indicators |
| `ayush.mint` | `#E8F5E9` | Audio prompt backgrounds, subtle cards |
| `ayush.gold` | `#B78103` | Prakriti highlighting, Ayush wisdom badges |
| `ayush.sky` | `#E1F5FE` | Secondary informational callouts |
| `ayush.slate` | `#263238` | Primary dark headings & text |
| `rose.600` (Safety Only) | `#E11D48` | Red flag alerts and active mic recording state only |

### Typography Scale
- **`text-touch-base`**: `1.125rem` (18px) - Minimum body text size for rural readability.
- **`text-touch-lg`**: `1.25rem` (20px) - Question descriptions and instructions.
- **`text-touch-xl`**: `1.5rem` (24px) - Prominent action labels and headings.

### Touch Target Minimums
```css
/* Universal touch targets */
button, input, select, textarea, .touch-target {
  min-height: 56px;
  min-width: 56px;
}
```

---

## 🧩 3. Reusable Patient UI Components

1. **`ExtraLargeButton`** (`components/ui/patient/ExtraLargeButton.tsx`):
   - Variants: `primary`, `secondary`, `success`, `danger`, `calmSky`
   - Sizes: `default` (56px), `large` (64px), `giant` (72px)
   - Integrated Framer Motion micro-interaction: `whileTap={{ scale: 0.97 }}`
2. **`IconButton`** (`components/ui/patient/IconButton.tsx`):
   - Large visual cards with icon on top, primary bilingual label, and secondary English descriptor.
3. **`AudioPrompt`** (`components/ui/patient/AudioPrompt.tsx`):
   - Native Web Speech Synthesis with calm speech cadence (`rate: 0.9`) in Hindi / English.
4. **`VoiceInputButton`** (`components/ui/patient/VoiceInputButton.tsx`):
   - 128px circular button with animated ripple pulse during active audio capture.
5. **`DocumentScanCard`** (`components/ui/patient/DocumentScanCard.tsx`):
   - Direct camera photo capture and PDF upload trigger with zero technical jargon.
6. **`ProgressStepper`** (`components/ui/patient/ProgressStepper.tsx`):
   - 6-step progress bar with large numbered milestones and completed checkmarks.
7. **`PatientLanguageSwitcher`** (`components/ui/patient/PatientLanguageSwitcher.tsx`):
   - Instant language switching across Hindi (`hi`), English (`en`), and Marathi (`mr`).

---

## 🗺️ 4. Patient Routes & User Flow

```
/[locale]/patient (Home Launcher)
   │
   ▼
/[locale]/patient/language (1. भाषा चयन)
   │
   ▼
/[locale]/patient/consent (2. डिजिटल सहमति व आवाज स्पष्टीकरण)
   │
   ▼
/[locale]/patient/complaint (3. मुख्य लक्षण व वॉयस इनपुट)
   │
   ▼
/[locale]/patient/questions (4. अडेप्टिव प्रश्नोत्तरी - हाँ/नहीं)
   │
   ▼
/[locale]/patient/documents (5. पुरानी पर्ची व फोटो स्कैन)
   │
   ▼
/[locale]/patient/summary-preview (6. केस सारांश व डॉक्टर प्रेषण)
   │
   ▼
/[locale]/patient/patient-dashboard (रोगी डैशबोर्ड)
```

---

## ♿ 5. Accessibility & High Contrast Specifications
- Strict **WCAG 2.2 AA / AAA** compliance.
- High-contrast toggle turns all active backgrounds to `#000000` and text/borders to `#FFFFFF` with primary elements highlighted in `#FFFF00` (Pure Yellow).
- Screen-reader tags `aria-label` and `aria-pressed` on all dynamic widgets.
