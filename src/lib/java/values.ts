/* Conversions between JSON (test inputs/outputs, UI) and compiled-Java runtime values, driven by static types. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Type } from "./parser";
import { Parser } from "./parser";
import { ArrayList, BaseMap, HashMap, HashSet, LinkedList, TreeMap, TreeSet, dstr, ts } from "./runtime";

export const parseType = (s: string): Type => new Parser(s).parseType();
const BOX: Record<string, string> = { Integer: "int", Long: "long", Double: "double", Float: "float", Short: "short", Byte: "byte", Character: "char", Boolean: "boolean" };
const prim = (t: Type) => (t.dims === 0 && BOX[t.name] ? BOX[t.name] : t.name);
const elem = (t: Type): Type => ({ name: t.name, args: t.args, dims: t.dims - 1 });
const LISTS = new Set(["List", "ArrayList", "Collection", "Iterable", "Vector", "LinkedList", "Queue", "Deque", "ArrayDeque", "Stack"]);
const SETS = new Set(["Set", "HashSet", "LinkedHashSet", "TreeSet", "SortedSet"]);
const MAPS = new Set(["Map", "HashMap", "LinkedHashMap", "TreeMap", "SortedMap"]);

export interface ClassTable { [name: string]: any }

// ---------------------------------------------------------------- JSON -> Java
export function fromPlain(v: any, t: Type, classes: ClassTable): any {
  if (v === null || v === undefined) return null;
  const p = prim(t);
  if (t.dims > 0) {
    if (p === "char" && typeof v === "string") return v.split("").map((c) => c.charCodeAt(0));
    if (!Array.isArray(v)) throw new Error(`expected an array for ${t.name}${"[]".repeat(t.dims)}`);
    const et = elem(t);
    return v.map((x) => fromPlain(x, et, classes));
  }
  switch (p) {
    case "int": case "long": case "short": case "byte": case "double": case "float": return typeof v === "number" ? v : Number(v);
    case "boolean": return !!v;
    case "char": return typeof v === "string" ? v.charCodeAt(0) : v;
    case "String": return String(v);
  }
  if (LISTS.has(t.name)) { const et = t.args[0] ?? { name: "?", args: [], dims: 0 }; const items = (v as any[]).map((x) => fromPlain(x, et, classes)); return t.name === "Stack" ? Object.assign(new (classes.__Stack ?? ArrayList)(), { a: items }) : ArrayList.of(items); }
  if (SETS.has(t.name)) { const et = t.args[0] ?? { name: "?", args: [], dims: 0 }; const s = t.name === "TreeSet" ? new TreeSet() : new HashSet(); (v as any[]).forEach((x) => s.add(fromPlain(x, et, classes))); return s; }
  if (MAPS.has(t.name)) {
    const m = t.name === "TreeMap" ? new TreeMap() : new HashMap();
    const kt = t.args[0] ?? { name: "?", args: [], dims: 0 }, vt = t.args[1] ?? { name: "?", args: [], dims: 0 };
    const entries = Array.isArray(v) ? v : Object.entries(v);
    for (const [k, x] of entries) m.put(fromPlain(prim(kt) === "int" || prim(kt) === "long" ? Number(k) : k, kt, classes), fromPlain(x, vt, classes));
    return m;
  }
  if (t.name === "ListNode" && classes.ListNode) return buildList(v, classes.ListNode);
  if (t.name === "TreeNode" && classes.TreeNode) return buildTree(v, classes.TreeNode);
  if (t.name === "Node" && classes.Node && Array.isArray(v) && typeof v[0] === "number" && Array.isArray(v[1]) && "children" in mk(classes.Node, 0)) return buildNary(v, classes.Node);
  if (t.name === "Node" && classes.Node && Array.isArray(v) && v.every((x) => Array.isArray(x)) && "neighbors" in mk(classes.Node, 0)) return buildGraph(v, classes.Node);
  if (t.name === "Node" && classes.Node && Array.isArray(v) && v.every((x) => Array.isArray(x)) && "random" in new classes.Node()) return buildRandomList(v, classes.Node);
  return v;
}

export function mk(cls: any, ...args: any[]) { const o = new cls(); const c = o[`$ctor${args.length}`]; return c ? c.apply(o, args) : o; }
function buildList(arr: number[], cls: any) {
  let head: any = null;
  for (let i = arr.length - 1; i >= 0; i--) { const n = mk(cls, arr[i]); n.next = head; head = n; }
  return head;
}
/** adjacency list (1-based node values, as on LeetCode) -> Node graph; returns node 1 */
function buildGraph(adj: number[][], cls: any): any {
  const nodes = adj.map((_, i) => mk(cls, i + 1));
  adj.forEach((ns, i) => ns.forEach((j) => nodes[i].neighbors.add(nodes[j - 1])));
  return nodes[0] ?? null;
}
function buildNary(spec: any[], cls: any): any {
  const node = mk(cls, spec[0]);
  for (const c of spec[1] as any[]) node.children.add(buildNary(c, cls));
  return node;
}
function buildRandomList(pairs: any[][], cls: any) {
  const nodes = pairs.map(([val]) => mk(cls, val));
  nodes.forEach((n, i) => { n.next = nodes[i + 1] ?? null; n.random = pairs[i][1] === null || pairs[i][1] === undefined ? null : nodes[pairs[i][1] as number]; });
  return nodes[0] ?? null;
}
function buildTree(arr: (number | null)[], cls: any) {
  if (!arr.length || arr[0] === null) return null;
  const root = mk(cls, arr[0]); const q = [root]; let i = 1;
  while (q.length && i < arr.length) {
    const n = q.shift();
    if (i < arr.length && arr[i] !== null) { n.left = mk(cls, arr[i]); q.push(n.left); } i++;
    if (i < arr.length && arr[i] !== null) { n.right = mk(cls, arr[i]); q.push(n.right); } i++;
  }
  return root;
}

