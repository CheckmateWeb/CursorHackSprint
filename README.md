# Canvas Dreams

**Step Inside the Art.** — An immersive web experience that transforms paintings into explorable 3D worlds.

## Features

- Upload or choose sample artwork
- AI-style scene analysis (colors, mood, depth, weather, objects)
- First-person exploration with Three.js
- Dynamic effects: clouds, particles, brush strokes, weather, water
- Procedural ambient soundtrack and spatial audio chimes
- Style filters: oil, watercolor, surreal, cyberpunk, pixel
- Compare original painting vs immersive world
- Optional narration

## Run locally

```bash
npm install
cp .env.example .env   # optional: add Replicate token for AI outpainting
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### AI painting extension (optional)

To generate **more real painting detail** beyond the frame (not just blurred smears), add a [Replicate](https://replicate.com) API token:

```
VITE_REPLICATE_API_TOKEN=r8_xxx
```

Uses inpainting/outpainting models (`emaph/outpaint-controlnet-union` or `stability-ai/stable-diffusion-inpainting`) to extend left/right in the artist’s style. Without a token, the app uses **patch-based texture synthesis** locally.

Other options we evaluated: [openOutpaint](https://github.com/zero01101/openOutpaint) (needs local Stable Diffusion server), Hugging Face Diffusers (requires self-hosted GPU).

## Build

```bash
npm run build
npm run preview
```

## Tech

- React + TypeScript + Vite
- React Three Fiber + Drei + Postprocessing
- Web Audio API for generative ambience
- Client-side canvas image analysis

## Taglines

- Step Inside the Art.
- Experience the World Beyond the Canvas.
- Where Paintings Come Alive.
- Walk Through Imagination.
