/*
 * Turns an execution trace of the real Java code into animation Steps (so every problem can be visualised
 * without hand-written animation code).
 *   - 1D arrays / short Strings become rows of tiles; int variables used as an index of that array become pointer labels
 *   - cells that changed since the previous step are highlighted
 *   - other scalars go to the state panel, collections / objects to the "extra" lines
 */
import type { Block, Cell, Step } from "../problems/types";
import type { TraceStep } from "./java";

type Snap = NonNullable<TraceStep["vars"][number]["v"]>;
const INT_TYPES = new Set(["int", "long", "short", "byte", "Integer", "Long"]);
const MAX_ROWS = 3, MAX_STATE = 8, MAX_STRING = 24;

interface Prev { arrays: Map<string, (string | number | boolean | null)[]>; scalars: Map<string, string> }

export function traceToSteps(trace: TraceStep[], code: string, indexUse: Record<string, string[]>, viz?: "container" | "trap" | "heap"): Step[] {
  const lines = code.split("\n");
  const steps: Step[] = [];
  const prevByFn = new Map<string, Prev>();
  let lastVisual: Step | null = null;

  trace.forEach((t, idx) => {
    const isReturn = t.vars.length === 1 && t.vars[0].n === "return" && idx === trace.length - 1;
    if (isReturn && lastVisual) {
      const v = t.vars[0].v;
      const text = v ? (v.kind === "array" ? `[${v.values.map(String).join(", ")}]` : v.kind === "array2" ? `[${v.rows.map((r) => `[${r.join(", ")}]`).join(", ")}]` : v.kind === "tree" ? `tree [${v.values.map((x) => (x === null ? "null" : x)).join(",")}]` : v.kind === "list" ? `${v.values.join(" → ")}${v.cyc !== undefined ? " ↺" : ""}` : v.text) : "(void)";
      steps.push({ ...lastVisual, line: lastVisual.line, note: `Return ${text}`, done: true, hot: "RETURN", state: { ...lastVisual.state, RETURN: text.length > 22 ? text.slice(0, 21) + "…" : text }, extra: text.length > 22 ? [...(lastVisual.extra ?? []), { label: "return", text }] : lastVisual.extra });
      return;
    }

    const prev = prevByFn.get(t.fn) ?? { arrays: new Map(), scalars: new Map() };
    const next: Prev = { arrays: new Map(), scalars: new Map() };
    const state: Record<string, string | number> = {};
    const extra: { label: string; text: string }[] = [];
    const changes: string[] = [];
    let hot: string | undefined;

    const arrays: { name: string; values: (string | number | boolean | null)[]; elemType: string }[] = [];
    const ints = new Map<string, number>();
    const strings: { name: string; text: string }[] = [];
    const structs: { name: string; snap: Extract<Snap, { kind: "tree" | "list" }> }[] = [];

    for (const v of t.vars) {
      if (!v.v) continue;
      const s: Snap = v.v;
      if (s.kind === "array") { arrays.push({ name: v.n, values: s.values, elemType: s.elemType }); next.arrays.set(v.n, s.values); }
      else if (s.kind === "array2") { s.rows.forEach((r, i) => { arrays.push({ name: `${v.n}[${i}]`, values: r, elemType: s.elemType }); next.arrays.set(`${v.n}[${i}]`, r); }); }
      else if (s.kind === "tree" || s.kind === "list") {
        structs.push({ name: v.n, snap: s });
        const sig = JSON.stringify(s);
        next.scalars.set(v.n, sig);
        const old = prev.scalars.get(v.n);
        if (old !== undefined && old !== sig) changes.push(`${v.n} changed`);
      } else if (s.kind === "scalar") {
        if (INT_TYPES.has(v.t) && /^-?\d+$/.test(s.text)) ints.set(v.n, Number(s.text));
        if (v.t === "String" && s.text.length - 2 <= MAX_STRING && s.text !== "null") strings.push({ name: v.n, text: JSON.parse(s.text) });
        else state[v.n] = s.text;
        next.scalars.set(v.n, s.text);
        const old = prev.scalars.get(v.n);
        if (old !== undefined && old !== s.text) { changes.push(`${v.n}: ${old} → ${s.text}`); hot ??= v.n; }
      } else if (s.kind === "text") {
        extra.push({ label: v.n, text: s.text });
        next.scalars.set(v.n, s.text);
        const old = prev.scalars.get(v.n);
        if (old !== undefined && old !== s.text) { changes.push(`${v.n} changed`); }
      }
    }
    prevByFn.set(t.fn, next);

    // ----- stage rows
    const rows: { label: string; values: (number | string | null)[]; cells: Cell[] }[] = [];
    const addRow = (name: string, values: (string | number | boolean | null)[], oldValues: (string | number | boolean | null)[] | undefined, base: string) => {
      const pointers = pointerVars(base, indexUse, ints);
      const cells: Cell[] = values.map((val, i) => {
        const tags = pointers.filter((p) => p.value === i).map((p) => p.name);
        const changed = oldValues !== undefined && oldValues.length === values.length && oldValues[i] !== val;
        const c: Cell = {};
        if (changed) c.role = "low";
        if (tags.length) { c.role = "cur"; c.tags = [{ text: tags.slice(0, 2).join(","), tone: "i" }]; }
        return c;
      });
      rows.push({ label: name.length > 9 ? name.slice(0, 8) + "…" : name, values: values.map((x) => (typeof x === "boolean" ? String(x) : x)) as (number | string | null)[], cells });
    };
    for (const a of arrays.slice(0, MAX_ROWS)) {
      if (a.values.length > 24) { extra.push({ label: a.name, text: `[${a.values.slice(0, 40).join(", ")}${a.values.length > 40 ? ", …" : ""}]` }); continue; }
      addRow(a.name, a.values, prev.arrays.get(a.name), a.name.replace(/\[\d+\]$/, ""));
    }
    for (const s of strings) if (rows.length < MAX_ROWS) addRow(s.name, [...s.text], undefined, s.name);
    else state[s.name] = JSON.stringify(s.text);
    arrays.slice(MAX_ROWS).forEach((a) => extra.push({ label: a.name, text: `[${a.values.join(", ")}]` }));

    // ----- state: drop what the stage already shows as pointer labels
    const shown = Object.entries(state).slice(0, MAX_STATE);
    const stateOut = Object.fromEntries(shown);

    const src = (lines[t.line - 1] ?? "").trim();
    const where = t.fn && !/^(Solution|<init>)$/.test(t.fn) ? `${t.fn}()  ` : "";
    const note = changes.length ? changes.slice(0, 3).join("   ·   ") + (changes.length > 3 ? "   …" : "") : idx === 0 ? "Start of the run" : `Next: ${src}`;
    const structBlocks: Block[] = structs.map(({ name, snap }) => snap.kind === "tree"
      ? { type: "tree" as const, label: name, values: snap.values, marks: snap.marks, truncated: snap.truncated }
      : { type: "list" as const, label: name, values: snap.values, cyc: snap.cyc, marks: snap.marks, truncated: snap.truncated });
    // problem-specific pictures that mirror the video (bars + water, heap as a tree)
    const special = viz ? vizBlock(viz, arrays[0], rows[0], ints, indexUse) : null;
    const stage: Step["stage"] = special
      ? { kind: "blocks", blocks: [...special.blocks, ...rows.slice(special.replacesRow ? 1 : 0).map((r) => ({ type: "row" as const, ...r }))] }
      : structBlocks.length
      ? { kind: "blocks", blocks: [...structBlocks, ...rows.map((r) => ({ type: "row" as const, ...r }))] }
      : { kind: "rows", rows };
    const step: Step = { line: Math.max(0, t.line - 1), note: where ? `${where}${note}` : note, state: stateOut, extra: extra.length ? extra : undefined, hot, stage };
    steps.push(step);
    lastVisual = step;
  });
  return steps;
}