// ---------------------------------------------------------------- Java -> JSON (results)
export function toPlain(v: any, t: Type | null, depth = 0): any {
  if (v === null || v === undefined) return null;
  if (depth > 40) return "...";
  const p = t ? prim(t) : "?";
  if (t && t.dims > 0 && Array.isArray(v)) return v.map((x) => toPlain(x, elem(t), depth + 1));
  if (t && t.dims === 0 && p === "char") return String.fromCharCode(v);
  if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.map((x) => toPlain(x, null, depth + 1));
  const arg0 = t?.args[0] ?? null, arg1 = t?.args[1] ?? null;
  if (v instanceof ArrayList || v instanceof HashSet) return (v as any).toArr().map((x: any) => toPlain(x, arg0, depth + 1));
  if (v instanceof BaseMap) { const o: Record<string, any> = {}; v.entries().forEach((n) => { o[ts(n.k)] = toPlain(n.v, arg1, depth + 1); }); return o; }
  if (typeof v === "object" && "val" in v && "random" in v) { const nodes: any[] = []; for (let n = v, g = 0; n && g++ < 1000; n = n.next) nodes.push(n); return nodes.map((n) => [n.val, n.random ? nodes.indexOf(n.random) : null]); }
  if (typeof v === "object" && "neighbors" in v) { const seen = new Map<number, any>(); const q = [v]; while (q.length) { const n = q.shift(); if (seen.has(n.val)) continue; seen.set(n.val, n); (n.neighbors?.toArr?.() ?? n.neighbors ?? []).forEach((m: any) => q.push(m)); } return [...seen.keys()].sort((a, b) => a - b).map((k) => (seen.get(k).neighbors?.toArr?.() ?? seen.get(k).neighbors ?? []).map((m: any) => m.val).sort((a: number, b: number) => a - b)); }
  if (typeof v === "object" && "val" in v && "children" in v) return [v.val, (v.children?.toArr?.() ?? v.children ?? []).map((c: any) => toPlain(c, null, depth + 1))];
  if (typeof v === "object" && "val" in v && "next" in v) { const out: any[] = []; const seen = new Set<any>(); for (let n = v; n && !seen.has(n) && seen.size < 1000; n = n.next) { seen.add(n); out.push(toPlain(n.val, null)); } return out; }
  if (typeof v === "object" && "val" in v && "left" in v) {
    const out: any[] = []; const q = [v];
    while (q.length) { const n = q.shift(); if (n === null) { out.push(null); continue; } out.push(toPlain(n.val, null)); q.push(n.left ?? null, n.right ?? null); }
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
  }
  if (v && typeof v.toArr === "function") return v.toArr().map((x: any) => toPlain(x, arg0, depth + 1));
  const o: Record<string, any> = {};
  for (const k of Object.keys(v)) o[k] = toPlain(v[k], null, depth + 1);
  return o;
}

