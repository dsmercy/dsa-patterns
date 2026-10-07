# DSA Patterns in Java — Coding Hacks

Visual, step-by-step DSA walkthroughs with an editable, runnable Java playground — 60 problems so far
(Arrays, Strings, Sorting, Math, Hashing). Vite + React + TypeScript, deployed to GitHub Pages.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (HashRouter + relative base: host anywhere)
npm run generate -- 6-60 --force   # regenerate problem pages from the handbook
```

## Deploy
Push to `main`. `.github/workflows/deploy.yml` builds and publishes to GitHub Pages
(repo **Settings → Pages → Source: GitHub Actions**, set once).

## How a problem page is made
`npm run generate -- <n | a-b>` reads the DSA handbook (`handbook.json`, path in `scripts/generate.ts`, override with `DSA_SERIES_DIR`)
plus the hand-written `scripts/authoring.mjs` (test inputs, quiz question, "remember" line) and writes `src/problems/<slug>/problem.ts`.
Expected results and quiz answers are **produced by running the reference Java** through the same engine the site uses,
and each handbook "better" solution is cross-checked against it. Pages #1–#5 are hand-written (custom animations).

Every page: learn cards + handbook figure, **Watch it run** (live trace of the real Java: pointers, changed cells, variables),
Quick Challenge, editable Java playground with test cases, Interview Memory.

## The in-browser Java engine (`src/lib/java/`)
Tokenizer + parser + statically-typed compiler to JS (`parser.ts`, `compiler.ts`) and a runtime (`runtime.ts`) with Java semantics:
int overflow, integer division, char arithmetic, Strings/StringBuilder, ArrayList/LinkedList/ArrayDeque/Stack/PriorityQueue,
HashMap (Java iteration order)/LinkedHashMap/TreeMap, HashSet/LinkedHashSet/TreeSet, Arrays/Collections/Math/Integer/Character, lambdas,
exceptions, ListNode/TreeNode, and "design" problems (constructor + operations). Runs in a Web Worker with a timeout.
Known limits: `long` is a double (exact to 2^53), no inheritance/`super`, no anonymous or inner (non-static) classes, no generics-aware overloads.
