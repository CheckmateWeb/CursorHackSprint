# Adrian — 3D World & Immersive Experience

**Role:** Three.js scene, first-person exploration, visual effects, and “inside the painting” feel  
**Focus:** Make exploration cinematic, dreamlike, and emotionally immersive — not game-like.

---

## Your mission

Build and polish the 3D world so users feel they have **entered the artwork**: depth, atmosphere, motion, and subtle interactions.

---

## Primary files (you own)

| File | Purpose |
|------|---------|
| `src/components/world/PaintingWorld.tsx` | Main 3D scene, layers, lighting, post-processing |
| `src/components/world/BrushStrokeParticles.tsx` | Floating brush-stroke particles |
| `src/components/world/WeatherLayer.tsx` | Rain, snow, fog, dream particles |
| `src/components/world/InteractiveHotspot.tsx` | Clickable orbs, memories, spatial triggers |
| `src/components/world/styleShaders.ts` | Style presets (oil, watercolor, surreal, etc.) |

---

## Tasks

### 1. First-person exploration (Priority: High)

- [ ] Improve `FirstPersonControls`: pointer-lock on “Step Inside” click.
- [ ] Add on-screen hint: “Click to look around” until locked.
- [ ] Tune movement speed (`movementSpeed`) for cinematic pace, not FPS-game speed.
- [ ] Prevent camera clipping through depth layers.

### 2. Depth & environment reconstruction (Priority: High)

- [ ] Use `analysis.depthLayers` and `analysis.objects` from Paul’s analysis to place layers and hotspots.
- [ ] Add parallax between depth planes based on camera position.
- [ ] Improve back-wall sky treatment (`mesh` at `z: -18`) for seamless horizon.
- [ ] When `analysis.hasWater`, refine water plane animation and reflection feel.

### 3. Dynamic environmental effects (Priority: High)

- [ ] Map `analysis.weather` to effects: `rain`, `fog`, `snow`, `dream`, `clear`.
- [ ] Add sunlight god-rays when `!analysis.isNight` and mood is `joyful` or `serene`.
- [ ] Animate clouds speed based on `analysis.mood`.
- [ ] Add subtle fog density tied to `analysis.palette.sky`.

### 4. Style preservation (Priority: Medium)

- [ ] Wire `style` prop from store into all materials (already started in `styleShaders.ts`).
- [ ] Per-style post-processing: stronger bloom for surreal, scanlines for pixel, chromatic aberration for cyberpunk.
- [ ] Painterly texture overlay (optional shader pass) for `oil` and `watercolor`.

### 5. Interactions (Priority: Medium)

- [ ] Expand `InteractiveHotspot`: hover glow, distance-based visibility.
- [ ] Trigger short camera sway or color pulse when memory text appears.
- [ ] Add 1–2 “hidden” hotspots only visible when user walks near them.

### 6. Performance (Priority: Medium)

- [ ] Cap particle counts on mobile (detect `window.innerWidth` or `navigator.hardwareConcurrency`).
- [ ] Lazy-load textures; dispose on unmount.
- [ ] Target 60fps on mid-range laptop; 30fps acceptable on mobile.

---

## Inputs you need from teammates

| From | You need |
|------|----------|
| **Paul** | `SceneAnalysis` with accurate `depthLayers`, `objects`, `weather`, `hasWater`, `isNight` |
| **Arden** | “Step Inside” button must call `setEnteredWorld(true)` before controls activate |
| **Gab** | Stable `imageUrl` and `analysis` in store when `phase === 'world'` |

---

## Definition of done

- User can walk through layered painting world in first person.
- Weather and mood visibly change the atmosphere.
- At least 3 clickable hotspots trigger memory + sound.
- All 6 art styles look distinctly different.
- No console errors from Three.js or R3F.

---

## Helpful commands

```bash
npm run dev
# Edit src/components/world/PaintingWorld.tsx
```

---

## References

- [React Three Fiber docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei helpers](https://github.com/pmndrs/drei)
