# Arden — UI/UX & Cinematic Presentation

**Role:** Museum-quality interface, transitions, HUD, mobile layout, and emotional first impression  
**Focus:** Premium art-gallery feel — elegant, slow, cinematic — never cluttered or “game UI.”

---

## Your mission

Design every screen so users feel they are entering a **curated exhibition**, not a tech demo.

---

## Primary files (you own)

| File | Purpose |
|------|---------|
| `src/components/Landing.tsx` | Home / upload / sample gallery |
| `src/components/Landing.css` | Landing styles |
| `src/components/AnalyzingOverlay.tsx` | AI analysis loading experience |
| `src/components/AnalyzingOverlay.css` | Scan line, progress bar |
| `src/components/TransitionCinematic.tsx` | “Entering the canvas” cutscene |
| `src/components/TransitionCinematic.css` | Zoom, vignette, title reveal |
| `src/components/WorldHUD.tsx` | In-world controls, narration, styles |
| `src/components/WorldHUD.css` | HUD, compare panel styles |
| `src/components/ComparePanel.tsx` | Original vs world split view |
| `src/styles/global.css` | Typography, colors, CSS variables |

---

## Tasks

### 1. Landing page (Priority: High)

- [ ] Polish hero: title **Canvas Dreams**, tagline **Step Inside the Art.**
- [ ] Refine upload button hover states and gold accent consistency.
- [ ] Sample artwork grid: equal cards, hover lift, artist names.
- [ ] Add subtle grain / vignette (`.landing-grain`) without hurting performance.
- [ ] Footer taglines: “Where Paintings Come Alive” / “Walk Through Imagination.”

### 2. Analyzing experience (Priority: High)

- [ ] Sync progress bar with `analysisProgress` from store.
- [ ] Rotate status messages smoothly (no jarring jumps).
- [ ] Painting preview frame: museum-style mat/border.
- [ ] Optional: show detected mood/color chips as analysis completes.

### 3. Enter transition (Priority: High)

- [ ] Cinematic zoom on artwork (`TransitionCinematic`).
- [ ] Display `analysis.title` and capitalized `analysis.mood`.
- [ ] Smooth fade to black before 3D world appears.
- [ ] Total transition ~4s — not too long for judges.

### 4. In-world HUD (Priority: High)

- [ ] **Pre-enter panel:** title, narration excerpt, **Step Inside** button (triggers `setEnteredWorld(true)`).
- [ ] Controls hint: “WASD · Mouse · Click orbs” — legible on dark gradient.
- [ ] Style switcher pills: Original, Oil, Watercolor, Surreal, Cyberpunk, Pixel.
- [ ] Toggles: Compare Original, Narration, Sound — clear on/off state.
- [ ] Exit Gallery returns to landing (`reset()`).

### 5. Compare mode (Priority: Medium)

- [ ] `ComparePanel`: floating frame, label “Original Canvas.”
- [ ] Draggable or fixed top-right; doesn’t block center view.
- [ ] Subtle border glow matching `--gold`.

### 6. Mobile & accessibility (Priority: Medium)

- [ ] Responsive landing grid (2 columns on phone).
- [ ] Touch-friendly button sizes (min 44px).
- [ ] Virtual joystick or tap-to-move note if FP controls are desktop-only.
- [ ] `prefers-reduced-motion`: disable scan line / heavy animations.
- [ ] Alt text on images; focus states on buttons.

### 7. Visual system (Priority: Medium)

Document in CSS comments:

| Token | Usage |
|-------|--------|
| `--ink` | Background |
| `--cream` | Text |
| `--gold` | Accents, CTAs |
| `--serif` | Headlines (Cormorant Garamond) |
| `--sans` | UI (Outfit) |

- [ ] No new fonts without team agreement.
- [ ] Keep contrast readable on dark backgrounds.

---

## Inputs you need from teammates

| From | You need |
|------|----------|
| **Paul** | `analysis.title`, `analysis.mood`, `analysis.narration`, progress timing |
| **Gab** | Store actions: `setEnteredWorld`, `setCompareMode`, `setStyle`, `reset` |
| **Adrian** | World runs only after `enteredWorld === true`; don’t block canvas with full-screen HUD |

---

## Definition of done

- First-time user understands: upload → wait → enter → explore within 10 seconds.
- HUD readable over bright and dark 3D scenes (semi-transparent panels).
- Landing + transition feel “museum / cinema,” not generic SaaS.
- Layout works on 375px-wide mobile without horizontal scroll.

---

## Helpful commands

```bash
npm run dev
# Resize browser DevTools → iPhone 14 profile
```

---

## Design references

- Slow, minimal motion (fade, not bounce)
- Large serif headlines, small caps for labels
- Gold on near-black (#0a0908)
