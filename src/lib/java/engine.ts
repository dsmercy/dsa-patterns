/* Compile + execute in one place (used by the Web Worker and by node-based verification scripts). */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompileError, compileJava, type Compiled } from "./compiler";
import { createRuntime, JavaException } from "./runtime";
import { fromPlain, parseType, snapshot, toPlain, typedStr, type Snap } from "./values";
import type { Type } from "./parser";

export const PRELUDE = `
class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } }
class TreeNode { int val; TreeNode left; TreeNode right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; } }
`;

export interface TraceStep { line: number; fn: string; vars: { n: string; t: string; v: Snap | null }[]; out: string[] }
export interface CaseOut { ok: boolean; value?: any; text?: string; error?: string; errorName?: string; line?: number; logs: string[]; ms?: number }
export type EngineResult =
  | { ok: false; phase: "compile" | "setup"; error: string; line?: number }
  | { ok: true; results: CaseOut[]; steps?: TraceStep[]; truncated?: boolean; indexUse?: Record<string, string[]> };

export interface EngineOptions { trace?: boolean; maxSteps?: number; maxHooks?: number }

const errText = (e: any) => (e instanceof JavaException ? e.toString() : e instanceof Error ? e.message : String(e));

export function execute(code: string, method: string, cases: unknown[][], opts: EngineOptions = {}): EngineResult {
  let compiled: Compiled;
  try { compiled = compileJava(code, { trace: !!opts.trace, prelude: PRELUDE }); }
  catch (e: any) {
    if (e instanceof CompileError) return { ok: false, phase: "compile", error: e.message, line: e.line };
    return { ok: false, phase: "compile", error: `Internal compiler error: ${errText(e)}` };
  }

  // ---- runtime
  const logsRef = { logs: [] as string[] };
  const L = () => logsRef.logs;
  const steps: TraceStep[] = [];
  let hooks = 0, truncated = false;
  const maxSteps = opts.maxSteps ?? 600, maxHooks = opts.maxHooks ?? 200000;
  const siteTypes = compiled.sites.map((s) => s.vars.map((v) => parseType(v.t)));
  const rt = createRuntime({
    out: (l) => { if (logsRef.logs.length < 500) logsRef.logs.push(l); },
    trace: (id, vals) => {
      if (++hooks > maxHooks) throw new JavaException("Error", "Trace stopped: the program ran too many steps");
      if (steps.length >= maxSteps) { truncated = true; return; }
      const site = compiled.sites[id];
      steps.push({ line: site.line, fn: site.fn, vars: site.vars.map((v, i) => ({ n: v.n, t: v.t, v: safeSnap(vals[i], siteTypes[id][i]) })), out: logsRef.logs.slice() });
    },
  });

  let mod: { classes: Record<string, any>; getLine: () => number };
  try {
    const names = Object.keys(rt);
    mod = new Function("__rt", `const {${names.join(",")}} = __rt;\n${compiled.code}`)(rt);
  } catch (e: any) { return { ok: false, phase: "setup", error: `Could not load the program: ${errText(e)}` }; }

  // ---- design problems: the "method" is a class name; each case is [constructorArgs, [[op, ...args], ...]]
  if (compiled.classes[method] && !compiled.classes[method].methods[method]) return runDesign(compiled, mod, method, cases, logsRef, opts, steps, () => truncated);

  // ---- entry point
  let clsName = "Solution";
  if (!compiled.classes[clsName]?.methods[method]) clsName = Object.keys(compiled.classes).find((c) => compiled.classes[c].methods[method]) ?? "";
  if (!clsName) return { ok: false, phase: "setup", error: `Method \`${method}\` not found. Keep the method name unchanged.` };

  const results: CaseOut[] = [];
  for (const args of cases) {
    logsRef.logs = [];
    const logs = logsRef.logs;
    const t0 = performance.now();
    const sigs = compiled.classes[clsName].methods[method].filter((s) => s.params.length === args.length);
    if (!sigs.length) { results.push({ ok: false, error: `Method \`${method}\` takes ${compiled.classes[clsName].methods[method][0].params.length} argument(s) but the input has ${args.length}.`, logs }); continue; }
    const sig = sigs[0];
    try {
      const jargs = args.map((a, i) => fromPlain(a, sig.params[i], mod.classes));
      const target = sig.static ? mod.classes[clsName] : new mod.classes[clsName]();
      const v = target[sig.js](...jargs);
      const rtType: Type | null = sig.ret.name === "void" ? null : sig.ret;
      // methods that return void (in-place) are shown as the mutated first argument
      const value = rtType ? toPlain(v, rtType) : toPlain(jargs[0], sig.params[0] ?? null);
      const text = rtType ? typedStr(v, rtType) : typedStr(jargs[0], sig.params[0] ?? null);
      results.push({ ok: true, value, text, logs, ms: performance.now() - t0 });
      if (opts.trace) { steps.push({ line: lastLineOf(compiled), fn: method, vars: [{ n: "return", t: tyShow(sig.ret), v: rtType ? safeSnap(v, rtType) : null }], out: logs.slice() }); }
    } catch (e: any) {
      const w = e instanceof JavaException ? e : null;
      results.push({ ok: false, error: errText(e), errorName: w?.jname, line: mod.getLine(), logs });
    }
  }
  return { ok: true, results, steps: opts.trace ? steps : undefined, truncated, indexUse: compiled.indexUse };
}