/** int variables that index this array (compile-time hint), falling back to common pointer names */
function pointerVars(arrayName: string, indexUse: Record<string, string[]>, ints: Map<string, number>): { name: string; value: number }[] {
  const names = indexUse[arrayName] ?? [];
  const out: { name: string; value: number }[] = [];
  for (const n of names) { const v = ints.get(n); if (v !== undefined && v >= 0) out.push({ name: n, value: v }); }
  return out;
}

type Row = { label: string; values: (number | string | null)[]; cells: Cell[] };
/** bars + water (container / trapping rain water) or the heap tree, built from the first array of the trace step */
function vizBlock(viz: "container" | "trap" | "heap", a: { name: string; values: (string | number | boolean | null)[] } | undefined, row: Row | undefined, ints: Map<string, number>, indexUse: Record<string, string[]>): { blocks: Block[]; replacesRow: boolean } | null {
  if (!a || !row || !a.values.length || typeof a.values[0] !== "number") return null;
  const values = a.values as number[];
  const base = a.name.replace(/[d+]$/, "");
  const ptr = pointerVars(base, indexUse, ints).filter((p) => p.value < values.length);
  const label = row.label;
  if (viz === "container") {
    const ps = ptr.map((p) => p.value);
    const area = ps.length >= 2 ? { from: Math.min(...ps), to: Math.max(...ps), level: Math.min(values[Math.min(...ps)], values[Math.max(...ps)]) } : undefined;
    return { blocks: [{ type: "bars", label, values, cells: row.cells, area }], replacesRow: true };
  }
  if (viz === "trap") {
    // water above bar j = min(tallest on its left, tallest on its right) − its height; shown for the bars the code has already added up
    const lmax: number[] = [], rmax: number[] = [];
    values.forEach((v, j) => { lmax[j] = Math.max(v, lmax[j - 1] ?? 0); });
    for (let j = values.length - 1; j >= 0; j--) rmax[j] = Math.max(values[j], rmax[j + 1] ?? 0);
    const amount = values.map((v, j) => Math.max(0, Math.min(lmax[j], rmax[j]) - v));
    const total = ints.get("water") ?? 0;
    const cur = (ptr.find((p) => p.name === "i") ?? ptr[0])?.value ?? -1;
    let upTo = -1, sum = 0;
    for (let j = 0; j < values.length; j++) { sum += amount[j]; if (j <= cur && sum <= total) upTo = j; }
    const water = amount.map((w, j) => (j <= upTo ? w : 0));
    return { blocks: [{ type: "bars", label, values, cells: row.cells, water }], replacesRow: true };
  }
  // heap: the array is a heap of size size / end / n — draw it as a tree and keep the array row below
  const size = Math.min(values.length, ints.get("size") ?? ints.get("end") ?? ints.get("n") ?? values.length);
  if (size < 1 || size > 15) return null;
  const marks: Record<number, string[]> = {};
  for (const p of ptr) if (p.value < size && !["end", "n", "size"].includes(p.name)) (marks[p.value] ??= []).push(p.name);
  return { blocks: [{ type: "tree", label: "heap", values: values.slice(0, size), marks }], replacesRow: false };
}
