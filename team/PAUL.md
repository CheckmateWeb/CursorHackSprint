# Paul — AI Analysis, Audio & Atmosphere

**Role:** Scene understanding from paintings, depth/mood detection, generative soundtrack, and spatial audio  
**Focus:** The experience should *feel* intelligent — music and ambience match the artwork’s emotion.

---

## Your mission

Make the app “read” each painting and respond with believable analysis, narration, and an adaptive soundscape.

---

## Primary files (you own)

| File | Purpose |
|------|---------|
| `src/lib/imageAnalysis.ts` | Color extraction, mood, weather, objects, depth layers |
| `src/lib/audioEngine.ts` | Procedural ambient music, spatial chimes, reverb |
| `src/lib/types.ts` | `SceneAnalysis`, `Mood`, `WeatherEffect` (coordinate with Gab) |

---

## Tasks

### 1. Scene understanding (Priority: High)

- [ ] Improve color clustering (`kMeansColors`) for more accurate dominant palette.
- [ ] Better `inferMood()` using brightness, saturation, contrast, and warmth together.
- [ ] Detect night vs day from top-third vs bottom-third luminance (refine `isNight`).
- [ ] Improve `hasWater` / `hasTrees` / `hasSky` heuristics.
- [ ] Return richer `objects[]` with labels tied to image regions (not random names).

### 2. Depth estimation (Priority: High)

- [ ] Build a simple depth map from luminance + vertical position (sky top, ground bottom).
- [ ] Output `depthLayers` (3–6) based on depth histogram, not only contrast.
- [ ] Optional: integrate a lightweight depth model (e.g. ONNX Runtime + small model) if time allows.
- [ ] Document depth algorithm in code comments for Adrian to consume.

### 3. Narration (Priority: Medium)

- [ ] Expand `buildNarration()` with mood-specific paragraphs (2–3 sentences).
- [ ] Add optional `title` generation from palette + mood (e.g. “Whispers of Amber Dusk”).
- [ ] Optional: Web Speech API `speechSynthesis` toggle wired to `narrationEnabled` in store.

### 4. Ambient soundtrack (Priority: High)

- [ ] Refine `AudioEngine.start()` chord roots per `Mood` (serene, melancholic, joyful, etc.).
- [ ] Add second LFO or filtered noise layer for texture (wind, room tone).
- [ ] Fade in/out smoothly on enter/exit world (no clicks/pops).
- [ ] Respect `audioEnabled` from store; resume AudioContext on user gesture.

### 5. Dynamic soundscape (Priority: Medium)

- [ ] Environmental loops: rain hiss when `weather === 'rain'`, low drone when `mysterious`.
- [ ] `playSpatialChime()` variation by hotspot depth and color.
- [ ] Optional: subtle footstep or brush-stroke foley on movement (very quiet).

### 6. AI API integration (Priority: Low — stretch)

- [ ] Add optional OpenAI / Gemini vision endpoint behind env var `VITE_AI_API_KEY`.
- [ ] Fallback to client-side analysis if API unavailable (hackathon-safe).
- [ ] Return structured JSON matching `SceneAnalysis`.

---

## Outputs other teammates depend on

```typescript
// SceneAnalysis — keep this shape stable
{
  palette, mood, warmth, brightness, contrast, saturation,
  hasWater, hasSky, hasTrees, isNight, weather,
  depthLayers, objects[], narration, title
}
```

| Teammate | Uses |
|----------|------|
| **Adrian** | `depthLayers`, `objects`, `weather`, palette, flags |
| **Arden** | `title`, `mood`, `narration` for HUD and analyzing screen |
| **Gab** | Full object for app flow and demo |

---

## Definition of done

- Uploading different images produces visibly different mood/weather/narration.
- Audio starts after “Step Inside” and matches mood (audible difference serene vs dramatic).
- Hotspot clicks play spatial chime without errors.
- `analyzePainting()` completes in under 2 seconds for 2MP images.

---

## Helpful commands

```bash
npm run dev
# Test: upload dark vs bright images, compare analysis in React DevTools / console.log
```

---

## Testing checklist

- [ ] Starry / dark sample → `isNight`, ethereal or melancholic mood
- [ ] Warm sunset sample → `joyful`, clear or fog weather
- [ ] Blue-green sample → `hasWater` true
- [ ] Mute/unmute from HUD stops and restarts audio cleanly
