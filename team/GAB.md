# Gab — Project Lead & Integration

**Role:** Team lead, app flow, repository, deployment, and final integration  
**Remote:** https://github.com/CheckmateWeb/CursorHackSprint.git

---

## Your mission

Own the full user journey from landing → analysis → transition → world, make sure all four teammates’ work merges cleanly, and prepare the hackathon demo.

---

## Primary files (you own or coordinate)

| Area | Files |
|------|--------|
| App shell | `src/App.tsx` |
| Global state | `src/store/useAppStore.ts`, `src/lib/types.ts` |
| Project docs | `README.md`, `.gitignore` |
| Samples | `src/lib/sampleArtworks.ts` |

---

## Tasks

### 1. Repository & Git (Priority: High)

- [ ] Initialize git **inside** the `Cursor` project folder (not the user home directory).
- [ ] Set remote: `git remote add origin https://github.com/CheckmateWeb/CursorHackSprint.git`
- [ ] Push the full Canvas Dreams codebase to `main`.
- [ ] Add branch protection rules / agree on PR workflow with the team.
- [ ] Ensure `node_modules/` and `dist/` stay in `.gitignore`.

### 2. App flow & state (Priority: High)

- [ ] Verify all phases work: `landing` → `analyzing` → `transition` → `world`.
- [ ] Fix any broken imports or TypeScript errors (`npm run build` must pass).
- [ ] Wire teammate changes through `useAppStore` without breaking phase logic.
- [ ] Add error boundary if image upload or analysis fails.

### 3. Integration checkpoints (Priority: High)

Schedule merges with:

| Teammate | Delivers into |
|----------|----------------|
| **Arden** | Landing, HUD, transitions, CSS |
| **Adrian** | `src/components/world/*` |
| **Paul** | `src/lib/imageAnalysis.ts`, `src/lib/audioEngine.ts` |

- [ ] Create a shared `develop` branch for daily merges.
- [ ] Resolve merge conflicts before demo day.

### 4. Demo & documentation (Priority: Medium)

- [ ] Write a 2-minute demo script (upload → analyze → step inside → interact → compare).
- [ ] Update `README.md` with team credits and setup steps.
- [ ] Add a `DEMO.md` with talking points and fallback sample artworks.
- [ ] Record a short screen capture as backup if live demo fails.

### 5. Deployment (Priority: Medium)

- [ ] Deploy to Vercel or Netlify (connect to CursorHackSprint repo).
- [ ] Test on mobile browser (upload + explore).
- [ ] Share live URL with judges / team.

### 6. Sample content (Priority: Low)

- [ ] Replace procedural samples with 2–4 real paintings (royalty-free).
- [ ] Add artist name / title in HUD when using real works.

---

## Definition of done

- `npm run build` succeeds with zero errors.
- Live demo URL works on desktop and mobile.
- All four member task files’ **critical** items are integrated.
- Repo `CursorHackSprint` contains the full project.

---

## Daily standup questions

1. What did you merge yesterday?
2. What is blocking integration today?
3. Is the demo path still working end-to-end?

---

## Contact

Coordinate PR reviews and assign issues in GitHub for Adrian, Paul, and Arden.
