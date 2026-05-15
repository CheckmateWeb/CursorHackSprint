# Paul — setup & branch

Your analysis/audio improvements live in `src/lib/imageAnalysis.ts` and `src/lib/audioEngine.ts`.

## 1. Get the full repo (one-time)

In **PowerShell** (outside the sandboxed agent terminal):

```powershell
cd C:\Users\paulr\.cursor\projects\empty-window\CursorHackSprint
node scripts/fetch-upstream.mjs
```

This downloads all upstream files from GitHub and **keeps** your Paul lib changes.

## 2. Create your feature branch

```powershell
cd C:\Users\paulr\.cursor\projects\empty-window\CursorHackSprint
git init
git remote add origin https://github.com/CheckmateWeb/CursorHackSprint.git
git fetch origin master
git checkout -b master FETCH_HEAD
git checkout -B feature/paul-scene-analysis-audio
npm install
npm run dev
```

If the repo is already cloned elsewhere, copy only these two files into your clone instead:

- `src/lib/imageAnalysis.ts`
- `src/lib/audioEngine.ts`

Then branch from latest `master` / `develop` as your team agrees.

## 3. Commit (when ready)

```powershell
git add src/lib/imageAnalysis.ts src/lib/audioEngine.ts
git commit -m "feat(analysis): improve scene understanding, depth layers, and adaptive audio"
git push -u origin feature/paul-scene-analysis-audio
```

Open a PR into `develop` (or `master` if Gab says so). Do **not** push to `master` directly.

## What changed

- **Analysis:** k-means++ palette, richer mood/weather/night detection, depth histogram layers, region-based object labels, generated titles/narration.
- **Audio:** mood chords, dual LFO, noise bed, rain/mysterious/dream drones, smooth fades, spatial chimes by depth/color.
- **Contract:** `SceneAnalysis` shape unchanged for Adrian, Arden, and Gab.