// ---------------------------------------------------------------- typed toString (for the trace / console)
export function typedStr(v: any, t: Type | null, depth = 0): string {
  if (v === null || v === undefined) return "null";
  if (depth > 6) return "…";
  const p = t ? prim(t) : "?";
  if (t && t.dims > 0 && Array.isArray(v)) return `[${v.map((x) => typedStr(x, elem(t), depth + 1)).join(", ")}]`;
  if (t && t.dims === 0) {
    if (p === "char") return String.fromCharCode(v);
    if (p === "double" || p === "float") return dstr(v);
  }
  const a0 = t?.args[0] ?? null, a1 = t?.args[1] ?? null;
  if (v instanceof ArrayList || v instanceof HashSet) return `[${(v as any).toArr().map((x: any) => typedStr(x, a0, depth + 1)).join(", ")}]`;
  if (v instanceof BaseMap) return `{${v.entries().map((n) => `${typedStr(n.k, a0, depth + 1)}=${typedStr(n.v, a1, depth + 1)}`).join(", ")}}`;
  if (v && typeof v.toArr === "function") return `[${v.toArr().map((x: any) => typedStr(x, a0, depth + 1)).join(", ")}]`;
  // nodes inside collections (a queue of TreeNodes, a stack of ListNodes…): just their value
  if (typeof v === "object" && !Array.isArray(v) && "val" in v && ("left" in v || "next" in v || "neighbors" in v || "children" in v)) return String(v.val);
  if (typeof v === "object" && !Array.isArray(v) && v.toString === Object.prototype.toString) {
    return `${v.constructor?.name ?? "Object"}{${Object.keys(v).map((k) => `${k}=${typedStr(v[k], null, depth + 1)}`).join(", ")}}`;
  }
  return ts(v);
}

/** Display snapshot for the trace: arrays stay arrays (cloned, chars as strings); everything else is text. */
export type Snap = { kind: "scalar"; text: string } | { kind: "array"; values: (string | number | boolean | null)[]; elemType: string } | { kind: "array2"; rows: (string | number | boolean | null)[][]; elemType: string } | { kind: "text"; text: string }
  | { kind: "tree"; values: (number | null)[]; marks: Record<number, string[]>; truncated?: boolean }
  | { kind: "list"; values: (number | string)[]; cyc?: number; marks: Record<number, string[]>; truncated?: boolean };
export function snapshot(v: any, t: Type): Snap | null {
  if (v === undefined) return null;
  const p = prim(t);
  if (t.dims === 1 && Array.isArray(v) && (PRIMS.has(prim(elem(t))) || elem(t).name === "String")) return { kind: "array", values: v.map((x) => cell(x, elem(t))), elemType: tyName(elem(t)) };
  if (t.dims === 2 && Array.isArray(v) && PRIMS.has(prim(elem(elem(t))))) return { kind: "array2", rows: v.map((r: any) => (Array.isArray(r) ? r.map((x: any) => cell(x, elem(elem(t)))) : [])), elemType: tyName(elem(elem(t))) };
  if (t.dims === 0 && (PRIMS.has(p) || p === "String")) return { kind: "scalar", text: p === "String" ? (v === null ? "null" : JSON.stringify(v)) : p === "char" ? `'${String.fromCharCode(v)}'` : p === "double" || p === "float" ? dstr(v) : String(v) };
  return { kind: "text", text: typedStr(v, t) };
}
const PRIMS = new Set(["int", "long", "short", "byte", "char", "boolean", "double", "float"]);
const tyName = (t: Type) => prim(t);
const cell = (x: any, t: Type): string | number | boolean | null => (x === null ? null : prim(t) === "char" ? String.fromCharCode(x) : x);
