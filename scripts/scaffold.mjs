#!/usr/bin/env node
/**
 * Scaffold src/problems/<slug>/problem.ts from the video folder's spec.json.
 *
 *   npm run scaffold -- 2            # by handbook number
 *   npm run scaffold -- 2 3 54       # several
 *   npm run scaffold -- 1-20         # range
 *   npm run scaffold -- all          # everything (skips existing unless --force)
 *
 * The generated page already works (learn cards + editable Java + Run on custom input).
 * Then add what makes it great: `tests` + `reference` (checked results) and `buildSteps` (animation).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Source of the problem videos/specs (the dsa-series-v2 folder). Override with DSA_SERIES_DIR.
const root = process.env.DSA_SERIES_DIR ?? "F:/Projects/Algorithm-Visualization-Engine-Tier2/dsa-series-v2";
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "problems");
const args = process.argv.slice(2);
const force = args.includes("--force");
const picks = args.filter((a) => !a.startsWith("--"));
if (!picks.length) { console.error("usage: npm run scaffold -- <number | a-b | all> [--force]"); process.exit(1); }

const dirs = readdirSync(root).filter((d) => /^DSA-H\d+-/.test(d));
const num = (d) => +d.match(/^DSA-H(\d+)-/)[1];
const wanted = new Set();
for (const p of picks) {
  if (p === "all") dirs.forEach((d) => wanted.add(d));
  else {
    const [a, b = a] = p.split("-").map(Number);
    dirs.filter((d) => num(d) >= a && num(d) <= b).forEach((d) => wanted.add(d));
  }
}

const q = (s) => JSON.stringify(s ?? "");
let made = 0;
for (const dir of [...wanted].sort((a, b) => num(a) - num(b))) {
  const specPath = join(root, dir, "spec.json");
  if (!existsSync(specPath)) { console.warn("skip (no spec.json):", dir); continue; }
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  const slug = dir.replace(/^DSA-H\d+-/, "");
  const file = join(out, slug, "problem.ts");
  if (existsSync(file) && !force) { console.log("exists, skipped:", slug); continue; }

  const code = (spec.javaCode ?? []).join("\n");
  const method = code.match(/(?:public|private|static)\s+[\w<>[\],\s]+?\s+(\w+)\s*\(/)?.[1] ?? "solve";
  const input = String(spec.input ?? "").replace(/\b[A-Za-z_]\w*\s*=\s*/g, "");   // "nums = [1], k = 2" -> "[1], 2"
  const ts = `import type { Problem } from "../types";

// Scaffolded from ${dir}/spec.json — edit freely. Re-running the scaffold will NOT overwrite this file.
const CODE = ${JSON.stringify(code)};

const problem: Problem = {
  id: ${q(spec.id)},
  number: ${spec.handbookNumber},
  slug: ${q(slug)},
  title: ${q(spec.title)},
  category: ${q(spec.category)},
  definition: ${q(spec.definition)},
  example: { input: ${q(spec.input)}, output: ${q(spec.output)} },
  approach: ${q(spec.plainApproach)},
  keyIdea: ${JSON.stringify(spec.keyIdeaPoints ?? [], null, 2).replace(/\n/g, "\n  ")},
  time: ${q(spec.timeComplexity)},
  space: ${q(spec.spaceComplexity)},
  complexityWhy: ${q(spec.complexityWhy)},
  code: CODE,
  method: ${q(method)},
  defaultInput: ${q(input)},

  // TODO(tests): add cases + a trusted JS \`reference\` so the playground can check results.
  // tests: [{ name: "Example", args: [/* ... */] }],
  // reference: (...args) => ...,

  // TODO(viz): add \`buildSteps(args): Step[]\` to enable "Watch it run" (see best-time-to-buy-and-sell-stock).
};

export default problem;
`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, ts);
  console.log("created:", slug, `(method ${method})`);
  made++;
}
console.log(`\n${made} problem(s) scaffolded.`);
