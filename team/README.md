# Canvas Dreams — Team Assignments

**Project:** Immersive AI-powered app — step inside paintings as explorable 3D worlds  
**Repository:** https://github.com/CheckmateWeb/CursorHackSprint.git

| Member | Focus | Task file |
|--------|--------|-----------|
| **Gab** | Lead, integration, Git, deploy, demo | [GAB.md](./GAB.md) |
| **Adrian** | 3D world, effects, first-person exploration | [ADRIAN.md](./ADRIAN.md) |
| **Paul** | Image analysis, audio, narration | [PAUL.md](./PAUL.md) |
| **Arden** | UI/UX, transitions, HUD, mobile | [ARDEN.md](./ARDEN.md) |

## Workflow

1. Clone the repo and run `npm install` && `npm run dev`.
2. Each member works on their files; use feature branches (`feature/adrian-depth`, etc.).
3. Merge to `develop` daily; Gab merges to `main` before demo.
4. Check off tasks in your MD file; comment on PRs for cross-team files.

## Integration order (suggested)

```
Paul (analysis/audio) → Adrian (3D uses analysis) → Arden (UI wired to store) → Gab (E2E + deploy)
```

## Shared rules

- Do not commit `node_modules/` or secrets (`.env`).
- Keep `SceneAnalysis` type stable — discuss changes in group chat.
- Tagline: **Step Inside the Art.**