const tyShow = (t: Type) => t.name + "[]".repeat(t.dims);
const lastLineOf = (c: Compiled) => Math.max(...c.sites.map((s) => s.line), 1);
function safeSnap(v: any, t: Type): Snap | null { try { return snapshot(v, t); } catch { return { kind: "text", text: "?" }; } }

/** Design problems (constructor + operations): case = [ctorArgs, [[op, ...args], ...]] -> list of op results. */
function runDesign(
  compiled: Compiled, mod: { classes: Record<string, any>; getLine: () => number }, cls: string, cases: unknown[][],
  logsRef: { logs: string[] }, opts: EngineOptions, steps: TraceStep[], truncated: () => boolean,
): EngineResult {
  const info = compiled.classes[cls];
  const results: CaseOut[] = [];
  for (const c of cases) {
    logsRef.logs = [];
    const logs = logsRef.logs;
    const [ctorArgs, ops] = c as [unknown[], unknown[][]];
    try {
      const ctorNames = Object.getOwnPropertyNames(mod.classes[cls].prototype).filter((k) => k.startsWith("$ctor"));
      const ctor = ctorNames.find((k) => k === `$ctor${ctorArgs.length}`);
      const obj = new mod.classes[cls]();
      if (ctor) obj[ctor](...ctorArgs.map((a) => fromPlain(a, ctorParamType(compiled, cls, ctorArgs.length, 0), mod.classes)));
      const out: unknown[] = [];
      for (const [op, ...a] of ops as [string, ...unknown[]][]) {
        const sigs = info.methods[op]?.filter((s) => s.params.length === a.length);
        if (!sigs?.length) throw new Error(`No method ${op}(${a.length} argument${a.length === 1 ? "" : "s"})`);
        const sig = sigs[0];
        const v = obj[sig.js](...a.map((x, i) => fromPlain(x, sig.params[i], mod.classes)));
        out.push(sig.ret.name === "void" ? null : toPlain(v, sig.ret));
      }
      results.push({ ok: true, value: out, text: JSON.stringify(out), logs });
    } catch (e: any) {
      results.push({ ok: false, error: errText(e), line: mod.getLine(), logs });
    }
  }
  return { ok: true, results, steps: opts.trace ? steps : undefined, truncated: truncated(), indexUse: compiled.indexUse };
}
// constructor parameter types are not part of the exported signatures; arguments are plain JSON numbers/strings/arrays
function ctorParamType(_c: Compiled, _cls: string, _n: number, _i: number): Type { return { name: "?", args: [], dims: 0 }; }
