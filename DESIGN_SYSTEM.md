# AyurSetu Premium Design System
## AyurSetu · AyurSetu Clinical Platform · Ministry of Ayush

> **Indigo-Glass × Teal-Ayush × Claymorphism × Editorial**
> A government-premium clinical design language built for national-scale digital health.

---

## Design Philosophy

| Pillar | Approach |
|---|---|
| **Authority** | Deep Indigo as trust-building primary — signals government, permanence, reliability |
| **Care** | Teal as the Ayush identity accent — health, calm, natural healing |
| **Depth** | Glassmorphism surfaces create hierarchy without weight |
| **Touch** | Claymorphism on primary actions — tactile, inviting, accessible |
| **Precision** | Editorial typography — Apple-level information hierarchy |
| **Alert** | Controlled Neobrutalism on red-flag states only — impossible to miss |

---

## Color Palette

### Primary — Indigo Authority
| Token | Value | Usage |
|---|---|---|
| `indigo-700` | `#4338CA` | Primary buttons, active states, CTA |
| `indigo-600` | `#4F46E5` | Hover, gradient mid-stop |
| `indigo-900` | `#312E81` | Dark gradient stop, text |
| `indigo-50` | `#EEF2FF` | Selection backgrounds, tints |

### Ayush Accent — Teal
| Token | Value | Usage |
|---|---|---|
| `teal-600` | `#0D9488` | Voice/audio elements, Ayush branding |
| `teal-700` | `#0F766E` | Dark teal (previously ayush-green — preserved) |
| `teal-50` | `#F0FDFA` | Light teal surfaces |

### Neutrals
| Token | Value | Usage |
|---|---|---|
| `background` | `hsl(220 18% 97%)` | Page background |
| `foreground` | `hsl(224 32% 10%)` | Primary text |
| `muted` | `hsl(220 14% 93%)` | Subtle surfaces |
| `muted-foreground` | `hsl(220 10% 46%)` | Secondary text |

### Semantic
| Purpose | Color | Token |
|---|---|---|
| Success / Ayush | Teal-600 | `clinic-routine` |
| Warning | Amber-600 | `clinic-urgent` |
| Critical / Red-flag | Red-600 | `clinic-critical` |
| Info | Indigo-600 | `clinic-info` |

---

## Typography

### Font Stack
```css
font-family: 'Inter', 'Noto Sans Devanagari', system-ui, sans-serif;
```

- **Inter**: Latin script, headings and body. High legibility, Apple-adjacent feel.
- **Noto Sans Devanagari**: Hindi script. Comprehensive weight support (300–900).
- Both loaded via Google Fonts with `display=swap` for performance.

### Type Scale

| Role | Size | Weight | Class |
|---|---|---|---|
| Hero H1 | 42–72px | 900 Black | `text-[72px] font-black` |
| Section H2 | 30–38px | 900 Black | `text-[36px] font-black` |
| Card H3 | 18–20px | 800 ExtraBold | `text-[18px] font-extrabold` |
| Body | 14–15px | 500 Medium | `text-[14px] font-medium` |
| Caption | 10–12px | 600 SemiBold | `text-[11px] font-semibold` |
| Editorial Label | 9–11px | 800 ExtraBold + uppercase tracking | `.editorial-label` |

---

## Glassmorphism System

### `.glass` — Light interactive panels
```css
background: rgba(255,255,255,0.72);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255,255,255,0.55);
```

### `.glass-panel` — Navbar/header/footer
- Blur: 20px / Saturation: 180%
- Used for: sticky headers, footers, overlays

### `.glass-card` — Feature cards
- Gradient: `rgba(255,255,255,0.92)` → `rgba(248,250,255,0.72)`
- Subtle inner highlight: `inset 0 1px 0 rgba(255,255,255,0.9)`
- Shadow: `0 4px 32px -4px rgba(67,56,202,0.08)`

---

## Claymorphism System

### `.clay-white` — Primary action cards
```css
background: linear-gradient(145deg, #FFFFFF, #F8FAFF);
box-shadow: 0 8px 32px -6px rgba(67,56,202,0.12),
            inset 0 1px 2px rgba(255,255,255,1),
            inset 0 -1px 3px rgba(67,56,202,0.04);
border: 1px solid rgba(224,228,255,0.8);
```

### `.clay-teal` — Audio/voice elements
- Background: `#F0FDFA → #CCFBF1`
- Use for AudioPrompt, voice recording surfaces

### `.clay-indigo` — Selected states, info surfaces
- Background: `#EEF2FF → #E0E7FF`
- Use for active navigation, selected options

---

## Shadow Scale

| Token | Value | Usage |
|---|---|---|
| `shadow-clay` | `0 4px 24px -4px rgba(67,56,202,0.14), inset 0 1px 2px rgba(255,255,255,0.9)` | Card lift |
| `shadow-glass` | `0 8px 40px -8px rgba(67,56,202,0.12)` | Floating panels |
| `shadow-glass-lg` | `0 16px 60px -12px rgba(67,56,202,0.18)` | Modals, dropdowns |
| `shadow-premium` | Multi-layer subtle | Hero elements |
| `shadow-indigo-glow` | `0 0 0 4px rgba(67,56,202,0.15), 0 4px 20px rgba(67,56,202,0.25)` | Focus/hover on buttons |
| `shadow-teal-glow` | Same but teal | Voice elements |
| `shadow-neo-alert` | `5px 5px 0px 0px #DC2626` | Red-flag only |

