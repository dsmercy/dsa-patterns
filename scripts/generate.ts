/*
 * Generates src/problems/<slug>/problem.ts from the DSA handbook + scripts/authoring.mjs.
 *   npm run generate -- 6-60          (range)      npm run generate -- 54      (one)      npm run generate -- 6-60 --force
 * Every expected value (tests + quiz answers) is produced by running the reference Java through the same
 * engine the website uses, and the handbook's "better" solution is cross-checked against it.
 */
import fs from "node:fs";
import path from "node:path";
import { execute } from "../src/lib/java/engine";
import authoring1 from "./authoring.mjs";
import authoringBinary from "./authoring_binary.mjs";
import authoringTrees from "./authoring_trees.mjs";
import authoringGraphs from "./authoring_graphs.mjs";
import authoringLists from "./authoring_lists.mjs";
import authoringStacks from "./authoring_stacks.mjs";
import authoringDp from "./authoring_dp.mjs";
import authoringHeapBt from "./authoring_heap_bt.mjs";
// every authoring_*.mjs file contributes entries keyed by handbook number
const authoring = { ...authoring1, ...authoringBinary, ...authoringTrees, ...authoringGraphs, ...authoringLists, ...authoringStacks, ...authoringDp, ...authoringHeapBt } as Record<number, any>;

const SERIES = process.env.DSA_SERIES_DIR ?? "F:/Projects/Algorithm-Visualization-Engine-Tier2/dsa-series-v2";
const OUT = path.join(process.cwd(), "src", "problems");
const H: any[] = JSON.parse(fs.readFileSync(path.join(SERIES, "handbook.json"), "utf8"));
const slugOf = new Map<number, string>();
for (const d of fs.readdirSync(SERIES)) { const m = d.match(/^DSA-H(\d+)-(.+)$/); if (m) slugOf.set(+m[1], m[2]); }

const args = process.argv.slice(2);
const force = args.includes("--force");
const pick = args.find((a) => !a.startsWith("--")) ?? "";
const [lo, hi] = pick.includes("-") ? pick.split("-").map(Number) : [Number(pick), Number(pick)];
if (!lo) { console.error("usage: generate <n | a-b> [--force]"); process.exit(1); }

