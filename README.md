# DSA Patterns in Java — Coding Hacks

Visual, step-by-step DSA walkthroughs with an editable, runnable Java playground. Vite + React + TypeScript, deployed to GitHub Pages.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (HashRouter + relative base: host anywhere)
npm run preview
```

## Deploy
Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes to GitHub Pages
(repo **Settings → Pages → Source: GitHub Actions**, set once).

## Add a problem
1. `npm run scaffold -- 54` (number, range `1-20`, or `all`) creates `src/problems/<slug>/problem.ts` from the video folder's `spec.json`
   (reads `F:/Projects/Algorithm-Visualization-Engine-Tier2/dsa-series-v2`; override with `DSA_SERIES_DIR`). The page is auto-registered.
2. Upgrade it: `tests` + `reference` (checked results), `buildSteps` ("Watch it run"), `challenge` (Quick Challenge), `memory` (Interview Memory).
   Model: `src/problems/best-time-to-buy-and-sell-stock/problem.ts`.

## Structure
- `src/problems/types.ts` — `Problem`, `Step`, `Stage`, `Challenge`, `InterviewMemory` contracts
- `src/components/` — `LearnCards`, `Visualizer`, `QuickChallenge`, `Playground`, `InterviewMemory`, `CodeEditor`, `CodeBlock`, `stages/Stage`
- `src/lib/javaRunner/` — Java-subset → JS translator + Web Worker runner (timeout-protected; no int overflow / integer `/`, no ListNode/TreeNode yet)