---

## Layout Patterns

### Patient Flow — Single Focus
- Max width: 576px (max-w-xl) centered
- Progressive disclosure: one question at a time
- AnimatePresence slide transitions between questions
- Large touch targets: min 56px height

### Doctor/Admin — Bento Grid
- 3-column grid with spanning cards (md:col-span-2)
- `.bento-hover` for lift effect on interaction
- Editorial headers above each section

### Hero — Ambient Depth
- `.hero-mesh` radial gradient background
- Absolute positioned ambient orbs (Indigo/Teal blur)
- Content floats above with glass panels

---

## Motion System

| Interaction | Animation | Duration |
|---|---|---|
| Page transitions | `opacity 0→1, y 12→0` | 350ms |
| Question change | `AnimatePresence x±20, opacity` | 300ms |
| Button hover | `scale(1.015) y(-1px)` | 180ms |
| Button tap | `scale(0.97)` | 100ms |
| Step completion | `Spring stiffness:300 damping:28` | — |
| Audio pulse ring | `scale 1→1.8, opacity 0.8→0` | 1200ms infinite |
| Bento hover | `translateY(-4px) scale(1.005)` | 400ms |

All animations respect `prefers-reduced-motion: reduce`.

---

## Component Usage Guide

### ExtraLargeButton
```tsx
// Primary action (indigo gradient)
<ExtraLargeButton variant="primary" size="large">Submit</ExtraLargeButton>

// Ayush/success action (teal gradient)
<ExtraLargeButton variant="success">Confirm</ExtraLargeButton>

// Secondary (claymorphic white)
<ExtraLargeButton variant="secondary">Back</ExtraLargeButton>
```

### AudioPrompt
```tsx
// Always pass locale for language-aware audio
<AudioPrompt
  locale={locale}
  text="English text"
  hindiText="हिंदी टेक्स्ट"
/>
```
- Clay-teal surface with sound wave animation when playing
- Auto-cancels on locale/question change

### EmergencyAlertModal
```tsx
// Controlled neobrutalism — red-flag clinical alerts only
<EmergencyAlertModal
  description={flagDescription}
  onDismiss={() => setFlag(null)}
/>
```
- Neo-brutal offset shadow border
- 108 emergency call link preserved

### ProgressStepper
```tsx
// Indigo-teal gradient fill, spring-animated steps
<ProgressStepper currentStep={4} />
```

---

## Accessibility

| Standard | Status |
|---|---|
| WCAG 2.2 AA | ✅ Met (all text contrast ≥ 4.5:1) |
| High Contrast AAA | ✅ Via `.high-contrast` mode |
| Eye-Rest/Low | ✅ Via `.low-contrast` sepia mode |
| Touch Targets | ✅ All interactive elements ≥ 56px |
| Focus Rings | ✅ Custom indigo ring via `focus-visible` |
| Screen Reader | ✅ `aria-label`, `aria-pressed`, semantic HTML |
| Reduced Motion | ✅ `@media (prefers-reduced-motion: reduce)` |

---

## Do's and Don'ts

### ✅ Do
- Use `clay-white` for primary content cards
- Use `glass-panel` for sticky/overlay surfaces
- Apply `bento-hover` to interactive grid cards
- Use `.editorial-label` for section labels
- Use Indigo for authority/primary, Teal for Ayush/health
- Keep emergency/red-flag states as neobrutalism only

### ❌ Don't
- Don't use Tailwind color utilities directly for brand colors — use design tokens
- Don't apply glassmorphism to more than 2 layers deep
- Don't use neobrutalism (offset shadow) outside red-flag contexts
- Don't modify font-family on body — Inter + Devanagari handles all scripts
- Don't add `backdrop-filter` to elements inside other blurred containers
- Don't change any API, route, or clinical logic — design layer only

---

## File Map

| File | Role |
|---|---|
| `app/globals.css` | CSS tokens, glass/clay utilities, mesh backgrounds |
| `tailwind.config.ts` | Color palette, shadow tokens, animation keyframes |
| `components/shared/Navbar.tsx` | Glass navbar |
| `components/ui/patient/AudioPrompt.tsx` | Clay-teal voice prompt |
| `components/ui/patient/ExtraLargeButton.tsx` | Premium button variants |
| `components/ui/patient/ProgressStepper.tsx` | Indigo-teal animated stepper |
| `components/ui/patient/EmergencyAlertModal.tsx` | Neo-brutal red-flag modal |
| `components/ui/patient/PatientLanguageSwitcher.tsx` | Pill toggle language selector |

---

*AyurSetu Design System v2.0 · AyurSetu · Ministry of Ayush / AIIA*