const methodOf = (code: string) => {
  if (!/class\s+Solution\b/.test(code)) return code.match(/class\s+(\w+)/)![1]; // design problem: the class is the entry point
  // prefer a public method (the entry point) over private helpers that may be declared first
  return (code.match(/public\s+[\w<>[\],.\s?]+?\s+(\w+)\s*\(/) ?? code.match(/(?:private|static)\s+[\w<>[\],.\s?]+?\s+(\w+)\s*\(/))![1];
};
const parseInput = (s: string): unknown[] => JSON.parse(`[${s}]`);
const j = (v: unknown) => JSON.stringify(v);
const show = (v: unknown): string => (typeof v === "string" ? JSON.stringify(v) : Array.isArray(v) ? `[${v.map(show).join(",")}]` : v === null ? "null" : String(v));

// deterministic shuffle
function rng(seed: number) { let s = seed * 2654435761 % 4294967296; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

function distractors(correct: unknown, input: unknown[], seed: number): string[] {
  const out = new Set<string>(); const c = show(correct); const r = rng(seed);
  const add = (v: unknown) => { const s = show(v); if (s !== c) out.add(s); };
  if (typeof correct === "number") {
    for (const d of [1, -1, 2, -2, 3]) if (correct + d >= 0 || correct < 0) add(correct + d);
    add(correct * 2); add(Math.max(0, Math.floor(correct / 2)));
  } else if (typeof correct === "boolean") add(!correct);
  else if (typeof correct === "string") {
    add([...correct].reverse().join("")); add(correct.slice(1)); add(correct.slice(0, -1)); add(correct + correct[0]); if (typeof input[0] === "string") add(input[0].slice(0, correct.length)); add([...correct].sort().join(""));
  } else if (Array.isArray(correct) && correct.length) {
    if (correct.every((x) => typeof x === "number")) {
      const a = correct as number[];
      add([...a].reverse()); add([...a].sort((x, y) => x - y)); add([...a].sort((x, y) => y - x)); add([...a.slice(1), a[0]]); add(a.slice(0, -1));
      if (a.length > 1) { const sw = [...a]; [sw[0], sw[1]] = [sw[1], sw[0]]; add(sw); }
      add(a.map((x) => x + 1));
    } else if (correct.every((x) => Array.isArray(x))) { const a = correct as unknown[][]; add(a.slice(0, -1)); add([...a].reverse()); add(a.map((x) => [...x].reverse())); }
    else { const a = correct as unknown[]; add([...a].reverse()); add(a.slice(0, -1)); add([...a.slice(1), a[0]]); }
  }
  return [...out].sort(() => r() - 0.5);
}

function buildOptions(correct: unknown, input: unknown[], seed: number, explicit?: string[], correctStr?: string): { options: string[]; answer: number } {
  const c = correctStr ?? show(correct);
  if (explicit) { const i = explicit.indexOf(c); if (i < 0) throw new Error(`explicit options do not contain the correct answer ${c}`); return { options: explicit, answer: i }; }
  if (typeof correct === "boolean") return { options: ["true", "false"], answer: c === "true" ? 0 : 1 };
  const wrong = distractors(correct, input, seed).slice(0, 3);
  if (wrong.length < 3) throw new Error(`could not make enough distractors for ${c}`);
  const opts = [...wrong]; const r = rng(seed + 7);
  const pos = Math.floor(r() * 4); opts.splice(pos, 0, c);
  return { options: opts, answer: pos };
}

/** pretty JSON, but arrays that fit on a line stay on one line */
function compact(s: string): string { return fmt(JSON.parse(s), 0); }
function fmt(v: unknown, depth: number): string {
  const pad = "  ".repeat(depth + 1), end = "  ".repeat(depth);
  if (Array.isArray(v)) {
    const flat = JSON.stringify(v).replace(/,/g, ", ");
    if (flat.length <= 100 && !v.some((x) => x && typeof x === "object" && !Array.isArray(x))) return flat;
    const NL = String.fromCharCode(10);
    return "[" + NL + v.map((x) => pad + fmt(x, depth + 1)).join("," + NL) + NL + end + "]";
  }
  if (v && typeof v === "object") {
    const NL = String.fromCharCode(10);
    const e = Object.entries(v as object);
    return "{" + NL + e.map(([k, x]) => pad + JSON.stringify(k) + ": " + fmt(x, depth + 1)).join("," + NL) + NL + end + "}";
  }
  return JSON.stringify(v);
}

const canonOf = (a: any, v: any) => (a.unordered && Array.isArray(v) ? [...v].sort((x: any, y: any) => (JSON.stringify(x) < JSON.stringify(y) ? -1 : 1)) : v);
const pickOf = (a: any, v: any) => (a.pick !== undefined && Array.isArray(v) ? v[a.pick] ?? null : v);

let made = 0, problems = 0;
const warn: string[] = [];
for (let n = lo; n <= hi; n++) {
  const h = H[n - 1]; const a = authoring[n];
  const slug = slugOf.get(n);
  if (!h || !slug) { warn.push(`#${n}: not in handbook`); continue; }
  if (!a) { warn.push(`#${n} ${slug}: no authoring entry — skipped`); continue; }
  const file = path.join(OUT, slug, "problem.ts");
  if (fs.existsSync(file) && !force && !/Generated by scripts\/generate/.test(fs.readFileSync(file, "utf8"))) { console.log(`#${n} ${slug}: hand-written file exists, skipped`); continue; }
  problems++;
  const method = a.method ?? methodOf(h.c);
  const err = (m: string) => warn.push(`#${n} ${slug}: ${m}`);

  // --- tests (expected = what the reference Java returns)
  const testArgs = a.tests.map(([, inp]: [string, string]) => parseInput(inp));
  const res = execute(h.c, method, testArgs, { prelude: a.prelude });
  if (!res.ok) { err(`reference does not compile/run: ${res.error}`); continue; }
  const tests = a.tests.map(([label]: [string], i: number) => {
    const r = res.results[i];
    if (!r.ok) err(`test "${label}" throws: ${r.error}`);
    return { name: label, args: testArgs[i], expected: r.ok ? pickOf(a, r.value) : null };
  });

  // --- better solution must agree with the reference on every test
  if (h.b && !a.skipBetter) {
    const bm = methodOf(h.b.c);
    const br = execute(h.b.c, bm, testArgs, { prelude: a.prelude });
    if (!br.ok) err(`better solution does not compile/run: ${br.error}`);
    else br.results.forEach((r, i) => { if (!r.ok) err(`better solution throws on "${a.tests[i][0]}": ${r.error}`); else if (JSON.stringify(canonOf(a, r.value)) !== JSON.stringify(canonOf(a, res.results[i].value))) err(`better solution DISAGREES on "${a.tests[i][0]}": ${JSON.stringify(r.value)} vs ${JSON.stringify(res.results[i].value)}`); });
  }

  // --- handbook example check
  const defaultInput: string = a.defaultInput ?? String(h.i).replace(/\b[A-Za-z_]\w*\s*=\s*/g, "");
  try {
    const er = execute(h.c, method, [parseInput(defaultInput)], { prelude: a.prelude });
    if (er.ok && er.results[0].ok) {
      const got = show(er.results[0].value);
      const want = String(h.o).split(/\s+/)[0].replace(/[,;]$/, "");
      if (!String(h.o).includes(got) && got !== want) warn.push(`#${n} ${slug}: example output ${got} vs handbook "${h.o}" (check manually)`);
    } else err(`example input fails: ${er.ok ? er.results[0].error : er.error}`);
  } catch (e) { err(`defaultInput not parseable: ${defaultInput}`); }

  // --- quick challenge
  let challenge: any;
  try {
    const cin = parseInput(a.c.input);
    const cr = execute(h.c, method, [cin], { prelude: a.prelude });
    if (!cr.ok || !cr.results[0].ok) throw new Error(`challenge input fails: ${!cr.ok ? cr.error : cr.results[0].error}`);
    const raw = pickOf(a, cr.results[0].value);
    const value = a.c.f ? a.c.f(raw) : raw;
    const { options, answer } = buildOptions(value, cin, n, a.c.options, a.c.correct);
    challenge = { question: a.c.q, input: a.c.input, options, answer, explanation: a.c.e };
  } catch (e: any) { err(`challenge: ${e.message}`); }

  const pattern = h.cn ?? a.p ?? (h.b ? h.b.n : undefined);
  if (!pattern) err("no pattern label (handbook cn / authoring p)");

  const problem = {
    id: `DSA-H${String(n).padStart(3, "0")}`, number: n, slug, title: h.t, category: h.section,
    definition: h.d, example: { input: h.i, output: h.o },
    approach: h.plain, keyIdea: h.a, time: h.ts[0], space: h.ts[1], complexityWhy: h.w,
    figure: h.g ?? undefined,
    better: h.b ? { name: h.b.n, time: h.b.ts[0], space: h.b.ts[1], code: h.b.c } : undefined,
    code: h.c, method, prelude: a.prelude, resultIndex: a.pick, unordered: a.unordered, viz: a.viz, defaultInput,
    tests, challenge,
    memory: { remember: a.r, pattern: pattern ?? "" },
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `// Generated by scripts/generate.ts from the DSA handbook + scripts/authoring.mjs — edit those, then re-run the generator.\nimport type { Problem } from "../types";\n\nconst problem: Problem = ${JSON.stringify(problem, null, 2)};\n\nexport default problem;\n`);
  made++;
  if (process.env.VERBOSE) console.log(`#${n} ${slug}: ${tests.length} tests, answer "${challenge?.options?.[challenge.answer]}" in ${j(challenge?.options)}`);
}
console.log(`\n${made}/${problems} problem file(s) written.`);
if (warn.length) { console.log(`\n${warn.length} warning(s):`); warn.forEach((w) => console.log("  - " + w)); }
